# 🕵️ Mystery Reporter
AI 기반 인터랙티브 공포 추리 시스템

---

## 📖 프로젝트 개요
Mystery Reporter는 사용자가 ‘사건 리포터’가 되어 세 가지 난이도(상·중·하)의 사건 중 하나를 선택하고,
AI 탐정과의 대화를 통해 사건의 진실에 접근하는 **대화형 추리 게임형 챗봇**입니다.

---

## 🚀 주요 기능
- 사건 데이터(`case_low.json`, `case_mid.json`, `case_high.json`) 자동 로드
- GPT 기반 AI 탐정 대화 (FastAPI + OpenAI API)
- 인물 및 증거 자동 탐색 (자연어 키워드 인식)
- 사건별 엔딩(진실) 공개 기능
- 다크 모드 기반 UI (Next.js + TailwindCSS)

---

## 🧠 기술 스택
| 구분 | 기술 |
|------|------|
| **Frontend** | Next.js, React, TailwindCSS |
| **Backend** | FastAPI (Python) |
| **AI** | OpenAI GPT-4o-mini API |
| **Data** | JSON 기반 사건 시나리오 |

---

## ⚙️ 실행 방법

### 1️⃣ 환경 설정
1. 루트 경로에 `.env` 파일 생성
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here


* Python 가상환경 생성 및 패키지 설치
python -m venv venv
source venv/bin/activate  # (Windows: venv\Scripts\activate)
pip install fastapi uvicorn openai python-dotenv

* Next.js 프론트엔드 의존성 설치
cd frontend  # 프론트 폴더로 이동 (없다면 직접 생성)
npm install

* 백엔드 실행 (FastAPI)
uvicorn main:app --reload

* 프론트엔드 실행 (Next.js)
npm run dev

- 기본 실행 주소: http://localhost:3000
- 홈 화면에서 사건 난이도(상/중/하) 선택 → AI 리포터 페이지 이동