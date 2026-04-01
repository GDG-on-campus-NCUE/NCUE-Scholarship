"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User as UserIcon, Edit3, Save, LogOut, Loader2, AtSign, Fingerprint, Calendar, Clock, FileText, GraduationCap, AlertCircle, Trash2, AlertTriangle, X } from "lucide-react";
import Toast from '@/components/ui/Toast';

// --- Helper function to render input fields ---
const renderInputField = (label, name, value, placeholder, onChange, required = false, props = {}) => (
	<div>
		<label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
		<input type="text" id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
			className="block w-full rounded-md border-0 py-2.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"
            {...props}
		/>
	</div>
);

// --- 主要頁面元件 ---
export default function ProfilePage() {
	const router = useRouter();
	const { user, isAuthenticated, isAdmin, loading, signOut, updateProfile, deleteAccount } = useAuth();

	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({ name: "", student_id: "" });

	const [isSavingProfile, setIsSavingProfile] = useState(false);
    
    // 註銷帳戶狀態
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

	const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
	const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    const needsCompletion = useMemo(() => user?.needsProfileCompletion, [user]);

	useEffect(() => {
		if (!loading && !isAuthenticated) {
			router.push('/login');
		}
	}, [isAuthenticated, loading, router]);

	useEffect(() => {
		if (user?.user_metadata || user?.profile) {
			setFormData({
				name: user?.profile?.username || user?.user_metadata?.name || "",
				student_id: user?.profile?.student_id || user?.user_metadata?.student_id || "",
			});
            // 如果需要補全資料，自動開啟編輯模式
            if (user?.needsProfileCompletion) {
                setIsEditing(true);
            }
		}
	}, [user]);

	const handleProfileChange = (e) => {
		let { name, value } = e.target;
		if (name === 'student_id') {
			value = value.toUpperCase().slice(0, 8);
		}
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleProfileSubmit = async (e) => {
		e.preventDefault();
        
        if (!formData.student_id) {
            showToast('請務必填寫學號', 'error');
            return;
        }

        // 驗證學號格式：首位大寫字母 + 7位數字
        const studentIdRegex = /^[A-Z][0-9]{7}$/;
        if (!studentIdRegex.test(formData.student_id)) {
            showToast('學號格式錯誤，請輸入正確格式 (e.g. S1354000)', 'error');
            return;
        }

		setIsSavingProfile(true);

        try {
            // Check for duplicate student_id
            const checkRes = await fetch('/api/check-duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    student_id: formData.student_id,
                    exclude_id: user?.id
                })
            });

            if (checkRes.ok) {
                const { studentIdExists } = await checkRes.json();
                if (studentIdExists) {
                    showToast('此學號已被註冊。若您曾註冊過帳號，請先登入原帳戶並至個資管理頁面註銷帳號，再重新使用 Google 登入註冊。', 'error');
                    setIsSavingProfile(false);
                    return;
                }
            }
        } catch (err) {
            console.error("Duplicate check failed", err);
        }

		const result = await updateProfile(formData);
		if (result.success) {
			showToast('個人資料已成功更新', 'success');
			setIsEditing(false);
            // 重新載入頁面以更新全域狀態
            window.location.reload();
		} else {
			showToast(result.error || '更新失敗，請稍後再試', 'error');
		}
		setIsSavingProfile(false);
	};

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== '註銷帳戶') {
            showToast('請正確輸入確認文字', 'error');
            return;
        }

        setIsDeleting(true);
        const result = await deleteAccount();
        if (result.success) {
            showToast('帳戶已註銷，期待再次與您相見', 'success');
            setTimeout(() => router.push('/'), 2000);
        } else {
            showToast(result.error || '註銷失敗，請聯繫系統管理員', 'error');
            setIsDeleting(false);
        }
    };

	if (loading || !isAuthenticated) {
		return (
			<div className="flex items-center justify-center p-4 min-h-[400px]">
				<Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
			</div>
		);
	}

	const ghostButtonClasses = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:transform-none disabled:shadow-none";
	const primaryGhostButton = `${ghostButtonClasses} border-indigo-600 bg-transparent text-indigo-600 hover:bg-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/40 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200`;

	const isGoogleUser = user?.app_metadata?.provider === 'google';

	return (
		<>
			<Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24 select-none">
                
                {needsCompletion && (
                    <div className="mb-8 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl flex items-start gap-3 shadow-sm animate-pulse">
                        <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-amber-800 font-bold text-lg">請完成基本資料設定</h3>
                            <p className="text-amber-700">歡迎使用 Google 登入！為了確保您能正常使用獎學金申請功能，請先填寫您的「學號」資訊。</p>
                        </div>
                    </div>
                )}

				<div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 items-stretch">
					<aside className="lg:col-span-1 flex flex-col gap-6">
						<div className="w-full flex flex-col h-full bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
							<div className="p-6">
								<div className="flex items-center gap-4">
									{user?.profile?.avatar_url || user?.user_metadata?.avatar_url ? (
										<img 
											src={user?.profile?.avatar_url || user?.user_metadata?.avatar_url} 
											alt="Avatar" 
											className="h-16 w-16 rounded-full border-2 border-indigo-100 shadow-sm"
										/>
									) : (
										<div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
											<UserIcon className="h-8 w-8 text-indigo-600" />
										</div>
									)}
									<div>
										<h2 className="text-xl font-bold text-gray-900 truncate">{formData.name || '使用者'}</h2>
										<p className="text-sm text-gray-500 truncate">{user.email}</p>
										{isGoogleUser && (
											<span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
												Google 帳號
											</span>
										)}
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

                        {/* 註銷帳戶 Danger Zone */}
                        {!needsCompletion && !isAdmin && (
                            <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6">
                                <h3 className="text-red-600 font-bold flex items-center gap-2 mb-4">
                                    <Trash2 size={20} />
                                    帳號註銷
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    註銷後將刪除您的所有個人資料與對話紀錄，此操作不可逆，請謹慎執行。
                                </p>
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-md shadow-red-200"
                                >
                                    註銷此帳戶
                                </button>
                            </div>
                        )}
					</aside>

					<main className="lg:col-span-2 flex flex-col h-full mt-8 lg:mt-0">
						<div className="bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
							<form onSubmit={handleProfileSubmit} className="flex flex-col h-full">
								<div className="p-8">
									<div>
										<h2 className="text-xl font-bold text-gray-900 flex items-center gap-3"><FileText className="h-6 w-6 text-indigo-600" />個人資料</h2>
										<p className="mt-1 text-sm text-gray-500">請確保您提供的是正確的個人資料。</p>
									</div>
								</div>

								<div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
									{isEditing
										? renderInputField('姓名', 'name', formData.name, '請輸入您的姓名', handleProfileChange, true)
										: <div className="flex flex-col"><dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><UserIcon size={16} className="text-indigo-400" />姓名</dt><dd className="text-base text-gray-900 mt-1">{formData.name || '未設定'}</dd></div>
									}
									{isEditing
										? renderInputField('學號', 'student_id', formData.student_id, '請輸入您的學號', handleProfileChange, true, { maxLength: 8 })
										: <div className="flex flex-col"><dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><GraduationCap size={16} className="text-indigo-400" />學號</dt><dd className="text-base text-gray-900 mt-1">{formData.student_id || '未設定'}</dd></div>
									}
								</div>

								<div className="bg-gray-50 px-8 py-4 rounded-b-xl flex justify-end mt-auto">
									{isEditing ? (
										<div className="flex gap-2">
											{!needsCompletion && (
                                                <button type="button" onClick={() => setIsEditing(false)} className={`${ghostButtonClasses} border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100`}>
                                                    取消
                                                </button>
                                            )}
											<button type="submit" disabled={isSavingProfile} className={primaryGhostButton}>
												{isSavingProfile ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
												儲存
											</button>
										</div>
									) : (
										<button type="button" onClick={() => setIsEditing(true)} className={primaryGhostButton}>
											<Edit3 className="h-4 w-4" />
											編輯資料
										</button>
									)}
								</div>
							</form>
						</div>
					</main>
				</div>
			</div>

            {/* 註銷確認對話框 Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteConfirm(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 mb-2">確定要註銷帳戶嗎？</h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                這項動作將會<span className="text-red-600 font-bold underline">永久刪除</span>您的所有資料、對話紀錄及設定，且無法恢復。
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                                        請在下方輸入「<span className="font-bold text-gray-900 italic">註銷帳戶</span>」以確認：
                                    </label>
                                    <input 
                                        type="text" 
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="註銷帳戶"
                                        className="block w-full rounded-lg border-gray-300 border py-2.5 px-4 text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                        disabled={isDeleting}
                                    />
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button 
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting || deleteConfirmText !== '註銷帳戶'}
                                        className="w-full py-3 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? <Loader2 className="animate-spin h-5 w-5" /> : <Trash2 size={18} />}
                                        確認註銷
                                    </button>
                                    <button 
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeleting}
                                        className="w-full py-3 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
		</>
	);
}