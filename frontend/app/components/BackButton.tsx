"use client"
import { useRouter } from "next/navigation"

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push("/")} // 메인 페이지로 이동
      className="
        hidden md:block                      /*  모바일에서는 숨기고, md(768px↑)부터 표시 */
        px-3 py-1 rounded-md text-sm font-semibold
        text-red-300 border border-red-700/60 
        hover:bg-red-900/40 transition-all 
        shadow-[0_0_6px_rgba(255,0,0,0.4)]
      "
    >
      ← 메인으로
    </button>
  )
}
