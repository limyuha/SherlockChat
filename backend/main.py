import json, random, os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI

# ------------------------------
# ① .env 불러오기
# ------------------------------
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()
# ------------------------------
# ② FastAPI 기본 설정
# ------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 임시로 모든 origin 허용 (테스트용)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent

# ------------------------------
# 📢 사건 데이터 API
# ------------------------------
@app.get("/api/report")
def get_report(mode: str):
    print(f"[DEBUG] /api/report called with mode={mode}")

    # 사건별 파일 매핑
    case_file_map = {
        "상": "case_high.json",
        "중": "case_mid.json",
        "하": "case_low.json"
    }

    # 기본 파일 설정 (fallback)
    filename = case_file_map.get(mode, "case_low.json")
    case_path = BASE_DIR / "cases" / filename

    # JSON 로드
    with open(case_path, "r", encoding="utf-8") as f:
        case = json.load(f)

    return {
        "title": case["title"],
        "image": case.get("image", ""),
        "difficulty": case.get("difficulty", "중"),
        "case_overview": case.get("case_overview", {}),
        "characters": case.get("characters", []),
        "evidence": case.get("evidence", []),
        "solution": case.get("solution", {})
    }
    
# =========================
# 🔍 인물 자동 탐색 (정확도 개선 버전)
# =========================
def find_character_info(message: str, case_data: dict):
    """
    사용자의 입력에서 등장인물을 탐지하여 관련 정보를 반환.
    - '사용자', '당신', '기자' 등 자기지칭 단어는 무시
    - case_high / mid / low 모두 호환
    """
    message_lower = message.lower()
    characters = case_data.get("characters", [])

    # 🚫 무시해야 하는 단어
    ignore_keywords = ["사용자", "너", "당신", "기자", "탐정"]

    if any(word in message_lower for word in ignore_keywords):
        return None

    for char in characters:
        name = char.get("name", "")
        role = char.get("role", "")
        desc = char.get("description", "")

        # ✅ 이름 또는 역할이 입력 문장에 포함되어 있으면 매칭
        if name and name.lower() in message_lower:
            return char
        if role and role.lower() in message_lower:
            return char
        if name.replace("씨", "").lower() in message_lower:
            return char

    return None


# =========================
# 🧩 증거 자동 탐색
# =========================
def find_evidence_info(message: str, case_data: dict):
    message_lower = message.lower()
    evidences = case_data.get("evidence", [])

    for ev in evidences:
        ev_type = ev.get("type", "").lower()
        ev_desc = ev.get("description", "").lower()

        # ✅ 타입명(예: '시계', '녹음 장치')이나 설명 일부가 문장에 포함되면 탐지
        if ev_type in message_lower or any(word in message_lower for word in ev_desc.split()):
            return ev

    return None

# ------------------------------
# 💬 대화 API (탐정 모드)
# ------------------------------
@app.post("/api/chat")
async def chat(req: Request):
    data = await req.json()
    message = data.get("message", "").strip()
    mode = data.get("mode", "중")
    history = data.get("history", [])

    # 사건 파일 매핑
    case_file_map = {
        "상": "case_high.json",
        "중": "case_mid.json",
        "하": "case_low.json"
    }
    filename = case_file_map.get(mode, "case_low.json")
    case_path = BASE_DIR / "cases" / filename

    # 사건 데이터 로드
    with open(case_path, "r", encoding="utf-8") as f:
        case = json.load(f)
        
    # 🧠 사용자의 질문에서 인물 탐색
    found_char = find_character_info(message, case)
    if found_char:
        desc = (
            found_char.get("alibi", "")
            or found_char.get("background", "")
            or found_char.get("relationship", "")
            or found_char.get("description", "")
        )
        role = found_char.get("occupation", "") or found_char.get("role", "")
        reply = f"{found_char['name']} ({role}) — {desc if desc else '관련 정보가 없습니다.'}"
        return {"reply": reply}

    # 🔍 증거 탐색
    found_evi = find_evidence_info(message, case)
    if found_evi:
        return {
            "reply": f"🔍 {found_evi['type']} — {found_evi['description']}\n"
                     f"📎 단서 요약: {found_evi.get('details', found_evi.get('implications', ''))}"
        }

    # 사건 개요를 요약 문자열로 생성
    overview_text = (
        f"장소: {case['case_overview'].get('setting', '')}, "
        f"시간: {case['case_overview'].get('time', '')}, "
        f"피해자: {case['case_overview'].get('victim', '')}, "
        f"사망 원인: {case['case_overview'].get('death_cause', '')}."
    )

    # 시스템 메시지 구성 (탐정 역할)
    system_prompt = case.get("chatbot_instructions", {}).get(
        "role",
        "당신은 이 미스터리 사건을 조사하는 탐정입니다."
    )

    guidelines = "\n".join(case.get("chatbot_instructions", {}).get("guidelines", []))

    # GPT 대화 히스토리 구성
    messages = [
        {"role": "system", "content": f"{system_prompt}\n{guidelines}"},
        {"role": "user", "content": f"사건 개요: {overview_text}"}
    ]

    # 이전 대화 반영
    for h in history:
        messages.append({"role": h["role"], "content": h["text"]})

    # 사용자의 새 입력 추가
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7
        )
        answer = response.choices[0].message.content
        return {"reply": answer}

    except Exception as e:
        print("[ERROR]", e)
        return {"reply": f"AI 처리 중 오류가 발생했습니다: {e}"}

# ------------------------------
# 🧩 스토리 분기형 (미사용 시 기본 응답)
# ------------------------------
@app.post("/api/story")
async def story(req: Request):
    return {
        "reply": "이 사건은 스토리 분기 모드를 지원하지 않습니다.",
        "choices": []
    }
