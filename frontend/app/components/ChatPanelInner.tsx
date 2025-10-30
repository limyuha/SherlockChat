"use client";
import { useState, useRef, useEffect } from 'react'
import { API_BASE } from '@/lib/api'
import { useSearchParams } from 'next/navigation' // mode 읽기용

// 단서를 상위(ReporterPage나 page.tsx)로 올리기 위해
// prop으로 함수를 받아서 호출(없어도 오류 안나도록 ? 추가)
export default function ChatPanel({ onNewClue }: { onNewClue?: (clues: string[]) => void }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'system', text: '안녕하세요, 사건 리포터 AI입니다. 사건에 대해 궁금한 점이 있나요?' }
  ])
  const [loading, setLoading] = useState(false)
  // 스크롤 참조용
  const scrollRef = useRef<HTMLDivElement | null>(null) 
  // URL 쿼리 읽기용
  const params = useSearchParams() 
  // 기본값 '하' 설정
  const mode = params.get('mode') || '하' 
  // 힌트 표시 상태
  const [showHints, setShowHints] = useState(true)
  // 기본 질문 코인 수
  const [coins, setCoins] = useState<number>(0)

  // 난이도별 코인 개수
  useEffect(() => {
    if (mode === '상') setCoins(50)
    else if (mode === '중') setCoins(35)
    else setCoins(20)
  }, [mode])

  // 새 메시지가 추가될 때마다 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  // 모드별 예시 질문 (최초 3개)
  const modeHints: Record<string, string[]> = {
    상: [
      '“녹음 장치엔 뭐가 녹음돼 있었지?”',
      '“시계가 왜 계속 11시를 가리키고 있어?”',
      '“D-01 문서에 뭐라고 적혀 있었어?”',
    ],
    중: [
      '“피해자의 방에 뭐가 있었어?”',
      '“CCTV에는 누가 찍혔어?”',
      '“L씨에 관해 알려줘”',
    ],
    하: [
      '“USB가 사라졌다고 했는데, 누가 마지막으로 봤어?”',
      '“카페 CCTV에는 뭐가 찍혔어?”',
    ],
  }

  // 현재 모드에 해당하는 힌트
  const hintQuestions = modeHints[mode] || modeHints['하']

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    setShowHints(false) // 질문 시작 시 힌트 숨김

    // 질문 코인이 없으면 전송 불가
    if (coins <= 0) {
      setMessages([
        ...messages,
        { role: 'assistant', text: '❌ 질문 코인이 부족합니다. 더 이상 질문할 수 없습니다.' },
      ])
      return
    }

    // 전송 시 코인 1개 차감
    setCoins((prev) => prev - 1)
    setShowHints(false)

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
      console.log("서버 응답 hints:", data.hints);

      // reply + hints를 한 번에 묶어서 추가
      let updatedMessages = [...newMessages, { role: 'assistant', text: data.reply }]

      // 조수의 생각 중복 방지 처리
      if (data.hints && data.hints.length > 0) {
        const existingHints = new Set(
          messages
            .filter(m => m.text.startsWith("💭 조수의 생각"))
            .map(m => m.text)
        )

        const uniqueNewHints = data.hints
          .map((h: string) => {
            // "핸드폰: 힌트문" → "힌트문" 으로 변환
            const cleanText = h.includes(":") ? h.split(":").slice(1).join(":").trim() : h.trim()
            return cleanText
          })
          .filter(
            (hintText: string) =>
              !existingHints.has(`💭 조수의 생각\n${hintText}`)
          )

        uniqueNewHints.forEach((hintText: string) => {
          updatedMessages.push({
            role: "assistant",
            text: `💭 조수의 생각\n${hintText}`, // 👈 이모티콘 변경 + 줄바꿈
          })
        })
      }

      // 한 번만 setMessages 호출
      setMessages(updatedMessages)

      if (onNewClue) {
        if (data.clues && data.clues.length > 0) {
          onNewClue(data.clues)
        } else if (data.clue) {
          onNewClue([data.clue])
        }
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
    <div className="flex flex-col h-full relative text-xs sm:text-sm md:text-base">
      {/* 초기 질문 힌트 */}
      {showHints && (
        <div className="absolute bottom-[85px] left-1/2 -translate-x-1/2 text-center pointer-events-none animate-fade-in z-10 px-2">
          <div className="flex flex-col gap-1 text-red-400 font-light opacity-80 text-[11px] sm:text-sm md:text-base">
            {hintQuestions.map((q, i) => (
              <p
                key={i}
                className="italic tracking-wide drop-shadow-[0_0_6px_rgba(255,0,0,0.5)]"
              >
                {q}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 메시지 출력 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 px-2 pt-2 pb-1 scroll-smooth max-h-[55vh] sm:max-h-[60vh] md:max-h-none"
      >
        {/* 실제 메시지 목록 */}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === 'user'
                ? 'justify-end'
                : m.role === 'assistant'
                ? 'justify-start'
                : 'justify-center'
            }`}
          >
            <div
              className={`relative max-w-[85%] md:max-w-[75%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl leading-relaxed whitespace-pre-wrap
                shadow-[0_0_12px_rgba(255,0,0,0.25)]
                ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-[#1a0000] to-[#4d0000] text-[#ffcccc] border border-[#ff1a1a70]'
                    : m.role === 'assistant'
                    ? 'bg-gradient-to-r from-[#2b0000] to-[#660000] text-[#fff0f0] border border-[#ff333370]'
                    : 'text-gray-400 text-xs italic'
                }`}
            >
              <div
                className={`whitespace-pre-wrap ${
                  m.text.includes("🧠 조수의 생각")
                    ? "text-yellow-400 italic border border-yellow-500/40 bg-black/40 px-2 py-1 rounded-md shadow-[0_0_8px_rgba(255,255,100,0.3)]"
                    : ""
                }`}
                dangerouslySetInnerHTML={{
                  __html: m.text.replace(/\n/g, "<br/>"),
                }}
              ></div>

              {/* 꼬리 (공통 스타일, 방향만 다름) */}
              {m.role === 'user' && (
                <span
                  className="absolute w-3 h-3 bg-[#4d0000] rotate-45 right-[-5px] bottom-[10px]
                  border-r border-t border-[#ff1a1a70]
                  shadow-[2px_-2px_4px_rgba(255,0,0,0.2)]"
                />
              )}
              {m.role === 'assistant' && (
                <span
                  className="absolute left-[-10px] bottom-[12px] 
                    w-0 h-0 
                    border-t-[6px] border-t-transparent 
                    border-b-[6px] border-b-transparent 
                    border-r-[10px] border-r-[#550000] 
                    drop-shadow-[0_0_4px_rgba(255,0,0,0.4)]"
                />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-red-500 text-sm animate-pulse">기자가 단서를 정리 중...</div>
        )}
      </div>

      {/* 코인 표시 */}
      <div className="flex justify-end items-center text-[11px] sm:text-sm md:text-base font-semibold text-red-400 tracking-wide mt-[6px] mb-[4px] pr-1">
        <span>질문 코인:</span>
        <span className="ml-1 text-red-300 drop-shadow-[0_0_6px_rgba(255,0,0,0.7)]">{coins}</span>
        <span className="ml-1">💰</span>
      </div>

      {/* 입력창 */}
      <div className="flex gap-2 border-t border-red-800 pt-[6px] pb-[3px] mt-[2px] items-center justify-center px-2 sm:px-0">
        <input
          data-allow-input="true"  // ReporterPage에서 이 속성 가진 요소는 입력 허용
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={coins > 0 ? '질문을 입력하세요...' : '질문 코인이 없습니다.'}
          disabled={coins <= 0}
          className={`w-[75%] sm:w-[80%] border border-red-800/60 bg-black/40 rounded-md px-2 sm:px-3 py-[6px] text-xs sm:text-sm md:text-base text-red-100 focus:outline-none ${
            coins <= 0
              ? 'bg-gray-900 text-gray-500 cursor-not-allowed'
              : 'focus:ring-1 focus:ring-red-500 shadow-[0_0_4px_#ff0000]'
          }`}
        />
        <button
          onClick={sendMessage}
          disabled={coins <= 0}  // 코인 0이면 버튼 비활성화
          className={`px-3 sm:px-4 py-[6px] rounded-md text-xs sm:text-sm md:text-base font-semibold text-white transition-all shadow-[0_0_6px_rgba(255,0,0,0.4)] ${
            loading || coins <= 0
              ? 'bg-gray-600 cursor-not-allowed opacity-60'
              : 'bg-red-700 hover:bg-red-800 hover:shadow-[0_0_10px_#ff0000]'
          }`}
        >
          전송
        </button>
      </div>
    </div>
  )
}
