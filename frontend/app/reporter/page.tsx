'use client'

import { Suspense } from 'react'
import ReporterContent from './ReporterContent'

export default function ReporterPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ReporterContent />
    </Suspense>
  )
}
