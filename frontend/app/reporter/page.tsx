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
  const mode = params.get('mode') || 'real'

  useEffect(() => {
    fetch(`${API_BASE}/api/report?mode=${mode}`)
      .then(res => res.json())
      .then(data => setArticle(data))
  }, [mode])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 기사 패널 */}
      <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-300 bg-white">
        {article ? <ArticleCard article={article} /> : <p>뉴스를 불러오는 중...</p>}
      </div>

      {/* 대화 + 단서 패널 */}
      <div className="w-1/2 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <ChatPanel />
        </div>
        <div className="h-1/3 border-t border-gray-300 bg-gray-50 p-4">
          <ClueBoard />
        </div>
      </div>
    </div>
  )
}
