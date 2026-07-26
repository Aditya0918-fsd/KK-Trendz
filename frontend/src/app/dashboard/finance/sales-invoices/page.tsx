'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend
} from 'recharts';
import {
    Plus, Search, Filter, Download, MoreHorizontal, TrendingUp,
    Clock, AlertCircle, CheckCircle2, FileText,
    Truck, BadgeCheck, ShieldCheck, Mail, Printer, ExternalLink
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';

const STATUS_COLORS = {
    Paid: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    Pending: 'text-amber-600 bg-amber-50 border-amber-100',
    'Partially Paid': 'text-indigo-600 bg-indigo-50 border-indigo-100',
    Overdue: 'text-rose-600 bg-rose-50 border-rose-100',
    Sent: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    Generated: 'text-slate-600 bg-slate-50 border-slate-100'
};

export default function SalesInvoicesPage() {
    const [data, setData] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const r = await api.get('/sales-invoices');
            setData(r.data || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = [
        { name: 'Dec', amount: 850000 },
        { name: 'Jan', amount: 1100000 },
        { name: 'Feb', amount: 950000 },
        { name: 'Mar', amount: 1400000 },
    ];

    const statusDist = [
        { name: 'Paid', value: 45, color: '#10b981' },
        { name: 'Pending', value: 25, color: '#f59e0b' },
        { name: 'Overdue', value: 30, color: '#ef4444' },
    ];

    if (loading && !isMounted) return null;

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black italic tracking-tight text-slate-800 dark:text-white uppercase">
                            INVOICING & <span className="text-indigo-600">BILLING CENTER</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">Section 8.1 • Accounts Receivable • Compliance Hub</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors">
                            <Download size={14} /> EXPORT GSTR-1
                        </button>
                        <Link href="/dashboard/finance/sales-invoices/new" className="flex items-center gap-2 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-lg px-4 py-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
                            <Plus size={14} /> NEW SALES INVOICE
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Revenue MTD', value: '₹4.2M', sub: '↑ 12% vs LY', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
                        { label: 'E-Way Required', value: '14', sub: 'Pending Action', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                        { label: 'Compliance Pass', value: '98%', sub: 'E-Invoice Sync', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                        { label: 'Outstanding', value: '₹840K', sub: '12 Invoices', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
                    ].map((kpi, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${kpi.bg}`}>
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{kpi.label}</p>
                                    <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                                    <p className="text-[9px] font-bold text-slate-500 mt-1">{kpi.sub}</p>
                                </div>
                                <div className="p-2 bg-white rounded-lg shadow-sm"><kpi.icon size={16} className={kpi.color} /></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 shadow-sm border-slate-200">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Financial Velocity</CardTitle>
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">QUARTERLY VIEW</span>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 bg-slate-900 text-white">
                        <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aging Distribution</CardTitle></CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {statusDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 800 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="SEARCH INVOICE NO, CUSTOMER, OR GSTIN..."
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider focus:outline-none focus:border-indigo-400 w-[350px]"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase px-4 bg-white"><Filter size={14} /> Filter Compliance</button>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow>
                                    {['Invoice Ref', 'Billing Date', 'Customer Entity', 'Taxable', 'GST', 'Total Amt', 'Compliance', 'Status', 'Actions'].map(h => (
                                        <TableHead key={h} className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4">{h}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((inv) => (
                                    <TableRow key={inv._id} className="group hover:bg-slate-50/50 transition-colors border-b last:border-0">
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter">{inv.invoiceNumber}</span>
                                                <span className="text-[8px] font-black text-slate-300">TYPE: {inv.invoiceType}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-600 italic">{inv.invoiceDate ? format(new Date(inv.invoiceDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-700 uppercase">{inv.customerId?.partyName}</span>
                                                <span className="text-[8px] font-bold text-slate-400">{inv.customerId?.gstin || 'UNREGISTERED'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[11px] font-black text-slate-600">₹{inv.summary?.totalTaxable?.toLocaleString()}</TableCell>
                                        <TableCell className="text-[11px] font-black text-slate-400">₹{inv.summary?.totalGst?.toLocaleString()}</TableCell>
                                        <TableCell className="text-[12px] font-black text-slate-900 italic">₹{inv.summary?.grandTotal?.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${inv.summary?.grandTotal > 100000 ? 'bg-cyan-500' : 'bg-slate-200'}`} title="E-Invoice Status" />
                                                <div className={`h-2 w-2 rounded-full ${inv.transport?.eWayBillRequired ? 'bg-amber-500' : 'bg-slate-200'}`} title="E-Way Bill Status" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border shadow-sm ${STATUS_COLORS[inv.payment?.paymentStatus as keyof typeof STATUS_COLORS] || 'text-slate-400'}`}>
                                                {inv.payment?.paymentStatus || 'Pending'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded" title="Print Invoice"><Printer size={14} /></button>
                                                <button className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded" title="Send Email (Step 14)"><Mail size={14} /></button>
                                                <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded"><MoreHorizontal size={14} /></button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {data.length === 0 && (
                                    <TableRow>
                                        <td colSpan={9} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText size={32} className="text-slate-200" />
                                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No commercial invoices generated yet</p>
                                            </div>
                                        </td>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
