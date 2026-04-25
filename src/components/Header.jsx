"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Smartphone, Clock, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { useState, forwardRef, useEffect, useRef, createContext } from "react";
import { usePathname } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import logo from "@/app/assets/logo.png";
import IconButton from "@/components/ui/IconButton";
import { motion, AnimatePresence } from "framer-motion";

export const HeaderContext = createContext({ isHeaderVisible: true });

const LogoTitle = ({ isMenuOpen, isOverDark, closeMenu }) => (
	<Link href="/" className="flex items-center space-x-3 focus:outline-none p-1" aria-label="回到首頁" onClick={closeMenu}>
		<Image src={logo} alt="NCUE Logo" width={52} height={52} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" priority />
		<h1
			className="font-bold text-base sm:text-lg whitespace-nowrap transition-colors duration-300"
			style={{ color: isMenuOpen && isOverDark ? 'var(--primary-light)' : 'var(--primary)' }}
		>
			生輔組校外獎助學金資訊平台
		</h1>
	</Link>
);

const Header = forwardRef((props, ref) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isOverDark, setIsOverDark] = useState(false);
	const mobileMenuRef = useRef(null);
	const userMenuRef = useRef(null);

    // 處理滾動顯示邏輯 (Headroom Pattern)
	const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
            
            if (currentScrollY <= 0) {
                // 在最頂部時始終顯示
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // 往下滑且超過 100px 時隱藏
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY) {
                // 往上滑時顯示
                setIsVisible(true);
            }
            
            setLastScrollY(currentScrollY);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, [lastScrollY]);

	const isHeaderVisible = isVisible;

	const { user, loading, signOut, isAuthenticated, isAdmin, timeLeft, canExtend, extendSession, resetIdleTimer } = useAuth();
	const [userIp, setUserIp] = useState("");
	const pathname = usePathname();

    // Android Install Logic
    const [isAndroid, setIsAndroid] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkAndroid = /Android/i.test(navigator.userAgent);
        setIsAndroid(checkAndroid);

        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsStandalone(checkStandalone);

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallApp = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            alert('請點擊瀏覽器選單 (⋮) 並選擇「安裝應用程式」或「加到主畫面」。');
        }
    };

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
	const closeMenu = () => {
		setIsMenuOpen(false);
		setIsUserMenuOpen(false);
	};

	const handleLogout = async () => {
		await signOut();
		closeMenu();
	};

	useEffect(() => {
		const fetchIp = async () => {
			if (isAuthenticated && !userIp) {
				try {
					const response = await fetch('/api/get-ip');
					const data = await response.json();
					setUserIp(data.ip);
				} catch (error) {
					console.error("Failed to fetch IP:", error);
				}
			}
		};
		fetchIp();
	}, [isAuthenticated, userIp]);

	const handleKeyDown = (event) => {
		if (event.key === 'Escape') {
			closeMenu();
		}
	};

	useEffect(() => {
		if (!isMenuOpen) return;
		const footer = document.querySelector('footer');
		const menu = mobileMenuRef.current;
		if (!footer || !menu) return;
		const checkOverlap = () => {
			const menuRect = menu.getBoundingClientRect();
			const footerRect = footer.getBoundingClientRect();
			const isOverlapping = menuRect.bottom > footerRect.top && menuRect.top < footerRect.bottom;
			setIsOverDark(isOverlapping);
		};
		checkOverlap();
		window.addEventListener('scroll', checkOverlap, { passive: true });
		return () => {
			window.removeEventListener('scroll', checkOverlap);
		};
	}, [isMenuOpen]);

	// 點擊外部關閉選單
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
				setIsUserMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// 路徑變更自動關閉選單
	useEffect(() => {
		setIsUserMenuOpen(false);
		setIsMenuOpen(false);
	}, [pathname]);

    // 格式化時間 mm:ss
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 延長連線時間點擊處理
    const handleExtendSession = () => {
        if (!canExtend) return;
        const success = extendSession();
        if (success) {
            // alert("連線時間已延長至 60 分鐘。");
        }
    };

    // 監控倒數計時，剩餘 10 分鐘時發出通知
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const hasWarnedRef = useRef(false);
    
    useEffect(() => {
        // 修改為小於等於 600 (10分鐘)，確保跳秒時也能觸發
        if (timeLeft > 0 && timeLeft <= 600 && !hasWarnedRef.current) {
            hasWarnedRef.current = true;
            setShowTimeoutModal(true);
            console.log("[Header] Idle warning triggered at:", timeLeft);
        }
        
        // 重置警告旗標：只有當時間回升到 10 分鐘以上時（例如使用者活動或手動延長），才允許下次再次警告
        if (timeLeft > 600) {
            hasWarnedRef.current = false;
        }
        
        // 如果倒數結束，關閉 Modal
        if (timeLeft <= 0) {
            setShowTimeoutModal(false);
        }
    }, [timeLeft]);

    const handleContinueSession = () => {
        resetIdleTimer();
        if (canExtend) {
            extendSession();
        }
        setShowTimeoutModal(false);
    };


	const navLinks = [
		{ href: '/', label: '首頁' },
		{ href: '/ai-assistant', label: 'AI 獎學金助理'},
		{ href: '/resource', label: 'FAQ 及相關資源' },
		{ href: '/terms-and-privacy', label: '服務條款', auth: true },
		{ href: '/manage', label: '管理後台', auth: true, admin: true },
	];

	const getFilteredLinks = () => {
		if (!isAuthenticated) {
			const publicLinks = navLinks.filter(link => !link.auth);
			return [
				...publicLinks,
				{ href: '/login', label: '登入' },
			];
		}
		return isAdmin
			? navLinks.filter(l => l.auth || !l.hasOwnProperty('auth'))
			: navLinks.filter(l => !l.admin);
	};

	const filteredNavLinks = getFilteredLinks();

	const formatIp = (ip) => {
		if (!ip) return "";
		if (ip.includes(':') && ip.length > 15) {
			return `${ip.substring(0, 8)}...${ip.substring(ip.length - 4)}`;
		}
		return ip;
	};

	return (
		<HeaderContext.Provider value={{ isHeaderVisible }}>
			<header
				className={`header-fixed opacity-100 select-none ${isMenuOpen ? 'menu-open' : ''} ${!isVisible && !isMenuOpen ? 'header-hidden' : ''}`}
				ref={ref}
				onKeyDown={handleKeyDown}
			>
				<div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between relative z-10">
					<LogoTitle isMenuOpen={isMenuOpen} isOverDark={isOverDark} closeMenu={closeMenu} />
					<nav className="hidden lg:flex items-center space-x-1 lg:space-x-2" role="navigation">
						{filteredNavLinks.map(link => (
							<Link key={link.href} href={link.href} className={`nav-link underline-extend navbar-link ${pathname === link.href ? 'active' : ''}`}>
								{link.label}
							</Link>
						))}
						{isAuthenticated && (
                            <>
                                {/* 自動登出計時器 */}
                                <button 
                                    onClick={handleExtendSession}
                                    disabled={!canExtend}
                                    className={`group flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300 ml-2 relative overflow-hidden
                                        ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}
                                        ${!canExtend ? 'cursor-default opacity-80' : 'cursor-pointer'}
                                    `} 
                                    title={canExtend ? "點擊可將自動登出時間延長至 60 分鐘 (僅限一次)。" : "基於安全性考量，如長時間未操作系統將於倒數結束後自動登出。"}
                                >
                                    {canExtend ? <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> : <Clock size={14} />}
                                    <span className="text-xs font-mono font-bold">{formatTime(timeLeft)}</span>
                                </button>

                                <div 
                                    className="relative ml-2" 
                                    ref={userMenuRef}
                                    onMouseEnter={() => setIsUserMenuOpen(true)}
                                    onMouseLeave={() => setIsUserMenuOpen(false)}
                                >
                                    <button 
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex flex-row items-center space-x-2 nav-link navbar-link focus:outline-none"
                                    >
                                        {user?.profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                                            <img 
                                                src={user?.profile?.avatar_url || user?.user_metadata?.avatar_url} 
                                                alt="Avatar" 
                                                className="h-8 w-8 rounded-full border border-gray-200"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                                                <span className="text-indigo-700 text-xs font-bold">
                                                    {(user?.profile?.username || user?.user_metadata?.name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <span className="truncate max-w-[120px] xl:max-w-xs text-left">
                                            Hi, {user?.profile?.username || user?.user_metadata?.name || 'User'}
                                            {userIp && <span className="hidden xl:inline ml-1 text-xs opacity-75 font-normal">({formatIp(userIp)})</span>}
                                        </span>
                                        <svg 
                                            className={`w-4 h-4 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {/* Dropdown 容器 */}
                                    <div className={`absolute right-0 top-full pt-2 w-48 z-50 transition-all duration-300 ${isUserMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                                        <div className="bg-white rounded-lg shadow-xl p-2 border border-gray-100">
                                            <Link href="/profile" className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md transition-colors">
                                                個資管理
                                            </Link>
                                            <hr className="my-1 border-gray-100" />
                                            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                                登出
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
						)}
					</nav>
					<div className="lg:hidden">
						<IconButton variant="ghost" className="text-muted z-20" aria-label="選單" onClick={toggleMenu}>
							<div className="relative w-6 h-6">
								<span className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'rotate-45 top-1/2 -translate-y-1/2' : 'top-1'}`} />
								<span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ease-in-out top-1/2 -translate-y-1/2 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
								<span className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMenuOpen ? '-rotate-45 top-1/2 -translate-y-1/2' : 'bottom-1'}`} />
							</div>
						</IconButton>
					</div>
				</div>

				{/* --- 手機版下拉選單 --- */}
				<div
					ref={mobileMenuRef}
					className={`lg:hidden absolute left-0 w-full 
						bg-white/85 backdrop-blur-xl shadow-lg border-b border-gray-200/50
						transition-all duration-300 ease-in-out overflow-y-auto overscroll-contain
						${isMenuOpen ? 'max-h-[90dvh] top-0 opacity-100' : 'max-h-0 top-0 opacity-0 pointer-events-none'}`
					}
				>
					<div style={{ height: 'var(--header-height)' }} />

					<div className="p-4 space-y-1 relative z-20">
						{filteredNavLinks.map((link, index) => (
							<Link
								key={`mobile-${link.href}`}
								href={link.href}
								className={`block w-full text-left px-4 py-2.5 my-0.5 rounded-lg text-lg 
									transition-all duration-300 ease-in-out
									${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}
									${pathname === link.href
										? (isOverDark ? 'bg-black/10 text-slate-800 font-bold' : 'bg-indigo-50/80 text-indigo-700 font-bold')
										: (isOverDark ? 'text-slate-800' : 'text-slate-700')
									}`
								}
								style={{ transitionDelay: isMenuOpen ? `${index * 50}ms` : '0ms' }}
								onClick={closeMenu}
							>
								{link.label}
							</Link>
						))}
						{isAuthenticated && (
							<div
								className={`border-t pt-2 mt-2 transition-all duration-300 ease-in-out ${isOverDark ? 'border-gray-200' : 'border-t-gray-200/80'} ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
								style={{ transitionDelay: isMenuOpen ? `${filteredNavLinks.length * 50}ms` : '0ms' }}
							>
								<div className={`text-left px-4 py-2 transition-colors duration-200 flex items-center justify-between ${isOverDark ? 'text-slate-800' : 'text-slate-700'}`}>
									<span className="font-medium text-indigo-600">Hi, {user?.profile?.username || user?.user_metadata?.name || 'User'}</span>
                                    <button 
                                        onClick={handleExtendSession}
                                        disabled={!canExtend}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-sm font-mono transition-all duration-300 ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                                    >
                                        {canExtend ? <RefreshCw size={12} /> : <Clock size={12} />}
                                        {formatTime(timeLeft)}
                                    </button>
								</div>
								<Link
									href="/profile"
									className={`block w-full text-left px-4 py-2.5 rounded-lg text-lg transition-colors duration-200 ${isOverDark ? 'text-slate-800 hover:bg-black/5' : 'text-gray-700 hover:bg-gray-100/80'}`}
									onClick={closeMenu}
								>
									個資管理
								</Link>
								<button
									className={`block w-full text-left px-4 py-2.5 rounded-lg text-lg transition-colors duration-200 mt-1 ${isOverDark ? 'text-red-500 hover:bg-red-50/50' : 'text-red-600 hover:bg-red-50/80'}`}
									onClick={handleLogout}
								>
									登出
								</button>
							</div>
						)}

                        {/* Android Install Button (Mobile Only) */}
                        {isAndroid && !isStandalone && (
                            <div className="pt-4 mt-4 border-t border-gray-200/50 flex justify-center pb-6">
                                <button
                                    onClick={handleInstallApp}
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-all duration-200 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 w-[90%] justify-center"
                                >
                                    <Download size={20} />
                                    <span>下載應用程式</span>
                                </button>
                            </div>
                        )}
					</div>
				</div>
			</header>

            {/* 自動登出提醒 Modal */}
            <AnimatePresence>
                {showTimeoutModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTimeoutModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        
                        {/* Modal Content */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100"
                        >
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                                    <AlertTriangle size={40} strokeWidth={2.5} />
                                </div>
                                
                                <h3 className="text-2xl font-black text-gray-900 mb-2 font-sans tracking-tight">登出提醒</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                    您已長時間未操作系統，將於以下時間後自動登出以保護您的帳號安全：
                                </p>
                                
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                                    <Clock size={20} className="text-indigo-600" />
                                    <span className="text-3xl font-mono font-black text-indigo-700 tracking-tighter">
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={handleContinueSession}
                                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                                    >
                                        繼續使用系統
                                    </button>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full py-3 bg-white text-gray-500 font-bold rounded-xl hover:text-red-500 transition-colors"
                                    >
                                        立即登出
                                    </button>
                                </div>
                            </div>
                            
                            {/* Close Button */}
                            <button 
                                onClick={() => setShowTimeoutModal(false)}
                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-600 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
		</HeaderContext.Provider>
	);
});

Header.displayName = 'Header';
export default Header;
