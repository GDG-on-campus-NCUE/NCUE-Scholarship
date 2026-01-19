export default function manifest() {
  return {
    name: '彰師生輔組獎助學金資訊平台',
    short_name: '彰師獎助學金',
    description: '提供彰師學生校外獎助學金資訊的 AI 公告平台',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
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
  }
}
