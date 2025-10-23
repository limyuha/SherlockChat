'use client'
import { useRouter } from 'next/navigation'
import "./globals.css";

export default function Home() {
  const router = useRouter()

  const handleSelect = (mode: string) => {
    router.push(`/reporter?mode=${mode}`)
  }

  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center justify-center text-white select-none">
      {/* 🩸 손자국 배경 */}
      <div className="blood-overlay">
        <div className="hand hand1" />
        <div className="hand hand2" />
        <div className="hand hand3" />
        <div className="hand hand4" />
      </div>

      <div className="flex flex-col items-center justify-center mt-[-1rem] mb-4">
        <img
          src="/logo.png"
          alt="Sherlock Chat"
          className="w-32 h-auto opacity-90 drop-shadow-[0_0_12px_rgba(255,0,0,0.4)]"
        />
        <h1 className="text-4xl font-bold text-red-600 mt-4 tracking-widest drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]">
          공포 추리 챗봇
        </h1>
      </div>

      {/* 카드 크기 확대 + 간격 증가 */}
      <div className="grid grid-cols-3 gap-14">
        <div onClick={() => handleSelect('상')} className="mode-card">
          <div className="mode-card-title">👹 상</div>
          <div className="mode-card-desc">스릴러 소설</div>
        </div>

        <div onClick={() => handleSelect('중')} className="mode-card">
          <div className="mode-card-title">🔪 중</div>
          <div className="mode-card-desc">살인사건 추리</div>
        </div>

        <div onClick={() => handleSelect('하')} className="mode-card">
          <div className="mode-card-title">도난 사건</div>
          <div className="mode-card-desc">사라진 USB의 비밀</div>
        </div>
      </div>
    </main>
  )
}
