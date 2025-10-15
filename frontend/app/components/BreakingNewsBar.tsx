"use client"; // 클라이언트 컴포넌트로 지정

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BreakingNewsBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [headline, setHeadline] = useState("🕵️ Breaking News : 사건 리포터 AI가 단서를 추적 중...");

  // ✅ 모드 감지
  useEffect(() => {
    const mode = searchParams.get("mode");

    switch (mode) {
      case "real":
        setHeadline("🩸 Breaking News : 실제 범죄 사건 속보");
        break;
      case "murder":
        setHeadline("🔪 Breaking News : 살인 사건 긴급 속보");
        break;
      case "ghost":
        setHeadline("👻 Breaking News : 귀신 사건 발생, 주의 요망");
        break;
      default:
        setHeadline("🕵️ Breaking News : 사건 리포터 AI가 단서를 추적 중...");
    }
  }, [pathname, searchParams]);

  // ✅ 음성 재생 (headline이 바뀔 때마다)
  useEffect(() => {
    if (!headline) return;
    const utterance = new SpeechSynthesisUtterance(headline);
    utterance.lang = "ko-KR"; // 한국어 뉴스 스타일
    utterance.pitch = 0.9; // 약간 낮은 톤
    utterance.rate = 1; // 속도
    utterance.volume = 1; // 볼륨
    speechSynthesis.cancel(); // 이전 음성 중복 방지
    speechSynthesis.speak(utterance);
  }, [headline]);

  return (
    <div className="breaking-news-bar">
      <div className="breaking-news-text">{headline}</div>
    </div>
  );
}
