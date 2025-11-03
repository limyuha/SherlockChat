"use client";
import { useSearchParams } from "next/navigation";
import { useCases } from "@/app/context/CaseContext";
import { useEffect, useState } from "react";

export default function BreakingNewsInner() {
  const searchParams = useSearchParams();
  const { cases } = useCases();
  const [headline, setHeadline] = useState("🕵️ 사건 리포터 AI가 단서를 추적 중...");

  useEffect(() => {
    const mode = searchParams.get("mode") as "상" | "중" | "하";
    const headlineText = cases[mode]?.headline;
    if (headlineText) setHeadline(headlineText);
  }, [cases, searchParams]);

  // 뉴스 톤 음성 (선택사항: 원하면 삭제 가능)
  useEffect(() => {
    if (!headline) return;
    const utterance = new SpeechSynthesisUtterance(headline);
    utterance.lang = "ko-KR";
    utterance.pitch = 0.9;
    utterance.rate = 1;
    utterance.volume = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }, [headline]);

  return (
    <div className="breaking-news-bar">
      <div className="breaking-news-text">{headline}</div>
    </div>
  );
}
