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

# ------------------------------
# ② FastAPI 기본 설정
# ------------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
CASE_PATH = BASE_DIR / "cases" / "case001.json"

# ------------------------------
# 📢 기사 데이터 API
# ------------------------------
@app.get("/api/report")
def get_report(mode: str):
    print(f"[DEBUG] /api/report called with mode={mode}")  # ✅ 로그 추가
    
    with open(CASE_PATH, "r", encoding="utf-8") as f:
        case = json.load(f)
        print("[DEBUG] case loaded successfully")  # ✅ 로그 추가

    if mode in ["상", "중", "하", "ghost"]:
        # 귀신 / 스릴러 모드
        return {
            "title": case["title"],
            "summary": case["summary"],
            "difficulty": case["difficulty"],
            "image": "https://images.unsplash.com/photo-1607863680165-5f4fa3f3923d",
            "setting": case["setting"]
        }

    elif mode == "real":
        # 현실 모드 뉴스
        return {
            "title": "신촌 살인사건, 새 단서 발견",
            "date": "2025-10-13",
            "location": "서울 신촌",
            "summary": "오늘 새벽 신촌 한 아파트에서...",
            "image": "https://picsum.photos/800/400"
        }

    else:
        # 기본 뉴스
        return {
            "title": "도심 속 살인사건, 목격자는 누구?",
            "summary": "용의자는 피해자의 직장 동료로 추정된다."
        }

# ------------------------------
# 💬 대화 API
# ------------------------------
@app.post("/api/chat")
async def chat(req: Request):
    data = await req.json()
    message = data.get("message", "").lower()
    history = data.get("history", [])  # ✅ 프론트에서 보낸 이전 대화

    with open(CASE_PATH, "r", encoding="utf-8") as f:
        case = json.load(f)

    # 1️⃣ 키워드 기반 즉시 반응 (귀신 모드)
    if any(keyword in message for keyword in ["귀신", "병실", "밥", "거울", "사람", "퇴원", "cctv"]):
        responses = case["responses"]
        for key, resp in responses.items():
            if key.lower() in message:
                return {"reply": resp}
        clue = random.choice(case["clues"])
        return {"reply": f"단서 발견 🧩: {clue}"}

    # 2️⃣ AI 대화 (히스토리 포함)
    messages = [
        {"role": "system", "content": "너는 공포 추리 기자 AI다. 사건의 진실을 바로 말하지 말고, 점점 단서를 통해 드러내라."},
        {"role": "user", "content": f"사건 요약: {case['summary']}"}
    ]

    # ✅ 지금까지의 대화 히스토리 반영
    for h in history:
        messages.append({"role": h["role"], "content": h["text"]})

    # ✅ 새 질문 추가
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )
        answer = response.choices[0].message.content
        return {"reply": answer}
    except Exception as e:
        return {"reply": f"AI 처리 중 오류가 발생했습니다: {e}"}
    
# ------------------------------
# 💬 스토리 분기형 API
# ------------------------------
@app.post("/api/story")
async def story(req: Request):
    data = await req.json()
    user_message = data.get("message", "")
    story_id = data.get("story_id", "start")  # 기본 시작 지점
    with open(CASE_PATH, "r", encoding="utf-8") as f:
        case = json.load(f)

    # 스토리 노드 탐색
    story_nodes = case.get("story", {})
    node = story_nodes.get(story_id)

    if not node:
        return {"reply": "이야기를 이어갈 수 없습니다.", "choices": []}

    # 사용자가 선택을 했을 경우
    if user_message and "next" in node:
        next_id = node["next"].get(user_message)
        if next_id:
            next_node = story_nodes.get(next_id)
            return {
                "reply": next_node["text"],
                "choices": next_node.get("choices", [])
            }

    # 기본 출력
    return {
        "reply": node["text"],
        "choices": node.get("choices", [])
    }
