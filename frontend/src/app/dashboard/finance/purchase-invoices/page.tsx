'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import {
    Plus, Search, Filter, Download, FileText, ShoppingBag,
    CreditCard, Clock, CheckCircle2, XCircle, AlertCircle,
    MoreVertical, ArrowUpRight
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

const STATUS_STYLING = {
    'Booked': 'bg-slate-100 text-slate-600 border-slate-200',
    'Pending Approval': 'bg-amber-50 text-amber-600 border-amber-100',
    'Approved': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Rejected': 'bg-rose-50 text-rose-600 border-rose-100',
    'Query': 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

export default function PurchaseInvoicesPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const r = await api.get('/finance/purchase-invoices');
            setData(r.data.invoices || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: string) => {
        try {
            await api.patch(`/finance/purchase-invoices/${id}/status`, { status: action });
            showToast(`Invoice status updated to ${action}`, 'success');
            fetchInvoices();
        } catch (error: any) {
            console.error('Action failed:', error);
            const msg = error?.response?.data?.message || 'Action failed';
            showToast(msg, 'error');
        }
    };

    const supplierData = [
        { name: 'Fabric Hub', amount: 850000 },
        { name: 'Yarn Mills', amount: 420000 },
        { name: 'Chemical Co', amount: 156000 },
        { name: 'Logistics X', amount: 92000 },
    ];

    const payStatus = [
        { name: 'Approved', value: 45, color: '#10b981' },
        { name: 'Pending', value: 35, color: '#f59e0b' },
        { name: 'Rejected', value: 20, color: '#ef4444' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tight text-slate-800 dark:text-white">
                            ACCOUNTS <span className="text-emerald-500">PAYABLE HUB</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">Section 8.2 • Procurement Reconciliation • Tax Compliance</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/finance/debit-notes" className="flex items-center gap-2 text-[10px] font-black uppercase border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors">DEBIT NOTES (8.3)</Link>
                        <Link href="/dashboard/finance/purchase-invoices/new" className="flex items-center gap-2 text-[10px] font-black uppercase bg-emerald-500 text-white rounded-lg px-4 py-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100">
                            <Plus size={14} /> NEW PURCHASE VOUCHER
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending Approval', value: '12', sub: '₹4.2M Volume', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Approved Today', value: '₹1.8M', sub: '6 Vouchers', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { l: 'Outstanding AP', value: '₹2.4M', sub: 'Due in 7 Days', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { l: 'Credit Balances', value: '₹140K', sub: 'Section 8.3', icon: ShoppingBag, color: 'text-rose-500', bg: 'bg-rose-50' }
                    ].map((k, i) => (
                        <div key={i} className={`p-4 rounded-xl border border-transparent shadow-sm ${k.bg} flex justify-between items-center`}>
                            <div>
                                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{k.label || k.l}</p>
                                <p className={`text-xl font-black ${k.color} mt-1`}>{k.value}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{k.sub}</p>
                            </div>
                            <div className="p-2 bg-white rounded-lg"><k.icon size={18} className={k.color} /></div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-slate-200">
                        <CardHeader className="py-4 border-b flex flex-row items-center justify-between"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aging & Flow</CardTitle><ArrowUpRight size={14} className="text-slate-300" /></CardHeader>
                        <CardContent className="h-[250px] p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={supplierData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} tick={{ fontSize: 11 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                        <CardHeader className="py-4 border-b"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approval Sentiment</CardTitle></CardHeader>
                        <CardContent className="h-[250px] p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={payStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                                        {payStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <div className="relative group w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={14} />
                            <input type="text" placeholder="QUERY VOUCHER, SUPPLIER OR PO..." className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-[10px] uppercase font-black tracking-widest focus:outline-none focus:border-emerald-300" />
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 px-4 hover:bg-white"><Filter size={14} /> FILTER STATUS</button>
                            <button className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-500"><Download size={14} /></button>
                        </div>
                    </div>
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                {['Voucher Info', 'Ref Invoice', 'Vendor Entity', 'Matched Link', 'Total Payable', 'Status', 'Workflow Actions'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase tracking-widest py-4">{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map(inv => (
                                <TableRow key={inv._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter">{inv.invoiceNumber}</span>
                                            <span className="text-[8px] font-bold text-slate-400 italic">{new Date(inv.invoiceDate).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-700">{inv.supplierInvoiceNo}</span>
                                            <span className="text-[8px] font-bold text-slate-300">DT: {new Date(inv.supplierInvoiceDate).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-800 uppercase">{inv.supplierId?.partyName}</span>
                                            <span className="text-[8px] font-bold text-slate-400">{inv.supplierId?.gstin || 'UNREGISTERED'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full w-fit">PO Match</span>
                                            <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">GRN Match</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[11px] font-black text-slate-900 italic">₹{inv.summary?.netPayable?.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border select-none ${STATUS_STYLING[inv.status as keyof typeof STATUS_STYLING] || 'bg-slate-50'}`}>
                                            {inv.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {inv.status === 'Pending Approval' ? (
                                                <>
                                                    <button onClick={() => handleAction(inv._id, 'Approved')} className="p-1.5 bg-emerald-500 text-white rounded shadow-sm hover:bg-emerald-600" title="Approve Step 11"><CheckCircle2 size={12} /></button>
                                                    <button onClick={() => handleAction(inv._id, 'Rejected')} className="p-1.5 bg-rose-500 text-white rounded shadow-sm hover:bg-rose-600" title="Reject Step 11"><XCircle size={12} /></button>
                                                </>
                                            ) : (
                                                <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded"><FileText size={14} /></button>
                                            )}
                                            <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded ml-2"><MoreVertical size={14} /></button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <td colSpan={7} className="py-20 text-center flex flex-col items-center gap-2">
                                        <ShoppingBag size={32} className="text-slate-200" />
                                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No purchase vouchers found</p>
                                    </td>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
}
