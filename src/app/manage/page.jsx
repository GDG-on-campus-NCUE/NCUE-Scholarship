import ManageClient from './ManageClient';

export const metadata = {
  title: '管理後台',
  description: '彰師生輔組校外獎助學金資訊平台管理後台，管理公告、使用者及系統設定。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ManagePage() {
  return <ManageClient />;
}
