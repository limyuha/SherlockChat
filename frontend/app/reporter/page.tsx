'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ArticleCard from '@/app/components/ArticleCard'
import ChatPanel from '@/app/components/ChatPanel'
import { API_BASE } from '@/lib/api'

export default function ReporterPage() {
  const [article, setArticle] = useState<any>(null)
  const [showSolution, setShowSolution] = useState(false)
  const params = useSearchParams()
  const mode = params.get('mode') || '하'

  useEffect(() => {
    fetch(`${API_BASE}/api/report?mode=${mode}`)
      .then(res => res.json())
      .then(data => setArticle(data))
  }, [mode])

  return (
    <div className="min-h-screen bg-black text-red-500 font-mono tracking-wide flex justify-center items-center">
      {/* ✅ 전체 컨테이너 - 중앙 정렬 + 좌우 여백 */}
      <div className="w-[60%] h-[88vh] flex border border-red-800 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(255,0,0,0.3)]">
        {/* 좌측 사건 정보 */}
        <div className="w-1/2 overflow-y-auto border-r border-red-800 p-8 bg-black/95">
          {article ? (
            <>
              <h1 className="text-2xl font-bold mb-4 text-red-600">{article.title}</h1>
              <ArticleCard article={article} />

              {/* 사건 개요 */}
              <section className="mt-8">
                <h2 className="text-xl font-bold mb-3 text-red-500">📍 사건 개요</h2>
                <ul className="space-y-1 text-sm leading-relaxed">
                  <li>장소: {article.case_overview?.setting}</li>
                  <li>시간: {article.case_overview?.time}</li>
                  <li>피해자: {article.case_overview?.victim}</li>
                  <li>사망 원인: {article.case_overview?.death_cause}</li>
                </ul>
              </section>

              {/* 등장 인물 */}
              <section className="mt-8">
                <h2 className="text-xl font-bold mb-3 text-red-500">👥 등장 인물</h2>
                <ul className="space-y-1 text-sm leading-relaxed">
                  {article.characters?.map((c: any, i: number) => (
                    <li key={i}>
                      <strong>{c.name}</strong> — {c.role || c.occupation}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 증거 목록 */}
              <section className="mt-8 mb-10">
                <h2 className="text-xl font-bold mb-3 text-red-500">🔍 증거 목록</h2>
                <ul className="space-y-2 text-sm">
                  {article.evidence?.map((e: any, i: number) => (
                    <li key={i} className="border-b border-red-800 pb-2">
                      <strong>{e.type}</strong> — {e.description}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <p>데이터를 불러오는 중...</p>
          )}
        </div>

        {/* 우측: 대화 + 엔딩 */}
        <div className="w-1/2 flex flex-col bg-black/90 border-l border-red-800">
          {/* 💬 채팅창 */}
          <div className="flex-1 overflow-y-auto p-8 border-b border-red-800">
            <ChatPanel />
          </div>

          {/* 🩸 엔딩 섹션 */}
          <div className="h-[30%] p-6 bg-black/70 border-t border-red-800 flex flex-col justify-center">
            {article?.solution && (
              <div className="text-center space-y-4">
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="w-full bg-red-700 hover:bg-red-900 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg shadow-red-900/40"
                >
                  {showSolution ? '엔딩 숨기기' : '엔딩 보기'}
                </button>

                {showSolution && (
                  <div className="mt-3 bg-black/80 p-4 rounded-lg shadow-inner text-sm text-red-400 text-left whitespace-pre-wrap overflow-y-auto max-h-[50vh] border border-red-700">
                    <h3 className="font-bold text-red-500 mb-2">🩸 사건의 진실</h3>
                    <p>{article.solution.truth?.join('\n') || '엔딩 정보가 없습니다.'}</p>
                    {article.solution.answer && (
                      <p className="mt-3 text-red-500 font-semibold">
                        💬 결론: {article.solution.answer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
