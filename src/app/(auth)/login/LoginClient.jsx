"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import { storage } from '@/utils/helpers';
import { authFetch } from '@/lib/authFetch';

function LoginContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { signIn, signInWithGoogle, isAuthenticated, loading } = useAuth();

	const [formData, setFormData] = useState({ email: "", password: "" });
	const [rememberMe, setRememberMe] = useState(false);
	const [errors, setErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isClient, setIsClient] = useState(false);

	const [showOldLogin, setShowOldLogin] = useState(false);
	const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
	const showToast = (message, type = 'success') => setToast({ show: true, message, type });
	const hideToast = () => setToast(prev => ({ ...prev, show: false }));

	// 確保只在客戶端渲染
	useEffect(() => {
		setIsClient(true);
	}, []);

	// 登入頁面動畫計算
	const particles = useMemo(() => {
		if (!isClient) return []; // 服務器端返回空陣列避免 hydration 不匹配

		const colorClasses = ['bg-blue-700', 'bg-teal-500', 'bg-cyan-400'];
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

	// 頁面載入時讀取記住的用戶資訊
	useEffect(() => {
		const rememberedEmail = storage.get('rememberedEmail');
		const shouldRemember = storage.get('shouldRememberUser');
		if (rememberedEmail && shouldRemember) {
			setFormData(prev => ({ ...prev, email: rememberedEmail }));
			setRememberMe(true);
		}
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			const redirectTo = searchParams.get('redirect') || '/profile';
			router.push(redirectTo);
		}
	}, [isAuthenticated, router, searchParams]);


	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
		if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
	};

	const validateForm = () => {
		const newErrors = {};
		if (!formData.email.trim()) newErrors.email = "請輸入電子郵件地址";
		else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "請輸入有效的電子郵件格式";
		if (!formData.password) newErrors.password = "請輸入密碼";
		return newErrors;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const formErrors = validateForm();
		if (Object.keys(formErrors).length > 0) {
			setErrors(formErrors);
			return;
		}

		setIsSubmitting(true);
		setErrors({});

		try {
			const result = await signIn(formData.email, formData.password);
			if (result.success) {
				// 記錄登入狀態功能
				if (rememberMe) {
					storage.set('rememberedEmail', formData.email);
					storage.set('shouldRememberUser', true);
				} else {
					storage.remove('rememberedEmail');
					storage.remove('shouldRememberUser');
				}

				showToast("登入成功！正在將您導向頁面...", 'success');
				const redirectTo = searchParams.get('redirect') || '/';
				router.push(redirectTo);
			} else {
				const errorMessage = result.error || "電子郵件或密碼不正確。";
				showToast(errorMessage, 'error');
			}
		} catch (err) {
			const errorMessage = "發生無法預期的錯誤，請稍後再試。";
			showToast(errorMessage, 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleLogin = async () => {
		setIsSubmitting(true);
		try {
			const result = await signInWithGoogle();
			if (!result.success) {
				showToast(result.error || "Google 登入失敗", 'error');
				setIsSubmitting(false);
			}
		} catch (err) {
			showToast("發生無法預期的錯誤", 'error');
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
			<div className="flex w-full max-w-5xl my-16 sm:my-24 mx-auto overflow-hidden rounded-2xl shadow-2xl bg-white/70 backdrop-blur-xl border border-gray-200/50 select-none">

				<div className="relative hidden w-0 flex-1 lg:block bg-slate-900">
					<div className="absolute inset-0 h-full w-full overflow-hidden">
						{particles.map((p) => (
							<div
								key={p.id}
								className={`absolute rounded-full filter blur-3xl opacity-30 ${p.color}`}
								style={{
									width: `${p.size}px`,
									height: `${p.size}px`,
									top: p.top,
									left: p.left,
									animation: `move-particle ${p.animationDuration} ease-in-out infinite`,
									'--x-start': p.xStart,
									'--y-start': p.yStart,
									'--x-end': p.xEnd,
									'--y-end': p.yEnd,
									'--x-end-2': p.xEnd2,
									'--y-end-2': p.yEnd2,
								}}
							/>
						))}
					</div>
					<div className="relative flex h-full flex-col justify-center p-16 text-left text-white z-10">
						<div className="max-w-lg">
							<h2 className="text-3xl font-bold leading-tight tracking-tight">
								Empowering Your Journey
							</h2>
							<p className="mt-6 text-lg text-slate-200">
								立即登入，與 AI 獎學金助理開始對話。我們整合全網資訊與所有校內公告，為您提供最精準的解答 !
							</p>
						</div>
					</div>
				</div>

				{/* --- 右側登入表單區 --- */}
				<div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
					<div className="mx-auto w-full max-w-md">
						<div>
							<h2 className="text-3xl font-bold leading-9 tracking-tight text-gray-900">歡迎回來</h2>
							<p className="mt-2 text-sm leading-6 text-gray-500 text-pretty">
								請使用您的 Google 帳號登入或註冊。
							</p>
						</div>

						<div className="mt-8">
							<button
								onClick={handleGoogleLogin}
								disabled={isSubmitting || loading}
								className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all"
							>
								<svg className="h-5 w-5" viewBox="0 0 24 24">
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										fill="#EA4335"
									/>
								</svg>
								<span className="text-base font-semibold leading-6">使用 Google 帳號登入/註冊</span>
							</button>

							<div className="mt-10 flex justify-center">
								<button 
                                    onClick={() => setShowOldLogin(!showOldLogin)}
                                    className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
                                >
                                    使用舊版帳密登入
                                    <svg className={`w-4 h-4 transition-transform duration-300 ${showOldLogin ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
							</div>
						</div>

						<div className={`transition-all duration-500 ease-in-out overflow-hidden ${showOldLogin ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
							<form onSubmit={handleSubmit} className="space-y-6">
								<div>
									<label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">電子郵件</label>
									<div className="mt-2 relative">
										<Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
										<input id="email" name="email" type="email" autoComplete="email" required={showOldLogin} placeholder="example@mail.com" value={formData.email} onChange={handleChange}
											className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ${errors.email ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:shadow-lg focus:shadow-indigo-500/50 sm:text-sm sm:leading-6 transition-all`}
										/>
									</div>
									{errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
								</div>

								<div>
									<label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">密碼</label>
									<div className="mt-2 relative">
										<Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
										<input id="password" name="password" required={showOldLogin} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="請輸入您的密碼" value={formData.password} onChange={handleChange}
											className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ${errors.password ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:shadow-lg focus:shadow-indigo-500/50 sm:text-sm sm:leading-6 transition-all`}
										/>
										<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
											{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
										</button>
									</div>
									{errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center">
										<input
											id="remember-me"
											name="remember-me"
											type="checkbox"
											checked={rememberMe}
											onChange={(e) => setRememberMe(e.target.checked)}
											className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
										/>
										<label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-gray-900">紀錄登入狀態</label>
									</div>
									<div className="text-sm">
										<Link href="/forgot-password" className="font-semibold text-indigo-600 login-link-hover">
											忘記密碼？
										</Link>
									</div>
								</div>

								<div>
									<button type="submit" disabled={isSubmitting || loading}
										className={`
											flex w-full justify-center rounded-md px-3 py-2.5 text-sm font-semibold leading-6
											border border-indigo-600 bg-transparent text-indigo-600
											transition-all duration-300 ease-in-out
											hover:bg-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/40
											focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
											disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
										`}>
										{isSubmitting || loading ? <Loader2 className="animate-spin" /> : '登入'}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default function Login() {
	return (
		<Suspense fallback={
			<div className="w-full flex items-center justify-center p-4">
				<div className="text-center">
					<Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
					<p className="text-gray-600 mt-4">正在載入登入頁面...</p>
				</div>
			</div>
		}>
			<LoginContent />
		</Suspense>
	);
}