@echo off
chcp 65001 >nul
title SherlockChat - Full Auto Starter

echo ======================================================
echo SherlockChat 통합 개발 환경 자동 실행 중...
echo ======================================================

:: 루트로 이동
cd /d C:\SherlockChat

:: 가상환경 활성화
echo [1/5] 가상환경 활성화...
call venv\Scripts\activate

:: FastAPI 백엔드 실행 (새 창)
echo [2/5] FastAPI 서버 실행...
start "FastAPI Server" cmd /k "chcp 65001 >nul && cd backend && uvicorn main:app --reload"

:: 프론트엔드 실행 (새 창)
echo [3/5] Next.js 프론트엔드 실행...
start "Frontend Server" cmd /k "chcp 65001 >nul && cd frontend && npm run dev"

:: 포트 확인
echo [4/5] 포트 상태 확인...
timeout /t 3 >nul
echo 확인 중...

netstat -ano | findstr :8000 >nul
if %errorlevel%==0 (
    echo FastAPI (포트 8000) 실행 중
) else (
    echo FastAPI (포트 8000) 실행 안 됨
)

netstat -ano | findstr :3000 >nul
if %errorlevel%==0 (
    echo Next.js (포트 3000) 실행 중
) else (
    echo Next.js (포트 3000) 실행 안 됨
)

:: 크롬 브라우저 자동 실행
echo [5/5] 브라우저 열기...
timeout /t 2 >nul
start "" "http://localhost:3000/reporter?mode=ghost"

echo ======================================================
echo 모든 서버가 실행되었습니다!
echo - FastAPI:  http://127.0.0.1:8000
echo - Frontend: http://localhost:3000
echo ======================================================
pause
