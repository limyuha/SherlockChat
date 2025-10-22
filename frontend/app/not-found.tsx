'use client'

import { Suspense } from 'react'

export default function NotFound() {
  return (
    <Suspense fallback={<div className="text-center text-gray-500 p-6">Loading 404 page...</div>}>
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold mb-2">404 - 페이지를 찾을 수 없습니다</h1>
        <p className="text-gray-400 mb-6">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        <a href="/" className="text-blue-500 hover:underline">홈으로 돌아가기</a>
      </div>
    </Suspense>
  )
}
