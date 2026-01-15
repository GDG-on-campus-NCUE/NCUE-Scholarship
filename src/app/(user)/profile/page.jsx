import ProfileClient from './ProfileClient';

export const metadata = {
  title: '個人資料',
  description: '管理您的個人資料、學號資訊以及帳號安全設定。',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
