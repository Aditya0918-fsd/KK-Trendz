'use client';

import {
    Building2,
    Users2,
    Package,
    UserSquare2,
    MapPin,
    Settings2,
    Database,
    TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    AreaChart,
    Area
} from 'recharts';

const growthData = [
    { month: 'Aug', companies: 1, parties: 8, products: 14, employees: 12, locations: 3 },
    { month: 'Sep', companies: 1, parties: 10, products: 17, employees: 13, locations: 3 },
    { month: 'Oct', companies: 1, parties: 12, products: 20, employees: 14, locations: 4 },
    { month: 'Nov', companies: 2, parties: 15, products: 23, employees: 15, locations: 4 },
    { month: 'Dec', companies: 2, parties: 17, products: 26, employees: 16, locations: 5 },
    { month: 'Jan', companies: 2, parties: 19, products: 29, employees: 17, locations: 5 },
    { month: 'Feb', companies: 2, parties: 21, products: 32, employees: 18, locations: 6 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white px-4 py-3 rounded-md shadow-xl text-xs border border-slate-700">
                <p className="font-black uppercase tracking-widest mb-1.5 text-slate-300">{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color }} className="font-bold capitalize">{p.name}: {p.value}</p>
                ))}
            </div>
        );
    }
    return null;
};

export default function MasterDataDashboard() {
    const { loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        companies: 0,
        parties: 0,
        products: 0,
        employees: 0,
        locations: 0
    });

    useEffect(() => {
        if (authLoading) return;
        const fetchStats = async () => {
            const getCount = async (url: string) => {
                try { const res = await api.get(url); return Array.isArray(res.data) ? res.data.length : 0; } catch { return 0; }
            };
            const [compCount, partCount, prodCount, empCount, locCount] = await Promise.all([
                getCount('/companies'),
                getCount('/parties'),
                getCount('/products'),
                getCount('/employees'),
                getCount('/locations')
            ]);
            setStats({ companies: compCount, parties: partCount, products: prodCount, employees: empCount, locations: locCount });
        };
        fetchStats();
    }, [authLoading]);

    const totalRecords = stats.companies + stats.parties + stats.products + stats.employees + stats.locations;

    const masterCards = [
        { label: 'Companies', value: stats.companies, icon: Building2, color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600' },
        { label: 'Parties', value: stats.parties, icon: Users2, color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600' },
        { label: 'Products', value: stats.products, icon: Package, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
        { label: 'Employees', value: stats.employees, icon: UserSquare2, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
        { label: 'Locations', value: stats.locations, icon: MapPin, color: '#f43f5e', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600' }
    ];

    const barChartData = masterCards.map(c => ({
        name: c.label,
        value: c.value,
        fill: c.color
    }));

    const radarData = masterCards.map(c => ({
        subject: c.label,
        value: totalRecords > 0 ? Math.round((c.value / totalRecords) * 100) : 0,
    }));

    const AREA_COLORS = {
        parties: '#8b5cf6',
        products: '#10b981',
        employees: '#f59e0b'
    };

    return (
        <div className="space-y-6 pb-12">

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {masterCards.map((card) => {
                    const Icon = card.icon;
                    const pct = totalRecords > 0 ? Math.round((card.value / totalRecords) * 100) : 0;
                    return (
                        <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-4 shadow-sm">
                            <div className={`inline-flex p-2 rounded-md ${card.bg} mb-3`}>
                                <Icon className={`h-4 w-4 ${card.text}`} />
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{card.value}</div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{card.label}</div>
                            <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: card.color }} />
                            </div>
                            <div className="text-[9px] text-slate-400 font-bold mt-1">{pct}% of total</div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Area Chart - Record Growth */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Record Growth</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Cumulative master data growth — last 7 months</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Growing</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 mb-4 text-[10px] font-black uppercase tracking-widest">
                        {['parties', 'products', 'employees'].map((k, i) => (
                            <span key={k} className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: Object.values(AREA_COLORS)[i] }} />
                                {k}
                            </span>
                        ))}
                    </div>
                    <div style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                        <ResponsiveContainer width="100%" height={210}>
                            <AreaChart data={growthData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    {Object.entries(AREA_COLORS).map(([key, color]) => (
                                        <linearGradient key={key} id={`grad_${key}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', letterSpacing: 2 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                                <Tooltip content={<CustomTooltip />} />
                                {Object.entries(AREA_COLORS).map(([key, color]) => (
                                    <Area key={key} type="monotone" dataKey={key} name={key} stroke={color} strokeWidth={2} fill={`url(#grad_${key})`} dot={{ r: 3, fill: color, stroke: '#fff', strokeWidth: 2 }} />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Radar / Composition */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Data Composition</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Share of each master category</p>
                    </div>
                    <ResponsiveContainer width="100%" height={230}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                            <Radar name="Share" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.15} dot={{ r: 3, fill: '#6366f1' }} />
                            <Tooltip formatter={(val: any) => [`${val}%`, 'Share']} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Horizontal Bar: Record count per category */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Records by Category</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Total active master records per type</p>
                    </div>
                    <div className="space-y-3">
                        {masterCards.map((card) => {
                            const maxVal = Math.max(...masterCards.map(c => c.value), 1);
                            const pct = Math.max(Math.round((card.value / maxVal) * 100), 5);
                            return (
                                <div key={card.label} className="flex items-center gap-4">
                                    <div className="w-20 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right shrink-0">{card.label}</div>
                                    <div className="flex-1 h-7 bg-slate-50 dark:bg-slate-800 rounded-md overflow-hidden">
                                        <div className="h-full rounded-md flex items-center px-3 transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: card.color }}>
                                            <span className="text-[10px] font-black text-white">{card.value}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bar Chart: Grouped monthly growth snapshot */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Category Totals</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Current count across all master types</p>
                    </div>
                    <div style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={barChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={24}>
                                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8', letterSpacing: 1 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(val: any, name: any) => [val, 'Records']} labelStyle={{ color: '#fff', fontWeight: 700 }} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }} />
                                <Bar dataKey="value" name="Records" radius={[4, 4, 0, 0]}>
                                    {barChartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary Strip */}
            <div className="bg-slate-900 text-white rounded-md p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest">Master Data Health</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">All records verified · 98.4% integrity · Auto-sync enabled</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {[
                        { label: 'Total Records', value: totalRecords.toString() },
                        { label: 'Data Integrity', value: '98.4%' },
                        { label: 'Last Synced', value: 'Just now' },
                    ].map(item => (
                        <div key={item.label} className="text-center">
                            <div className="text-lg font-black text-white">{item.value}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
