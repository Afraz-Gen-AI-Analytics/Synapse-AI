import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ChartData } from '../types';

const LineChart: React.FC<{ data: ChartData }> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

    const PADDING = { top: 20, right: 20, bottom: 30, left: 30 };
    const SVG_WIDTH = 500;
    const SVG_HEIGHT = 300;
    
    const VIEWBOX_WIDTH = SVG_WIDTH;
    const VIEWBOX_HEIGHT = SVG_HEIGHT;

    const chartWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
    const chartHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom;

    const maxValue = Math.max(...data.values, 0);
    const yMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 10; // Add 10% ceiling
    const numYTicks = 5;

    // Map data points to SVG coordinates
    const points = useMemo(() => {
        if (data.values.length < 2) {
             const x = PADDING.left + chartWidth / 2;
             const y = PADDING.top + chartHeight - (data.values[0] / yMax) * chartHeight;
             return [{ x, y, value: data.values[0], label: data.labels[0] }];
        }
        return data.values.map((value, i) => {
            const x = PADDING.left + (i / (data.values.length - 1)) * chartWidth;
            const y = PADDING.top + chartHeight - (value / yMax) * chartHeight;
            return { x, y, value, label: data.labels[i] };
        });
    }, [data, yMax, chartWidth, chartHeight, PADDING]);

    // Create the SVG path string for the line
    const linePath = useMemo(() => {
        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
        const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');
        return path;
    }, [points]);

    // Create the SVG path for the area fill
    const areaPath = useMemo(() => {
        if (points.length === 0) return '';
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        if (points.length === 1) {
            return `M ${firstPoint.x} ${chartHeight + PADDING.top} L ${firstPoint.x} ${firstPoint.y} L ${firstPoint.x} ${chartHeight + PADDING.top} Z`;
        }
        return `${linePath} L ${lastPoint.x} ${chartHeight + PADDING.top} L ${firstPoint.x} ${chartHeight + PADDING.top} Z`;
    }, [linePath, points, chartHeight, PADDING.top]);

    // Animation setup
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.5 });

        const currentRef = svgRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    const pathLength = useMemo(() => {
        if (!isVisible || !svgRef.current) return 0;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', linePath);
        return path.getTotalLength();
    }, [isVisible, linePath]);

    const yAxisLabels = useMemo(() => {
        if (yMax <= 0) return [];
        const labels = [];
        for (let i = 0; i < numYTicks; i++) {
            // Calculate value from top to bottom
            const value = Math.round((yMax / (numYTicks - 1)) * (numYTicks - 1 - i));
            // Calculate y position
            const y = PADDING.top + (i * chartHeight / (numYTicks - 1));
            labels.push({ value, y });
        }
        return labels;
    }, [yMax, numYTicks, chartHeight, PADDING.top]);
    
    return (
        <div className="relative w-full h-full">
            <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-full">
                <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0.5" x2="1" y2="0.5">
                        <stop offset="0%" stopColor="var(--gradient-start)" />
                        <stop offset="100%" stopColor="var(--gradient-end)" />
                    </linearGradient>
                     <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gradient-start)" stopOpacity="0.4"/>
                        <stop offset="80%" stopColor="var(--gradient-start)" stopOpacity="0"/>
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                <g className="text-slate-700">
                    {Array.from({ length: numYTicks }).map((_, i) => {
                        const y = PADDING.top + (i * chartHeight / (numYTicks -1));
                        return (
                            <line key={i} x1={PADDING.left} y1={y} x2={chartWidth + PADDING.left} y2={y} stroke="currentColor" strokeWidth="0.5" />
                        );
                    })}
                </g>

                {/* Y-Axis Labels */}
                <g className="text-[10px] fill-slate-500">
                     {yAxisLabels.map((labelInfo, i) => (
                        <text
                            key={i}
                            x={PADDING.left - 8}
                            y={labelInfo.y}
                            dy="0.3em"
                            textAnchor="end"
                            className="transition-opacity duration-700"
                            style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${200 + i * 50}ms` }}
                        >
                           {labelInfo.value}
                        </text>
                     ))}
                </g>

                {/* X-Axis Labels */}
                <g className="text-[10px] fill-slate-500">
                     {points.map((point, i) => (
                        <text
                            key={i}
                            x={point.x}
                            y={VIEWBOX_HEIGHT - PADDING.bottom + 15}
                            textAnchor="middle"
                            className="transition-opacity duration-700"
                            style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${300 + i * 70}ms` }}
                        >
                            {point.label}
                        </text>
                    ))}
                </g>
                
                {/* Area Fill */}
                <path
                    d={areaPath}
                    fill="url(#areaGradient)"
                    className="transition-opacity duration-1000"
                    style={{ opacity: isVisible ? 1 : 0, transitionDelay: '500ms' }}
                />

                {/* Main Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={pathLength}
                    strokeDashoffset={pathLength}
                    style={isVisible ? { transition: 'stroke-dashoffset 2s ease-out', strokeDashoffset: 0 } : {}}
                />
                
                {/* Data Points and Tooltip Triggers */}
                <g>
                    {points.map((point, i) => (
                        <circle
                            key={i}
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            fill="transparent"
                            onMouseEnter={() => setTooltip({ ...point, x: point.x, y: point.y })}
                            onMouseLeave={() => setTooltip(null)}
                            className="cursor-pointer"
                        />
                    ))}
                    {points.map((point, i) => (
                         <circle
                            key={`inner-${i}`}
                            cx={point.x}
                            cy={point.y}
                            r="3"
                            fill="currentColor"
                            className="text-white pointer-events-none transition-opacity duration-1000"
                            style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${200 + i * 50}ms` }}
                        />
                    ))}
                </g>

            </svg>
            
            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute p-2 text-xs bg-slate-800 text-white rounded-md shadow-lg pointer-events-none transition-transform duration-100"
                    style={{
                        left: `${(tooltip.x / VIEWBOX_WIDTH) * 100}%`,
                        top: `${(tooltip.y / VIEWBOX_HEIGHT) * 100}%`,
                        transform: `translate(-50%, -120%)`,
                    }}
                >
                    <div className="font-bold">{tooltip.value}</div>
                    <div className="text-slate-400">{tooltip.label}</div>
                </div>
            )}
        </div>
    );
};

export default LineChart;