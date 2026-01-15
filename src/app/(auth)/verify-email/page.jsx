import VerifyEmailClient from './VerifyEmailClient';

export const metadata = {
  title: '驗證電子郵件',
  description: '請驗證您的電子郵件地址以完成註冊流程。',
};

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
