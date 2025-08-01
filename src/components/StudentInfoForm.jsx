'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

// 年級選項
const gradeOptions = ['大一', '大二', '大三', '大四', '碩', '博']
// 系所選項（節錄部分系所供示例使用）
const departmentOptions = [
  '教育學系',
  '國文學系',
  '英語學系',
  '數學系',
  '資訊工程學系',
  '其他'
]

const familyOptions = [
  '低收',
  '中低收',
  '特殊境遇家庭子女',
  '弱勢1-6級',
  '符合弱勢1-6級',
  '無以上資料但家境清寒'
]

// 台灣縣市選項
const countyOptions = [
  '基隆市','台北市','新北市','桃園市','新竹市','新竹縣','苗栗縣','台中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','台南市','高雄市','屏東縣','宜蘭縣','花蓮縣','台東縣','澎湖縣','金門縣','連江縣'
]

export default function StudentInfoForm({ onSubmit, initialData }) {
  const [form, setForm] = useState({
    educationLevel: '',
    department: '',
    freshman: '否',
    grade: '',
    familyStatus: '',
    score80: '否',
    county: '',
    extensionSchool: '否',
    foreignStudent: '否',
    extended: '否',
    graduating: '否',
    directMaster: '否'
  })

  // 載入初始資料（若提供）
  // 若有初始資料，僅於初次載入時套用
  useEffect(() => {
    if (initialData) {
      setForm(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow p-6 rounded-lg max-w-2xl w-full">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">學制</label>
          <select name="educationLevel" value={form.educationLevel} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="">請選擇</option>
            <option value="大學部">大學部</option>
            <option value="碩班">碩班</option>
            <option value="博班">博班</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">系所名稱</label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">請選擇</option>
            {departmentOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">新生</label>
          <select name="freshman" value={form.freshman} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="是">是</option>
            <option value="否">否</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">年級</label>
          <select
            name="grade"
            value={form.grade}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">請選擇</option>
            {gradeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">家境</label>
          <select name="familyStatus" value={form.familyStatus} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="">請選擇</option>
            {familyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">前一學期成績達80分</label>
          <select name="score80" value={form.score80} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="是">是</option>
            <option value="否">否</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">戶籍地縣市</label>
          <select
            name="county"
            value={form.county}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">請選擇</option>
            {countyOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">進修學院學生</label>
          <select name="extensionSchool" value={form.extensionSchool} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="是">是</option>
            <option value="否">否</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">僑外陸生</label>
          <select name="foreignStudent" value={form.foreignStudent} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="是">是</option>
            <option value="否">否</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">延修生</label>
          <select name="extended" value={form.extended} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="是">是</option>
            <option value="否">否</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">當學期應屆畢業生</label>
          <select name="graduating" value={form.graduating} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="是">是</option>
            <option value="否">否</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">本校直升碩班生</label>
          <select name="directMaster" value={form.directMaster} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="是">是</option>
            <option value="否">否</option>
          </select>
        </div>
      </div>
      <div className="text-center">
        <Button type="submit" className="mt-4">開始諮詢</Button>
      </div>
    </form>
  )
}
