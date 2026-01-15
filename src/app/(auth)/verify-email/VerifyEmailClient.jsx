"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Mail, ShieldCheck, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

// --- New Component: OTP Input ---
const OtpInput = ({ value, onChange, disabled }) => {
  const inputsRef = useRef([]);

  const handleInputChange = (e, index) => {
    const val = e.target.value;
    if (!/^[0-9]$/.test(val) && val !== "") return;

    const newOtp = [...value];
    newOtp[index] = val;
    onChange(newOtp.join(""));

    if (val !== "" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && value[index] === "" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array(6).fill("").map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength="1"
          value={value[index] || ""}
          onChange={(e) => handleInputChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          disabled={disabled}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold bg-slate-100 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
        />
      ))}
    </div>
  );
};


// --- Modified Main Component ---
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, resendOtp, loading: authLoading } = useAuth();

  const [verificationStatus, setVerificationStatus] = useState("waiting"); // checking, waiting, success, error, expired
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    // Note: Verification via link click would be handled by Supabase redirecting to a specific URL
    // This page is now primarily for manual OTP entry or showing status.
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6 || isVerifyingOtp) return;

    setIsVerifyingOtp(true);
    setError("");
    setMessage("");

    const result = await verifyOtp(email, otp, 'signup');
    
    if (result.success) {
      setVerificationStatus("success");
      setTimeout(() => router.push('/profile'), 3000); // Redirect to profile on success
    } else {
      setError(result.error || "無效的驗證碼或驗證碼已過期，請重試。");
      setOtp(""); // Clear OTP on error
    }
    setIsVerifyingOtp(false);
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !email) return;
    
    setIsResending(true);
    setError("");
    
    const result = await resendOtp(email, 'signup');
    
    if (result.success) {
      setMessage("新的驗證郵件已成功發送！");
      setResendCooldown(60);
    } else {
      setError(result.error || "重新發送失敗，請稍後再試。");
    }
    setIsResending(false);
  };
  
  const renderIcon = (IconComponent, colorClass) => (
    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-opacity-10 ${colorClass.bg}`}>
      <IconComponent className={`w-8 h-8 sm:w-10 sm:h-10 ${colorClass.text}`} />
    </div>
  );

  // --- Success State ---
  if (verificationStatus === "success") {
    return (
      <div className="text-center">
        {renderIcon(CheckCircle, { bg: 'bg-emerald-500', text: 'text-emerald-500' })}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">驗證成功！</h1>
        <p className="text-slate-500 mb-6">您的帳號已成功啟用。將在 3 秒後自動跳轉至您的個人頁面。</p>
        <button onClick={() => router.push('/profile')} className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
          立即前往
        </button>
      </div>
    );
  }

  // --- Default Waiting & Error State ---
  return (
    <div className="w-full">
        {renderIcon(ShieldCheck, { bg: 'bg-indigo-500', text: 'text-indigo-600' })}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-2">確認您的電子信箱</h1>
        <p className="text-slate-500 text-center mb-8">
            我們已發送一封帶有 6 位數驗證碼的郵件至 <strong className="text-slate-700">{email || "您的信箱"}</strong>。
            <br/>請輸入驗證碼以完成註冊。
        </p>

        <form onSubmit={handleVerifyOtp} className="space-y-6">
            <OtpInput value={otp} onChange={setOtp} disabled={isVerifyingOtp} />

            {error && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            {message && !error && (
                 <div className="flex items-start gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium">{message}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={otp.length !== 6 || isVerifyingOtp || authLoading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex justify-center items-center transition-colors"
            >
                {isVerifyingOtp ? <Loader2 className="w-6 h-6 animate-spin" /> : '驗證並登入'}
            </button>
        </form>

        <div className="text-center mt-8">
            <p className="text-slate-500">沒有收到郵件嗎？</p>
            <button
                onClick={handleResendEmail}
                disabled={resendCooldown > 0 || isResending || authLoading}
                className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
                {isResending 
                    ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> 發送中...</span>
                    : resendCooldown > 0 
                        ? `在 ${resendCooldown} 秒後重新發送` 
                        : "重新發送驗證碼"
                }
            </button>
        </div>
    </div>
  );
}

// --- Main Page Component with Layout ---
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
        <div className="w-full max-w-md mx-auto p-8 sm:p-10 bg-white rounded-xl shadow-lg text-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
            <p className="text-slate-500 mt-4">正在載入頁面...</p>
        </div>
    }>
        <div className="bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto p-8 sm:p-10 bg-white rounded-xl shadow-lg">
                <VerifyEmailContent />
            </div>
        </div>
    </Suspense>
  );
}