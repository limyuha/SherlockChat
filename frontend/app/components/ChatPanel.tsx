'use client'
import { useState, useRef, useEffect } from 'react'
import { API_BASE } from '@/lib/api'
import { useSearchParams } from 'next/navigation' // mode 읽기용

// 단서를 상위(ReporterPage나 page.tsx)로 올리기 위해
// prop으로 함수를 받아서 호출(없어도 오류 안나도록 ? 추가)
export default function ChatPanel({ onNewClue }: { onNewClue?: (clue: string) => void }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'system', text: '안녕하세요, 사건 리포터 AI입니다. 사건에 대해 궁금한 점이 있나요?' }
  ])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null) // 스크롤 참조용
  const params = useSearchParams() // URL 쿼리 읽기용
  const mode = params.get('mode') || '하' // 기본값 '하' 설정

   // 새 메시지가 추가될 때마다 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const newMessages = [...messages, { role: 'user', text: input }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages, // 이전 대화 기록 함께 전송
          mode,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', text: data.reply }])

    // 단서(clue)가 응답에 포함되어 있으면 상위로 전달(왼쪽 패널로 전달)
    if (data.clue && onNewClue) {
      onNewClue(data.clue)
    }

    } catch (err) {
      console.error(err)
      setMessages([
        ...newMessages,
        { role: 'assistant', text: '❌ 서버와 통신 중 오류가 발생했습니다.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 출력 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 p-2 scroll-smooth"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-xl whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-blue-100 text-right'
                : m.role === 'assistant'
                ? 'bg-gray-200 text-left'
                : 'text-center text-sm text-gray-400'
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="text-red-500 text-sm animate-pulse">기자가 단서를 정리 중...</div>
        )}
      </div>

      {/* 입력창 */}
      <div className="flex gap-2 mt-3 border-t pt-3">
        <input
          data-allow-input="true" // ReporterPage에서 이 속성 가진 요소는 입력 허용
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="질문을 입력하세요..."
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <button
          onClick={sendMessage}
          className={`px-4 rounded-lg text-white transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          전송
        </button>
      </div>
    </div>
  )
}
