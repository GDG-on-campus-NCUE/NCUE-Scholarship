"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, GraduationCap, Eye, EyeOff } from 'lucide-react';
import Toast from '@/components/ui/Toast';

// --- UI 元件: 輸入框 ---
const InputField = ({ id, name, type, placeholder, value, onChange, error, icon: Icon }) => (
	<div>
		<div className="relative">
			<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
			</div>
			<input
				id={id} name={name} type={type} placeholder={placeholder} value={value} onChange={onChange}
				className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ${error ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:shadow-lg focus:shadow-indigo-500/50 sm:text-sm sm:leading-6 transition-all`}
				required
			/>
		</div>
		{error && <p className="mt-2 text-xs text-red-600">{error}</p>}
	</div>
);

// --- UI 元件: 密碼輸入框 ---
const PasswordField = ({ id, name, placeholder, value, onChange, error, passwordStrength, isConfirmField = false }) => {
	const [showPassword, setShowPassword] = useState(false);
	const strength = !isConfirmField && value ? passwordStrength(value) : null;

	const strengthLevels = [
		{ text: '非常弱', lightColor: 'bg-red-200', color: 'bg-red-500', textColor: 'text-red-600' },
		{ text: '弱', lightColor: 'bg-orange-200', color: 'bg-orange-500', textColor: 'text-orange-600' },
		{ text: '中等', lightColor: 'bg-yellow-200', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
		{ text: '強', lightColor: 'bg-green-200', color: 'bg-green-500', textColor: 'text-green-600' },
		{ text: '非常強', lightColor: 'bg-emerald-200', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
	];

	const currentStrength = strength ? strengthLevels[strength.score] : null;
	const widthPercentage = strength ? (strength.score + 1) * 20 : 0;

	return (
		<div>
			<div className="relative">
				<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v10a1 1 0 00.883.993L5 19h10a1 1 0 00.993-.883L16 18V8a1 1 0 00-.883-.993L15 7h-1V6a4 4 0 00-4-4zm0 1.5a2.5 2.5 0 012.5 2.5V7h-5V6a2.5 2.5 0 012.5-2.5z" clipRule="evenodd" /></svg></div>
				<input
					id={id} name={name} type={showPassword ? "text" : "password"} placeholder={placeholder} value={value} onChange={onChange}
					className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ${error ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:shadow-lg focus:shadow-indigo-500/50 sm:text-sm sm:leading-6 transition-all`}
					required
				/>
				<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
					{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
				</button>
			</div>
			{!isConfirmField && currentStrength && (
				<div className="mt-2">
					<div className={`h-1.5 w-full rounded-full ${currentStrength.lightColor}`}>
						<div className={`h-full rounded-full ${currentStrength.color} transition-all duration-300`} style={{ width: `${widthPercentage}%` }} />
					</div>
					<p className={`mt-1 text-xs font-medium ${currentStrength.textColor}`}>{currentStrength.text}</p>
				</div>
			)}
			{error && <p className="mt-2 text-xs text-red-600">{error}</p>}
		</div>
	);
};

// --- 主要註冊元件 ---
export default function Register() {
	const router = useRouter();
	const { signUp, isAuthenticated, loading } = useAuth();
	const [formData, setFormData] = useState({ username: "", email: "", student_id: "", password: "", confirmPassword: "" });
	const [errors, setErrors] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
	const showToast = (message, type = 'success') => setToast({ show: true, message, type });
	const hideToast = () => setToast(prev => ({ ...prev, show: false }));
	useEffect(() => {
		if (!loading && isAuthenticated) router.push('/profile');
	}, [isAuthenticated, loading, router]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
		if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
		if (errors.submit) setErrors(prev => ({ ...prev, submit: "" }));
	};

	const calculatePasswordStrength = (password) => {
		if (!password) return { score: 0 };
		let score = 0;
		if (password.length > 8) score++;
		if (password.length > 12) score++;
		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 2;
		if (/\d/.test(password)) score++;
		if (/[\W_]/.test(password)) score++;
		const weakPatterns = /123|abc|qwerty|password|admin|test|user|1111|aaaa|changhua|ncue|scholarship|student/i;
		if (weakPatterns.test(password)) score -= 3;
		const sequentialPatterns = /1234|2345|3456|4567|5678|6789|9876|8765|abcd|bcde|cdef|qwer|asdf|zxcv/i;
		if (sequentialPatterns.test(password)) score -= 2;
		const finalScore = Math.max(0, Math.min(Math.floor(score / 1.5), 4));
		return { score: finalScore };
	};

	const validateForm = () => {
		const newErrors = {};
		if (!formData.username.trim()) newErrors.username = "請提供您的姓名";
		if (!/^[A-Za-z]\d{7}$/.test(formData.student_id)) {
			newErrors.student_id = "學號格式應為 1 位英文字母加上 7 位數字";
		}
		if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
			newErrors.email = "請輸入有效的電子郵件地址";
		}
		if (formData.password.length < 8) {
			newErrors.password = "密碼長度至少需要 8 個字元";
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "兩次輸入的密碼不一致";
		}
		return newErrors;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErrors({});

		const formErrors = validateForm();
		if (Object.keys(formErrors).length > 0) {
			setErrors(formErrors);
			return;
		}

		setIsSubmitting(true);
		try {
			// 透過後端 API 檢查學號與 Email 是否重複
			const res = await fetch('/api/check-duplicate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: formData.email, student_id: formData.student_id })
			});

			if (!res.ok) {
				throw new Error('Email重複');
			}

			const { emailExists, studentIdExists } = await res.json();

			if (studentIdExists) {
				setErrors({ student_id: '此學號已被註冊，請檢查或直接登入。' });
				showToast('此學號已被註冊，請檢查或直接登入。', 'error');
				setIsSubmitting(false);
				return;
			}

			if (emailExists) {
				setErrors({ email: '此電子郵件已被註冊，請直接登入。' });
				showToast('此電子郵件已被註冊，請直接登入。', 'error');
				setIsSubmitting(false);
				return;
			}

			// 呼叫 signUp 並直接處理其回傳結果
			const result = await signUp(
				formData.email,
				formData.password,
				{ name: formData.username, student_id: formData.student_id }
			);

			// 根據回傳結果決定下一步
			if (result.success) {
				router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
			} else {
				if (result.error && result.error.includes('User already registered')) {
					setErrors({ email: '此電子郵件已被註冊，請直接登入。' });
					showToast('此電子郵件已被註冊，請直接登入。', 'error');
					setIsSubmitting(false);
					return;
				} else {
					setErrors({ submit: result.error || "發生未知錯誤，請稍後再試" });
					showToast(result.error || "發生未知錯誤，請稍後再試", 'error');
				}
			}
		} catch (error) {
			setErrors({ submit: `註冊請求失敗: ${error.message}` });
			showToast(`註冊請求失敗: ${error.message}`, 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
			<main className="flex justify-center items-center my-16 sm:my-24 px-4">
				<div className="flex w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl">
					{/* --- 左側面板 --- */}
					<div className="relative hidden w-0 flex-1 lg:block bg-slate-900">
						<div className="absolute inset-0 h-full w-full overflow-hidden">
							<div className="absolute w-64 h-64 bg-green-700 rounded-full filter blur-3xl opacity-20" style={{ top: '-5%', left: '-10%', animation: 'move-particle 20s infinite alternate', '--x-start': '0px', '--y-start': '0px', '--x-end': '100px', '--y-end': '80px', '--x-end-2': '-100px', '--y-end-2': '-150px' }} />
							<div className="absolute w-72 h-72 bg-lime-500 rounded-full filter blur-3xl opacity-20" style={{ top: '50%', left: '50%', animation: 'move-particle 25s infinite alternate', '--x-start': '0px', '--y-start': '0px', '--x-end': '-100px', '--y-end': '50px', '--x-end-2': '50px', '--y-end-2': '-50px' }} />
							<div className="absolute w-56 h-56 bg-sky-600 rounded-full filter blur-3xl opacity-20" style={{ bottom: '-5%', right: '-10%', animation: 'move-particle 18s infinite alternate', '--x-start': '0px', '--y-start': '0px', '--x-end': '-80px', '--y-end': '-120px', '--x-end-2': '120px', '--y-end-2': '80px' }} />
						</div>
						<div className="relative flex h-full flex-col justify-center p-16 text-left text-white">
							<div className="max-w-lg">
								<h2 className="text-3xl font-bold leading-tight tracking-tight">
									Complexity,<br />Simplified.<br /> Potential,<br />Amplified.
								</h2>
								<p className="mt-6 text-lg text-slate-200">
									新版彰師生輔組獎助學金平台，透過 AI 智慧解析與自動化流程，將繁瑣的公告發布流程轉化為流暢的數位體驗，助您事半功倍 !
								</p>
							</div>
						</div>
					</div>

					{/* --- 右側表單面板 --- */}
					<div className="flex flex-1 flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
						<div className="mx-auto w-full max-w-sm lg:w-96">
							<div>
								<h2 className="text-3xl font-bold leading-9 tracking-tight text-gray-900">建立您的專屬帳號</h2>
								<p className="mt-2 text-sm leading-6 text-gray-500">
									已經是會員？{' '}
									<Link href="/login" className="font-semibold text-indigo-600 login-link-hover">
										由此登入
									</Link>
								</p>
							</div>
							<div className="mt-10">
								<form onSubmit={handleSubmit} className="space-y-6">
									{errors.submit && (
										<div className="rounded-md bg-red-50 p-4">
											<p className="text-sm font-medium text-red-800">{errors.submit}</p>
										</div>
									)}
									<InputField id="username" name="username" type="text" placeholder="姓名" value={formData.username} onChange={handleChange} error={errors.username} icon={User} />
									<InputField id="student_id" name="student_id" type="text" placeholder="學號" value={formData.student_id} onChange={handleChange} error={errors.student_id} icon={GraduationCap} />
									<InputField id="email" name="email" type="email" placeholder="電子郵件" value={formData.email} onChange={handleChange} error={errors.email} icon={Mail} />
									<PasswordField id="password" name="password" placeholder="設定密碼" value={formData.password} onChange={handleChange} error={errors.password} passwordStrength={calculatePasswordStrength} />
									<PasswordField id="confirmPassword" name="confirmPassword" placeholder="再次輸入密碼" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} isConfirmField={true} />

									<div>
										<button
											type="submit"
											disabled={isSubmitting || loading}
											className={`
												flex w-full justify-center rounded-md px-3 py-2.5 text-sm font-semibold leading-6
												border border-indigo-600 bg-transparent text-indigo-600
												transition-all duration-300 ease-in-out
												hover:bg-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/40
												focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
												disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
											`}
										>
											{isSubmitting || loading ? '處理中...' : '同意並註冊帳號'}
										</button>
									</div>
								</form>
								<p className="mt-6 text-center text-xs text-gray-500">
									點擊註冊按鈕即表示您同意我們的
									<Link
										href="/terms-and-privacy"
										className="font-medium text-indigo-500 underline hover:text-indigo-700"
										target="_blank"
										rel="noopener noreferrer"
									>服務條款</Link>。
								</p>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}