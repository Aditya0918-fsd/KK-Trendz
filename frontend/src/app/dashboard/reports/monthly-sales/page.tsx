'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Download, Briefcase } from 'lucide-react';
import api from '@/lib/api';

export default function MonthlySalesReport() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        setLoading(true);
        api.get('/reports/monthly-sales', { params: { month, year } })
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [month, year]);

    if (loading) return (
        <DashboardLayout>
            <div className="flex h-screen items-center justify-center font-black animate-pulse text-rose-500 uppercase tracking-[0.5em]">
                Aggregating Sales Data...
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                            MONTHLY <span className="text-rose-500">SALES REPORT</span>
                        </h1>
                        <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest mt-2">
                            Revenue Summary • Customer Wise
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            className="bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 border border-slate-200 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-rose-400"
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                        >
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            className="bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 border border-slate-200 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-rose-400"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                        >
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <Button className="bg-rose-600 hover:bg-rose-700 text-sm font-semibold shadow-lg shadow-rose-600/20 px-4 py-2">
                            <Download size={15} className="mr-2" /> Export PDF
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-900 dark:bg-slate-800 border-none text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all duration-700" />
                        <CardHeader className="pb-1 pt-5 px-6">
                            <CardTitle className="text-sm font-semibold text-slate-400">
                                Total Orders
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-5">
                            <p className="text-5xl font-bold mt-1">{data?.summary?.totalOrders || 0}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-rose-600 border-none text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
                        <CardHeader className="pb-1 pt-5 px-6">
                            <CardTitle className="text-sm font-semibold text-rose-200">
                                Total Value (₹)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-5">
                            <p className="text-5xl font-bold mt-1">₹{(data?.summary?.totalValue || 0).toLocaleString()}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-emerald-200 hover:scale-[1.02] transition-all">
                        <CardHeader className="pb-1 pt-5 px-6">
                            <CardTitle className="text-sm font-semibold text-emerald-600">
                                Average Order Value
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-5">
                            <p className="text-5xl font-bold mt-1 text-emerald-500">
                                ₹{Math.round(data?.summary?.avgValue || 0).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Customer Wise Details */}
                <Card className="border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 italic">
                                Customer Wise Revenue
                            </CardTitle>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {data?.period}
                            </span>
                        </div>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                            <TableRow className="border-slate-200 dark:border-slate-700">
                                <TableHead className="text-[9px] font-black uppercase py-4 text-slate-500 dark:text-slate-400">Customer Name</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-right text-slate-500 dark:text-slate-400">Orders</TableHead>
                                <TableHead className="text-[9px] font-black uppercase text-right text-slate-500 dark:text-slate-400">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.customerWise?.map((c: any) => (
                                <TableRow key={c._id} className="hover:bg-rose-50/30 dark:hover:bg-rose-900/10 border-slate-100 dark:border-slate-700 group">
                                    <TableCell className="text-[11px] font-black text-rose-600 uppercase tracking-tighter">{c.customerName}</TableCell>
                                    <TableCell className="text-[11px] font-bold text-right text-slate-500 dark:text-slate-400">{c.orderCount}</TableCell>
                                    <TableCell className="text-[11px] font-black text-right italic text-slate-800 dark:text-white group-hover:text-rose-600">
                                        ₹{c.totalValue.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!data?.customerWise || data.customerWise.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                        No orders found for this month
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
