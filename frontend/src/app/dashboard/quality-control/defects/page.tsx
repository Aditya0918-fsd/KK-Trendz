'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    AlertTriangle, ShieldAlert, BarChart3, TrendingDown,
    ArrowRight, Info, PieChart as PieIcon, Activity
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    ComposedChart, Line
} from 'recharts';
import api from '@/lib/api';
import { format } from 'date-fns';

const COLORS = ['#f43f5e', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#6366f1'];

export default function DefectAnalysisPage() {
    const [qualityChecks, setQualityChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({
        topDefects: [],
        totalRejections: 0,
        avgRejectionRate: 0,
        defectsByOrder: []
    });
    const [selectedDefect, setSelectedDefect] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/quality-control');
            const data = res.data;
            setQualityChecks(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        const isMock = !data || data.length === 0;
        const processData = isMock ? [
            {
                checkingId: 'CHK-MOCK-001',
                orderId: { orderNumber: 'SO-2024-001' },
                summary: { totalRejected: 15, totalChecked: 500 },
                rejectionAnalysis: [
                    { defectType: 'Stitching Open', quantity: 8, cause: 'Needle Tension High', action: 'Machine Calibrated' },
                    { defectType: 'Minor Stain', quantity: 7, cause: 'Fabric Storage', action: 'Cleaning Implemented' }
                ]
            },
            {
                checkingId: 'CHK-MOCK-002',
                orderId: { orderNumber: 'SO-2024-002' },
                summary: { totalRejected: 22, totalChecked: 450 },
                rejectionAnalysis: [
                    { defectType: 'Measurement Out', quantity: 12, cause: 'Inaccurate Cutting', action: 'Pattern Verified' },
                    { defectType: 'Stitching Open', quantity: 10, cause: 'Operator Fatigue', action: 'Shift Rotation' }
                ]
            },
            {
                checkingId: 'CHK-MOCK-003',
                orderId: { orderNumber: 'SO-2024-001' },
                summary: { totalRejected: 12, totalChecked: 600 },
                rejectionAnalysis: [
                    { defectType: 'Color Shade Mix', quantity: 9, cause: 'Sorting Error', action: 'Lighting Enhanced' },
                    { defectType: 'Broken Button', quantity: 3, cause: 'Low quality trim', action: 'Vendor Replaced' }
                ]
            }
        ] : data;

        if (isMock) setQualityChecks(processData);

        const defectCounts: { [key: string]: number } = {};
        let totalRejections = 0;
        let totalChecked = 0;
        const orderDefects: { [key: string]: number } = {};

        processData.forEach(check => {
            totalRejections += check.summary?.totalRejected || 0;
            totalChecked += check.summary?.totalChecked || 0;

            // Defect types from rejectionAnalysis
            (check.rejectionAnalysis || []).forEach((analysis: any) => {
                const type = analysis.defectType || 'Other';
                defectCounts[type] = (defectCounts[type] || 0) + (analysis.quantity || 0);
            });

            // Rejections by Order
            const orderNum = check.orderId?.orderNumber || 'N/A';
            orderDefects[orderNum] = (orderDefects[orderNum] || 0) + (check.summary?.totalRejected || 0);
        });

        const topDefects = Object.entries(defectCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const defectsByOrder = Object.entries(orderDefects)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        setStats({
            topDefects,
            totalRejections,
            avgRejectionRate: totalChecked > 0 ? (totalRejections / totalChecked) * 100 : 0,
            defectsByOrder
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLegendClick = (data: any) => {
        const name = data.value;
        if (selectedDefect === name) {
            setSelectedDefect(null);
        } else {
            setSelectedDefect(name);
        }
    };

    const handleRefresh = () => {
        setSelectedDefect(null);
        fetchData();
    };

    const pieData = selectedDefect
        ? stats.topDefects.filter((d: any) => d.name === selectedDefect)
        : stats.topDefects;

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Synchronizing Quality Intel...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Failure Pattern Analysis</h2>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Root cause detection and defect Pareto charts.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Activity className="h-3 w-3" /> Refresh Intel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-slate-100 dark:border-slate-800 shadow-sm bg-rose-50/30">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
                            <ShieldAlert className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-rose-600/70 tracking-widest">Total Defects Logged</p>
                            <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{stats.totalRejections} <span className="text-xs font-medium text-rose-400">PCS</span></p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                            <TrendingDown className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Mean Rejection Rate</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.avgRejectionRate.toFixed(2)}%</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Primary Defect Mode</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white uppercase truncate max-w-[150px]">{stats.topDefects[0]?.name || 'N/A'}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
                    <CardHeader className="border-b dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <PieIcon className="h-3 w-3" /> Defect Distribution (Pareto)
                        </CardTitle>
                        {selectedDefect && (
                            <button
                                onClick={() => setSelectedDefect(null)}
                                className="text-[9px] font-black uppercase text-indigo-600 hover:underline"
                            >
                                Reset Filter
                            </button>
                        )}
                    </CardHeader>
                    <CardContent className="h-[350px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry: any, index: number) => {
                                        // Find original index for color consistency
                                        const originalIndex = stats.topDefects.findIndex((d: any) => d.name === entry.name);
                                        return (
                                            <Cell key={`cell-${index}`} fill={COLORS[originalIndex % COLORS.length]} />
                                        );
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                                />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    onClick={handleLegendClick}
                                    wrapperStyle={{ cursor: 'pointer' }}
                                    formatter={(value) => (
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 transition-all ${selectedDefect && selectedDefect !== value ? 'opacity-30' : 'opacity-100 text-slate-700 dark:text-slate-300'}`}>
                                            {value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
                    <CardHeader className="border-b dark:border-slate-800 pb-4">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                            <BarChart3 className="h-3 w-3" /> Rejections by Sales Order
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.defectsByOrder} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Defect Remediation Log</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Defect Type</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Quantity</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Likely Cause</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Corrective Action</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Source Audit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {qualityChecks.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">No defect logs found</TableCell></TableRow>
                            ) : (
                                qualityChecks.flatMap(check =>
                                    (check.rejectionAnalysis || []).map((analysis: any, idx: number) => (
                                        <TableRow key={`${check._id || check.checkingId}-${idx}`} className="border-b transition-colors hover:bg-slate-50/50">
                                            <TableCell className="font-black text-rose-600 text-[11px] uppercase tracking-wider">{analysis.defectType}</TableCell>
                                            <TableCell className="font-bold text-slate-700 dark:text-slate-300">{analysis.quantity} PCS</TableCell>
                                            <TableCell className="text-xs text-slate-600 italic font-medium">{analysis.cause || '--'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1 w-1 rounded-full bg-emerald-500"></div>
                                                    <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter">{analysis.action || 'Investigation Pending'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{check.checkingId}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
