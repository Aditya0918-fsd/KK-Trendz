'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Download, Calendar, ShieldCheck, CheckCircle2, XCircle, Settings, Truck } from 'lucide-react';
import api from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';

export default function DailyReports() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        setLoading(true);
        api.get('/reports/daily', { params: { date } })
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [date]);

    // Chart data derived from API
    const productionChartData = [
        { name: 'Input', value: data?.production?.cuttingInput || 0, fill: '#6366f1' },
        { name: 'Output', value: data?.production?.stitchingOutput || 0, fill: '#10b981' },
        { name: 'Defects', value: data?.production?.defects || 0, fill: '#f43f5e' },
    ];

    const qualityPieData = [
        { name: 'Passed', value: data?.quality?.passed || 0 },
        { name: 'Rejected', value: data?.quality?.rejected || 0 },
    ];
    const QUALITY_COLORS = ['#10b981', '#f43f5e'];

    const passRate = data?.quality?.totalChecked
        ? Math.round((data.quality.passed / data.quality.totalChecked) * 100)
        : 0;

    const radialData = [{ name: 'Pass Rate', value: passRate, fill: '#10b981' }];

    if (loading) return (
        <DashboardLayout>
            <div className="flex h-screen items-center justify-center font-black animate-pulse text-indigo-500 uppercase tracking-[0.5em]">
                Compiling Daily Metrics...
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
                            DAILY <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">OPERATIONS REPORT</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.4em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700 block"></span>
                            Production • Quality • Dispatch
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="date"
                            className="bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-indigo-400"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase italic shadow-lg shadow-indigo-600/20">
                            <Download size={14} className="mr-2" /> Export PDF
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Production */}
                    <Card className="bg-slate-900 dark:bg-slate-800 border-none text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/30 transition-all duration-700" />
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 italic">
                                <Settings size={14} className="mr-2" /> Production Core
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                    {data?.production?.stitchingOutput || 0}
                                </span>
                                <span className="text-[14px] font-black uppercase text-slate-400 tracking-wider">PCs</span>
                            </div>
                            <div className="mt-4 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-700 pt-3">
                                <span>Input: {data?.production?.cuttingInput || 0}</span>
                                <span>Defects: <span className="text-rose-400">{data?.production?.defects || 0}</span></span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quality */}
                    <Card className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-emerald-400 hover:scale-[1.02] transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 italic">
                                <ShieldCheck size={14} className="mr-2" /> Quality Assurance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums">
                                        {data?.quality?.totalChecked || 0}
                                    </span>
                                    <span className="text-[14px] font-black uppercase text-slate-400 tracking-wider">Checked</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-emerald-500 tabular-nums leading-none">
                                        {passRate}%
                                    </p>
                                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest mt-1">Pass Rate</span>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-4 text-[9px] font-bold uppercase tracking-widest border-t border-slate-100 dark:border-slate-700 pt-3">
                                <span className="text-emerald-500 flex items-center"><CheckCircle2 size={10} className="mr-1" /> {data?.quality?.passed || 0}</span>
                                <span className="text-rose-500 flex items-center"><XCircle size={10} className="mr-1" /> {data?.quality?.rejected || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dispatch */}
                    <Card className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-amber-400 hover:scale-[1.02] transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 italic">
                                <Truck size={14} className="mr-2" /> Dispatch Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums">
                                    {data?.dispatches?.length || 0}
                                </span>
                                <span className="text-[14px] font-black uppercase text-slate-400 tracking-wider">Vehicles</span>
                            </div>
                            <div className="mt-4 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-slate-700 pt-3">
                                <span>Total Gross Wt: {data?.dispatches?.reduce((s: any, d: any) => s + (d.shippingDetails?.totalGrossWeight || 0), 0) || 0} KG</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Production Bar Chart */}
                    <Card className="md:col-span-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Production Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={productionChartData} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {productionChartData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Quality Pie Chart */}
                    <Card className="md:col-span-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Quality Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={qualityPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {qualityPieData.map((entry, index) => (
                                            <Cell key={index} fill={QUALITY_COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
                                    />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Pass Rate Radial */}
                    <Card className="md:col-span-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Pass Rate Gauge</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height={200}>
                                <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="90%"
                                    startAngle={180}
                                    endAngle={0}
                                    data={radialData}
                                >
                                    <RadialBar dataKey="value" cornerRadius={8} fill="#10b981" background={{ fill: '#f1f5f9' }} />
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 dark:fill-white" style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic' }}>
                                        {passRate}%
                                    </text>
                                    <text x="50%" y="62%" textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8', textTransform: 'uppercase', letterSpacing: 4 }}>
                                        Pass Rate
                                    </text>
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Dispatch Details Table */}
                <Card className="border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 italic">
                            Dispatch Breakdown
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                            <TableRow className="border-slate-200 dark:border-slate-700">
                                <TableHead className="text-[9px] font-black uppercase py-4 text-slate-500 dark:text-slate-400">Order Ref</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">Vehicle No</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">Pieces</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">Cartons</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">LR Number</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.dispatches?.map((d: any) => (
                                <TableRow key={d._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 border-slate-100 dark:border-slate-700">
                                    <TableCell className="text-[11px] font-black text-indigo-600 italic tracking-tighter">{d.orderId?.orderNumber || 'N/A'}</TableCell>
                                    <TableCell className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">{d.transporter?.vehicleNumber || 'N/A'}</TableCell>
                                    <TableCell className="text-[11px] font-black text-slate-800 dark:text-white">{d.shippingDetails?.totalPieces || 0}</TableCell>
                                    <TableCell className="text-[11px] font-black text-slate-800 dark:text-white">{d.shippingDetails?.totalCartons || 0}</TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-400">{d.documents?.lrNumber || 'Pending'}</TableCell>
                                </TableRow>
                            ))}
                            {(!data?.dispatches || data.dispatches.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                        No dispatches recorded for this date
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>

            </div>
        </DashboardLayout>
    );
}
