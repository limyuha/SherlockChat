"use client";
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatPanel from '@/app/components/ChatPanel'
import AnswerPanel from '@/app/components/AnswerPanel'
import CasePanel from '@/app/components/CasePanel' // 새로 분리할 컴포넌트
import { API_BASE } from '@/lib/api'

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

  // ChatPanel이 새 단서를 감지하면 실행되는 함수
  const handleNewClue = (newClue: string) => {
    if (!clues.includes(newClue)) {
      setClues([...clues, newClue])

      // 단서가 증거 설명에 포함되면 해당 증거 해금
      if (article?.evidence) {
        const matches = article.evidence.filter((e: any) =>
          e.description.includes(newClue) || e.type.includes(newClue)
        )
        const matchedNames = matches.map((m: any) => m.type)
        setUnlockedEvidence([...new Set([...unlockedEvidence, ...matchedNames])])
      }
    }
  }

  return (
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
      <div className="w-[60%] h-[88vh] flex border border-red-800 rounded-2xl overflow-visible shadow-[0_0_25px_rgba(255,0,0,0.3)]">
        
        {/* 좌측 패널 */}
        <div className="relative w-1/2 border-r border-red-800 bg-black/95">
          
          {/* 📑 책갈피 버튼 */}
          <div className="absolute -left-[110px] top-20 flex flex-col gap-3">
            {[
              { key: 'story', label: '스토리' },
              { key: 'overview', label: '사건 개요 / 등장 인물' },
              { key: 'evidence', label: '증거 / 단서' },
            ].map(btn => {
              const isActive = activeTab === btn.key
              return (
                <div
                  key={btn.key}
                  onClick={() => setActiveTab(btn.key as any)}
                  className={`relative cursor-pointer select-none text-center text-sm font-semibold
                    w-[100px] py-2 border transition-all duration-300 overflow-hidden
                    ${isActive
                      ? 'bg-[#222] text-red-200 border-red-600 shadow-[inset_0_0_10px_#ff000055]'
                      : 'bg-black/80 text-red-700 border-red-900 hover:text-red-400 hover:border-red-600 hover:translate-x-[3px]'
                    }`}
                  style={{ clipPath: 'polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%)' }}
                >
                  {/* 💥 피 효과 — hover시에만, 선택(active)이면 숨김 */}
                  {!isActive && (
                    <span className="absolute inset-0 blood-burst pointer-events-none -z-10"></span>
                  )}
                  <span className="relative z-10">{btn.label}</span>
                </div>
              )
            })}
          </div>

          {/* 패널 내용 (CasePanel) */}
          <div className="relative p-8 overflow-y-auto h-full bg-black/95 border-r border-red-800">

            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none brightness-125 contrast-125"
              style={{
                backgroundImage: `url(${modeBackgrounds[mode] || modeBackgrounds['하']})`,
              }}
            />

            {/* 내용 */}
            <div className="relative z-10">
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
        <div className="w-1/2 flex flex-col bg-black/90 border-l border-red-800">
          {/* 💬 채팅창 */}
          <div className="flex-1 overflow-y-auto p-8 border-b border-red-800">
            <ChatPanel onNewClue={handleNewClue} /> {/*  단서 전달 연결 */}
          </div>

          {/* 🩸 엔딩 섹션 → 추리 패널로 변경 */}
          <div className="h-[30%] p-6 bg-black/70 border-t border-red-800 flex flex-col justify-center">
            <AnswerPanel mode={mode} />  {/* 새 컴포넌트 연결 */}
          </div>
        </div>
      </div>
    </div>
  )
}