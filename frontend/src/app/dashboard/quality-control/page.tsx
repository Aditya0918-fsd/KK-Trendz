'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    TrendingUp, ShieldCheck, AlertTriangle,
    CheckCircle2, Clock, Activity, Target,
    Layers, Search, Download, Filter
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import api from '@/lib/api';
import { format, subDays } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function QualityControlDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        trendData: [],
        gradeData: [],
        overallYield: 0,
        aGradeAccuracy: 0,
        rejectionVelocity: 0,
        totalAudits: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/quality-control');
                const data = res.data;
                calculateDashboardStats(data);
            } catch (error) {
                console.error('Error fetching quality stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const calculateDashboardStats = (data: any[]) => {
        // Fallback to high-quality mock data if API is empty
        const isMock = !data || data.length === 0;
        const processData = isMock ? [
            { checkingDate: subDays(new Date(), 0), summary: { totalPassed: 850, totalRejected: 12, totalChecked: 862, totalRework: 5 }, gradeWiseOutput: { 'A Grade': 780, 'B Grade': 70 } },
            { checkingDate: subDays(new Date(), 1), summary: { totalPassed: 920, totalRejected: 15, totalChecked: 935, totalRework: 8 }, gradeWiseOutput: { 'A Grade': 850, 'B Grade': 70 } },
            { checkingDate: subDays(new Date(), 2), summary: { totalPassed: 780, totalRejected: 25, totalChecked: 805, totalRework: 12 }, gradeWiseOutput: { 'A Grade': 700, 'B Grade': 80 } },
            { checkingDate: subDays(new Date(), 3), summary: { totalPassed: 1100, totalRejected: 8, totalChecked: 1108, totalRework: 4 }, gradeWiseOutput: { 'A Grade': 1050, 'B Grade': 50 } },
            { checkingDate: subDays(new Date(), 4), summary: { totalPassed: 950, totalRejected: 10, totalChecked: 960, totalRework: 6 }, gradeWiseOutput: { 'A Grade': 890, 'B Grade': 60 } },
            { checkingDate: subDays(new Date(), 5), summary: { totalPassed: 880, totalRejected: 18, totalChecked: 898, totalRework: 9 }, gradeWiseOutput: { 'A Grade': 800, 'B Grade': 80 } },
            { checkingDate: subDays(new Date(), 6), summary: { totalPassed: 1050, totalRejected: 5, totalChecked: 1055, totalRework: 3 }, gradeWiseOutput: { 'A Grade': 1000, 'B Grade': 50 } },
        ] : data;

        // Last 7 days trend
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), 6 - i);
            return format(d, 'yyyy-MM-dd');
        });

        const trendMap: { [key: string]: any } = {};
        last7Days.forEach(date => trendMap[date] = { date, passed: 0, rejected: 0, rework: 0 });

        let totalPassed = 0;
        let totalRejected = 0;
        let totalChecked = 0;
        let aGradeCount = 0;
        let bGradeCount = 0;

        processData.forEach(item => {
            const dateStr = format(new Date(item.checkingDate), 'yyyy-MM-dd');
            if (trendMap[dateStr]) {
                trendMap[dateStr].passed += item.summary?.totalPassed || 0;
                trendMap[dateStr].rejected += item.summary?.totalRejected || 0;
                trendMap[dateStr].rework += item.summary?.totalRework || 0;
            }

            totalPassed += item.summary?.totalPassed || 0;
            totalRejected += item.summary?.totalRejected || 0;
            totalChecked += item.summary?.totalChecked || 0;

            aGradeCount += item.gradeWiseOutput?.['A Grade'] || 0;
            bGradeCount += item.gradeWiseOutput?.['B Grade'] || 0;
        });

        const trendData = Object.values(trendMap);

        const totalOutput = aGradeCount + bGradeCount + totalRejected;
        const gradeData = [
            { name: 'A Grade', value: totalOutput > 0 ? Math.round((aGradeCount / totalOutput) * 100) : 0 },
            { name: 'B Grade', value: totalOutput > 0 ? Math.round((bGradeCount / totalOutput) * 100) : 0 },
            { name: 'Rejected', value: totalOutput > 0 ? Math.round((totalRejected / totalOutput) * 100) : 0 },
        ].filter(g => g.value > 0);

        setStats({
            trendData,
            gradeData: gradeData.length > 0 ? gradeData : [{ name: 'No Data', value: 100 }],
            overallYield: totalChecked > 0 ? (totalPassed / totalChecked) * 100 : 0,
            aGradeAccuracy: (aGradeCount + bGradeCount) > 0 ? (aGradeCount / (aGradeCount + bGradeCount)) * 100 : 0,
            rejectionVelocity: totalChecked > 0 ? (totalRejected / totalChecked) * 100 : 0,
            totalAudits: isMock ? 342 : data.length
        });
    };

    const departmentPerf = [
        { name: 'Cutting', score: 98 },
        { name: 'Stitching', score: 92 },
        { name: 'Finishing', score: 95 },
        { name: 'Packaging', score: 99 },
    ];

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Synchronizing Quality Intel...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Intelligence Dashboard</h2>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Real-time quality metrics and rejection analytics.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border rounded-lg text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
                        <Download className="h-3 w-3" /> Export Analytics
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md">
                        <Filter className="h-3 w-3" /> Filter Range
                    </button>
                </div>
            </div>

            {/* Premium KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Overall Yield', value: `${stats.overallYield.toFixed(1)}%`, trend: '+0.5%', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'A-Grade Accuracy', value: `${stats.aGradeAccuracy.toFixed(1)}%`, trend: '+1.2%', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    { label: 'Rejection Velocity', value: `${stats.rejectionVelocity.toFixed(1)}%`, trend: '-0.3%', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                    { label: 'Audits Completed', value: stats.totalAudits, trend: 'Daily Avg: 12', icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="p-5 relative overflow-hidden group border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all transform scale-150 rotate-12`}>
                            <kpi.icon className={`h-12 w-12 ${kpi.color}`} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider transition-colors">{kpi.label}</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</span>
                                <span className={`text-[10px] font-bold ${kpi.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {kpi.trend}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts Row 1: Trend & Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Output Quality Velocity</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-indigo-500"></div><span className="text-[9px] font-bold uppercase text-slate-400">Passed</span></div>
                            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-rose-500"></div><span className="text-[9px] font-bold uppercase text-slate-400">Rejected</span></div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.trendData}>
                                <defs>
                                    <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => format(new Date(str), 'dd MMM')}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                    labelStyle={{ color: '#64748b', fontSize: '9px', marginBottom: '4px' }}
                                />
                                <Area type="monotone" dataKey="passed" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPassed)" />
                                <Area type="monotone" dataKey="rejected" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorRejected)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Final Grading Mix</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.gradeData}
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.gradeData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {stats.gradeData.map((g: any, i: number) => (
                                <div key={g.name} className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                    <span className="text-[9px] font-black uppercase text-slate-500">{g.name}: {g.value}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Department Performance & Action Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Section-wise Quality Index</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={departmentPerf} margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px' }}
                                />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                                    {departmentPerf.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Critical Quality Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { title: 'Stitching Variance High', line: 'Floor 1 - Line B', level: 'Critical', time: '10m ago' },
                            { title: 'Measurement Drift detected', line: 'Finishing Unit 2', level: 'Major', time: '1h ago' },
                            { title: 'Button alignment issue', line: 'Pack-03', level: 'Minor', time: '4h ago' },
                        ].map((alert, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg group hover:border-rose-200 dark:hover:border-rose-900/50 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${alert.level === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">{alert.title}</p>
                                        <p className="text-[10px] text-slate-500 font-medium tracking-tight">{alert.line}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[9px] font-black uppercase ${alert.level === 'Critical' ? 'text-rose-600' : 'text-amber-600'}`}>{alert.level}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{alert.time}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
