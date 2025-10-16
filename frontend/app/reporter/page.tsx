'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ArticleCard from '@/app/components/ArticleCard'
import ChatPanel from '@/app/components/ChatPanel'
import ClueBoard from '@/app/components/ClueBoard'
import { API_BASE } from '@/lib/api'

export default function ReporterPage() {
  const [article, setArticle] = useState<any>(null)
  const params = useSearchParams()
  const mode = params.get('mode') || '하' // 기본 모드

  useEffect(() => {
    fetch(`${API_BASE}/api/report?mode=${mode}`)
      .then(res => res.json())
      .then(data => setArticle(data))
  }, [mode])

  return (
    <div className="min-h-screen bg-black text-red-500 flex justify-center items-center px-10 py-8">
      {/* 중앙 콘텐츠 영역 */}
      <div className="flex w-full max-w-7xl h-[90vh] bg-black border border-red-700 rounded-2xl shadow-[0_0_20px_rgba(255,0,0,0.4)] overflow-hidden">
        
        {/* 왼쪽: 사건 정보 패널 */}
        <div className="w-[55%] p-8 overflow-y-auto border-r border-red-800 bg-black/90 backdrop-blur-md">
          {article ? (
            <div>
              <ArticleCard article={article} />

              {/* 사건 개요 */}
              <section className="mt-6">
                <h2 className="text-lg font-semibold mb-2 text-red-400">📍 사건 개요</h2>
                <ul className="text-sm leading-relaxed space-y-1">
                  <li>장소: {article.case_overview?.setting}</li>
                  <li>시간: {article.case_overview?.time}</li>
                  <li>피해자: {article.case_overview?.victim}</li>
                  <li>사망 원인: {article.case_overview?.death_cause}</li>
                </ul>
              </section>

              {/* 등장 인물 */}
              <section className="mt-6">
                <h2 className="text-lg font-semibold mb-2 text-red-400">👥 등장 인물</h2>
                <ul className="text-sm space-y-2">
                  {article.characters?.map((c: any, i: number) => (
                    <li key={i} className="border-b border-red-800 pb-2">
                      <strong>{c.name}</strong>
                      {c.occupation && <> — {c.occupation}</>}
                      {c.alibi && <div className="text-red-300 ml-2 text-xs">📘 {c.alibi}</div>}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 증거 목록 */}
              <section className="mt-6">
                <h2 className="text-lg font-semibold mb-2 text-red-400">🔍 증거 목록</h2>
                <ul className="text-sm space-y-2">
                  {article.evidence?.map((e: any, i: number) => (
                    <li key={i} className="border-b border-red-800 pb-2">
                      <strong>{e.type}</strong> — {e.description}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <p className="text-red-300">사건 데이터를 불러오는 중...</p>
          )}
        </div>

        {/* 오른쪽: 대화 및 단서 패널 */}
        <div className="flex flex-col w-[45%] bg-black/90 backdrop-blur-md">
          <div className="flex-1 overflow-y-auto p-6 border-b border-red-800">
            <ChatPanel />
          </div>
          <div className="h-[30%] p-4">
            <ClueBoard />
          </div>
        </div>
      </div>
    </div>
  )
}
