import json, os, re
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.responses import PlainTextResponse
from functools import lru_cache

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



# Desert Logic Engine
class DesertLogicEngine:
    def __init__(self, case_id: str):
        rules_path = os.path.join(os.path.dirname(__file__), "logic_engine", "rules", f"{case_id}_rules.json")
        if os.path.exists(rules_path):
            with open(rules_path, "r", encoding="utf-8") as f:
                self.rules = json.load(f)
        else:
            self.rules = []

    def evaluate_text(self, text: str):
        """텍스트 내 여러 규칙 매칭 (yes만 감지)"""
        detected = []
        for rule in self.rules:
            pattern = rule.get("pattern", "")
            verdict = rule.get("verdict", "yes")
            if re.search(rf".*{pattern}.*", text, re.IGNORECASE):
                if verdict == "yes":
                    detected.append(pattern)
        return detected

    def evaluate_dialogue(self, user_input: str, ai_reply: str):
        """사용자 입력에서 다중 단서 감지"""
        user_clues = self.evaluate_text(user_input)
        if user_clues:
            return {
                "text": "💡 흥미로운 단서가 언급된 것 같습니다.",
                "clues": user_clues
            }
        return None

    # 단서 추출 메서드
    def extract_clue_from_feedback(self, feedback_text: str):
        """피드백 문장에서 단서명만 추출"""
        match = re.search(r"['\"](.+?)['\"]", feedback_text)
        if match:
            return match.group(1)
        return None

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
    - 너무 긴 응답 방지 (150자 내외)
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
- 답변은 150자 이내로 제한.
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

        # 인물 이름 즉시 감지
        for c in case_data.get("characters", []):
            # 이름이 입력문에 포함되면 즉시 반환
            if c["name"] in user_input:
                print(f"인물 감지: {c['name']}")
                return {
                    "reply": f"{c['name']} — {c['description']}",
                    "clue": c["name"],  # 프론트에 전달 (감지 단서로)
                }

        # 증거 이름(type) 즉시 감지(자연스럽게 설명 포함)
        for e in case_data.get("evidence", []):
            evidence_type = e.get("type")
            desc = e.get("description", "")
            extra = e.get("spoiler_investigation", "")

            if evidence_type and evidence_type in user_input:
                print(f"증거 감지: {evidence_type}")

                # description과 추가 조사 결과를 자연스럽게 합침
                reply_parts = []
                if desc:
                    reply_parts.append(desc.strip().rstrip("."))
                if extra:
                    reply_parts.append(f"추가 조사 결과, {extra.strip().rstrip('.')}")
                
                # 여백 있는 출력: 각 문장마다 줄바꿈
                formatted_text = "\n\n".join(reply_parts)

                # 탐정식 톤 추가
                reply_text = f"{evidence_type}은(는) {formatted_text}."

                return {
                    "reply": reply_text.strip(),
                    "clue": evidence_type,
                }

        # GPT 응답 생성 (히스토리 반영)
        t1 = time.time()
        ai_reply = generate_gpt_response(case_data, user_input, history)
        print(f"GPT 응답 생성 완료 ({time.time() - t1:.2f}s)")

        # Desert Logic 검증(Desert Logic이 감지한 단서/논리 평가 결과)
        t2 = time.time()
        try:
            logic_feedback = logic_engine.evaluate_dialogue(user_input, ai_reply)
        except Exception as e:
            print(f"[LogicEngine 오류] {e}")
            traceback.print_exc()
        print(f"🔍 단서 감지 완료 ({time.time() - t2:.2f}s)")

        # 감지된 단서 추출
        clue_data = None
        if logic_feedback:
            clue_data = logic_feedback.get("clues", [])

        # 최종 응답 구성
        if logic_feedback:
            final_reply = f"{ai_reply}\n\n---\n{logic_feedback['text']}"
        else:
            final_reply = ai_reply
            
        print(f"🏁 전체 처리 완료 ({time.time() - start_time:.2f}s)")
        print("-------------------------------------------\n")
            
        return {
            "reply": final_reply,  # 프론트엔드로 전송되는 JSON 응답
            "clues": clue_data  # 배열 형태로 여러 단서 전달
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
    story_path = os.path.join(os.path.dirname(__file__), "cases", "story")
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