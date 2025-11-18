import React, { useEffect, useState, useRef, useMemo } from 'react';
import { User, AnalyticsData, ChartData, Kpi, AgentStats, HistoryItem } from '../types';
import { getHistoryCollection, getAgentsCollection } from '../services/firebaseService';
import AgentIcon from './icons/AgentIcon';
import SparklesIcon from './icons/SparklesIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import LineChart from './LineChart';
import InfoIcon from './icons/InfoIcon';

interface AnalyticsDashboardProps {
    user: User;
}

const kpiIcons = [SparklesIcon, AgentIcon, TrendingUpIcon, TrendingUpIcon];

// Demo data to prevent "Empty Dashboard Syndrome"
const demoAnalyticsData: AnalyticsData = {
    kpis: [
        { label: 'Total Generations', value: '1,248', change: '+12% this week', changeType: 'increase' },
        { label: 'Agents Deployed', value: '3', change: 'Active', changeType: 'increase' },
        { label: 'Generations (7d)', value: '156', change: '+8 vs last week', changeType: 'increase' },
        { label: 'Avg. Gens/Day', value: '12.5', change: '', changeType: 'increase' },
    ],
    performanceByType: {
        labels: ['Social', 'Email', 'Video', 'Ad Copy', 'Blog'],
        values: [450, 320, 80, 210, 188]
    },
    engagementOverTime: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [12, 19, 15, 22, 30, 18, 10, 15, 25, 28, 35, 42, 20, 15]
    },
    mostUsedTools: {
        labels: ['Social Media Post', 'Marketing Email', 'AI Image Generator', 'Campaign Builder', 'Ad Copy'],
        values: [350, 280, 210, 150, 120]
    },
    agentStats: {
        active: 2,
        needsReview: 5,
        completed: 12,
        total: 19
    }
};


const KpiCard: React.FC<Kpi & { icon: React.FC<{className?: string}>, delay: number }> = ({ label, value, change, changeType, icon: Icon, delay }) => (
    <div 
        className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/80 shadow-lg shadow-black/30 transition-all duration-300 hover:border-[var(--gradient-end)]/50 hover:-translate-y-1 relative overflow-hidden group animate-fade-in-up" 
        style={{ animationDelay: `${delay}ms` }}
    >
        <div 
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[var(--gradient-start)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500"
            style={{ transform: 'rotate(-45deg)' }}
        />
        <div className="relative flex items-center space-x-4">
             <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Icon className="w-6 h-6 text-[var(--gradient-start)]"/>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-400">{label}</p>
                <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-white">{value}</p>
                    {change && (
                        <p className={`text-sm font-semibold ${changeType === 'increase' ? 'text-green-400' : 'text-red-400'}`}>
                            {change}
                        </p>
                    )}
                </div>
            </div>
        </div>
    </div>
);


const BarChart: React.FC<{ data: ChartData }> = ({ data }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.3 }
        );

        const currentRef = chartRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    const maxValue = useMemo(() => Math.max(...data.values, 1), [data.values]);
    const colors = ['#E025F0', '#4190F2', '#13B1B7', '#FFD700', '#FF4500'];

    return (
        <div ref={chartRef} className="w-full h-full flex justify-around items-end gap-2 sm:gap-4 px-2">
            {data.labels.map((label, index) => {
                const value = data.values[index];
                const heightPercentage = (value / maxValue) * 100;
                return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group max-w-[60px]">
                        {/* Value Label */}
                        <div 
                            className={`text-xs sm:text-sm font-bold text-white mb-1 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                            style={{ transitionDelay: `${500 + index * 100}ms` }}
                        >
                            {value}
                        </div>
                        {/* Bar */}
                        <div
                            className="w-full rounded-t-md transition-all duration-1000 ease-out relative"
                            style={{
                                height: isVisible ? `${heightPercentage}%` : '0%',
                                background: `linear-gradient(to top, ${colors[index % colors.length]}70, ${colors[index % colors.length]}FF)`,
                                boxShadow: isVisible ? `0 0 12px ${colors[index % colors.length]}50` : 'none',
                                transitionDelay: `${150 + index * 100}ms`
                            }}
                        >
                           {/* Subtle glow element for a premium feel */}
                           <div className="absolute -inset-x-1 bottom-0 h-1/2 bg-inherit rounded-t-md blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                        </div>
                        {/* Category Label */}
                        <div className="text-xs text-slate-400 mt-2 text-center break-words">{label}</div>
                    </div>
                );
            })}
        </div>
    );
};


const AnimatedCounter: React.FC<{ value: number, isVisible: boolean }> = ({ value, isVisible }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (isVisible && value > 0) {
            let start = 0;
            const end = value;
            const duration = 1200;
            const incrementTime = Math.max(1, duration / end);

            const timer = setInterval(() => {
                start += 1;
                setCount(start);
                if (start >= end) clearInterval(timer);
            }, incrementTime);

            return () => clearInterval(timer);
        } else if (!isVisible) {
            setCount(0);
        } else {
            setCount(value);
        }
    }, [isVisible, value]);

    return <>{count}</>;
}


const AgentOverview: React.FC<{ data: AgentStats }> = ({ data }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.5 });

        const currentRef = chartRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    const stats = [
        { label: 'Active', value: data.active, color: '#4ade80' }, // text-green-400
        { label: 'Needs Review', value: data.needsReview, color: '#facc15' }, // text-yellow-400
        { label: 'Completed', value: data.completed, color: '#e879f9' }, // text-fuchsia-400
    ];

    const totalForCalc = data.total > 0 ? (data.active + data.needsReview + data.completed) : 1;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPercentage = 0;
    const segments = stats.map(stat => {
        const percentage = (stat.value / totalForCalc);
        const dasharray = percentage * circumference;
        
        const segmentData = {
            ...stat,
            dasharray: `${dasharray} ${circumference - dasharray}`,
            offset: -accumulatedPercentage * circumference,
        };
        accumulatedPercentage += percentage;
        return segmentData;
    });

    return (
        <div ref={chartRef} className="h-full w-full flex flex-col items-center justify-center space-y-4">
            <div className="relative w-40 h-40">
                <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                    {segments.map((segment, index) => (
                        <circle
                            key={index}
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={isVisible ? segment.offset : circumference}
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: segment.dasharray,
                                transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25, 1, 0.5, 1)',
                                transitionDelay: `${index * 100}ms`
                            }}
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-bold text-white"><AnimatedCounter value={data.total} isVisible={isVisible} /></span>
                    <span className="text-sm text-slate-400">Total Agents</span>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                {stats.map(stat => (
                    <div key={stat.label} className="flex items-center text-sm">
                        <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: stat.color }}></span>
                        <span className="text-slate-400">{stat.label}:</span>
                        <span className="font-semibold text-white ml-1.5">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HorizontalBarChart: React.FC<{ data: ChartData }> = ({ data }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.3 }
        );

        const currentRef = chartRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    const maxValue = useMemo(() => Math.max(...data.values, 1), [data.values]);
    const colors = ['#E025F0', '#4190F2', '#13B1B7', '#FFD700', '#FF4500'].reverse();

    return (
        <div ref={chartRef} className="w-full h-full flex flex-col justify-around gap-4 py-2">
            {data.labels.map((label, index) => {
                const value = data.values[index];
                const widthPercentage = (value / maxValue) * 100;
                return (
                    <div key={index} className="flex items-center gap-3 w-full">
                        <div className="w-1/3 text-xs text-slate-400 text-right truncate" title={label}>{label}</div>
                        <div className="flex-1 bg-slate-800 rounded-full h-6 p-0.5">
                             <div
                                className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000 ease-out"
                                style={{
                                    width: isVisible ? `${widthPercentage}%` : '0%',
                                    background: `linear-gradient(to right, ${colors[index % colors.length]}70, ${colors[index % colors.length]}FF)`,
                                    boxShadow: isVisible ? `0 0 10px ${colors[index % colors.length]}40` : 'none',
                                    transitionDelay: `${150 + index * 100}ms`
                                }}
                            >
                                <span className="text-xs font-bold text-white opacity-0 transition-opacity" style={{ opacity: isVisible ? 1 : 0, transitionDelay: `${600 + index * 100}ms` }}>{value}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
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
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-900 rounded-xl border border-slate-800/80 animate-pulse p-6 flex flex-col min-h-[400px]">
                    <div className="h-6 bg-slate-800/50 rounded w-1/3 mb-4"></div>
                    <div className="flex-1 w-full bg-slate-800/50 rounded-md"></div>
                </div>
            ))}
        </div>
    </div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDemoData, setIsDemoData] = useState(false);

    useEffect(() => {
        const loadAnalytics = async () => {
            setIsLoading(true);
            try {
                const [historyItems, agents] = await Promise.all([
                    getHistoryCollection(user.uid),
                    getAgentsCollection(user.uid)
                ]);

                // Check if we should use demo data
                if (historyItems.length === 0 && agents.length === 0) {
                    setData(demoAnalyticsData);
                    setIsDemoData(true);
                    setIsLoading(false);
                    return;
                }

                const sortedHistory = historyItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                // --- BAR CHART DATA ---
                const performanceMap: { [key: string]: number } = { 'Social': 0, 'Email': 0, 'Video': 0, 'Ad Copy': 0, 'Blog': 0 };
                sortedHistory.forEach(item => {
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

                sortedHistory.forEach(item => {
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
                const totalGenerations = sortedHistory.length;
                const totalAgents = agents.length;

                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 6);
                const fourteenDaysAgo = new Date(today);
                fourteenDaysAgo.setDate(today.getDate() - 13);

                let gensLast7Days = 0;
                let gensPrev7Days = 0;
                sortedHistory.forEach(item => {
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
                if (sortedHistory.length > 0) {
                    firstGenDate = new Date(sortedHistory[sortedHistory.length - 1].timestamp);
                }
                
                let daysSinceFirstGen = 1;
                if(firstGenDate) {
                    const diffTime = new Date().getTime() - firstGenDate.getTime();
                    daysSinceFirstGen = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                }

                const avgGensPerDay = totalGenerations > 0 ? (totalGenerations / daysSinceFirstGen).toFixed(1) : '0.0';

                // --- MOST USED TOOLS DATA ---
                const toolUsageMap = new Map<string, number>();
                historyItems.forEach(item => {
                    toolUsageMap.set(item.templateName, (toolUsageMap.get(item.templateName) || 0) + 1);
                });
                const sortedTools = Array.from(toolUsageMap.entries()).sort((a, b) => b[1] - a[1]);
                const topTools = sortedTools.slice(0, 5);
                const mostUsedToolsData: ChartData = {
                    labels: topTools.map(entry => entry[0]),
                    values: topTools.map(entry => entry[1]),
                };

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
                    mostUsedTools: mostUsedToolsData,
                    agentStats: {
                        active: agents.filter(a => a.status === 'active').length,
                        needsReview: agents.reduce((acc, a) => acc + (a.taskStats?.needsReview || 0), 0),
                        completed: agents.filter(a => a.status === 'completed').length,
                        total: totalAgents
                    }
                };
                setData(analyticsData);
                setIsDemoData(false);
            } catch (err) {
                console.error("Failed to load analytics data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadAnalytics();
    }, [user.uid]);

    const Panel: React.FC<{title: string, children: React.ReactNode, className?: string, delay: number}> = ({ title, children, className, delay }) => (
        <div 
            className={`bg-slate-900/70 border border-slate-800 rounded-xl shadow-2xl shadow-black/40 flex flex-col animate-fade-in-up transition-all duration-300 group hover:-translate-y-1 hover:border-[var(--gradient-end)]/50 ${className}`}
            style={{ animationDelay: `${delay}ms`, backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(128, 128, 128, 0.05), transparent 40%)'}}
        >
            <h3 className="font-semibold text-white/90 text-lg p-6 pb-4 flex-shrink-0">{title}</h3>
            <div className="flex-1 relative flex px-6 pb-6 pt-0">
                {children}
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
        <div className="flex-1 flex flex-col p-1">
            {isDemoData && (
                <div className="mb-6 bg-slate-800/60 border border-slate-700 rounded-lg p-4 flex items-center animate-fade-in-up">
                    <InfoIcon className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                    <p className="text-slate-300 text-sm">
                        <span className="font-bold text-white">Viewing Sample Data.</span> Start creating content and deploying agents to see your own insights here.
                    </p>
                </div>
            )}

            {/* KPI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                {data.kpis.map((kpi, index) => (
                    <KpiCard key={index} {...kpi} icon={kpiIcons[index]} delay={100 + index * 100} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Panel title="Generations by Type" delay={400} className="min-h-[400px]">
                    <BarChart data={data.performanceByType} />
                </Panel>
                
                <Panel title="Engagement Over Time (14d)" delay={500} className="min-h-[400px]">
                    <LineChart data={data.engagementOverTime} />
                </Panel>

                <Panel title="Agent Overview" delay={600} className="min-h-[400px]">
                    <AgentOverview data={data.agentStats} />
                </Panel>
                
                <Panel title="Most Used Tools" delay={700} className="min-h-[400px]">
                    <HorizontalBarChart data={data.mostUsedTools} />
                </Panel>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;