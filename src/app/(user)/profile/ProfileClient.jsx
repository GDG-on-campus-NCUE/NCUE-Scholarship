"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import { Eye, EyeOff, User as UserIcon, Lock, ShieldCheck, Edit3, Save, LogOut, Loader2, AtSign, Fingerprint, Calendar, Clock, FileText } from "lucide-react";
import Toast from '@/components/ui/Toast';

// --- zxcvbn 設定 ---
zxcvbnOptions.setOptions({
	dictionary: { userInputs: ['ncue', 'scholarship', 'changhua', 'student'] }
});

// --- 子元件: 密碼輸入框 ---
const PasswordField = ({ id, name, placeholder, value, onChange, error, isConfirmField = false }) => {
	const [showPassword, setShowPassword] = useState(false);
	const strength = useMemo(() => (!isConfirmField && value) ? zxcvbn(value) : null, [value, isConfirmField]);

	const strengthLevels = [
		{ text: '非常弱', lightColor: 'bg-red-200', color: 'bg-red-500', textColor: 'text-red-700' },
		{ text: '弱', lightColor: 'bg-orange-200', color: 'bg-orange-500', textColor: 'text-orange-700' },
		{ text: '中等', lightColor: 'bg-yellow-200', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
		{ text: '強', lightColor: 'bg-green-200', color: 'bg-green-500', textColor: 'text-green-700' },
		{ text: '非常強', lightColor: 'bg-emerald-200', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
	];
	const currentStrength = strength ? strengthLevels[strength.score] : null;

	return (
		<div className="w-full space-y-2">
			<div className="relative">
				<Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
				<input id={id} name={name} type={showPassword ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={onChange} required
					className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ${error ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all`}
				/>
				<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600">
					{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
				</button>
			</div>
			{!isConfirmField && currentStrength && (
				<div className="flex items-center gap-2 px-1">
					<div className={`h-1.5 flex-grow rounded-full ${currentStrength.lightColor}`}>
						<div className={`h-full rounded-full ${currentStrength.color} transition-all duration-300`} style={{ width: `${(strength.score + 1) * 20}%` }} />
					</div>
					<p className={`text-xs font-medium ${currentStrength.textColor}`}>{currentStrength.text}</p>
				</div>
			)}
			{error && <p className="mt-1 text-xs text-red-600 px-1">{error}</p>}
		</div>
	);
};

// --- Helper function to render input fields ---
const renderInputField = (label, name, value, placeholder, onChange) => (
	<div>
		<label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
		<input type="text" id={name} name={name} value={value} onChange={onChange} placeholder={placeholder}
			className="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"
		/>
	</div>
);

// --- 主要頁面元件 ---
export default function ProfilePage() {
	const router = useRouter();
	const { user, isAuthenticated, loading, signOut, updateProfile, updatePassword } = useAuth();

	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({ name: "", student_id: "" });
	const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });

	const [errors, setErrors] = useState({});
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

	const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
	const showToast = (message, type = 'success') => setToast({ show: true, message, type });

	useEffect(() => {
		if (!loading && !isAuthenticated) {
			router.push('/login');
		}
	}, [isAuthenticated, loading, router]);

	useEffect(() => {
		if (user?.user_metadata) {
			setFormData({
				name: user.user_metadata.name || "",
				student_id: user.user_metadata.student_id || "",
			});
		}
	}, [user]);

	const handleProfileChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
	const handlePasswordChange = (e) => {
		setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
		if (errors[e.target.name] || errors.passwordSubmit) setErrors({});
	};

	const handleProfileSubmit = async (e) => {
		e.preventDefault();
		setIsSavingProfile(true);
		setErrors({});
		const result = await updateProfile(formData);
		if (result.success) {
			showToast('個人資料已成功更新', 'success');
			setIsEditing(false);
		} else {
			showToast(result.error || '更新失敗，請稍後再試', 'error');
		}
		setIsSavingProfile(false);
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();
		let newErrors = {};
		if (zxcvbn(passwordData.password).score < 2) newErrors.password = '密碼強度不足，請嘗試更複雜的組合';
		if (passwordData.password !== passwordData.confirmPassword) newErrors.confirmPassword = '兩次輸入的密碼不一致';

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setIsUpdatingPassword(true);
		setErrors({});
		const result = await updatePassword(passwordData.password);
		if (result.success) {
			showToast('密碼已成功更新', 'success');
			setPasswordData({ password: '', confirmPassword: '' });
		} else {
			const errorMsg = result.error || '更新失敗，請稍後再試';
			setErrors({ passwordSubmit: errorMsg });
			showToast(errorMsg, 'error');
		}
		setIsUpdatingPassword(false);
	};

	if (loading || !isAuthenticated) {
		return (
			<div className="flex items-center justify-center p-4">
				<Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
			</div>
		);
	}

	const ghostButtonClasses = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:transform-none disabled:shadow-none";
	const primaryGhostButton = `${ghostButtonClasses} border-indigo-600 bg-transparent text-indigo-600 hover:bg-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/40 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200`;

	return (
		<>
			<Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24">
				<div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
					<aside className="lg:col-span-1 flex flex-col">
						<div className="w-full flex flex-col flex-grow bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
							<div className="p-6">
								<div className="flex items-center gap-4">
									<div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
										<UserIcon className="h-8 w-8 text-indigo-600" />
									</div>
									<div>
										<h2 className="text-xl font-bold text-gray-900 truncate">{user.user_metadata?.name || '使用者'}</h2>
										<p className="text-sm text-gray-500 truncate">{user.email}</p>
									</div>
								</div>
							</div>

							<div className="p-6 border-t border-gray-100">
								<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3"><Fingerprint className="h-5 w-5 text-indigo-600" />帳號狀態</h3>
								<dl className="space-y-4">
									<div className="flex flex-col"><dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><AtSign size={16} />用戶ID</dt><dd className="text-sm text-gray-900 break-all mt-1">{user.id}</dd></div>
									<div className="flex flex-col"><dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Calendar size={16} />註冊時間</dt><dd className="text-sm text-gray-900 mt-1">{new Date(user.created_at).toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</dd></div>
									{user.last_sign_in_at && <div className="flex flex-col"><dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Clock size={16} />最後登入時間</dt><dd className="text-sm text-gray-900 mt-1">{new Date(user.last_sign_in_at).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>}
								</dl>
							</div>

							<div className="mt-auto p-6 border-t border-gray-100">
								<button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors">
									<LogOut className="h-5 w-5" />
									<span>登出</span>
								</button>
							</div>
						</div>
					</aside>

					<main className="lg:col-span-2 flex flex-col gap-8 mt-8 lg:mt-0">
						<div className="bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
							<form onSubmit={handleProfileSubmit}>
								<div className="p-8">
									<div>
										<h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><FileText className="h-6 w-6 text-indigo-600" />個人資料</h2>
										<p className="mt-1 text-sm text-gray-500">請確保您提供的是正確的個人資料。</p>
									</div>
								</div>

								<div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
									{isEditing
										? renderInputField('姓名', 'name', formData.name, '請輸入您的姓名', handleProfileChange)
										: <div className="flex flex-col"><dt className="text-sm font-medium text-gray-500">姓名</dt><dd className="text-base text-gray-900 mt-1">{formData.name || '未設定'}</dd></div>
									}
									{isEditing
										? renderInputField('學號', 'student_id', formData.student_id, '請輸入您的學號', handleProfileChange)
										: <div className="flex flex-col"><dt className="text-sm font-medium text-gray-500">學號</dt><dd className="text-base text-gray-900 mt-1">{formData.student_id || '未設定'}</dd></div>
									}
								</div>

								<div className="bg-gray-50 px-8 py-4 rounded-b-xl flex justify-end">
									{isEditing ? (
										<div className="flex gap-2">
											<button type="button" onClick={() => setIsEditing(false)} className={`${ghostButtonClasses} border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100`}>
												取消
											</button>
											<button type="submit" disabled={isSavingProfile} className={primaryGhostButton}>
												{isSavingProfile ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
												儲存
											</button>
										</div>
									) : (
										<button type="button" onClick={() => setIsEditing(true)} className={primaryGhostButton}>
											<Edit3 className="h-4 w-4" />
											編輯
										</button>
									)}
								</div>
							</form>
						</div>

						<div className="bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
							<form onSubmit={handlePasswordSubmit}>
								<div className="p-8">
									<h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><Lock className="h-6 w-6 text-indigo-600" />帳號安全</h2>
									<p className="mt-1 text-sm text-gray-500">建議您定期更換密碼以維持帳號安全。</p>
									<div className="mt-6 border-t border-gray-100 pt-6 space-y-6">
										<PasswordField id="password" name="password" placeholder="設定新密碼" value={passwordData.password} onChange={handlePasswordChange} error={errors.password} />
										<PasswordField id="confirmPassword" name="confirmPassword" placeholder="再次輸入新密碼" value={passwordData.confirmPassword} onChange={handlePasswordChange} error={errors.confirmPassword} isConfirmField={true} />
										{errors.passwordSubmit && <p className="text-sm text-red-600">{errors.passwordSubmit}</p>}
									</div>
								</div>
								<div className="bg-gray-50 px-8 py-4 rounded-b-xl flex justify-end">
									<button type="submit" disabled={isUpdatingPassword} className={primaryGhostButton}>
										{isUpdatingPassword ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}更新密碼
									</button>
								</div>
							</form>
						</div>
					</main>
				</div>
			</div>
		</>
	);
}