import json
import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI
import os

# 1️⃣ 환경 변수 불러오기
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 2️⃣ 페이지 설정
st.set_page_config(page_title="SherlockChat - 추리 뉴스", layout="centered")

# 3️⃣ 사건 데이터 불러오기
with open("cases/case1.json", "r", encoding="utf-8") as f:
    case = json.load(f)

# 4️⃣ 뉴스 리포트 표시
st.title(f"🗞️ {case['title']}")
st.write(case["summary"])

st.markdown("### 🔎 단서 목록")
for c in case["clues"]:
    st.write(f"- {c}")

st.markdown("---")

# 5️⃣ 세션 상태 초기화
if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "system",
            "content": f"""
            너는 냉철하면서도 직감이 좋은 탐정 AI ‘셜록’이야. 
            사용자의 추리를 보조하며 사건을 함께 해결해나가는 동료 탐정의 역할을 맡고 있어. 
            보고서처럼 딱딱하게 말하지 말고, 사람처럼 감정을 섞어서 이야기해.
            문장마다 생각의 흐름이 드러나야 해. (예: “음, 그건 흥미로운데...”, “좋아, 그럴 수도 있겠네.”)
            질문이나 단서 제안으로 대화를 자연스럽게 이어가. 
            사건 제목은 '{case['title']}'이야.
            """
        },
        {
            "role": "assistant",
            "content": "🕵️ 사건 브리핑 완료. 좋아, 이제 어디서부터 풀어볼까?"
        }
    ]


# 6️⃣ 지금까지의 대화 출력
for msg in st.session_state.messages:
    if msg["role"] == "assistant":
        st.markdown(f"**AI:** {msg['content']}")
    elif msg["role"] == "user":
        st.markdown(f"**👤 당신:** {msg['content']}")

# 7️⃣ 사용자 입력
user_input = st.text_input("🕵️ 추리를 계속 진행하세요:")

# 8️⃣ 버튼 클릭 시 대화 추가
if st.button("전송"):
    if user_input.strip():
        user_message = user_input.strip()
        st.session_state.messages.append({"role": "user", "content": user_message})

        # 🎯 1️⃣ 단서 매칭 로직
        found_location = None
        for location, has_clue in case.get("locations", {}).items():
            if location in user_message:
                found_location = (location, has_clue)
                break

        # 🎯 2️⃣ 결과 생성
        if found_location:
            loc_name, has_clue = found_location
            if has_clue:
                ai_reply = f"🔎 좋아요! 당신의 추리가 맞았어요. **{loc_name} 근처에서 중요한 단서가 발견됐어요.**"
            else:
                ai_reply = f"❌ 흠... **{loc_name} 근처에서는 아무 단서도 발견되지 않았어요.** 다른 곳을 수색해볼까요?"
        else:
            # 🎯 3️⃣ 일반 대화 (GPT 호출)
            with st.spinner("AI가 분석 중입니다..."):
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=st.session_state.messages,
                    temperature=0.8,
                )
                ai_reply = response.choices[0].message.content

        # 🎯 4️⃣ AI 응답 추가 및 렌더링
        st.session_state.messages.append({"role": "assistant", "content": ai_reply})
        st.rerun()

