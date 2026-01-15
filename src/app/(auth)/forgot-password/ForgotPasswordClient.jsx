"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Mail, KeyRound, ArrowLeft, Loader2, MailCheck, AlertTriangle, Send } from 'lucide-react';
import Toast from '@/components/ui/Toast';

function ForgotPasswordContent() {
	const router = useRouter();
	const { resetPassword, isAuthenticated } = useAuth();

	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const [cooldown, setCooldown] = useState(0);
	const [isResending, setIsResending] = useState(false);
	const [isClient, setIsClient] = useState(false);

	const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
	const showToast = (message, type = 'success') => setToast({ show: true, message, type });
	const hideToast = () => setToast(prev => ({ ...prev, show: false }));

	// 確保只在客戶端渲染
	useEffect(() => {
		setIsClient(true);
	}, []);

	const particles = useMemo(() => {
		if (!isClient) return []; // 服務器端返回空陣列避免 hydration 不匹配

		const colorClasses = ['bg-purple-700', 'bg-rose-500', 'bg-orange-400'];
		return [...Array(12)].map((_, i) => ({
			id: i,
			size: Math.floor(Math.random() * (220 - 100 + 1) + 100),
			color: colorClasses[Math.floor(Math.random() * colorClasses.length)],
			top: `${Math.random() * 100}%`,
			left: `${Math.random() * 100}%`,
			animationDuration: `${25 + Math.random() * 20}s`,
			xStart: `${Math.random() * 20 - 10}vw`,
			yStart: `${Math.random() * 20 - 10}vh`,
			xEnd: `${Math.random() * 40 - 20}vw`,
			yEnd: `${Math.random() * 40 - 20}vh`,
			xEnd2: `${Math.random() * 40 - 20}vw`,
			yEnd2: `${Math.random() * 40 - 20}vh`,
		}));
	}, [isClient]);

	useEffect(() => {
		if (isAuthenticated) router.push('/profile');
	}, [isAuthenticated, router]);

	useEffect(() => {
		if (cooldown > 0) {
			const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [cooldown]);

	const handleChange = (e) => {
		setEmail(e.target.value);
		if (error) setError("");
	};

	const triggerRequest = async () => {
		if (!email || !/\S+@\S+\.\S+/.test(email)) {
			setError("請輸入有效的電子郵件格式");
			return false;
		}
		setError("");
		const result = await resetPassword(email);
		if (result.success) {
			return true;
		} else {
			const errorMessage = result.error || "發送失敗，請確認此電子郵件是否已註冊。";
			showToast(errorMessage, 'error');
			return false;
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		const success = await triggerRequest();
		if (success) {
			setIsSuccess(true);
			setCooldown(120);
		}
		setIsLoading(false);
	};

	const handleResend = async () => {
		if (cooldown > 0 || isResending) return;
		setIsResending(true);
		const success = await triggerRequest();
		if (success) {
			showToast("新的重設郵件已成功發送！", 'success');
			setCooldown(120);
		}
		setIsResending(false);
	};

	const ghostButtonClasses = `
		flex w-full justify-center items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold leading-6
		border border-indigo-600 bg-transparent text-indigo-600
		transition-all duration-300 ease-in-out
		hover:bg-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/40
		focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
		disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
	`;

	return (
		<>
			<Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
			<div className="flex w-full max-w-5xl my-16 sm:my-24 mx-auto overflow-hidden rounded-2xl shadow-2xl bg-white/70 backdrop-blur-xl border border-gray-200/50">

				<div className="relative hidden w-0 flex-1 lg:block bg-slate-900">
					<div className="absolute inset-0 h-full w-full overflow-hidden">
						{particles.map((p) => (
							<div
								key={p.id}
								className={`absolute rounded-full filter blur-3xl opacity-30 ${p.color}`}
								style={{
									width: `${p.size}px`, height: `${p.size}px`, top: p.top, left: p.left,
									animation: `move-particle ${p.animationDuration} ease-in-out infinite`,
									'--x-start': p.xStart, '--y-start': p.yStart, '--x-end': p.xEnd,
									'--y-end': p.yEnd, '--x-end-2': p.xEnd2, '--y-end-2': p.yEnd2
								}}
							/>
						))}
					</div>
					<div className="relative flex h-full flex-col justify-center p-16 text-left text-white z-10">
						<h2 className="text-3xl font-bold leading-tight tracking-tight">
							Forgot Your Password?
						</h2>
						<p className="mt-6 text-lg text-slate-200">請在右方欄位輸入您的註冊信箱，我們將立即寄送 OTP 至您的信箱，協助您重新登入。</p>
					</div>
				</div>

				<div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
					<div className="w-full max-w-md mx-auto">
						{!isSuccess ? (
							<div>
								<div className="mb-8">
									<h1 className="text-3xl font-bold text-gray-900">重設您的密碼</h1>
								</div>
								<form onSubmit={handleSubmit} className="space-y-6">
									<div>
										<label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">電子郵件</label>
										<div className="mt-2 relative">
											<Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
											<input id="email" name="email" type="email" autoComplete="email" required placeholder="example@mail.com" value={email} onChange={handleChange}
												className={`block w-full rounded-md border-0 py-2.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ${error ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:shadow-lg focus:shadow-indigo-500/50 sm:text-sm sm:leading-6 transition-all`} />
										</div>
										{error && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertTriangle size={14} />{error}</p>}
									</div>
									<button type="submit" disabled={isLoading} className={ghostButtonClasses}>
										{isLoading ? <Loader2 className="animate-spin" /> : '發送重設郵件'}
									</button>
								</form>
							</div>
						) : (
							<div className="text-center">
								<div className="inline-block p-3 bg-green-100 rounded-full mb-4"><MailCheck className="h-8 w-8 text-green-600" /></div>
								<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">郵件已成功發送</h1>
								<p className="mt-2 text-sm text-gray-500">我們已將密碼重設連結發送到 <strong className="text-gray-700">{email}</strong>。請檢查您的收件匣（包含垃圾郵件）。</p>
								<button onClick={handleResend} disabled={cooldown > 0 || isResending} className={`mt-8 ${ghostButtonClasses}`}>
									{isResending ? <Loader2 className="animate-spin" /> : <Send size={16} />}
									<span className="ml-2">
										{cooldown > 0 ? `在 ${cooldown} 秒後重新發送` : '重新發送郵件'}
									</span>
								</button>
							</div>
						)}
						<div className="mt-8 text-center text-sm">
							<Link href="/login" className="font-semibold text-indigo-600 login-link-hover">
								返回登入
							</Link>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default function ForgotPasswordPage() {
	return (
		<Suspense fallback={
			<div className="w-full flex items-center justify-center p-4">
				<div className="text-center"><Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" /></div>
			</div>
		}>
			<ForgotPasswordContent />
		</Suspense>
	);
}