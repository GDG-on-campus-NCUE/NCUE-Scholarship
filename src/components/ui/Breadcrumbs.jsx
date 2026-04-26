                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels = {
    'ai-assistant': 'AI 獎學金助理',
    'resource': 'FAQ 及相關資源',
    'terms-and-privacy': '服務條款',
    'manage': '管理後台',
    'profile': '個資管理',
    'login': '登入',
    'forgot-password': '忘記密碼',
    'reset-password': '重設密碼'
};

export default function Breadcrumbs() {
    const pathname = usePathname();
    
    // 首頁不顯示麵包屑
    if (pathname === '/') return null;

    const pathSegments = pathname.split('/').filter(segment => segment);

    return (
        <nav aria-label="路徑連結列" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 select-none">
            <ol className="flex items-center space-x-2 text-sm">
                <li className="flex items-center">
                    <Link href="/" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <Home size={14} aria-hidden="true" />
                        <span>首頁</span>
                    </Link>
                </li>
                
                {pathSegments.map((segment, index) => {
                    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathSegments.length - 1;
                    const label = routeLabels[segment] || segment;

                    return (
                        <li key={href} className="flex items-center space-x-2">
                            <ChevronRight size={14} className="text-gray-400" aria-hidden="true" />
                            {isLast ? (
                                <span className="font-bold text-gray-900" aria-current="page">
                                    {label}
                                </span>
                            ) : (
                                <Link href={href} className="text-gray-500 hover:text-indigo-600 transition-colors">
                                    {label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
