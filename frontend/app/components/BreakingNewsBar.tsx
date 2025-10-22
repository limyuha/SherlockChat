'use client'

import { Suspense } from 'react'
import BreakingNewsInner from './BreakingNewsInner'

export default function BreakingNewsBar() {
  return (
    <Suspense fallback={<div className="breaking-news-bar">Loading...</div>}>
      <BreakingNewsInner />
    </Suspense>
  )
}
