"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Smartphone, Clock } from 'lucide-react';
import { useState, forwardRef, useEffect, useRef, createContext } from "react";
import { usePathname } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import logo from "@/app/assets/logo.png";
import IconButton from "@/components/ui/IconButton";

export const HeaderContext = createContext({ isHeaderVisible: true });

const Header = forwardRef((props, ref) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isOverDark, setIsOverDark] = useState(false);
	const mobileMenuRef = useRef(null);
	const userMenuRef = useRef(null);

	const isHeaderVisible = true;

	const { user, loading, signOut, isAuthenticated, isAdmin, timeLeft } = useAuth();
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

	const LogoTitle = () => (
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

	return (
		<HeaderContext.Provider value={{ isHeaderVisible }}>
			<header
				className={`header-fixed opacity-100 select-none ${isMenuOpen ? 'menu-open' : ''}`}
				ref={ref}
				onKeyDown={handleKeyDown}
			>
				<div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between relative z-10">
					<LogoTitle />
					<nav className="hidden lg:flex items-center space-x-1 lg:space-x-2" role="navigation">
						{filteredNavLinks.map(link => (
							<Link key={link.href} href={link.href} className={`nav-link underline-extend navbar-link ${pathname === link.href ? 'active' : ''}`}>
								{link.label}
							</Link>
						))}
						{isAuthenticated && (
                            <>
                                {/* 自動登出計時器 */}
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all duration-300 ml-2 ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-500'}`} title="基於安全性考量，如長時間未操作系統將於倒數結束後自動登出。">
                                    <Clock size={14} />
                                    <span className="text-xs font-mono font-bold">{formatTime(timeLeft)}</span>
                                </div>

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
                                    <div className="flex items-center gap-1 text-sm font-mono opacity-80 text-slate-500">
                                        <Clock size={12} />
                                        {formatTime(timeLeft)}
                                    </div>
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
		</HeaderContext.Provider>
	);
});

Header.displayName = 'Header';
export default Header;
