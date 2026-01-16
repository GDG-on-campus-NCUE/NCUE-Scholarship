'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { Search, Users, Shield, UserCheck, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Loader2, Mail, ChevronDown } from 'lucide-react';
import SendNotificationModal from './SendNotificationModal';

const NotifyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 50 50" className="inline-block">
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"></path><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"></path>
    </svg>
);

export default function UsersTab() {
    const { user: currentUser } = useAuth(); // 目前登入的使用者
    const [users, setUsers] = useState([]); // Renamed from allUsers
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // 新增 debounce 狀態
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState({ total: 0, admins: 0, users: 0 });

    // --- Modal 相關狀態 ---
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notificationUser, setNotificationUser] = useState(null); // 要寄送通知的目標使用者
    const [bulkTargetRole, setBulkTargetRole] = useState('all'); // 群發目標角色: 'all', 'user', 'admin'
    const [isSending, setIsSending] = useState(false); // 控制 Modal 中的寄送中狀態
    
    // --- 下拉選單狀態 (行動版/點擊) ---
    const [isBulkDropdownOpen, setIsBulkDropdownOpen] = useState(false);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            if (searchTerm !== debouncedSearchTerm) {
                setCurrentPage(1);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: rowsPerPage,
                search: debouncedSearchTerm // 使用 debouncedSearchTerm
            });
            const response = await authFetch(`/api/users?${params.toString()}`);
            const data = await response.json();
            if (response.ok) {
                setUsers(Array.isArray(data.users) ? data.users : []);
                setTotalCount(data.total || 0);
                if (data.stats) {
                    setStats(data.stats);
                }
            } else {
                showToast(data.error || '獲取用戶資料失敗', 'error');
                setUsers([]);
            }
        } catch (error) {
            showToast('獲取用戶資料時發生錯誤', 'error');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, debouncedSearchTerm]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // 點擊外部關閉 dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isBulkDropdownOpen && !event.target.closest('.bulk-email-dropdown')) {
                setIsBulkDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isBulkDropdownOpen]);


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

    const openNotificationModal = (user, role = 'all') => {
        setNotificationUser(user);
        setBulkTargetRole(role);
        setIsBulkDropdownOpen(false); // 關閉下拉選單
        setIsNotificationModalOpen(true);
    };

    const handleSendNotification = async ({ subject, htmlContent }) => {
        if (!subject || !htmlContent) {
            showToast('標題和內文為必填欄位', 'error');
            return;
        }

        setIsSending(true);
        try {
            const isBulkSend = !notificationUser;
            const apiEndpoint = isBulkSend ? '/api/send-bulk-email' : '/api/send-custom-email';
            
            let apiPayload;
            if (isBulkSend) {
                // Use new server-side role targeting
                apiPayload = {
                    targetRole: bulkTargetRole, // 'all', 'user', 'admin'
                    subject: subject,
                    body: htmlContent
                };
            } else {
                 if (!notificationUser) {
                    showToast('未指定收件人', 'error');
                    setIsSending(false);
                    return;
                }
                apiPayload = {
                    email: notificationUser.emailFull,
                    subject: subject,
                    body: htmlContent
                };
            }

            const response = await authFetch(apiEndpoint, {
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
            console.error("Error sending email:", error);
            showToast('寄送時發生網路或未知錯誤', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const totalPages = Math.ceil(totalCount / rowsPerPage);

    // 計算群發的目標數量與標籤
    const bulkTargetInfo = useMemo(() => {
        let count = 0;
        let label = '所有使用者';
        if (bulkTargetRole === 'user') {
            count = stats.users;
            label = '一般使用者';
        } else if (bulkTargetRole === 'admin') {
            count = stats.admins;
            label = '管理員';
        } else {
            count = stats.total; // or stats.admins + stats.users
            label = '所有使用者';
        }
        return { count, label };
    }, [bulkTargetRole, stats]);

    // --- 按鈕樣式 ---
    const ghostButtonBase = "flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border transition-all duration-300 ease-in-out transform disabled:transform-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";
    const buttonStyles = {
        demote: `${ghostButtonBase} border-indigo-200 bg-transparent text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 whitespace-nowrap`,
        promote: `${ghostButtonBase} border-rose-200 bg-transparent text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-rose-500/20 whitespace-nowrap`,
        notify: `${ghostButtonBase} p-2 border-sky-200 bg-transparent text-sky-600 hover:bg-sky-100 hover:text-sky-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20`,
        notifyAll: `${ghostButtonBase} py-3 px-4 rounded-lg bg-green-100 text-green-700 border-green-200 hover:bg-green-200 hover:text-green-800 hover:shadow-green-500/20 whitespace-nowrap relative`,
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:items-center">
                <div className="lg:col-span-3 flex items-center gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="搜尋姓名、學號、信箱..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-300
                                focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30" />
                    </div>
                    
                    {/* --- 群發信件 Dropdown --- */}
                    <div className="relative group bulk-email-dropdown">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsBulkDropdownOpen(!isBulkDropdownOpen);
                            }}
                            className={`${buttonStyles.notifyAll} w-full md:w-auto`}
                            title="群發信件選項"
                        >
                            <Mail size={16} />
                            <span className="hidden sm:inline whitespace-nowrap">群發信件</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isBulkDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className={`absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 transition-all duration-200 origin-top-right transform
                            ${isBulkDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible'}
                            md:invisible md:group-hover:visible md:group-hover:opacity-100 md:group-hover:scale-100
                        `}>
                            <div className="py-1">
                                <button onClick={() => openNotificationModal(null, 'all')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                    <Users size={14} /> 寄送給所有人
                                </button>
                                <button onClick={() => openNotificationModal(null, 'user')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                    <UserCheck size={14} /> 寄送給使用者
                                </button>
                                <button onClick={() => openNotificationModal(null, 'admin')} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors">
                                    <Shield size={14} /> 寄送給管理員
                                </button>
                            </div>
                        </div>
                    </div>

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
                            {loading ? (<tr><td colSpan="5" className="text-center p-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>) : users.length === 0 ? (<tr><td colSpan="5" className="text-center p-12 text-gray-500">找不到符合條件的使用者。</td></tr>) : (
                                users.map((user) => (
                                    <tr key={user.id} className="group transition-all duration-300 ease-out border-b border-gray-50 last:border-0 relative hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-purple-50/80 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] hover:-translate-y-1 hover:z-10">
                                        <td className="p-4 px-6 font-mono">{user.studentId || '-'}</td>
                                        <td className="p-4 px-6 font-medium text-gray-800">{user.name || '-'}</td>
                                        <td className="p-4 px-6 text-gray-600" title={user.emailFull}>{user.email}</td>
                                        <td className="p-4 px-6"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{user.role === 'admin' ? '管理員' : '使用者'}</span></td>
                                        <td className="p-4 px-6">
                                            <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
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
                    {loading ? (<div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>) : users.length === 0 ? (<div className="text-center p-8 text-gray-500">找不到符合條件的使用者。</div>) : (
                        users.map(user => (
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
                <div className="text-sm text-gray-600">共 {totalCount} 筆資料，第 {currentPage} / {totalPages || 1} 頁</div>
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
                targetCount={bulkTargetInfo.count}
                targetLabel={bulkTargetInfo.label}
            />
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
    );
}