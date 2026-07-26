'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Plus, Search, Filter, Download, CreditCard, Banknote, Landmark, Smartphone, MoreVertical } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const MOCK_RECEIPTS = [
    { _id: '1', receiptNumber: 'REC-5001', receiptDate: '2024-02-25', partyName: 'ABC Garments', amount: 100000, paymentMode: 'Bank Transfer', status: 'Verified' },
    { _id: '2', receiptNumber: 'REC-5002', receiptDate: '2024-02-26', partyName: 'Style World', amount: 45000, paymentMode: 'UPI', status: 'Verified' },
    { _id: '3', receiptNumber: 'REC-5003', receiptDate: '2024-02-27', partyName: 'Fashion Hub', amount: 75000, paymentMode: 'Cheque', status: 'Pending' },
];

export default function PaymentReceiptsPage() {
    const [data, setData] = useState(MOCK_RECEIPTS);

    useEffect(() => {
        api.get('/finance/receipts').then(r => setData(r.data.receipts.length > 0 ? r.data.receipts : MOCK_RECEIPTS)).catch(() => { });
    }, []);

    const flowData = [
        { name: 'Feb 20', amount: 45000 },
        { name: 'Feb 21', amount: 92000 },
        { name: 'Feb 22', amount: 38000 },
        { name: 'Feb 23', amount: 125000 },
        { name: 'Feb 24', amount: 68000 },
    ];

    const modeDist = [
        { name: 'Bank Transfer', value: 45 },
        { name: 'Cheque', value: 25 },
        { name: 'UPI', value: 20 },
        { name: 'Cash', value: 10 },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black italic tracking-tight text-slate-800 dark:text-white uppercase">Payment <span className="text-indigo-600">Receipts</span></h1>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Cash Flow Management • Bank Reconciliation • Multi-Mode Collections</p>
                    </div>
                    <Link href="/dashboard/finance/receipts/new" className="flex items-center gap-2 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"><Plus size={14} /> New Receipt</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Received', value: '₹2.8M', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Paid Out', value: '₹1.4M', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { label: 'Pending Clearance', value: '5 Checks', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Bounced/Failed', value: '2 Cases', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
                    ].map((k, i) => (
                        <Card key={i} className={`p-4 border-none shadow-sm ${k.bg} dark:bg-slate-900/50`}>
                            <div className="flex justify-between items-center">
                                <div><p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{k.label}</p><p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p></div>
                                <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 ${k.color}`}><k.icon size={20} /></div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 p-6 border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Daily Cash Flow Trend</p>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={flowData}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    <Card className="p-6 border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Payment Mode Breakdown</p>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={modeDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                                        {modeDist.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                        <div className="flex gap-4 items-center">
                            {[
                                { label: 'Settled', count: 124, icon: CheckCircle2, color: 'text-emerald-500' },
                                { label: 'Uncleared', count: 12, icon: Clock, color: 'text-amber-500' },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <s.icon size={14} className={s.color} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.count} {s.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white text-slate-500"><Search size={14} /></button>
                            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-white text-slate-500"><Download size={14} /></button>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                {['Receipt No', 'Date', 'Party Name', 'Mode', 'Amount', 'Status', 'Actions'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase tracking-widest">{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map(r => (
                                <TableRow key={r._id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="text-[11px] font-black text-indigo-600">{r.receiptNumber}</TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-500">{new Date(r.receiptDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-[11px] font-black text-slate-700">{r.partyName}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {r.paymentMode === 'Bank Transfer' ? <Landmark size={12} className="text-blue-500" /> : r.paymentMode === 'UPI' ? <Smartphone size={12} className="text-purple-500" /> : <Banknote size={12} className="text-emerald-500" />}
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{r.paymentMode}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[11px] font-black">₹{r.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${r.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {r.status}
                                        </span>
                                    </TableCell>
                                    <TableCell><button className="p-1 hover:bg-slate-100 rounded text-slate-400"><MoreVertical size={14} /></button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
}

import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
