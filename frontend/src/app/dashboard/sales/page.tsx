'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/components/AuthProvider';
import {
    FileText, ShoppingCart, Users, TrendingUp, ArrowUpRight,
    ArrowDownRight, Activity, Clock, CheckCircle2, BarChart2,
    Briefcase, Package, Zap
} from 'lucide-react';
import {
    AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs shadow-lg">
                <p className="text-slate-400 font-semibold mb-0.5">{label}</p>
                <p className="text-white font-bold">{payload[0].value} Units</p>
            </div>
        );
    }
    return null;
};

export default function SalesOverview() {
    const { loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        enquiries: 0,
        quotations: 0,
        orders: 0,
        allocations: 0,
        convertedRate: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // In a real scenario, we'd have an endpoint for this
                // For now, let's fetch counts from the new collections
                const [enq, quot, ord, alloc] = await Promise.all([
                    api.get('/sales-enquiries').catch(() => ({ data: [] })),
                    api.get('/sales-quotations').catch(() => ({ data: [] })),
                    api.get('/sales-orders').catch(() => ({ data: [] })),
                    api.get('/order-allocations').catch(() => ({ data: [] })),
                ]);

                setStats({
                    enquiries: enq.data.length,
                    quotations: quot.data.length,
                    orders: ord.data.length,
                    allocations: alloc.data.length,
                    convertedRate: enq.data.length > 0 ? Math.round((ord.data.length / enq.data.length) * 100) : 0,
                });
            } catch (error) {
                console.error('Error fetching sales stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) fetchStats();
    }, [authLoading]);

    const salesTrendData = [
        { month: 'Aug', enquiries: 45, orders: 12 },
        { month: 'Sep', enquiries: 52, orders: 18 },
        { month: 'Oct', enquiries: 48, orders: 15 },
        { month: 'Nov', enquiries: 61, orders: 24 },
        { month: 'Dec', enquiries: 55, orders: 21 },
        { month: 'Jan', enquiries: 72, orders: 32 },
        { month: 'Feb', enquiries: 65, orders: 28 },
    ];

    const orderTypeData = [
        { name: 'Export', value: 40 },
        { name: 'Domestic', value: 45 },
        { name: 'Sample', value: 15 },
    ];

    const pipelineSteps = [
        { label: 'Enquiry', value: stats.enquiries, color: 'bg-indigo-500' },
        { label: 'Quotation', value: stats.quotations, color: 'bg-indigo-400' },
        { label: 'Sales Order', value: stats.orders, color: 'bg-emerald-500' },
        { label: 'Allocation', value: stats.allocations, color: 'bg-emerald-600' },
    ];

    const maxVal = Math.max(...pipelineSteps.map(s => s.value), 1);

    return (
        <div className="space-y-7">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                        Sales & Order Processing
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Manage enquiries, quotations, and live sales orders.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/sales/order">
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-sm transition-all flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" /> New Sales Order
                        </button>
                    </Link>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Enquiries', value: stats.enquiries, sub: '7 pending followup', icon: Activity, color: '#6366f1' },
                    { label: 'Quotations', value: stats.quotations, sub: '12 active quotes', icon: FileText, color: '#8b5cf6' },
                    { label: 'Orders (MTD)', value: stats.orders, sub: '₹2.8L revenue', icon: ShoppingCart, color: '#10b981' },
                    { label: 'Conv. Rate', value: `${stats.convertedRate}%`, sub: '+4% vs last mo.', icon: Zap, color: '#f59e0b' },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{kpi.label}</p>
                            <div className="rounded-md p-2" style={{ backgroundColor: kpi.color + '15' }}>
                                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{kpi.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Main Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Sales Velocity</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Enquiries vs Orders trend</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" />Enquiry</span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Order</span>
                        </div>
                    </div>
                    <div style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="enqGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', letterSpacing: 2 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="enquiries" stroke="#6366f1" strokeWidth={2.5} fill="url(#enqGrad)" dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2.5} fill="url(#ordGrad)" dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales Pipeline Funnel-like Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Sales Pipeline</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Stage-wise record counts</p>
                    </div>
                    <div className="space-y-4">
                        {pipelineSteps.map((step) => {
                            const pct = Math.max(Math.round((step.value / maxVal) * 100), 10);
                            return (
                                <div key={step.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{step.label}</span>
                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{step.value}</span>
                                    </div>
                                    <div className="h-6 bg-slate-50 dark:bg-slate-800 rounded-md overflow-hidden relative">
                                        <div
                                            className={`h-full ${step.color} transition-all duration-700 rounded-md`}
                                            style={{ width: `${pct}%` }}
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-white drop-shadow-sm">
                                            {pct}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <p className="text-xl font-black text-slate-900 dark:text-white">{stats.convertedRate}%</p>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Conv. Rate</p>
                            </div>
                            <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                            <div className="text-center">
                                <p className="text-xl font-black text-emerald-600">24.2d</p>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Avg Cycle Time</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sub Navigation Tabs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Enquiries', href: '/dashboard/sales/enquiry', icon: Activity, count: stats.enquiries, color: 'text-indigo-600 bubble-indigo' },
                    { label: 'Quotations', href: '/dashboard/sales/quotation', icon: FileText, count: stats.quotations, color: 'text-violet-600 bubble-violet' },
                    { label: 'Sales Orders', href: '/dashboard/sales/order', icon: ShoppingCart, count: stats.orders, color: 'text-emerald-600 bubble-emerald' },
                    { label: 'Allocations', href: '/dashboard/sales/allocation', icon: Zap, count: stats.allocations, color: 'text-amber-600 bubble-amber' },
                ].map((tab) => (
                    <Link href={tab.href} key={tab.label} className="group">
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-4 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md ${tab.color.split(' ')[1]} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                                        <tab.icon className={`h-4 w-4 ${tab.color.split(' ')[0]}`} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">
                                        {tab.label}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-500">{tab.count}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Status Strip ── */}
            <div className="bg-slate-900 text-white rounded-md p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-indigo-400" />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest">Active Sales Pipeline</p>
                        <p className="text-[10px] font-medium text-slate-400">Monitoring all stages from first enquiry to final order allocation.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-indigo-400">Pending Actions</p>
                        <p className="text-sm font-black">7 Follow-ups Due</p>
                    </div>
                    <div className="h-10 w-px bg-slate-800" />
                    <Link href="/dashboard/sales/enquiry">
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-md transition-all">
                            View Actions
                        </button>
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .bubble-indigo { background-color: rgba(99, 102, 241, 0.1); }
                .bubble-violet { background-color: rgba(139, 92, 246, 0.1); }
                .bubble-emerald { background-color: rgba(16, 185, 129, 0.1); }
                .bubble-amber { background-color: rgba(245, 158, 11, 0.1); }
            `}</style>
        </div>
    );
}
