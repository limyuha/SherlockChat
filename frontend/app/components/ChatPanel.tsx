'use client'

import { Suspense } from 'react'
import ChatPanelInner from './ChatPanelInner'

export default function ChatPanelWrapper(props: any) {
  return (
    <Suspense fallback={<div className="text-red-500 text-sm">Loading chat...</div>}>
      <ChatPanelInner {...props} />
    </Suspense>
  )
}
