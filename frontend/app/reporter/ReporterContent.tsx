'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatPanel from '@/app/components/ChatPanel'
import AnswerPanel from '@/app/components/AnswerPanel'
import CasePanel from '@/app/components/CasePanel' // 새로 분리할 컴포넌트
import { API_BASE } from '@/lib/api'
import BackButton from "@/app/components/BackButton"

import { Bookmark } from "lucide-react"

export default function ReporterPage() {
  const [article, setArticle] = useState<any>(null)
  const [showSolution, setShowSolution] = useState(false)
  const params = useSearchParams()
  const mode = params.get('mode') || '하'
  // 감지된 단서 상태
  const [clues, setClues] = useState<string[]>([])  
  // 해금된 증거
  const [unlockedEvidence, setUnlockedEvidence] = useState<string[]>([]) 
  // 책갈피 탭 
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'evidence' | 'clues'>('overview')
  // 스토리
  const [story1, setStory1] = useState('')

  // 모드별 이미지 매핑
  const modeBackgrounds: Record<string, string> = {
    상: "/textures/blood/blood4.png",
    중: "/textures/blood/blood5.png",
    // 하: "/textures/blood_splatter1.png",
    하: "/textures/blood/blood3.png",
  }

  // useEffect는 "특정 상태 변화"에 반응하는 훅
  //사건 JSON 불러오기, 스토리 불러오기
  useEffect(() => {
    fetch(`${API_BASE}/api/report?mode=${mode}`)
      .then(res => res.json())
      .then(data => {
        setArticle(data.case)
        setStory1(data.story) // 스토리까지 같이 저장
      })
      .catch(() => setStory1("스토리를 불러올 수 없습니다."))
  }, [mode])

  // ChatPanel이 새 단서를 감지하면 실행되는 함수 (배열 단서 처리)
  const handleNewClue = (newClues: string[]) => {
    // 중복 없이 새 단서 병합
    const updatedClues = [...new Set([...clues, ...newClues])]
    setClues(updatedClues)

    // 증거 데이터가 있으면 해금 처리
    if (article?.evidence) {
      const matchedNames = article.evidence
        .filter((e: any) =>
          newClues.some((clue) =>
            e.description.includes(clue) || e.type.includes(clue)
          )
        )
        .map((m: any) => m.type)

      // 이미 해금된 것과 새로 해금된 것 합치기
      setUnlockedEvidence((prev) => [...new Set([...prev, ...matchedNames])])
    }
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* 🔙 뒤로가기 버튼 */}
      <div className="absolute top-3 left-3 z-[5] pointer-events-auto">
        <BackButton />
      </div>

      <div
        className="min-h-screen bg-black text-red-500 font-mono tracking-wide flex justify-center items-center select-none"
        onMouseDown={(e) => {
          // data-allow-input="true" 속성이 있는 영역만 입력 허용
          const target = e.target as HTMLElement
          const isAllowed = target.closest('[data-allow-input="true"]')
          if (!isAllowed) {
            e.preventDefault()
          }
        }}
      >
        {/* 전체 컨테이너 - 중앙 정렬 + 좌우 여백 */}
        <div className="relative w-full md:w-[90%] lg:w-[60%] h-auto md:h-[88vh] flex flex-col md:flex-row border border-red-800 rounded-2xl overflow-visible shadow-[0_0_25px_rgba(255,0,0,0.3)]">
          {/* 좌측 패널 */}
          <div className="relative w-full md:w-1/2 border-b md:border-b-0 md:border-r border-red-800 bg-black/95">
            {/* 책갈피 버튼 - 이미지 배경으로 교체 */}
            <div
              className="
                flex flex-col md:absolute md:-left-[140px] md:top-[15px] md:gap-3
                gap-2 justify-center items-center
                w-full md:w-auto
                md:flex-col flex-row
                md:z-[40] z-[20]
                overflow-visible
              "
            >
              {[
                { key: 'story', label: '📖 스토리' },
                { key: 'overview', label: '🧩 사건\n개요' },
                { key: 'evidence', label: '🔍 증거\n단서' },
              ].map((btn) => {
                const isActive = activeTab === btn.key
                return (
                  <button
                    key={btn.key}
                    data-type="bookmark"
                    tabIndex={-1}
                    onClick={() => setActiveTab(btn.key as any)}
                    className={`relative cursor-pointer select-none text-center font-semibold
                      transition-transform duration-300 ease-in-out
                      md:w-[150px] w-[130px] h-[50px] 
                      flex items-center justify-center
                      overflow-visible
                      group
                      ${isActive ? 'scale-105 brightness-[1.25]' : 'hover:scale-105'}
                    `}
                    style={{
                      backgroundImage: `url('/ui/blood-bookmark.svg')`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center',
                      color: isActive ? '#fff0f0' : '#ff5a5a',
                      textShadow: isActive
                        ? '0 0 8px #ff0000, 0 0 16px #ff3030'
                        : '0 0 4px #660000',
                      filter: isActive
                        ? 'drop-shadow(0 0 10px #ff0000)'
                        : 'drop-shadow(0 0 4px #400000)',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                  >
                    <span
                      className="absolute inset-0 bg-red-700/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    />
                    <span
                      className="relative z-10 flex flex-col items-center justify-center text-center
                                text-[12px] sm:text-[13px] md:text-[14px]
                                leading-[1.1] tracking-tight whitespace-pre-line px-1"
                    >
                      {btn.label}
                    </span>


                  </button>
                )
              })}
            </div>

          {/* 패널 내용 (CasePanel) */}
          <div className="relative p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[70vh] md:max-h-full bg-black/95 border-r border-red-800">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none brightness-125 contrast-125"
              style={{
                backgroundImage: `url(${modeBackgrounds[mode] || modeBackgrounds['하']})`,
              }}
            />

            {/* 내용 */}
            <div className="relative z-10 text-xs sm:text-sm md:text-base">
              {article ? (
                <CasePanel
                  article={article}
                  clues={clues}
                  unlockedEvidence={unlockedEvidence}
                  activeTab={activeTab}
                  mode={mode}
                  story1={story1}
                />
              ) : (
                <p>데이터를 불러오는 중...</p>
              )}
              </div>
            </div>
          </div>


          {/* 우측: 대화 + 엔딩 */}
          <div className="w-full md:w-1/2 flex flex-col bg-black/90 border-t md:border-t-0 md:border-l border-red-800">
            {/* 💬 채팅창 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 border-b border-red-800">
              <ChatPanel onNewClue={handleNewClue} /> {/*  단서 전달 연결 */}
            </div>

            {/* 🩸 엔딩 섹션 → 추리 패널로 변경 */}
            <div className="h-auto md:h-[30%] p-4 sm:p-6 bg-black/70 border-t border-red-800 flex flex-col justify-center">
              <AnswerPanel mode={mode} />  {/* 새 컴포넌트 연결 */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
