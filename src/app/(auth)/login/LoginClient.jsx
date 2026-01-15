"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import { storage } from '@/utils/helpers';

function LoginContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { signIn, isAuthenticated, loading } = useAuth();

	const [formData, setFormData] = useState({ email: "", password: "" });
	const [rememberMe, setRememberMe] = useState(false);
	const [errors, setErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isClient, setIsClient] = useState(false);

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
		if (!loading && isAuthenticated) {
			const redirectTo = searchParams.get('redirect') || '/profile';
			router.push(redirectTo);
		}
	}, [isAuthenticated, loading, router, searchParams]);

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
							<h2 className="text-3xl font-bold leading-9 tracking-tight text-gray-900">登入您的帳號</h2>
							<p className="mt-2 text-sm leading-6 text-gray-500">
								還沒有帳號嗎？{' '}
								<Link href="/register" className="font-semibold text-indigo-600 login-link-hover">
									立即註冊
								</Link>
							</p>
						</div>
						<div className="mt-10">
							<form onSubmit={handleSubmit} className="space-y-6">
								<div>
									<label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">電子郵件</label>
									<div className="mt-2 relative">
										<Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
										<input id="email" name="email" type="email" autoComplete="email" required placeholder="example@mail.com" value={formData.email} onChange={handleChange}
											className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ${errors.email ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:shadow-lg focus:shadow-indigo-500/50 sm:text-sm sm:leading-6 transition-all`}
										/>
									</div>
									{errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
								</div>

								<div>
									<label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">密碼</label>
									<div className="mt-2 relative">
										<Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
										<input id="password" name="password" required type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="請輸入您的密碼" value={formData.password} onChange={handleChange}
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