'use client';

import { Card, CardContent } from '@/components/ui/Card';
import {
    TrendingUp,
    Factory,
    Package,
    CheckCircle2,
    AlertCircle,
    Clock,
    IndianRupee
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line
} from 'recharts';

const monthlyJobData = [
    { month: 'Aug', orders: 3, issued: 3, received: 2 },
    { month: 'Sep', orders: 5, issued: 5, received: 4 },
    { month: 'Oct', orders: 4, issued: 4, received: 4 },
    { month: 'Nov', orders: 7, issued: 6, received: 5 },
    { month: 'Dec', orders: 6, issued: 6, received: 6 },
    { month: 'Jan', orders: 9, issued: 8, received: 7 },
    { month: 'Feb', orders: 8, issued: 7, received: 6 },
];

const processTypeData = [
    { process: 'Knitting', quantity: 4200 },
    { process: 'Dyeing', quantity: 3100 },
    { process: 'Finishing', quantity: 2400 },
    { process: 'Printing', quantity: 1800 },
    { process: 'Embroidery', quantity: 950 },
];

const workerEfficiencyData = [
    { week: 'W1', efficiency: 82, wastage: 4.2 },
    { week: 'W2', efficiency: 87, wastage: 3.8 },
    { week: 'W3', efficiency: 79, wastage: 5.1 },
    { week: 'W4', efficiency: 93, wastage: 2.9 },
    { week: 'W5', efficiency: 91, wastage: 3.1 },
    { week: 'W6', efficiency: 88, wastage: 3.5 },
    { week: 'W7', efficiency: 95, wastage: 2.5 },
];

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];

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

export default function JobWorkDashboard() {
    const { loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        activeOrders: 0,
        pendingIssues: 0,
        recentReceipts: 0,
        outForProcessing: 0
    });

    useEffect(() => {
        if (authLoading) return;
        const fetchStats = async () => {
            const getCount = async (url: string) => {
                try { const res = await api.get(url); return Array.isArray(res.data) ? res.data.length : 0; } catch { return 0; }
            };
            const [ordCount, issCount, recCount] = await Promise.all([
                getCount('/job-work/orders'),
                getCount('/job-work/issues'),
                getCount('/job-work/receipts')
            ]);
            setStats({ activeOrders: ordCount, pendingIssues: issCount, recentReceipts: recCount, outForProcessing: Math.max(ordCount - recCount, 0) });
        };
        fetchStats();
    }, [authLoading]);

    const kpiCards = [
        { label: 'Job Orders', value: stats.activeOrders, icon: Factory, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', sub: 'Total raised' },
        { label: 'Material Issues', value: stats.pendingIssues, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', sub: 'Dispatched' },
        { label: 'Work Receipts', value: stats.recentReceipts, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', sub: 'Goods received' },
        { label: 'Out for Processing', value: stats.outForProcessing, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', sub: 'Awaiting receipt' },
    ];

    const maxQty = Math.max(...processTypeData.map(d => d.quantity));

    return (
        <div className="space-y-6 pb-12">

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpiCards.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-md ${kpi.bg}`}>
                                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{kpi.value}</div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.sub}</div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Area Chart – Monthly Workflow */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Job Work Flow</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Orders issued vs. received — last 7 months</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />Ordered</span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />Issued</span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Received</span>
                        </div>
                    </div>
                    <div style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={monthlyJobData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="issuedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', letterSpacing: 2 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="orders" name="orders" stroke="#6366f1" strokeWidth={2} fill="url(#ordersGrad)" dot={{ r: 3, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="issued" name="issued" stroke="#f59e0b" strokeWidth={2} fill="url(#issuedGrad)" dot={{ r: 3, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="received" name="received" stroke="#10b981" strokeWidth={2} fill="url(#receivedGrad)" dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Horizontal Bar – Process Type Volume */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">By Process Type</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Total quantity (Kgs) processed</p>
                    </div>
                    <div className="space-y-4">
                        {processTypeData.map((item, i) => {
                            const pct = Math.round((item.quantity / maxQty) * 100);
                            return (
                                <div key={item.process}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.process}</span>
                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{item.quantity.toLocaleString()} kg</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Worker Efficiency Line Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Worker Efficiency</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Weekly yield & wastage trend (%)</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Efficiency</span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />Wastage</span>
                        </div>
                    </div>
                    <div style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                        <ResponsiveContainer width="100%" height={190}>
                            <LineChart data={workerEfficiencyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>

                                <XAxis dataKey="week" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', letterSpacing: 2 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="efficiency" name="Efficiency" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="wastage" name="Wastage" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Orders Bar Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Orders Per Month</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Volume of job work orders — last 7 months</p>
                    </div>
                    <div style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                        <ResponsiveContainer width="100%" height={190}>
                            <BarChart data={monthlyJobData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={22}>
                                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', letterSpacing: 2 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="orders" name="orders" radius={[4, 4, 0, 0]}>
                                    {monthlyJobData.map((_, i) => (
                                        <Cell key={i} fill={i === monthlyJobData.length - 1 ? '#6366f1' : '#e0e7ff'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Status Strip */}
            <div className="bg-slate-900 text-white rounded-md p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Factory className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest">Production Health</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Avg. processing time: 5 days · Wastage avg: 3.4% · Efficiency: 90.7%</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {[
                        { label: 'Total Processed', value: '12.5T' },
                        { label: 'Avg Yield', value: '96.6%' },
                        { label: 'Active Workers', value: '8' },
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
