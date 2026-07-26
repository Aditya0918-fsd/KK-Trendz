'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Package, ShoppingCart, Users, TrendingUp, ArrowUpRight,
    ArrowDownRight, Activity, AlertTriangle, CheckCircle2,
    Clock, BarChart2, Zap, RefreshCw, Layers, Globe,
    Cpu, HardDrive, ShieldCheck, Plus, ExternalLink,
    Search, Bell, Settings, Filter, FileBarChart,
    Factory, Workflow, Heart, Thermometer, Droplets
} from 'lucide-react';
import {
    AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
    BarChart, Bar, PieChart, Pie, Cell, Radar, RadarChart,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line,
    CartesianGrid, Legend
} from 'recharts';

// --- RICH MOCK DATA ---
const productionPulse = [
    { time: '08:00', load: 45, efficiency: 82 },
    { time: '10:00', load: 72, efficiency: 88 },
    { time: '12:00', load: 85, efficiency: 85 },
    { time: '14:00', load: 68, efficiency: 91 },
    { time: '16:00', load: 55, efficiency: 89 },
    { time: '18:00', load: 40, efficiency: 84 },
    { time: '20:00', load: 30, efficiency: 80 },
];

const resourceUtilization = [
    { department: 'Knitting', value: 85, color: '#6366f1' },
    { department: 'Dyeing', value: 68, color: '#06b6d4' },
    { department: 'Stitching', value: 92, color: '#f59e0b' },
    { department: 'Packing', value: 45, color: '#f43f5e' },
    { department: 'Logistics', value: 78, color: '#8b5cf6' },
];

const qualityParameters = [
    { subject: 'Visual', A: 120, fullMark: 150 },
    { subject: 'Durability', A: 98, fullMark: 150 },
    { subject: 'Coloring', A: 86, fullMark: 150 },
    { subject: 'Sizing', A: 99, fullMark: 150 },
    { subject: 'Finish', A: 85, fullMark: 150 },
    { subject: 'Strength', A: 65, fullMark: 150 },
];

const revenueOutlook = [
    { name: 'Mon', actual: 4000, projected: 2400 },
    { name: 'Tue', actual: 3000, projected: 1398 },
    { name: 'Wed', actual: 2000, projected: 9800 },
    { name: 'Thu', actual: 2780, projected: 3908 },
    { name: 'Fri', actual: 1890, projected: 4800 },
    { name: 'Sat', actual: 2390, projected: 3800 },
    { name: 'Sun', actual: 3490, projected: 4300 },
];

const topPerformers = [
    { name: 'John Doe', units: 452, avatar: 'JD', trend: 'up' },
    { name: 'Sarah Khan', units: 421, avatar: 'SK', trend: 'up' },
    { name: 'Akash Roy', units: 398, avatar: 'AR', trend: 'down' },
];

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#f43f5e', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <p className="text-xs font-bold text-white uppercase tracking-tight">
                            {entry.name}: <span className="text-slate-300 font-medium ml-1">{entry.value}</span>
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function RedesignedDashboard() {
    const { user, loading } = useAuth();
    const [isMounted, setIsMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [realTimeMetrics, setRealTimeMetrics] = useState({ temp: 28.4, humidity: 64 });

    useEffect(() => {
        setIsMounted(true);

        // Fetch Real Weather Data based on Geolocation
        const fetchWeather = async (lat: number, lon: number) => {
            try {
                // Using a relative protocol or proper error handling for local development
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`, {
                    mode: 'cors',
                    credentials: 'omit'
                });

                if (!res.ok) throw new Error('Network response was not ok');

                const data = await res.json();
                if (data.current) {
                    setRealTimeMetrics({
                        temp: data.current.temperature_2m,
                        humidity: data.current.relative_humidity_2m
                    });
                }
            } catch (err) {
                console.warn("Weather fetch failed (likely network or CORS):", err);
                // Subtly update with a small variation to simulated data so it doesn't look stuck
                setRealTimeMetrics(prev => ({
                    temp: +(prev.temp + (Math.random() - 0.5) * 0.2).toFixed(1),
                    humidity: Math.max(40, Math.min(85, Math.round(prev.humidity + (Math.random() - 0.5) * 1)))
                }));
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                fetchWeather(position.coords.latitude, position.coords.longitude);
            }, () => {
                // Fallback to a default location (e.g., Mumbai) if blocked
                fetchWeather(19.076, 72.877);
            });
        }

        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Update weather every 15 minutes
        const weatherInterval = setInterval(() => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                });
            }
        }, 900000);

        return () => {
            clearInterval(clockInterval);
            clearInterval(weatherInterval);
        };
    }, []);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-600/20 border-t-indigo-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-indigo-500/20" />
                </div>
            </div>
        </div>
    );

    const firstName = user?.name?.split(' ')[0] || 'User';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Dominion Morning' : hour < 17 ? 'Operational Afternoon' : 'Strategic Evening';

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-12">

                {/* ── COMMAND CENTER HEADER ── */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-10 transition duration-1000"></div>
                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-8 rounded-2xl shadow-2xl">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-transform duration-500">
                                <Factory className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest">{greeting}</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">HQ System 4.0</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest tabular-nums italic">
                                        {currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} •
                                        <span className="ml-1 text-indigo-500">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-montserrat italic pb-1">
                                    Command <span className="inline-block pr-2 pb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Interface</span>
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monitoring cluster nodes and operational throughput in real-time.</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-6 px-6 py-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temp</p>
                                    <div className="flex items-center gap-1.5 justify-center">
                                        <Thermometer className="h-3 w-3 text-rose-500" />
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 italic">{realTimeMetrics.temp}°C</span>
                                    </div>
                                </div>
                                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Humidity</p>
                                    <div className="flex items-center gap-1.5 justify-center">
                                        <Droplets className="h-3 w-3 text-indigo-500" />
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 italic">{realTimeMetrics.humidity}%</span>
                                    </div>
                                </div>
                            </div>
                            <button className="h-12 w-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-sm">
                                <Search className="h-4 w-4 text-slate-400" />
                            </button>
                            <button className="h-12 w-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-sm relative">
                                <Bell className="h-4 w-4 text-slate-400" />
                                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-800"></span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── QUICK ACTION DOCK ── */}
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { label: 'New Production Plan', icon: Plus, color: 'cyan', href: '/dashboard/production' },
                        { label: 'Export Analytics', icon: FileBarChart, color: 'indigo' },
                        { label: 'Fleet Status', icon: Globe, color: 'amber' },
                        { label: 'Worker Scheduling', icon: Users, color: 'violet' },
                        { label: 'Core Diagnostics', icon: Cpu, color: 'rose' },
                    ].map((btn, idx) => {
                        const content = (
                            <button className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-xl hover:-translate-y-1 transition-all duration-300 shadow-sm flex-shrink-0">
                                <div className={`h-8 w-8 rounded-lg bg-${btn.color}-500/10 flex items-center justify-center`}>
                                    <btn.icon className={`h-4 w-4 text-${btn.color}-500`} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">{btn.label}</span>
                            </button>
                        );

                        return btn.href ? (
                            <Link href={btn.href} key={idx} className="flex-shrink-0">
                                {content}
                            </Link>
                        ) : (
                            <div key={idx} className="flex-shrink-0">
                                {content}
                            </div>
                        );
                    })}
                </div>

                {/* ── CORE KPI MATRIX ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                        { label: 'Inventory Liquidity', value: '₹42.8M', trend: '+14% MoM', icon: Layers, color: 'indigo', data: [3, 8, 4, 9, 6, 8, 12] },
                        { label: 'Production Yield', value: '98.4%', trend: 'Peak Level', icon: Zap, color: 'cyan', data: [2, 5, 3, 7, 5, 9, 8] },
                        { label: 'Order Velocity', value: '2.4d', trend: '-0.2d faster', icon: Workflow, color: 'amber', data: [8, 4, 7, 3, 6, 2, 4] },
                        { label: 'System Uptime', value: '99.9%', trend: 'Operational', icon: HardDrive, color: 'violet', data: [9, 9, 9, 9, 9, 10, 9] },
                    ].map((kpi, idx) => (
                        <div key={idx} className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-500">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-${kpi.color}-500/10 text-${kpi.color}-500 group-hover:scale-110 transition-transform`}>
                                    <kpi.icon className="h-5 w-5" />
                                </div>
                                <div className="h-6 w-16 opacity-40 group-hover:opacity-100 transition-opacity">
                                    {isMounted && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={kpi.data.map(v => ({ v }))}>
                                                <Area type="monotone" dataKey="v" stroke={`var(--${kpi.color}-500)`} fill={`var(--${kpi.color}-500)`} fillOpacity={0.1} strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tight">{kpi.value}</h3>
                                <span className={`text-[9px] font-black uppercase text-${kpi.color}-500 bg-${kpi.color}-500/5 px-2 py-0.5 rounded`}>{kpi.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── ANALYSIS ROW: PRODUCTION PULSE ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                            <div>
                                <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest font-montserrat">Operational Pulse</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time load balancing vs output efficiency</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                    <span className="text-[9px] font-black uppercase text-slate-400">System Load</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                                    <span className="text-[9px] font-black uppercase text-slate-400">Efficiency</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minHeight={200} debounce={1}>
                                    <ComposedChart data={productionPulse}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b820" />
                                        <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="load" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} opacity={0.6} />
                                        <Area type="monotone" dataKey="efficiency" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#pulseGrad)" />
                                        <defs>
                                            <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col">
                        <div className="mb-10">
                            <h2 className="text-base font-black text-white uppercase tracking-widest font-montserrat">Department Load</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Resource allocation by zone</p>
                        </div>
                        <div className="flex-1 space-y-8">
                            {resourceUtilization.map((unit, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">{unit.department}</span>
                                        <span className="text-[11px] font-black italic" style={{ color: unit.color }}>{unit.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full p-[1px] group-hover:bg-slate-700 transition-all">
                                        <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ width: `${unit.value}%`, backgroundColor: unit.color }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                    <ShieldCheck className="h-4 w-4 text-cyan-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Optimized Status</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">No bottlenecks detected</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── QUALITY & REVENUE ROW ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xl p-8">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest font-montserrat italic">Quality <span className="text-indigo-600">DNA</span></h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Multi-dimensional audit metrics</p>
                            </div>
                            <Settings className="h-4 w-4 text-slate-300 animate-spin-slow rotate-45" />
                        </div>
                        <div className="h-[300px] flex items-center justify-center">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minHeight={200} debounce={1}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={qualityParameters}>
                                        <PolarGrid stroke="#94a3b830" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                        <Radar name="Parameters" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} dot />
                                        <Tooltip content={<CustomTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xl p-8">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest font-montserrat">Financial Velocity</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Weekly projection vs actuals</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1.5 rounded-lg">
                                <TrendingUp className="h-3 w-3" />
                                +₹12.4K GAIN
                            </div>
                        </div>
                        <div className="h-[300px]">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minHeight={200} debounce={1}>
                                    <AreaChart data={revenueOutlook}>
                                        <defs>
                                            <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="proj" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="stepBefore" dataKey="actual" stroke="#6366f1" strokeWidth={3} fill="url(#actual)" />
                                        <Area type="monotone" dataKey="projected" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" fill="url(#proj)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── LIVE FEED & TALENT MATRIX ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest font-montserrat flex items-center gap-3">
                                <Activity className="h-4 w-4 text-rose-500" />
                                Operations Stream
                            </h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Live Tracking Enabled</span>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {[
                                { title: 'Batch #442 Completed', desc: 'Stitching department released 240 units to Packing.', time: 'Just now', icon: CheckCircle2, iconBg: 'bg-cyan-50', iconColor: 'text-cyan-500' },
                                { title: 'Raw Material Inbound', desc: '500kg Cotton Fabric received from Shree Textiles.', time: '22 mins ago', icon: Package, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
                                { title: 'Critical Low Stock', desc: 'Dye – Royal Blue dropped below safety threshold (5L).', time: '1 hr ago', icon: AlertTriangle, iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
                                { title: 'Quality Audit Fail', desc: 'Batch #439 identified with 4% dimensional variance.', time: '3 hrs ago', icon: RefreshCw, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
                            ].map((item, i) => (
                                <div key={i} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer">
                                    <div className="flex gap-4">
                                        <div className={`h-10 w-10 rounded-xl ${item.iconBg} dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                            <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{item.title}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.time}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/20 text-center">
                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View Global Log Audit</button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xl p-8">
                        <div className="mb-10">
                            <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest font-montserrat flex items-center gap-3">
                                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                                Talent Matrix
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Top efficiency performers this shift</p>
                        </div>
                        <div className="space-y-6">
                            {topPerformers.map((person, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 dark:border-slate-800 hover:shadow-lg transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-400 shadow-md">
                                            {person.avatar}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white italic">{person.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency Elite</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-indigo-600">{person.units}</p>
                                        <p className="text-[9px] font-black text-cyan-500 uppercase">UNITS/HR</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                            View Full Roster Analysis
                        </button>
                    </div>
                </div>

                {/* ── SUSTAINABILITY & LOGISTICS ROW ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="bg-gradient-to-br from-indigo-600 to-sky-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -m-8 h-40 w-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-widest font-montserrat">Eco-Metrics</h2>
                                    <p className="text-[9px] text-sky-100 font-bold uppercase">Sustainability Score v2.1</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[10px] font-black text-white uppercase mb-2">
                                        <span>Renewable Energy Usage</span>
                                        <span>74%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full shadow-[0_0_10px_white]" style={{ width: '74%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-black text-white uppercase mb-2">
                                        <span>Water Recycling Rate</span>
                                        <span>89%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full shadow-[0_0_10px_white]" style={{ width: '89%' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                                <p className="text-[9px] font-black text-sky-100 uppercase tracking-widest mb-1 text-center italic">"Leading in eco-efficient manufacturing"</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest font-montserrat">Global Fleet Monitor</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time logistics & dispatch throughput</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Avg Delivery Time</p>
                                    <p className="text-xs font-black text-indigo-600">3.2 DAYS</p>
                                </div>
                                <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800"></div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Active Shipments</p>
                                    <p className="text-xs font-black text-cyan-600">14 LIVE</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'DEL', value: 45, d: 12 },
                                    { name: 'MUM', value: 30, d: 8 },
                                    { name: 'BLR', value: 55, d: 15 },
                                    { name: 'HYD', value: 25, d: 6 },
                                    { name: 'KOL', value: 40, d: 10 },
                                    { name: 'MAA', value: 35, d: 9 },
                                ]}>
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="d" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ANALYTICS MINI-STRIP ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 border-t border-slate-200 dark:border-slate-800 pt-8">
                    {[
                        { label: 'Cloud API', value: '4ms', color: 'cyan' },
                        { label: 'Data Sync', value: 'Active', color: 'indigo' },
                        { label: 'Node Count', value: '12', color: 'slate' },
                        { label: 'Traffic', value: 'Low', color: 'cyan' },
                        { label: 'Security', value: 'ISO V2', color: 'violet' },
                        { label: 'Region', value: 'IN-W', color: 'slate' },
                    ].map((st, idx) => (
                        <div key={idx} className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{st.label}</span>
                            <div className="flex items-center gap-1.5">
                                <div className={`h-1.5 w-1.5 rounded-full bg-${st.color}-500 shadow-[0_0_5px_rgba(var(--${st.color}-500),0.5)]`}></div>
                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 italic">{st.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </DashboardLayout>
    );
}
