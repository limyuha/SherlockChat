'use client'
import { useRouter } from 'next/navigation'
import "./globals.css";

export default function Home() {
  const router = useRouter()

  const handleSelect = (mode: string) => {
    router.push(`/reporter?mode=${mode}`)
  }

  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center justify-center text-white">
      {/* 🩸 손자국 배경 */}
      <div className="blood-overlay">
        <div className="hand hand1" />
        <div className="hand hand2" />
        <div className="hand hand3" />
        <div className="hand hand4" />
      </div>

      {/* 제목 살짝 위로 올림 */}
      <h1 className="text-5xl font-bold mb-20 -translate-y-24">🎙️ 사건 리포터</h1>


      {/* 카드 크기 확대 + 간격 증가 */}
      <div className="grid grid-cols-3 gap-14">
        <div onClick={() => handleSelect('real')} className="mode-card">
          <div className="mode-card-title">👹 상</div>
          <div className="mode-card-desc">스릴러 소설</div>
        </div>

        <div onClick={() => handleSelect('murder')} className="mode-card">
          <div className="mode-card-title">🔪 중</div>
          <div className="mode-card-desc">살인사건 추리</div>
        </div>

        <div onClick={() => handleSelect('ghost')} className="mode-card">
          <div className="mode-card-title">👻 하</div>
          <div className="mode-card-desc">누가 귀신일까?</div>
        </div>
      </div>
    </main>
  )
}
