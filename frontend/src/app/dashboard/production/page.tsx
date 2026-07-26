'use client';

import { useAuth } from '@/components/AuthProvider';
import {
    Scissors, Layers, Waves, Activity, Clock, CheckCircle2,
    BarChart2, Briefcase, Package, Zap, Calendar, TrendingUp, FilePlus, RefreshCw, AlertTriangle, AlertCircle
} from 'lucide-react';
import {
    AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';

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

export default function ProductionOverview() {
    const { loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        plans: 0,
        cutting: 0,
        stitching: 0,
        finishing: 0,
        qc: 0,
        jobCards: 0,
        activePlans: 0,
        totalCutPieces: 0,
        totalStitchedOutput: 0,
        avgStitchingEfficiency: 0,
        totalFinishedOutput: 0,
        totalFinishingDefects: 0,
        alerts: [] as any[],
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            const [statsRes, qcRes] = await Promise.all([
                api.get('/production/stats').catch(() => ({ data: {} })),
                api.get('/quality-control').catch(() => ({ data: [] })),
            ]);

            setStats(prev => ({
                ...prev,
                ...statsRes.data,
                qc: Array.isArray(qcRes.data) ? qcRes.data.length : 0,
            }));
        } catch (error) {
            console.error('Error fetching production stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchStats();
    }, [authLoading]);

    // Derive defect rate (finishing defects / finished output)
    const defectRate = stats.totalFinishedOutput > 0
        ? ((stats.totalFinishingDefects / stats.totalFinishedOutput) * 100).toFixed(2)
        : '0.00';

    // Derive efficiency from stitching data
    const efficiency = stats.avgStitchingEfficiency > 0 ? stats.avgStitchingEfficiency : '—';

    const efficiencySteps = [
        { label: 'Planning', value: stats.plans, color: 'bg-indigo-500' },
        { label: 'Cutting', value: stats.cutting, color: 'bg-violet-500' },
        { label: 'Stitching', value: stats.stitching, color: 'bg-emerald-500' },
        { label: 'Finishing', value: stats.finishing, color: 'bg-amber-500' },
        { label: 'QC Audit', value: stats.qc, color: 'bg-violet-600' },
    ];

    const maxVal = Math.max(...efficiencySteps.map(s => s.value), 1);

    // Build a simple trend from stage counts as throughput proxy
    const trendData = [
        { stage: 'Plans', count: stats.plans },
        { stage: 'Job Cards', count: stats.jobCards },
        { stage: 'Cutting', count: stats.cutting },
        { stage: 'Stitching', count: stats.stitching },
        { stage: 'Finishing', count: stats.finishing },
        { stage: 'QC', count: stats.qc },
    ];

    return (
        <div className="space-y-7">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                        Production Overview
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Live manufacturing stage metrics and floor efficiency.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={refreshing}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-md transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <Link href="/dashboard/production/plan">
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-sm transition-all flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> New Production Plan
                        </button>
                    </Link>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Pieces Finished',
                        value: loading ? '—' : stats.totalFinishedOutput.toLocaleString(),
                        sub: 'Total ironed output',
                        icon: Package,
                        color: '#6366f1'
                    },
                    {
                        label: 'Stitching Efficiency',
                        value: loading ? '—' : (stats.avgStitchingEfficiency > 0 ? `${stats.avgStitchingEfficiency}%` : 'No data'),
                        sub: 'Avg across all batches',
                        icon: Zap,
                        color: '#f59e0b'
                    },
                    {
                        label: 'Active Plans',
                        value: loading ? '—' : `${stats.activePlans}/${stats.plans}`,
                        sub: 'Approved + In Progress',
                        icon: Activity,
                        color: '#10b981'
                    },
                    {
                        label: 'Defect Rate',
                        value: loading ? '—' : `${defectRate}%`,
                        sub: 'Finishing stage rejects',
                        icon: TrendingUp,
                        color: '#f43f5e'
                    },
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
                {/* Pipeline Throughput */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Pipeline Throughput</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Active batches at each stage</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                            Live
                        </div>
                    </div>
                    <div style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '36px 36px' }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="stage" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8', letterSpacing: 1 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#actGrad)" dot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stage Distribution */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Stage Distribution</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Batches currently in process</p>
                    </div>

                    {/* Production Alerts */}
                    {stats.alerts.length > 0 && (
                        <div className="mb-8 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-1">Urgent Alerts</h4>
                            {stats.alerts.map((alert: any, idx: number) => (
                                <div key={idx} className={`p-3 rounded-md border flex items-start gap-3 ${alert.type === 'Delay' ? 'bg-amber-50/50 border-amber-100' : 'bg-rose-50/50 border-rose-100'}`}>
                                    {alert.type === 'Delay' ? <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5" />}
                                    <div>
                                        <p className={`text-[11px] font-black uppercase ${alert.type === 'Delay' ? 'text-amber-700' : 'text-rose-700'}`}>{alert.message}</p>
                                        <p className="text-[9px] font-medium text-slate-500">{format(new Date(alert.date), 'dd MMM yyyy')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4">
                        {efficiencySteps.map((step) => {
                            const pct = Math.max(Math.round((step.value / maxVal) * 100), step.value > 0 ? 10 : 0);
                            return (
                                <div key={step.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{step.label}</span>
                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{step.value} Batches</span>
                                    </div>
                                    <div className="h-6 bg-slate-50 dark:bg-slate-800 rounded-md overflow-hidden relative">
                                        <div
                                            className={`h-full ${step.color} transition-all duration-700 rounded-md`}
                                            style={{ width: `${pct}%` }}
                                        />
                                        {pct > 0 && (
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-white drop-shadow-sm">
                                                {pct}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <p className="text-xl font-black text-slate-900 dark:text-white">
                                    {stats.totalStitchedOutput > 0 ? `${stats.avgStitchingEfficiency}%` : '—'}
                                </p>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Avg Efficiency</p>
                            </div>
                            <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                            <div className="text-center">
                                <p className="text-xl font-black text-emerald-600">{stats.totalCutPieces.toLocaleString()}</p>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Cut Pieces</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Production Stages Navigation ── */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                    { label: 'PRODUCTION PLANNING', href: '/dashboard/production/plan', icon: Calendar, count: stats.plans, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    { label: 'JOB CARD / TECH SHEET', href: '/dashboard/production/job-card', icon: FilePlus, count: stats.jobCards, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    { label: 'CUTTING SECTION', href: '/dashboard/production/cutting', icon: Scissors, count: stats.cutting, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                    { label: 'STITCHING SECTION', href: '/dashboard/production/stitching', icon: Layers, count: stats.stitching, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'FINISHING PROCESS', href: '/dashboard/production/finishing', icon: Waves, count: stats.finishing, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    { label: 'QUALITY CONTROL', href: '/dashboard/quality-control', icon: CheckCircle2, count: stats.qc, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                ].map((tab) => (
                    <Link href={tab.href} key={tab.label} className="group">
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md p-4 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md ${tab.bg} group-hover:opacity-80 transition-all`}>
                                        <tab.icon className={`h-4 w-4 ${tab.color}`} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors text-ellipsis overflow-hidden whitespace-nowrap">
                                        {tab.label}
                                    </span>
                                </div>
                                <span className={`text-sm font-black ${tab.color}`}>{loading ? '—' : tab.count}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Summary Stats Footer ── */}
            <div className="bg-slate-900 text-white rounded-md p-5 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800 shadow-xl">
                <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-indigo-400" />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest">Production Pulse</p>
                        <p className="text-[10px] font-medium text-slate-400">Real-time monitoring of active batches across all production stages.</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {[
                        { label: 'Total Cut', value: stats.totalCutPieces.toLocaleString(), color: 'text-indigo-400' },
                        { label: 'Stitched Out', value: stats.totalStitchedOutput.toLocaleString(), color: 'text-emerald-400' },
                        { label: 'Finished', value: stats.totalFinishedOutput.toLocaleString(), color: 'text-amber-400' },
                        { label: 'Defects', value: stats.totalFinishingDefects.toLocaleString(), color: 'text-rose-400' },
                    ].map((s, i) => (
                        <div key={s.label} className="text-center">
                            <p className={`text-lg font-black ${s.color}`}>{loading ? '—' : s.value}</p>
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
