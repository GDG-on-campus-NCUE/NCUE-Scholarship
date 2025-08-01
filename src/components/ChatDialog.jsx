'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import ChatInterface from '@/components/ChatInterface'

export default function ChatDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 right-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg focus:outline-none"
        onClick={() => setOpen(true)}
        aria-label="開啟 AI 對話框"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg w-full max-w-3xl h-[90vh] flex flex-col">
            <div className="flex justify-end p-2 border-b">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setOpen(false)}
                aria-label="關閉"
              >
                &times;
              </button>
            </div>
            <div className="flex-grow overflow-hidden">
              <ChatInterface embedded />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
