'use client'
import { useEffect, useState } from 'react'
import { API_BASE } from '@/lib/api'

export default function ChatPanel() {
  const [storyId, setStoryId] = useState('start')
  const [messages, setMessages] = useState<any[]>([])
  const [choices, setChoices] = useState<string[]>([])

  useEffect(() => {
    loadStory('start')
  }, [])

  const loadStory = async (id: string, message?: string) => {
    const res = await fetch(`${API_BASE}/api/story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story_id: id, message })
    })
    const data = await res.json()

    setMessages(prev => [...prev, { role: 'system', text: data.reply }])
    setChoices(data.choices || [])
    setStoryId(id)
  }

  const handleChoice = (choice: string) => {
    setMessages(prev => [...prev, { role: 'user', text: choice }])
    loadStory(storyId, choice)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-xl ${
              m.role === 'user' ? 'bg-red-200 text-right' : 'bg-gray-100 text-left'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {choices.length > 0 ? (
          choices.map((c, i) => (
            <button
              key={i}
              onClick={() => handleChoice(c)}
              className="w-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg py-2 transition-all"
            >
              {c}
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center">선택지가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
