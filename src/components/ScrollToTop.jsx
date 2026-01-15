'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';

/**
 * ScrollToTop 組件
 * 實作一個帶有圓形進度環的「回到頂部」按鈕。
 * 進度環使用 CSS conic-gradient 達成極致平滑的紫色系漸層。
 */
export default function ScrollToTop() {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const prevYRef = useRef(0);

    // 外框尺寸 56px (3.5rem)
    // 圓環線寬設定
    const strokeWidth = 4;
    // 圓環直徑 (SVG viewbox 48) -> 實際像素換算
    // 為了簡單對齊，我們讓 CSS 漸層填滿整個容器，然後用 mask 挖洞
    const progressDeg = progress * 360;

    useEffect(() => {
        // 監聽 Modal 開啟狀態
        const checkModalStatus = () => {
            const hasModalOpen = document.body.classList.contains('modal-open');
            const hasAdminModalOpen = document.body.classList.contains('admin-modal-open');
            setIsModalOpen(hasModalOpen || hasAdminModalOpen);
        };

        const observer = new MutationObserver(checkModalStatus);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        // 初始化檢查
        checkModalStatus();

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            const p = docH > 0 ? y / docH : 0;
            setProgress(Math.max(0, Math.min(p, 1)));

            const dy = y - prevYRef.current;
            
            if (y < 150) {
                setVisible(false);
            } else if (window.innerWidth < 768) {
                if (dy < -4) setVisible(true);
                else if (dy > 4 && y > 300) setVisible(false);
            } else {
                setVisible(true);
            }
            prevYRef.current = y;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 計算終點圓頭的位置
    // 容器 56px, 半徑約 26px (中心 28)
    const size = 56;
    const center = size / 2;
    const r = (size - strokeWidth) / 2; // 讓圓環置中
    const angleRad = (progressDeg * Math.PI) / 180;
    
    // CSS Conic Gradient 的起始點通常是 12 點鐘 (0deg)，但 CSS 標準是從 12 點順時鐘
    // 我們需要校正角度計算
    const endX = center + r * Math.sin(angleRad);
    const endY = center - r * Math.cos(angleRad);

    const shouldShow = visible && !isModalOpen;

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out ${
                shouldShow ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-50 pointer-events-none'
            }`}
            style={{ width: `${size}px`, height: `${size}px` }}
        >
            <div className="relative w-full h-full">
                {/* 底層背景圓環 (淺灰色軌道) 直接畫一個圓框 */}
                <div 
                    className="absolute inset-0 rounded-full border-4 border-slate-100" 
                    style={{ zIndex: 0 }}
                />

                {/* 進度漸層環 (CSS Conic Gradient) */}
                <div 
                    className="absolute inset-0 rounded-full" 
                    style={{ 
                        zIndex: 1,
                        background: `conic-gradient(from 0deg at 50% 50%, #d8b4fe 0%, #7e22ce ${progressDeg}deg, transparent ${progressDeg}deg)`,
                        // 遮罩：白色區域會顯示，透明區域會隱藏
                        WebkitMaskImage: 'radial-gradient(transparent 58%, black 61%)',
                        maskImage: 'radial-gradient(transparent 58%, black 61%)',
                    }}
                />

                {/* 圓頭修飾 (SVG) 覆蓋在漸層之上 */}
                <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none" 
                    style={{ zIndex: 2 }}
                >
                    {/* 起點圓頭 (淺紫) - 固定在 12 點鐘方向 */}
                    {progress > 0 && (
                        <circle cx={center} cy={strokeWidth/2} r={strokeWidth/2} fill="#d8b4fe" />
                    )}
                    {/* 終點圓頭 (深紫) */}
                    {progress > 0 && (
                        <circle 
                            cx={endX} 
                            cy={endY} 
                            r={strokeWidth/2} 
                            fill="#7e22ce" 
                        />
                    )}
                </svg>

                {/* 中央按鈕內縮 4px (inset-1) 避免蓋住外環 */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="回到頂端"
                    className="absolute inset-1 rounded-full flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 text-slate-700 group"
                    style={{ zIndex: 10 }}
                >
                    <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform duration-300" />
                </button>
            </div>
        </div>
    );
}
