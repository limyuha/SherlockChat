'use client'

import { Suspense } from 'react'

function NotFoundContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-red-500 font-mono">
      <h1 className="text-5xl mb-4">404 - 페이지를 찾을 수 없습니다</h1>
      <p className="text-red-400">👻 요청하신 페이지가 사라졌거나 존재하지 않습니다.</p>
    </div>
  )
}

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div className="text-red-500 text-center mt-10">Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  )
}
