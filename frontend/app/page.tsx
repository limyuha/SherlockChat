"use client";
import { useRouter } from "next/navigation";
import { useCases } from "./context/CaseContext";
import "./globals.css";

export default function Home() {
  const router = useRouter();
  const { cases } = useCases();

  const handleSelect = (mode: string) => {
    router.push(`/reporter?mode=${mode}`);
  };

  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center justify-center text-white select-none px-4 sm:px-8">
      {/* 🩸 손자국 배경 */}
      <div className="blood-overlay">
        <div className="hand hand1" />
        <div className="hand hand2" />
        <div className="hand hand3" />
        <div className="hand hand4" />
      </div>

      <div className="flex flex-col items-center justify-center mt-[-1rem] mb-4 text-center">
        <img
          src="/logo.png"
          alt="Sherlock Chat"
          className="w-24 sm:w-32 h-auto opacity-90 drop-shadow-[0_0_12px_rgba(255,0,0,0.4)]"
        />
        <h1 className="text-3xl sm:text-4xl font-bold text-red-600 mt-4 tracking-widest drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]">
          공포 추리 챗봇
        </h1>
      </div>

      {/* 카드 자동 생성 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10 md:gap-14 mt-4 w-full max-w-[1000px]">
        {Object.entries(cases).map(([mode, data]) => (
          <div
            key={mode}
            onClick={() => handleSelect(mode)}
            className="mode-card cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="mode-card-title text-lg sm:text-xl md:text-2xl">
              {data.summary_tag}
            </div>
            <div className="mode-card-desc text-sm sm:text-base md:text-lg">
              {data.summary_desc}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
