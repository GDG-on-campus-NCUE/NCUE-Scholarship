import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata = {
  title: '忘記密碼',
  description: '請輸入您的電子郵件地址，我們將發送重設密碼的連結給您。',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
