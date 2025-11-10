import React, { useEffect, useState, useRef, useMemo } from 'react';
import { User, AnalyticsData, ChartData, Kpi, AgentStats, HistoryItem, Agent } from '../types';
import { getHistoryCollection, getAgentsCollection } from '../services/firebaseService';
import AgentIcon from './icons/AgentIcon';
import SparklesIcon from './icons/SparklesIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import EyeIcon from './icons/EyeIcon';

interface AnalyticsDashboardProps {
    user: User;
}

const kpiIcons = [SparklesIcon, AgentIcon, TrendingUpIcon, TrendingUpIcon];

const KpiCard: React.FC<Kpi & { icon: React.FC<{className?: string}>, delay: number }> = ({ label, value, change, changeType, icon: Icon, delay }) => (
    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800/80 shadow-lg shadow-black/30 transition-all duration-300 hover:border-[var(--gradient-end)]/50 hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: `${delay}ms`}}>
        <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-slate-800/50">
                <Icon className="w-6 h-6 text-[var(--gradient-start)]"/>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-400">{label}</p>
                <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className={`text-sm font-semibold ${changeType === 'increase' ? 'text-green-400' : 'text-red-400'}`}>
                        {change}
                    </p>
                </div>
            </div>
        </div>
    </div>
);

interface TooltipData {
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
}

const BarChart: React.FC<{ data: ChartData }> = ({ data }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({ visible: false, x: 0, y: 0, content: null });
    const maxValue = useMemo(() => Math.max(...data.values, 1), [data.values]);
    const colors = ['#E025F0', '#4190F2', '#13B1B7', '#FFD700', '#FF4500'];

    const handleMouseMove = (e: React.MouseEvent, index: number, value: number) => {
        if (!chartRef.current) return;
        const rect = chartRef.current.getBoundingClientRect();
        const containerHeight = chartRef.current.clientHeight;
        const barHeight = (value / maxValue) * containerHeight;

        setTooltip({
            visible: true,
            x: e.clientX - rect.left,
            y: containerHeight - barHeight,
            content: (
                <>
                    <span className="font-semibold">{data.labels[index]}</span>: {data.values[index]}
                </>
            ),
        });
    };

    return (
        <div ref={chartRef} onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))} className="w-full h-full relative flex items-end gap-3 px-4 pt-4">
            {data.values.map((value, index) => (
                <div
                    key={index}
                    className="flex-1 h-full flex flex-col justify-end items-center group"
                    onMouseMove={(e) => handleMouseMove(e, index, value)}
                >
                    <div
                        className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-100 opacity-80"
                        style={{
                            height: `${(value / maxValue) * 100}%`,
                            background: `linear-gradient(to top, ${colors[index % colors.length]}40, ${colors[index % colors.length]}99)`,
                            transitionProperty: 'height',
                            transitionDuration: '1s',
                            transitionTimingFunction: 'ease-out',
                            transitionDelay: `${150 + index * 100}ms`
                        }}
                    ></div>
                    <p className="text-xs text-slate-400 mt-2 whitespace-nowrap">{data.labels[index]}</p>
                </div>
            ))}
            {tooltip.visible && (
                <div
                    className="absolute p-2 bg-slate-800 border border-slate-700 text-white text-xs rounded-md shadow-lg pointer-events-none transition-opacity"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        transform: 'translate(-50%, -100%) translateY(-8px)',
                        opacity: 1
                    }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};

const AreaChart: React.FC<{ data: ChartData }> = ({ data }) => {
    const chartRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({ visible: false, x: 0, y: 0, content: null });
    const [indicator, setIndicator] = useState({ visible: false, x: 0, y: 0 });

    const chartWidth = 500;
    const chartHeight = 200;

    const { points, path, areaPath } = useMemo(() => {
        const maxValue = Math.max(...data.values, 1);
        const minValue = 0;
        const yRatio = (chartHeight - 20) / (maxValue - minValue);
        const xRatio = data.values.length > 1 ? chartWidth / (data.values.length - 1) : chartWidth;

        const calculatedPoints = data.values.map((val, i) => {
            const x = i * xRatio;
            const y = chartHeight - ((val - minValue) * yRatio) - 10;
            return { x, y, value: val, label: data.labels[i] };
        });

        const pathD = calculatedPoints.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');
        const areaPathD = `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
        
        return { points: calculatedPoints, path: pathD, areaPath: areaPathD };
    }, [data, chartWidth, chartHeight]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!chartRef.current) return;
        const rect = chartRef.current.getBoundingClientRect();
        const svgX = (e.clientX - rect.left) * (chartWidth / rect.width);
        
        const closestPoint = points.reduce((prev, curr) => 
            Math.abs(curr.x - svgX) < Math.abs(prev.x - svgX) ? curr : prev
        );
        
        setIndicator({ visible: true, x: closestPoint.x, y: closestPoint.y });
        setTooltip({
            visible: true,
            x: closestPoint.x * (rect.width / chartWidth),
            y: closestPoint.y * (rect.height / chartHeight),
            content: (
                <>
                    <span className="font-semibold">{closestPoint.label}</span>: {closestPoint.value}
                </>
            ),
        });
    };

    return (
        <div className="w-full h-full relative">
            <svg
                ref={chartRef}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full overflow-visible"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => { setTooltip(prev => ({ ...prev, visible: false })); setIndicator({ ...indicator, visible: false }); }}
            >
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gradient-start)" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="var(--gradient-start)" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#areaGradient)" />
                <path d={path} fill="none" stroke="var(--gradient-start)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                
                {indicator.visible && (
                    <>
                        <line x1={indicator.x} y1="0" x2={indicator.x} y2={chartHeight} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3"/>
                        <circle cx={indicator.x} cy={indicator.y} r="4" fill="var(--gradient-start)" stroke="#0D1117" strokeWidth="2" />
                    </>
                )}
            </svg>
             {tooltip.visible && (
                <div
                    className="absolute p-2 bg-slate-800 border border-slate-700 text-white text-xs rounded-md shadow-lg pointer-events-none"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        transform: 'translate(-50%, -100%) translateY(-8px)',
                    }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};


const AgentOverview: React.FC<{ data: AgentStats }> = ({ data }) => {
    const stats = [
        { label: 'Active', value: data.active, icon: AgentIcon, color: 'text-green-400' },
        { label: 'Needs Review', value: data.needsReview, icon: EyeIcon, color: 'text-yellow-400' },
        { label: 'Completed', value: data.completed, icon: CheckCircleIcon, color: 'text-fuchsia-400' },
    ];
     return (
        <div className="h-full flex flex-col justify-around space-y-4">
           {stats.map(({label, value, icon: Icon, color}) => (
               <div key={label} className="flex items-center">
                   <Icon className={`w-5 h-5 mr-4 flex-shrink-0 ${color}`} />
                   <div className="flex-1">
                       <p className="text-slate-300 text-sm font-medium">{label}</p>
                   </div>
                   <p className="text-lg font-bold text-white">{value}</p>
               </div>
           ))}
            <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                <p className="text-slate-300 text-sm font-medium">Total Agents</p>
                <p className="text-2xl font-bold text-white">{data.total}</p>
            </div>
        </div>
    );
};

const AnalyticsSkeleton: React.FC = () => (
    <div className="flex-1 flex flex-col h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 flex-shrink-0">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900 p-5 rounded-xl border border-slate-800/80 animate-pulse">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-slate-800/50"></div>
                <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-800/50 rounded w-3/4"></div>
                <div className="h-6 bg-slate-800/50 rounded w-1/2"></div>
                </div>
            </div>
            </div>
        ))}
        </div>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800/80 animate-pulse p-6 flex flex-col">
                <div className="h-6 bg-slate-800/50 rounded w-1/3 mb-4"></div>
                <div className="flex-1 w-full bg-slate-800/50 rounded-md"></div>
            </div>
            <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                <div className="bg-slate-900 rounded-xl border border-slate-800/80 animate-pulse p-6 flex flex-col">
                <div className="h-6 bg-slate-800/50 rounded w-1/2 mb-4"></div>
                <div className="flex-1 w-full bg-slate-800/50 rounded-md"></div>
                </div>
                <div className="bg-slate-900 rounded-xl border border-slate-800/80 animate-pulse p-6 flex flex-col">
                <div className="h-6 bg-slate-800/50 rounded w-1/2 mb-4"></div>
                <div className="flex-1 w-full bg-slate-800/50 rounded-md"></div>
                </div>
            </div>
        </div>
    </div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAnalytics = async () => {
            setIsLoading(true);
            try {
                const [history, agents] = await Promise.all([
                    getHistoryCollection(user.uid),
                    getAgentsCollection(user.uid)
                ]);

                // --- BAR CHART DATA ---
                const performanceMap: { [key: string]: number } = { 'Social': 0, 'Email': 0, 'Video': 0, 'Ad Copy': 0, 'Blog': 0 };
                history.forEach(item => {
                    if (item.templateName.includes('Social') || item.templateName.includes('Image')) {
                        performanceMap['Social']++;
                    } else if (item.templateName.includes('Email')) {
                        performanceMap['Email']++;
                    } else if (item.templateName.includes('Video')) {
                        performanceMap['Video']++;
                    } else if (item.templateName.includes('Ad')) {
                        performanceMap['Ad Copy']++;
                    } else if (item.templateName.includes('Blog')) {
                        performanceMap['Blog']++;
                    }
                });

                const performanceByType: ChartData = {
                    labels: Object.keys(performanceMap),
                    values: Object.values(performanceMap)
                };

                // --- LINE CHART DATA ---
                const engagementDays = 14;
                const engagementLabels: string[] = [];
                const engagementValues: number[] = new Array(engagementDays).fill(0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                for (let i = engagementDays - 1; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    engagementLabels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }

                history.forEach(item => {
                    const itemDate = new Date(item.timestamp);
                    itemDate.setHours(0, 0, 0, 0);
                    const diffTime = today.getTime() - itemDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays >= 0 && diffDays < engagementDays) {
                        const index = engagementDays - 1 - diffDays;
                        engagementValues[index]++;
                    }
                });

                const engagementOverTime: ChartData = {
                    labels: engagementLabels,
                    values: engagementValues
                };

                // --- KPI DATA ---
                const totalGenerations = history.length;
                const totalAgents = agents.length;

                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 6);
                const fourteenDaysAgo = new Date(today);
                fourteenDaysAgo.setDate(today.getDate() - 13);

                let gensLast7Days = 0;
                let gensPrev7Days = 0;
                history.forEach(item => {
                    const itemDate = new Date(item.timestamp);
                    if (itemDate >= sevenDaysAgo) {
                        gensLast7Days++;
                    } else if (itemDate >= fourteenDaysAgo && itemDate < sevenDaysAgo) {
                        gensPrev7Days++;
                    }
                });
                const weeklyChange = gensLast7Days - gensPrev7Days;
                const weeklyChangeType = weeklyChange >= 0 ? 'increase' : 'decrease';

                let firstGenDate: Date | null = null;
                if (history.length > 0) {
                    firstGenDate = history.reduce((earliest, item) => {
                        const itemDate = new Date(item.timestamp);
                        return earliest < itemDate ? earliest : itemDate;
                    }, new Date());
                }
                
                let daysSinceFirstGen = 1;
                if(firstGenDate) {
                    const diffTime = new Date().getTime() - firstGenDate.getTime();
                    daysSinceFirstGen = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                }

                const avgGensPerDay = totalGenerations > 0 ? (totalGenerations / daysSinceFirstGen).toFixed(1) : '0.0';

                // --- FINAL DATA OBJECT ---
                const analyticsData: AnalyticsData = {
                    kpis: [
                        { label: 'Total Generations', value: totalGenerations.toString(), change: `+${gensLast7Days} this week`, changeType: 'increase' },
                        { label: 'Agents Deployed', value: totalAgents.toString(), change: ``, changeType: 'increase' },
                        { label: 'Generations (7d)', value: gensLast7Days.toString(), change: `${weeklyChange >= 0 ? '+' : ''}${weeklyChange} vs last week`, changeType: weeklyChangeType },
                        { label: 'Avg. Gens/Day (all time)', value: avgGensPerDay, change: ``, changeType: 'increase' },
                    ],
                    performanceByType,
                    engagementOverTime,
                    agentStats: {
                        active: agents.filter(a => a.status === 'active').length,
                        needsReview: agents.reduce((acc, a) => acc + (a.taskStats?.needsReview || 0), 0),
                        completed: agents.filter(a => a.status === 'completed').length,
                        total: totalAgents
                    }
                };
                setData(analyticsData);
            } catch (err) {
                console.error("Failed to load analytics data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadAnalytics();
    }, [user.uid]);

    const Panel: React.FC<{title: string, children: React.ReactNode, className?: string, delay: number}> = ({ title, children, className, delay }) => (
        <div className={`bg-slate-900 rounded-xl border border-slate-800/80 shadow-2xl shadow-black/40 ${className} animate-fade-in-up transition-all duration-300 hover:border-[var(--gradient-end)]/50 hover:-translate-y-1`} style={{ animationDelay: `${delay}ms`}}>
          <div className="p-6 flex flex-col h-full">
            <h3 className="font-semibold text-white/90 mb-4 text-base flex-shrink-0">{title}</h3>
            <div className="flex-grow relative">
                {children}
            </div>
          </div>
        </div>
    );

    if (isLoading) {
        return <AnalyticsSkeleton />;
    }

    if (!data) {
        return <div className="flex-1 flex items-center justify-center text-slate-500">Could not load analytics data.</div>;
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto">
            
            {/* KPI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 flex-shrink-0">
                {data.kpis.map((kpi, index) => (
                    <KpiCard key={index} {...kpi} icon={kpiIcons[index]} delay={100 + index * 100} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Panel title="Generations by Type" delay={400} className="min-h-[350px] lg:h-full">
                        <BarChart data={data.performanceByType} />
                    </Panel>
                </div>
                <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    <Panel title="Activity Over Time" delay={500} className="min-h-[300px] lg:h-full">
                        <AreaChart data={data.engagementOverTime} />
                    </Panel>
                    <Panel title="Agent Overview" delay={600} className="min-h-[300px] lg:h-full">
                        <AgentOverview data={data.agentStats} />
                    </Panel>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;