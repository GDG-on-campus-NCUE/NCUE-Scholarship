import AiAssistantClient from './AiAssistantClient';

export const metadata = {
  title: 'AI 獎學金助理',
  description: '使用 AI 智慧對話，快速查詢、摘要並解析各項獎助學金資訊。',
};

export default function AiAssistantPage() {
  return <AiAssistantClient />;
}
