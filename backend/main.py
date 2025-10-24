import json, os, re
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.responses import PlainTextResponse
from logic_engine.desert_logic import DesertLogicEngine 

import time, traceback


# ------------------------------
# ① .env 불러오기
# ------------------------------
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

with open("logic_engine/rules/case_mid_rules.json", "r", encoding="utf-8") as f:
    rules = json.load(f)

for r in rules:
    pattern = r.get("pattern", "")
    if not pattern.strip():
        print("⚠️ 빈 패턴 감지:", r)

app = FastAPI()
# ------------------------------
# FastAPI 기본 설정
# ------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 임시로 모든 origin 허용 (테스트용)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

# =============================
# 사건 데이터 로더
# =============================
def load_case_data(mode: str):
    base_dir = os.path.join(os.path.dirname(__file__), "cases")
    filename = {
        "상": "case_high.json",
        "중": "case_mid.json",
        "하": "case_low.json",
    }.get(mode, "case_low.json")
    path = os.path.join(base_dir, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# =============================
# GPT 응답 생성 (히스토리 반영)
# =============================
def generate_gpt_response(case_data, user_input, history):
    """
    사건 데이터와 대화 히스토리를 기반으로 GPT 응답을 생성.
    - 사건 JSON(case_data) 기반으로만 답변하도록 제한
    - 자연스러운 탐정 조수 스타일 유지
    - 너무 긴 응답 방지 (200자 내외)
    """

    chatbot_instr = case_data.get("chatbot_instructions", {})
    role = chatbot_instr.get("role", "너는 사건을 함께 추리하는 탐정 조수 AI야.")
    style = chatbot_instr.get("style", "냉정하고 침착한 말투로, 탐정처럼 간결하게 말해.")
    guidelines_list = chatbot_instr.get("guidelines", [])

    # 지침을 보기 좋게 정리
    guidelines = "\n".join(f"- {g}" for g in guidelines_list) if guidelines_list else ""

    # 사건 요약 블록 추출 (GPT가 빠르게 참조)
    summary_info = case_data.get("summary_info", {})
    summary_text = json.dumps(summary_info, ensure_ascii=False)

    # 주요 섹션 텍스트 병합 (GPT가 문맥 기반 추론 가능)
    overview_text = json.dumps(case_data.get("case_overview", {}), ensure_ascii=False)
    character_text = json.dumps(case_data.get("characters", []), ensure_ascii=False)
    evidence_text = json.dumps(case_data.get("evidence", []), ensure_ascii=False)
    case_flow_text = json.dumps(case_data.get("case_flow", {}), ensure_ascii=False)

    # SYSTEM PROMPT
    system_prompt = f"""
{role}
{style}

너는 아래 사건 데이터를 기반으로 사용자의 질문에 답해야 해.
절대 스스로 추리하거나 상상하지 말고, 주어진 사실에 근거해서만 말해.
만약 데이터에 없는 내용이면, "그 정보는 아직 조사되지 않았습니다."라고 답해.

[답변 규칙]
- 답변은 200자 이내로 제한.
- 핵심만 요약해 1~3문장으로 말해.
- 불필요한 서술이나 장문 분석은 금지.
- 단서나 증거는 요약된 형태로만 언급.

[사건 요약 정보]
{summary_text}

[사건 개요]
{overview_text}

[등장인물]
{character_text}

[증거 목록]
{evidence_text}

[사건 흐름 요약]
{case_flow_text}

[대화 지침]
{guidelines}
    """.strip()

    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h["role"], "content": h["text"]})
    messages.append({"role": "user", "content": user_input})
    
    # GPT 호출
    print("[GPT 호출 시작]")
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        # model="gpt-5"
        messages=messages,
        temperature=0.6,  # 답변의 일관성과 논리성 유지
        max_tokens=200
    )
    print("[GPT 응답 수신 완료]")

    # 최종 응답 반환
    reply = completion.choices[0].message.content.strip()
    return reply


# =============================
# API: 대화 엔드포인트
# =============================
@app.post("/api/chat")
async def chat_endpoint(request: Request):
    start_time = time.time()
    print("\n[CHAT] 요청 시작 ------------------------")

    try:
        data = await request.json()
        user_input = data.get("message", "")
        mode = data.get("mode", "하")
        history = data.get("history", [])
        print(f"입력: {user_input[:80]}... (모드={mode})")

        # 사건 데이터 로드
        case_data = load_case_data(mode)
        case_id = f"case_{'high' if mode == '상' else 'mid' if mode == '중' else 'low'}"
        logic_engine = DesertLogicEngine(case_id)
        print(f"사건 데이터 로드 완료 ({case_id})")

        # GPT 응답 생성
        ai_reply = generate_gpt_response(case_data, user_input, history)
        combined_text = f"{user_input}\n{ai_reply}"

        # ------------------------------
        # 감지 결과 누적용
        # ------------------------------
        detected_evidences = set()
        detected_characters = set()
        new_clues = set()
        extra_info = []
        all_hints = []

        # --- 1) 인물 감지 ---
        for c in case_data.get("characters", []):
            name = c["name"]
            if name in combined_text:
                detected_characters.add(name)
                new_clues.add(name)

                # 사용자 질문에 직접 등장한 경우만 추가 설명
                if name in user_input:
                    extra_info.append(f"💡 {name} — {c['description']}")
                    
        # --- 2) 증거 감지 ---
        for e in case_data.get("evidence", []):
            evidence_type = e.get("type")
            desc = e.get("description", "")
            extra = e.get("spoiler_investigation", "")

            if not evidence_type:
                continue

            # 오직 사용자 입력(user_input)에 단서가 포함된 경우만 감지
            if re.search(evidence_type, user_input, re.IGNORECASE):
                # 이미 감지된 단서는 건너뛰기
                if evidence_type in detected_evidences:
                    continue

                detected_evidences.add(evidence_type)
                new_clues.add(evidence_type)

                # 💭 조수의 생각용 hint 추출 (중복 방지)
                hint_text = logic_engine.get_hint_for_evidence(evidence_type)
                if hint_text and evidence_type not in [h.split(":")[0] for h in all_hints]:
                    all_hints.append(f"{evidence_type}: {hint_text}")

                # 💡 기존 요약 문구 추가
                if desc:
                    reply_text = f"💡 {evidence_type}은(는) {desc.strip().rstrip('.')}."
                    extra_info.append(reply_text)


        # --- 3) Desert Logic ---
        try:
            logic_feedback = logic_engine.evaluate_dialogue(combined_text, ai_reply)
        except Exception as e:
            print(f"[LogicEngine 오류] {e}")
            traceback.print_exc()
            logic_feedback = None

        # ------------------------------
        # 최종 응답 구성
        # ------------------------------
        final_reply = ai_reply

        # (1) 조사 요청 시 추가 정보 표시
        if extra_info:
            final_reply += "\n\n" + "\n".join(extra_info)

        # (2) 추가 설명이 없고 새 단서가 감지된 경우에만 → 요약 메시지 한 줄 표시
        previous_clues = [h.get("text", "") for h in history if isinstance(h, dict)]  # 이전 대화 텍스트들
        previous_text = " ".join(previous_clues)

        # 새로 발견된 단서만 필터링
        unique_new_clues = [
            clue for clue in (new_clues or [])
            if clue not in previous_text
        ]

        if (
            not extra_info
            and unique_new_clues  # 이전에 없던 단서만 있을 때
            and not any(keyword in user_input for keyword in ["조사", "살펴", "확인", "자세히"])
        ):
            final_reply += "\n\n💡 흥미로운 단서가 언급된 것 같습니다."


        # (3) Desert Logic 문장은 한 번만 추가 (중복 방지)
        if logic_feedback and logic_feedback.get("text"):
            # text가 None이 아닐 때만 추가
            text_msg = logic_feedback.get("text")
            if text_msg and "흥미로운 단서" not in text_msg:
                final_reply += f"\n\n---\n{text_msg}"

        # (4) 감지된 단서 통합 (중복 제거)
        all_clues = list(set(list(new_clues) + (logic_feedback.get("clues", []) if logic_feedback else [])))
        
        print(f"🏁 전체 처리 완료 ({time.time() - start_time:.2f}s)")
        print("-------------------------------------------\n")
        
        print(f"[DEBUG] all_hints 최종: {all_hints}")
        return {
            "reply": final_reply,
            "clues": list(set(list(new_clues))),
            "hints": all_hints  # 조수의 생각 따로 내려줌
        }

    except Exception as e:
        print(f"💥 [chat_endpoint 예외 발생]: {e}")
        traceback.print_exc()
        return {"error": str(e)} 


# =============================
# 사건 정보 반환, 스토리 txt 반환
# =============================
@app.get("/api/report")
async def report_endpoint(mode: str = "하"):
    case_data = load_case_data(mode)
    
    # 스토리 파일 경로 설정
    story_path = os.path.join(os.path.dirname(__file__), "cases", "story_summary")
    story_file = {
        "상": "story_high.txt",
        "중": "story_mid.txt",
        "하": "story_low.txt",
    }.get(mode, "story_low.txt")
    story_fullpath = os.path.join(story_path, story_file)

    # 스토리 텍스트 로드
    story_text = ""
    if os.path.exists(story_fullpath):
        with open(story_fullpath, "r", encoding="utf-8") as f:
            story_text = f.read()
    else:
        story_text = "스토리 파일을 찾을 수 없습니다."

    # 사건 데이터 + 스토리 함께 반환
    return {"case": case_data, "story": story_text}

# =============================
# AI 채점 API
# =============================
@app.post("/api/submit_answer")
async def submit_answer(request: Request):
    data = await request.json()
    mode = data.get("mode", "하")
    user_answer = data.get("answer", "")

    case_data = load_case_data(mode)
    solution = case_data.get("solution", {})
    reference = json.dumps(solution, ensure_ascii=False)

    prompt = f"""
    아래는 사용자의 추리 답변입니다.
    사건 제목: {case_data.get('title')}
    정답 데이터: {reference}
    사용자 답변: {user_answer}
    
    ⚠️ 다음과 같은 경우에는 0점을 주고 간단히 피드백하세요:
    - 사용자가 단순히 "추리 작성", "사건 개요", "엔딩 보기" 등 형식적 문구만 입력한 경우
    - 추리의 내용이 전혀 없는 경우 (범인, 동기, 사건 내용 없음)
    - 단순한 명령문, 테스트 문장, 한 줄짜리 입력

    기준:
    1. 범인, 동기, 방법, 결론 일치도 (총점 100점)
    2. 논리 일관성 및 단서 활용도 (+/- 20점 가중)
    3. 핵심 진실 누락 시 감점
    4. 피드백은 간결하고 인물·증거 중심으로 작성

    JSON 형식으로 답변:
    {{
      "score": <0~100>,
      "feedback": "<짧은 평가 코멘트>"
    }}
    """

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        # model="gpt-5",
        messages=[
            {"role": "system", "content": "너는 공포 추리 게임의 채점관 AI야. 객관적으로 평가하되, 약간 불안한 말투를 써."},
            {"role": "user", "content": prompt}
        ]
    )

    try:
        result = json.loads(completion.choices[0].message.content)
    except:
        result = {"score": 0, "feedback": "채점 중 오류가 발생했습니다."}

    return result