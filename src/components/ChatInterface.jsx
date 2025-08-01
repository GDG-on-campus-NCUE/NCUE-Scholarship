'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { GoogleGenAI } from '@google/genai'
import StudentInfoForm from '@/components/StudentInfoForm'
import PreferenceForm from '@/components/PreferenceForm'
import Button from '@/components/ui/Button'

// 系統提示文字
const SYSTEM_PROMPT = `# 角色 (Persona)
你是一位專為「NCUE 獎學金資訊整合平台」設計的**頂尖AI助理**。你的個性是專業、精確且樂於助人。

# 你的核心任務
你的任務是根據我提供給你的「# 參考資料」，用**自然、流暢的繁體中文**回答使用者關於獎學金的問題。

# 表達與格式化規則
1. **直接回答:** 請直接以對話方式回答。
2. **結構化輸出:** 若資訊包含多項目，請使用 Markdown 的列表或表格。
3. **引用來源:** 若參考外部網頁，請以 \`[參考連結](URL)\` 嵌入連結；若為內部公告，禁止產生連結。
4. **最終回應:** 若引用內部公告，請在訊息最後加上 \`[ANNOUNCEMENT_CARD:id1,id2,...]\`。
5. **服務範圍:** 僅回答與獎學金申請相關的問題。
`

export default function ChatInterface({ embedded = false }) {
  const { user } = useAuth()
  const [info, setInfo] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [phase, setPhase] = useState('info') // info -> preference -> chat
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const modelRef = useRef(null)

  // 初始化 Gemini 模型
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY })
      modelRef.current = genAI
    }
  }, [])

  // 帶入已登入使用者資料
  useEffect(() => {
    if (user && user.user_metadata) {
      setInfo(prev => ({
        ...prev,
        department: user.user_metadata.department || '',
        grade: user.user_metadata.year || ''
      }))
    }
  }, [user])

  const handleInfoSubmit = (data) => {
    setInfo(data)
    setPhase('preference')
  }

  const handlePrefSubmit = (data) => {
    setPreferences(data)
    setPhase('chat')
  }

  // 送出訊息並取得 AI 回覆
  const handleSend = async () => {
    if (!input.trim()) return
    const userMessage = input
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setInput('')

    if (!modelRef.current) {
      setMessages(prev => [...prev, { role: 'ai', text: 'AI 模型尚未初始化。' }])
      return
    }

    const infoLines = Object.entries(info || {}).map(([k, v]) => `${k}: ${v}`).join('\n')
    const prefLines = Object.entries(preferences || {}).map(([k, v]) => `${k}: ${v}`).join('\n')
    const prompt = `${SYSTEM_PROMPT}\n\n# 學生資訊\n${infoLines}\n\n# 需求偏好\n${prefLines}\n\n# 問題\n${userMessage}\n\n請以 JSON 物件回覆，格式為 {"reply": "回答內容"}`

    const config = { responseMimeType: 'application/json' }
    const contents = [{ role: 'user', parts: [{ text: prompt }] }]
    const model = 'gemini-2.0-flash-lite'

    try {
      let result = ''
      const response = await modelRef.current.models.generateContentStream({ model, config, contents })
      for await (const chunk of response) {
        result += chunk.text || ''
      }
      const data = JSON.parse(result)
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || '' }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: `AI 回應失敗：${e.message}` }])
    }
  }

  // 快取使用者初始資料
  const userInfo = useMemo(() => ({
    department: user?.user_metadata?.department || '',
    grade: user?.user_metadata?.year || ''
  }), [user])

  // 依照不同階段呈現畫面
  if (phase === 'info') {
    return (
      <div className={`${embedded ? 'h-full' : 'min-h-screen'} flex items-center justify-center bg-gray-50 py-8`}>
        <StudentInfoForm onSubmit={handleInfoSubmit} initialData={userInfo} />
      </div>
    )
  }

  if (phase === 'preference') {
    return (
      <div className={`${embedded ? 'h-full' : 'min-h-screen'} flex items-center justify-center bg-gray-50 py-8`}>
        <PreferenceForm onSubmit={handlePrefSubmit} />
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'h-screen'} bg-gray-100`}>
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
            <div
              className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white'}`}
              dangerouslySetInnerHTML={{ __html: m.text }}
            />
          </div>
        ))}
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="輸入您的問題..."
          />
          <Button onClick={handleSend} className="rounded-r-lg">送出</Button>
        </div>
      </div>
    </div>
  )
}
