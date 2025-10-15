'use client'
import { useState } from 'react'
import { API_BASE } from '@/lib/api'

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'system', text: '안녕하세요, 사건 리포터 AI입니다. 사건에 대해 궁금한 점이 있나요?' }
  ])

  const sendMessage = async () => {
    if (!input.trim()) return

    const newMessages = [...messages, { role: 'user', text: input }]
    setMessages(newMessages)
    setInput('')

    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({ message: input }),
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    setMessages([...newMessages, { role: 'assistant', text: data.reply }])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-xl ${
              m.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-200 text-left'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="질문을 입력하세요..."
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded-lg"
        >
          전송
        </button>
      </div>
    </div>
  )
}
