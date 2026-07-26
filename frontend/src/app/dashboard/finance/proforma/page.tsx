'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Search, FileText, CheckCircle, RefreshCcw, Clock } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

const MOCK_PROFORMA = [
    { _id: '1', proformaNumber: 'PRO-1001', customerName: 'Fashion Hub', proformaDate: '2024-02-15', totalAmount: 250000, status: 'Generated' },
    { _id: '2', proformaNumber: 'PRO-1002', customerName: 'ABC Garments', proformaDate: '2024-02-16', totalAmount: 420000, status: 'Accepted' },
    { _id: '3', proformaNumber: 'PRO-1003', customerName: 'Style World', proformaDate: '2024-02-18', totalAmount: 125000, status: 'Converted' },
];

export default function ProformaPage() {
    const [data, setData] = useState(MOCK_PROFORMA);

    useEffect(() => {
        api.get('/finance/proforma').then(r => setData(r.data.length > 0 ? r.data : MOCK_PROFORMA)).catch(() => { });
    }, []);

    const conversionData = [
        { name: 'Generated', count: 12, value: 1200000 },
        { name: 'Accepted', count: 8, value: 850000 },
        { name: 'Converted', count: 5, value: 420000 },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black italic tracking-tight text-slate-800 dark:text-white uppercase">Proforma <span className="text-indigo-600">Invoices</span></h1>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Quotation-Based Billing • Order Verification • Pre-Tax Documents</p>
                    </div>
                    <Link href="/dashboard/finance/proforma/new" className="flex items-center gap-2 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"><Plus size={14} /> Create Proforma</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 border-none bg-indigo-600 text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Proforma Value</p>
                        <p className="text-2xl font-black mt-1">₹2.4M</p>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">25 Documents</span>
                        </div>
                    </Card>
                    <Card className="p-4 border-none bg-emerald-500 text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Converted to Tax Invoice</p>
                        <p className="text-2xl font-black mt-1">₹850K</p>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">34% Conversion Rate</span>
                        </div>
                    </Card>
                    <Card className="p-4 border-none bg-amber-500 text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Pending Acceptance</p>
                        <p className="text-2xl font-black mt-1">₹1.5M</p>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">12 Pending</span>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Conversion Tracking</p>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={conversionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} tick={{ fontSize: 10 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow>
                                {['Number', 'Date', 'Customer', 'Amount', 'Status', 'Actions'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase tracking-widest">{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map(p => (
                                <TableRow key={p._id}>
                                    <TableCell className="text-[11px] font-black text-indigo-600">{p.proformaNumber}</TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-500">{new Date(p.proformaDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-[11px] font-black text-slate-700">{p.customerName}</TableCell>
                                    <TableCell className="text-[11px] font-black">₹{p.totalAmount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${p.status === 'Converted' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : p.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                            {p.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                        <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400" title="Convert to Invoice"><RefreshCcw size={14} /></button>
                                        <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><FileText size={14} /></button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </DashboardLayout>
    );
}
