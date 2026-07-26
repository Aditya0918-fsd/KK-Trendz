'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Package, Download, TrendingUp, TrendingDown, BarChart2, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function InventoryReport() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );

    const fetchData = () => {
        setLoading(true);
        api.get('/reports/inventory', { params: { startDate } })
            .then(r => setData(Array.isArray(r.data) ? r.data : []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [startDate]);

    // Summary stats
    const totalProducts = data.length;
    const totalReceived = data.reduce((s, d) => s + (d.received || 0), 0);
    const totalIssued = data.reduce((s, d) => s + (d.issued || 0), 0);
    const totalClosing = data.reduce((s, d) => s + (d.closingStock || 0), 0);
    const lowStockCount = data.filter(d => {
        const closing = d.closingStock || 0;
        const reorder = d.product?.reorderLevel || 0;
        return closing <= reorder && reorder > 0;
    }).length;

    // Chart data — top 10 by closing stock
    const chartData = [...data]
        .sort((a, b) => (b.closingStock || 0) - (a.closingStock || 0))
        .slice(0, 10)
        .map(d => ({
            name: d.product?.name || d.product?.code || 'Unknown',
            received: d.received || 0,
            issued: d.issued || 0,
            closing: d.closingStock || 0,
        }));

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6 gap-4">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                            INVENTORY <span className="text-amber-500">REPORT</span>
                        </h1>
                        <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest mt-2">
                            Stock Movement • Opening • Received • Issued • Closing
                        </p>
                    </div>
                    <div className="flex gap-3 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">From Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-amber-400"
                            />
                        </div>
                        <Button
                            onClick={fetchData}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 h-[42px]"
                        >
                            <RefreshCw size={15} className="mr-2" /> Refresh
                        </Button>
                        <Button className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 h-[42px]">
                            <Download size={15} className="mr-2" /> Export
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total SKUs', value: totalProducts, icon: Package, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' },
                        { label: 'Total Received', value: `+${totalReceived.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' },
                        { label: 'Total Issued', value: totalIssued > 0 ? `-${totalIssued.toLocaleString()}` : '0', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800' },
                        { label: 'Closing Stock', value: totalClosing.toLocaleString(), icon: BarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800' },
                        { label: 'Low / Out of Stock', value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? 'text-rose-600' : 'text-slate-400', bg: lowStockCount > 0 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700' },
                    ].map((card, i) => (
                        <Card key={i} className={`border ${card.bg} shadow-sm hover:scale-[1.02] transition-transform`}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{card.label}</p>
                                    <card.icon size={18} className={card.color} />
                                </div>
                                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Bar Chart */}
                {chartData.length > 0 && (
                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4">
                            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Top 10 Products — Stock Movement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData} barSize={18} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f050" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 9, fontWeight: 700 }}
                                        interval={0}
                                        angle={-25}
                                        textAnchor="end"
                                        height={50}
                                    />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
                                    />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                    <Bar dataKey="received" name="Received" fill="#10b981" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="issued" name="Issued" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="closing" name="Closing" fill="#6366f1" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Detail Table */}
                <Card className="border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Stock Ledger — All Products
                            </CardTitle>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {data.length} items
                            </span>
                        </div>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                            <TableRow className="border-slate-200 dark:border-slate-700">
                                {['#', 'Product Name', 'Code', 'Unit', 'Opening', 'Received', 'Issued', 'Closing', 'Status'].map((h, idx) => (
                                    <TableHead key={h} className={`text-[10px] font-bold uppercase py-3 text-slate-500 dark:text-slate-400 ${idx >= 4 && idx <= 7 ? 'text-right' : ''}`}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-sm font-semibold text-amber-500 animate-pulse">
                                        Loading inventory data...
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-sm font-semibold text-slate-400 dark:text-slate-500">
                                        No inventory transactions found for the selected period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item: any, i: number) => {
                                    const closing = item.closingStock || 0;
                                    const reorderLevel = item.product?.reorderLevel || 0;
                                    const isOut = closing <= 0;
                                    const isLow = !isOut && reorderLevel > 0 && closing <= reorderLevel;
                                    return (
                                        <TableRow key={i} className={`hover:bg-amber-50/30 dark:hover:bg-amber-900/10 border-slate-100 dark:border-slate-700 ${isOut ? 'bg-rose-50/20 dark:bg-rose-900/10' : ''}`}>
                                            <TableCell className="text-xs text-slate-400 font-bold">{i + 1}</TableCell>
                                            <TableCell className="text-sm font-bold text-slate-800 dark:text-white">
                                                {item.product?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-xs text-indigo-500 font-mono font-bold">
                                                {item.product?.code || '—'}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                                                {item.product?.unit || '—'}
                                            </TableCell>
                                            <TableCell className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">
                                                {(item.openingStock || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm font-bold text-emerald-600 text-right">
                                                {item.received > 0 ? `+${item.received.toLocaleString()}` : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm font-bold text-rose-500 text-right">
                                                {item.issued > 0 ? `-${item.issued.toLocaleString()}` : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm font-black text-indigo-600 dark:text-indigo-400 text-right">
                                                {closing.toLocaleString()}
                                                {reorderLevel > 0 && (
                                                    <span className="text-[9px] text-slate-400 font-normal block">
                                                        min: {reorderLevel}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${isOut
                                                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                                                    : isLow
                                                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                                                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                    }`}>
                                                    {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>

            </div>
        </DashboardLayout>
    );
}
