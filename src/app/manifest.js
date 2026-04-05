export default function manifest() {
  return {
    name: '彰師獎助學金資訊平台',
    short_name: '彰師獎學金',
    description: '提供彰師學生校外獎助學金資訊的 AI 公告平台，支援智慧檢索與離線閱讀。',
    start_url: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    orientation: 'portrait',
    scope: '/',
    categories: ['education', 'finance'],
    dir: 'ltr',
    lang: 'zh-TW',
    gcm_sender_id: '103953800507', // 這是 Google 的固定值，用於識別推送服務
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/maskable_icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/maskable_icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/maskable_icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/maskable_icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'AI 獎學金助理',
        short_name: 'AI 助理',
        description: '立即諮詢獎學金相關問題',
        url: '/ai-assistant',
        icons: [{ src: '/maskable_icon.png', sizes: '192x192' }]
      }
    ],
    prefer_related_applications: false
  }
}
