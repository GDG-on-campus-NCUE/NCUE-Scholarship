'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';

export default function SimpleLineChart({ data, color = 'purple', height: initialHeight = 300 }) {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const containerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 基礎參數
    const padding = isMobile ? 40 : 50; 
    const width = 800; // SVG 內部座標系寬度
    const height = initialHeight; 
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const colorConfig = {
        purple: { stroke: '#7c3aed', fill: '#7c3aed', text: 'text-purple-700' },
        emerald: { stroke: '#059669', fill: '#059669', text: 'text-emerald-700' },
        rose: { stroke: '#e11d48', fill: '#e11d48', text: 'text-rose-700' },
        indigo: { stroke: '#4f46e5', fill: '#4f46e5', text: 'text-indigo-700' },
    };

    const theme = colorConfig[color] || colorConfig.purple;

    const safeData = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            return Array.from({ length: 7 }).map((_, i) => ({
                date: '',
                count: 0,
                isPlaceholder: true
            }));
        }
        return data.map(d => ({
            ...d,
            date: String(d.date || ''),
            count: Math.max(0, Number(d.count) || 0),
            cost: d.cost !== undefined ? Number(d.cost) : undefined
        }));
    }, [data]);

    const maxCount = useMemo(() => {
        const counts = safeData.map(d => d.count);
        const max = Math.max(...counts, 10);
        return Math.ceil(max / 5) * 5;
    }, [safeData]);
    
    const points = useMemo(() => {
        const len = safeData.length;
        return safeData.map((d, i) => {
            const x = padding + (i / (len - 1 || 1)) * chartWidth;
            const y = height - padding - ((d.count / maxCount) * chartHeight);
            return { x, y: isNaN(y) ? height - padding : y, ...d };
        });
    }, [safeData, chartWidth, chartHeight, padding, height, maxCount]);

    const pathD = useMemo(() => {
        if (points.length < 2) return "";
        return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }, [points]);

    const areaD = useMemo(() => {
        if (points.length < 2) return "";
        return `${pathD} L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    }, [pathD, points, height, padding]);

    return (
        <div className="w-full">
            <div 
                ref={containerRef} 
                className={`w-full select-none hide-scrollbar ${isMobile ? 'overflow-x-auto cursor-grab active:cursor-grabbing pb-2' : ''}`}
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div 
                    className="relative group" 
                    style={{ 
                        width: isMobile ? '700px' : '100%',
                        minHeight: height 
                    }}
                >
                    <svg 
                        viewBox={`0 0 ${width} ${height}`} 
                        className="w-full h-auto bg-white rounded-xl border border-slate-200 overflow-visible shadow-sm"
                    >
                        <defs>
                            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={theme.fill} stopOpacity="0.15" />
                                <stop offset="100%" stopColor={theme.fill} stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* 背景格線 */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const y = height - padding - ratio * chartHeight;
                            return (
                                <g key={`grid-${i}`}>
                                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                    <text 
                                        x={padding - 12} 
                                        y={y + 4} 
                                        textAnchor="end" 
                                        className={`${isMobile ? 'text-[14px]' : 'text-[11px]'} fill-slate-400 font-mono font-bold`}
                                    >
                                        {Math.round(ratio * maxCount)}
                                    </text>
                                </g>
                            );
                        })}

                        {/* X 軸線 */}
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="2" />
                        
                        {pathD && (
                            <>
                                <path d={areaD} fill={`url(#gradient-${color})`} />
                                <path d={pathD} fill="none" stroke={theme.stroke} strokeWidth={isMobile ? "4" : "3"} strokeLinecap="round" strokeLinejoin="round" />
                            </>
                        )}

                        {/* X 軸標籤 */}
                        {points.map((p, i) => {
                            const step = isMobile ? Math.ceil(points.length / 8) : Math.ceil(points.length / 10);
                            if (i % step === 0 || i === points.length - 1) {
                                return (
                                    <g key={`label-${i}`}>
                                        <line x1={p.x} y1={height - padding} x2={p.x} y2={height - padding + 6} stroke="#cbd5e1" strokeWidth="1.5" />
                                        <text 
                                            x={p.x} 
                                            y={height - padding + 24} 
                                            textAnchor="middle" 
                                            className={`${isMobile ? 'text-[14px]' : 'text-[11px]'} fill-slate-500 font-bold`}
                                        >
                                            {p.date.length > 5 ? p.date.slice(5) : p.date}
                                        </text>
                                    </g>
                                );
                            }
                            return null;
                        })}

                        {/* 數據點 */}
                        {points.map((p, i) => (
                            <g 
                                key={`point-${i}`} 
                                onMouseEnter={() => setHoveredPoint(p)} 
                                onMouseLeave={() => setHoveredPoint(null)} 
                                onClick={() => setHoveredPoint(p === hoveredPoint ? null : p)}
                            >
                                <circle 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r={hoveredPoint?.x === p.x ? (isMobile ? 8 : 6) : (isMobile ? 5 : 4)} 
                                    className="fill-white transition-all duration-200" 
                                    stroke={theme.stroke} 
                                    strokeWidth={hoveredPoint?.x === p.x ? 3 : 2} 
                                />
                                <rect x={p.x - (width/points.length/2)} y={padding} width={width/points.length} height={chartHeight} fill="transparent" className="cursor-pointer" />
                            </g>
                        ))}
                    </svg>

                    {/* Tooltip */}
                    {hoveredPoint && (
                        <div
                            className="absolute bg-slate-900/95 backdrop-blur-md text-white rounded-xl px-4 py-3 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 shadow-2xl z-50 whitespace-nowrap border border-slate-700/50"
                            style={{ 
                                left: `${(hoveredPoint.x / width) * 100}%`, 
                                top: `${(hoveredPoint.y / height) * 100}%`,
                                fontSize: isMobile ? '13px' : '11px'
                            }}
                        >
                            <div className="font-bold border-b border-slate-700/50 pb-2 mb-2 tracking-tight text-slate-300">{hoveredPoint.date}</div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-6">
                                    <span className="text-slate-400">{hoveredPoint.cost !== undefined ? 'API 請求' : '瀏覽次數'}</span>
                                    <span className="font-mono font-bold text-indigo-400">{hoveredPoint.count}</span>
                                </div>
                                {hoveredPoint.cost !== undefined && (
                                    <div className="flex items-center justify-between gap-6">
                                        <span className="text-slate-400">估算支出</span>
                                        <span className="font-mono font-bold text-emerald-400">${hoveredPoint.cost.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isMobile && (
                <div className="flex items-center justify-center gap-2 mt-2 text-slate-400 text-[11px] font-medium">
                    <span>← 左右滑動查看趨勢 →</span>
                </div>
            )}
            
            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
