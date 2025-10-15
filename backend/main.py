import json, random
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
CASE_PATH = BASE_DIR / "cases" / "case001.json"

@app.get("/api/report")
def get_report(mode: str):
    if mode == "ghost":
        with open(CASE_PATH, "r", encoding="utf-8") as f:
            case = json.load(f)
        return {
            "title": case["title"],
            "summary": case["summary"],
            "difficulty": case["difficulty"],
            "image": "https://images.unsplash.com/photo-1607863680165-5f4fa3f3923d",
            "setting": case["setting"]
        }
    elif mode == "real":
        return {"title": "신촌 살인사건, 새 단서 발견", "date": "2025-10-13", "location": "서울 신촌", "summary": "오늘 새벽 신촌 한 아파트에서...", "image": "https://picsum.photos/800/400"}
    else:
        return {"title": "도심 속 살인사건, 목격자는 누구?", "summary": "용의자는 피해자의 직장 동료로 추정된다."}


@app.post("/api/chat")
async def chat(req: Request):
    data = await req.json()
    message = data.get("message", "").lower()

    # 귀신 모드 대화 처리
    if any(keyword in message for keyword in ["귀신", "병실", "밥", "거울", "사람", "퇴원", "cctv"]):
        with open(CASE_PATH, "r", encoding="utf-8") as f:
            case = json.load(f)
        responses = case["responses"]
        for key, resp in responses.items():
            if key.lower() in message:
                return {"reply": resp}
        # 단서 중 하나 랜덤 공개
        clue = random.choice(case["clues"])
        return {"reply": f"단서 발견 🧩: {clue}"}

    # 일반 모드 응답
    reply = f"기자 AI: '{message}'에 대한 답변을 준비 중입니다."
    return {"reply": reply}
