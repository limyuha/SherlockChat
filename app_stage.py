import json
import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI
import os

# 1️⃣ 환경 변수 불러오기
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 2️⃣ 페이지 설정
st.set_page_config(page_title="SherlockChat - 추리 게임", layout="centered")

# 3️⃣ 사건 데이터 로드
with open("cases/case1.json", "r", encoding="utf-8") as f:
    case = json.load(f)

st.title(f"🕵️‍♂️ {case['title']}")
st.write(case["summary"])

st.markdown("### 🔎 단서 목록")
for c in case["clues"]:
    st.write(f"- {c}")

st.markdown("---")

# 4️⃣ 세션 초기화
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "🧩 사건 브리핑 완료. 당신의 추리를 입력해보세요."}
    ]
    st.session_state.found_clues = set()
    st.session_state.game_over = False

# 5️⃣ 대화 출력
for msg in st.session_state.messages:
    if msg["role"] == "assistant":
        st.markdown(f"**AI:** {msg['content']}")
    else:
        st.markdown(f"**👤 당신:** {msg['content']}")

# 6️⃣ 사용자 입력
user_input = st.text_input("🕵️ 추리를 입력하세요:")

# 7️⃣ 전송 버튼 클릭 시
if st.button("전송") and not st.session_state.game_over:
    if user_input.strip():
        user_message = user_input.strip()
        st.session_state.messages.append({"role": "user", "content": user_message})

        # 🎯 1️⃣ 단서 매칭
        found_location = None
        for location, has_clue in case.get("locations", {}).items():
            if location in user_message:
                found_location = (location, has_clue)
                break

        # 🎯 2️⃣ 단서 결과
        if found_location:
            loc_name, has_clue = found_location
            if has_clue:
                if loc_name not in st.session_state.found_clues:
                    st.session_state.found_clues.add(loc_name)
                    ai_reply = f"🔎 좋아요! 당신의 추리가 맞았어요. **{loc_name} 근처에서 중요한 단서가 발견됐어요.**"
                else:
                    ai_reply = f"📍 이미 **{loc_name}** 근처 단서를 찾았어요. 다른 곳도 살펴보죠."
            else:
                ai_reply = f"❌ **{loc_name}** 근처에서는 아무 단서도 발견되지 않았어요."
        else:
            # 🎯 3️⃣ 일반 대화 (GPT 사용)
            with st.spinner("AI가 생각 중입니다..."):
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "너는 추리 보조 탐정 AI 셜록이야. 간결하고 자연스럽게 말해."},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.8,
                )
                ai_reply = response.choices[0].message.content

        # 🎯 4️⃣ 단서 모두 찾았는지 확인
        all_true_clues = {k for k, v in case["locations"].items() if v}
        if st.session_state.found_clues == all_true_clues:
            ai_reply += "\n\n🎉 모든 단서를 찾았습니다! 결말이 밝혀집니다...\n\n" + case["ending"]
            st.session_state.game_over = True

        st.session_state.messages.append({"role": "assistant", "content": ai_reply})
        st.rerun()
