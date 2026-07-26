'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    TrendingUp,
    TrendingDown,
    IndianRupee,
    ClipboardList,
    ShoppingCart,
    Truck,
    Receipt,
    FileText,
    AlertCircle,
    CheckCircle2
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
    Legend,
    Cell
} from 'recharts';

const monthlySpendData = [
    { month: 'Aug', spend: 182000, orders: 4 },
    { month: 'Sep', spend: 245000, orders: 6 },
    { month: 'Oct', spend: 198000, orders: 5 },
    { month: 'Nov', spend: 312000, orders: 8 },
    { month: 'Dec', spend: 278000, orders: 7 },
    { month: 'Jan', spend: 356000, orders: 9 },
    { month: 'Feb', spend: 291000, orders: 7 },
];

const categorySpendData = [
    { category: 'Raw Fabric', amount: 520000 },
    { category: 'Chemicals', amount: 215000 },
    { category: 'Packaging', amount: 142000 },
    { category: 'Accessories', amount: 98000 },
    { category: 'Machinery', amount: 75000 },
];

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white px-4 py-3 rounded-md shadow-xl text-xs border border-slate-700">
                <p className="font-black uppercase tracking-widest mb-1 text-slate-300">{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color }} className="font-bold">
                        {p.name === 'spend' ? `₹${p.value.toLocaleString()}` : `${p.value} orders`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white px-4 py-3 rounded-md shadow-xl text-xs border border-slate-700">
                <p className="font-black uppercase tracking-widest mb-1 text-slate-300">{label}</p>
                <p className="font-bold text-indigo-300">₹{payload[0].value.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

export default function ProcurementDashboard() {
    const { loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        enquiries: 0,
        quotations: 0,
        orders: 0,
        grns: 0,
        invoices: 0
    });

    useEffect(() => {
        if (authLoading) return;
        const fetchStats = async () => {
            const getCount = async (url: string) => {
                try {
                    const res = await api.get(url);
                    return Array.isArray(res.data) ? res.data.length : 0;
                } catch { return 0; }
            };
            const [enqCount, quotCount, ordCount, grnCount, invCount] = await Promise.all([
                getCount('/purchase-enquiries'),
                getCount('/purchase-quotations'),
                getCount('/purchase-orders'),
                getCount('/grns'),
                getCount('/purchase-invoices')
            ]);
            setStats({ enquiries: enqCount, quotations: quotCount, orders: ordCount, grns: grnCount, invoices: invCount });
        };
        fetchStats();
    }, [authLoading]);

    const kpiCards = [
        { label: 'Open Enquiries', value: stats.enquiries, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', trend: '+2 this week' },
        { label: 'Quotations Received', value: stats.quotations, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', trend: 'Awaiting review' },
        { label: 'Purchase Orders', value: stats.orders, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: '3 pending delivery' },
        { label: 'GRN Entries', value: stats.grns, icon: Truck, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', trend: 'All verified' },
        { label: 'Invoices', value: stats.invoices, icon: Receipt, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', trend: '2 due this week' },
    ];

    const pipelineSteps = [
        { label: 'Enquiry', value: stats.enquiries, color: 'bg-blue-500' },
        { label: 'Quotation', value: stats.quotations, color: 'bg-amber-500' },
        { label: 'PO', value: stats.orders, color: 'bg-emerald-500' },
        { label: 'GRN', value: stats.grns, color: 'bg-violet-500' },
        { label: 'Invoice', value: stats.invoices, color: 'bg-rose-500' },
    ];
    const maxPipeline = Math.max(...pipelineSteps.map(s => s.value), 1);

    return (
        <div className="space-y-6 pb-12">

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {kpiCards.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-md ${kpi.bg}`}>
                                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{kpi.value}</div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.trend}</div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Area Chart – Monthly Spend Trend */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Monthly Spend Trend</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Total procurement spend — last 7 months</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">+18% MoM</span>
                        </div>
                    </div>
                    <div style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={monthlySpendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', letterSpacing: 2 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="spend" name="spend" stroke="#6366f1" strokeWidth={2.5} fill="url(#spendGradient)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Horizontal Bar Chart – Spend by Category */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Spend by Category</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">FY 2025–26 category breakdown</p>
                    </div>
                    <div className="space-y-4">
                        {categorySpendData.map((item, i) => {
                            const pct = Math.round((item.amount / categorySpendData[0].amount) * 100);
                            return (
                                <div key={item.category}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.category}</span>
                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">₹{(item.amount / 1000).toFixed(0)}k</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, backgroundColor: COLORS[i] }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Procurement Pipeline Funnel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Procurement Pipeline</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Live document count at each stage</p>
                    </div>
                    <div className="space-y-3">
                        {pipelineSteps.map((step) => {
                            const pct = Math.max(Math.round((step.value / maxPipeline) * 100), 5);
                            return (
                                <div key={step.label} className="flex items-center gap-4">
                                    <div className="w-20 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right shrink-0">{step.label}</div>
                                    <div className="flex-1 h-7 bg-slate-50 dark:bg-slate-800 rounded-md overflow-hidden">
                                        <div className={`h-full ${step.color} rounded-md flex items-center px-3 transition-all duration-700`} style={{ width: `${pct}%` }}>
                                            <span className="text-[10px] font-black text-white">{step.value}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Value Bar Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Orders Per Month</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Volume of purchase orders raised</p>
                        </div>
                    </div>
                    <div style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={monthlySpendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={20}>
                                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', letterSpacing: 2 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="orders" name="orders" radius={[4, 4, 0, 0]}>
                                    {monthlySpendData.map((_, i) => (
                                        <Cell key={i} fill={i === monthlySpendData.length - 1 ? '#6366f1' : '#e0e7ff'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Status Summary Strip */}
            <div className="bg-slate-900 text-white rounded-md p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest">Procurement Health</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Avg. cycle time: 12 days · On-time delivery: 87% · 2 invoices due</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {[
                        { label: 'Total Spend (YTD)', value: '₹18.6L' },
                        { label: 'Active Vendors', value: '14' },
                        { label: 'Avg PO Value', value: '₹32.4k' },
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
