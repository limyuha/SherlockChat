import json, os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.responses import PlainTextResponse
import re

# ------------------------------
# ① .env 불러오기
# ------------------------------
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


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
        """텍스트 내 논리 규칙 매칭 (yes/no/irrelevant 반환)"""
        for rule in self.rules:
            if re.search(rule["pattern"], text, re.IGNORECASE):
                return {"verdict": rule["verdict"], "evidence": rule.get("evidence", "")}
        return {"verdict": "unknown", "evidence": ""}

    def evaluate_dialogue(self, user_input: str, ai_reply: str):
        user_eval = self.evaluate_text(user_input)
        if user_eval["verdict"] == "yes":
            return f"논리 일치: {user_eval['evidence']}"
        return None
        """GPT 응답을 사건 논리와 대조
        ai_eval = self.evaluate_text(ai_reply)
        user_eval = self.evaluate_text(user_input)

        if ai_eval["verdict"] == "no":
            return f"🤔 논리 불일치: {ai_eval['evidence']}"
        elif ai_eval["verdict"] == "yes":
            return f"🧩 논리 일치: {ai_eval['evidence']}"
        elif user_eval["verdict"] == "yes":
            return f"💬 흥미로운 단서예요. ({user_eval['evidence']})"
        else:
            return None
        """
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
    chatbot_instructions(role, style, guidelines)을 통합하여 AI 페르소나를 구성.
    """

    chatbot_instr = case_data.get("chatbot_instructions", {})
    role = chatbot_instr.get("role", "너는 사건을 분석하는 리포터 AI야.")
    style = chatbot_instr.get("style", "냉정하고 논리적인 말투로 답해.")
    guidelines_list = chatbot_instr.get("guidelines", [])

    # guidelines 배열을 보기 좋게 줄 단위로 합침
    if guidelines_list:
        guidelines = "\n".join(f"- {g}" for g in guidelines_list)
    else:
        guidelines = "대화의 맥락과 일관성을 유지하며, 논리적인 추론을 이어가세요."

    # System Prompt (AI 캐릭터의 세계관, 말투, 규칙이 모두 포함됨)
    system_prompt = f"""
{role}
{style}

다음은 네 대화 지침이야:
{guidelines}
    """.strip()

    # 사건 개요 추가 (AI에게 사건 전체 맥락을 제공)
    overview_text = case_data.get("case_overview", "사건 개요가 제공되지 않았습니다.")

    # 메시지 구성
    messages = [
        {"role": "system", "content": f"{system_prompt}\n\n사건 개요:\n{overview_text}"}
    ]

    # 이전 대화 반영
    for h in history:
        messages.append({"role": h["role"], "content": h["text"]})

    # 사용자 입력 추가
    messages.append({"role": "user", "content": user_input})

    # GPT 호출 (client 사용)
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )

    # 최종 응답 반환
    return completion.choices[0].message.content.strip()


# =============================
# API: 대화 엔드포인트
# =============================
@app.post("/api/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    user_input = data.get("message", "")
    mode = data.get("mode", "하")
    history = data.get("history", [])

    case_data = load_case_data(mode)
    case_id = f"case_{'high' if mode == '상' else 'mid' if mode == '중' else 'low'}"
    logic_engine = DesertLogicEngine(case_id)

    # 인물 직접 질문 시 즉시 반환
    for c in case_data["characters"]:
        if c["name"] in user_input:
            return {
                "reply": f"{c['name']} — {c['description']}",
                "clue": c["name"],  # clue 필드 추가
            }

    # 증거 직접 질문 시 즉시 반환
    for e in case_data["evidence"]:
        name = e.get("name")
        if name and name in user_input:
            return {
                "reply": f"{name} 관련 단서: {e.get('description', '')}",
                "clue": name,  # clue 필드 추가
            }


    # GPT 응답 생성 (히스토리 반영)
    ai_reply = generate_gpt_response(case_data, user_input, history)

    # Desert Logic 검증(Desert Logic이 감지한 단서/논리 평가 결과)
    logic_feedback = logic_engine.evaluate_dialogue(user_input, ai_reply)

    # 감지된 단서 추출
    clue_data = None
    if logic_feedback:
        # 문자열 안에서 "단서:" 뒤에 있는 단어만 추출 (혹은 직접 전달)
        clue_data = logic_engine.extract_clue_from_feedback(logic_feedback)


    # 최종 응답
    if logic_feedback:
        final_reply = f"{ai_reply}\n\n---\n🧠 {logic_feedback}"
    else:
        final_reply = ai_reply

    return {
        "reply": final_reply,  # 프론트엔드로 전송되는 JSON 응답
        "clue": clue_data  # 감지된 단서 포함
        } 


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