'use client';

import React, { useState, useMemo } from 'react';

export default function SimpleLineChart({ data, color = 'purple', height = 300 }) {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const padding = 50; 
    const width = 800;
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
        return Math.max(...counts, 10);
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

    const hasRealData = Array.isArray(data) && data.length > 0 && data.some(d => (Number(d.count) || 0) > 0);

    return (
        <div className="w-full select-none" style={{ minHeight: height }}>
            <div className="relative group">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-white rounded-xl border-2 border-gray-100 shadow-inner">
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={theme.fill} />
                            <stop offset="100%" stopColor={theme.fill} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <rect x={padding} y={padding} width={chartWidth} height={chartHeight} fill="white" />

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = height - padding - ratio * chartHeight;
                        return (
                            <g key={`grid-${i}`}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5 5" />
                                <text x={padding - 15} y={y + 4} textAnchor="end" className="text-[12px] fill-gray-500 font-mono font-bold">{Math.round(ratio * maxCount)}</text>
                            </g>
                        );
                    })}

                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#64748b" strokeWidth="2" />
                    
                    {pathD && (
                        <>
                            <path d={areaD} fill={theme.fill} opacity="0.1" />
                            <path d={pathD} fill="none" stroke={theme.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                    )}

                    {points.map((p, i) => {
                        const step = Math.ceil(points.length / 8);
                        if (i % step === 0 || i === points.length - 1) {
                            return (
                                <g key={`label-${i}`}>
                                    <line x1={p.x} y1={height - padding} x2={p.x} y2={height - padding + 8} stroke="#64748b" strokeWidth="1.5" />
                                    <text x={p.x} y={height - padding + 25} textAnchor="middle" className="text-[11px] fill-gray-600 font-bold">{p.date.length > 5 ? p.date.slice(5) : p.date}</text>
                                </g>
                            );
                        }
                        return null;
                    })}

                    {points.map((p, i) => (
                        <g key={`point-${i}`} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}>
                            <circle cx={p.x} cy={p.y} r={hoveredPoint?.x === p.x ? 6 : 4} className="fill-white transition-all" stroke={theme.stroke} strokeWidth={hoveredPoint?.x === p.x ? 3 : 2} />
                            <rect x={p.x - 10} y={padding} width="20" height={chartHeight} fill="transparent" className="cursor-pointer" />
                        </g>
                    ))}
                </svg>

                {hoveredPoint && (
                    <div
                        className="absolute bg-gray-900 text-white text-[11px] rounded-xl px-4 py-3 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 shadow-2xl z-50 whitespace-nowrap border border-gray-700"
                        style={{ left: `${(hoveredPoint.x / width) * 100}%`, top: `${(hoveredPoint.y / height) * 100}%` }}
                    >
                        <div className="font-black border-b border-gray-700 pb-2 mb-2 tracking-tight text-gray-300">{hoveredPoint.date}</div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-gray-400">{hoveredPoint.cost !== undefined ? 'API 請求數:' : '瀏覽次數:'}</span>
                                <span className="font-mono font-black text-indigo-400">{hoveredPoint.count}</span>
                            </div>
                            {hoveredPoint.cost !== undefined && (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-gray-400">當日支出:</span>
                                    <span className="font-mono font-black text-emerald-400">TWD ${hoveredPoint.cost.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
