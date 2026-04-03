export default function manifest() {
  return {
    name: '彰師獎助學金資訊平台',
    short_name: '彰師獎學金',
    description: '提供彰師學生校外獎助學金資訊的 AI 公告平台，支援智慧檢索與離線閱讀。',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    orientation: 'portrait',
    scope: '/',
    categories: ['education', 'finance'],
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'AI 獎學金助理',
        short_name: 'AI 助理',
        description: '立即諮詢獎學金相關問題',
        url: '/ai-assistant',
        icons: [{ src: '/logo.png', sizes: '192x192' }]
      }
    ],
    prefer_related_applications: false
  }
}