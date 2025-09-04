'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { Search, Users, Shield, UserCheck, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Loader2 } from 'lucide-react';
import SendNotificationModal from './SendNotificationModal';

const NotifyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 50 50" className="inline-block">
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"></path><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"></path>
    </svg>
);

export default function UsersTab() {
    const { user: currentUser } = useAuth(); // 目前登入的使用者
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // --- Modal 相關狀態 ---
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notificationUser, setNotificationUser] = useState(null); // 要寄送通知的目標使用者
    const [isSending, setIsSending] = useState(false); // 控制 Modal 中的寄送中狀態

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/users');
            const data = await response.json();
            if (response.ok) {
                setAllUsers(Array.isArray(data.users) ? data.users : []);
            } else {
                showToast(data.error || '獲取用戶資料失敗', 'error');
                setAllUsers([]);
            }
        } catch (error) {
            showToast('獲取用戶資料時發生錯誤', 'error');
            setAllUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleChange = async (userToUpdate) => {
        if (currentUser && userToUpdate.id === currentUser.id) {
            showToast('無法變更自己的權限', 'error');
            return;
        }

        const newRole = userToUpdate.role === 'admin' ? 'user' : 'admin';
        if (!confirm(`確定要將使用者 ${userToUpdate.name} 的權限變更為「${newRole}」嗎？`)) return;

        try {
            const response = await authFetch(`/api/users/${userToUpdate.id}`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole }),
            });
            const data = await response.json();
            if (response.ok) {
                showToast('使用者權限更新成功', 'success');
                fetchUsers();
            } else {
                showToast(data.error || '更新失敗', 'error');
            }
        } catch (error) {
            showToast('更新時發生錯誤', 'error');
        }
    };

    const openNotificationModal = (user) => {
        setNotificationUser(user);
        setIsNotificationModalOpen(true);
    };

    const handleSendNotification = async ({ subject, htmlContent }) => {
        if (!subject || !htmlContent) {
            showToast('標題和內文為必填欄位', 'error');
            return;
        }
        if (!notificationUser) {
            showToast('未指定收件人', 'error');
            return;
        }

        setIsSending(true);
        try {
            const apiPayload = {
                email: notificationUser.emailFull,
                subject: subject,
                body: htmlContent
            };

            const response = await authFetch('/api/send-custom-email', {
                method: 'POST',
                body: JSON.stringify(apiPayload),
            });

            const data = await response.json();

            if (response.ok) {
                showToast(data.message || '通知已成功寄送！', 'success');
                setIsNotificationModalOpen(false);
            } else {
                showToast(data.error || '寄送失敗，請稍後再試', 'error');
            }
        } catch (error) {
            console.error("Error sending custom email:", error);
            showToast('寄送時發生網路或未知錯誤', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const processedUsers = useMemo(() => {
        if (!Array.isArray(allUsers)) return [];
        let filtered = [...allUsers];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                (user.name?.toLowerCase() || '').includes(lowercasedTerm) ||
                (user.studentId?.toLowerCase() || '').includes(lowercasedTerm) ||
                (user.email?.toLowerCase() || '').includes(lowercasedTerm)
            );
        }
        return filtered;
    }, [allUsers, searchTerm]);

    const paginatedUsers = useMemo(() => {
        return processedUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    }, [processedUsers, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(processedUsers.length / rowsPerPage);

    const stats = useMemo(() => ({
        total: allUsers.length,
        admins: allUsers.filter(u => u.role === 'admin').length,
        users: allUsers.filter(u => u.role === 'user').length,
    }), [allUsers]);

    // --- 按鈕樣式 ---
    const ghostButtonBase = "flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-300 ease-in-out transform disabled:transform-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";
    const buttonStyles = {
        demote: `${ghostButtonBase} border-indigo-200 bg-transparent text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 whitespace-nowrap`,
        promote: `${ghostButtonBase} border-rose-200 bg-transparent text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-rose-500/20 whitespace-nowrap`,
        notify: `${ghostButtonBase} p-2 border-sky-200 bg-transparent text-sky-600 hover:bg-sky-100 hover:text-sky-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20`,
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-center">
                <div className="lg:col-span-3 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="搜尋姓名、學號、信箱..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-11 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-300
                            focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30" />
                </div>
                <div className="lg:col-span-2 grid grid-cols-3 gap-4 text-center bg-white p-3 rounded-xl border border-gray-200/80">
                    <div><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5"><Users size={14} />總用戶數</h3><p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p></div>
                    <div className="border-l border-gray-200"><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5"><Shield size={14} />管理員</h3><p className="text-2xl font-bold text-blue-600 mt-1">{stats.admins}</p></div>
                    <div className="border-l border-gray-200"><h3 className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5"><UserCheck size={14} />使用者</h3><p className="text-2xl font-bold text-gray-600 mt-1">{stats.users}</p></div>
                </div>
            </div>

            <div className="rounded-xl w-full bg-white shadow-lg overflow-hidden border border-gray-200/80">
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/70 text-left"><tr>
                            <th className="p-4 px-6 font-semibold text-gray-500">學號</th><th className="p-4 px-6 font-semibold text-gray-500">姓名</th><th className="p-4 px-6 font-semibold text-gray-500">電子信箱</th><th className="p-4 px-6 font-semibold text-gray-500">權限</th><th className="p-4 px-6 font-semibold text-gray-500 text-center">操作</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (<tr><td colSpan="5" className="text-center p-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>) : paginatedUsers.length === 0 ? (<tr><td colSpan="5" className="text-center p-12 text-gray-500">找不到符合條件的使用者。</td></tr>) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="transform transition-all duration-300 hover:bg-violet-100/50 hover:shadow-xl z-0 hover:z-10 hover:scale-[1.02]">
                                        <td className="p-4 px-6 font-mono">{user.studentId || '-'}</td>
                                        <td className="p-4 px-6 font-medium text-gray-800">{user.name || '-'}</td>
                                        <td className="p-4 px-6 text-gray-600" title={user.emailFull}>{user.email}</td>
                                        <td className="p-4 px-6"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role === 'admin' ? '管理員' : '使用者'}</span></td>
                                        <td className="p-4 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleRoleChange(user)} className={user.role === 'admin' ? buttonStyles.demote : buttonStyles.promote} disabled={currentUser?.id === user.id}>{user.role === 'admin' ? '設為使用者' : '設為管理員'}</button>
                                                <button onClick={() => openNotificationModal(user)} className={buttonStyles.notify} title="寄送通知"><NotifyIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="md:hidden divide-y divide-gray-100">
                    {loading ? (<div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>) : paginatedUsers.length === 0 ? (<div className="text-center p-8 text-gray-500">找不到符合條件的使用者。</div>) : (
                        paginatedUsers.map(user => (
                            <div key={user.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-base text-gray-900 flex-1 pr-4">{user.name || '-'}</h3>
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role === 'admin' ? '管理員' : '使用者'}</span>
                                </div>
                                <div className="text-sm space-y-2 text-gray-600 border-t pt-3">
                                    <p><strong className="font-semibold text-gray-800">學號: </strong>{user.studentId || '-'}</p>
                                    <p><strong className="font-semibold text-gray-800">信箱: </strong>{user.email}</p>
                                </div>
                                <div className="flex items-center justify-end border-t pt-3 gap-2">
                                    <button onClick={() => handleRoleChange(user)} className={user.role === 'admin' ? buttonStyles.demote : buttonStyles.promote} disabled={currentUser?.id === user.id}>{user.role === 'admin' ? '設為使用者' : '設為管理員'}</button>
                                    <button onClick={() => openNotificationModal(user)} className={buttonStyles.notify} title="寄送通知"><NotifyIcon /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">共 {processedUsers.length} 筆資料，第 {currentPage} / {totalPages || 1} 頁</div>
                <div className="flex items-center gap-2">
                    <div className="relative"><select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm shadow-sm
                            transition-all duration-300
                            focus:outline-none focus:border-indigo-500
                            focus:ring-4 focus:ring-indigo-500/30">
                        <option value={10}>10 筆 / 頁</option>
                        <option value={25}>25 筆 / 頁</option>
                        <option value={50}>50 筆 / 頁</option>
                    </select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div></div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm"><button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronsLeft className="h-5 w-5" /></button><button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button><button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button><button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronsRight className="h-5 w-5" /></button></nav>
                </div>
            </div>

            <SendNotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                user={notificationUser}
                onConfirm={handleSendNotification}
                isSending={isSending}
            />
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
    );
}