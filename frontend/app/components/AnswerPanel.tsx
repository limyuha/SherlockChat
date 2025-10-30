"use client";
import { useState } from 'react'
import { API_BASE } from '@/lib/api'

export default function AnswerPanel({ mode }: { mode: string }) {
  const [answer, setAnswer] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submitAnswer = async () => {
    if (!answer.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/submit_answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, answer }),
      })
      const data = await res.json()
      setScore(data.score)
      setFeedback(data.feedback)
      setSubmitted(true)
    } catch (e) {
      setFeedback('❌ 서버와 통신 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center text-center text-xs sm:text-sm md:text-base">
      {!submitted ? (
        <>
          <h2 className="text-lg sm:text-xl font-bold text-red-500 mb-3">🧩 추리 작성</h2>
          <textarea
            data-allow-input="true" // ReporterPage에서 이 속성 가진 요소는 입력 허용
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="당신의 추리를 입력하세요..."
            className="w-full h-28 sm:h-32 bg-black/70 border border-red-700 rounded-lg p-2 sm:p-3 text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-xs sm:text-sm md:text-base"
          />
          <button
            onClick={submitAnswer}
            disabled={loading}
            className="mt-3 w-full bg-red-700 hover:bg-red-900 text-white font-semibold py-2 rounded-lg transition-all shadow-lg shadow-red-900/40 text-xs sm:text-sm md:text-base"
          >
            {loading ? 'AI가 채점 중...' : '제출'}
          </button>
        </>
      ) : (
        <div className="mt-3 bg-black/80 p-3 sm:p-4 md:p-5 rounded-lg border border-red-700 shadow-inner w-full">
          <h3 className="text-lg sm:text-xl text-red-400 font-bold mb-2">💀 채점 결과</h3>
          <p className="text-2xl sm:text-3xl font-extrabold text-red-500 mb-2">{score} / 100</p>
          <p className="text-xs sm:text-sm text-red-300 whitespace-pre-wrap">{feedback}</p>
        </div>
      )}
    </div>
  )
}
