'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    Plus, Search, Filter, Download,
    ArrowUpRight, FileCheck, CheckCircle2,
    Clock, MoreVertical, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function CreditNotesPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/finance/credit-notes').then(r => setData(r.data.creditNotes || [])).catch(() => { });
        setLoading(false);
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tight text-slate-800 dark:text-white">
                            CREDIT NOTES <span className="text-cyan-500">& SALES RETURNS</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">Section 8.3 • Sales Adjustments • AR Reconciliation</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/finance/credit-notes/new" className="flex items-center gap-2 text-[10px] font-black uppercase bg-cyan-500 text-white rounded-lg px-4 py-2 hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-100">
                            <Plus size={14} /> NEW CREDIT VOUCHER
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Sales Returns MTD', value: '₹180K', sub: '8 Processed', icon: FileCheck, color: 'text-cyan-500', bg: 'bg-cyan-50' },
                        { label: 'Adjusted in AR', value: '₹140K', sub: 'Ledger Updated', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Pending Inspections', value: '₹40K', sub: 'QC Awaited', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                    ].map((k, i) => (
                        <div key={i} className={`p-4 rounded-xl border border-transparent shadow-sm ${k.bg} flex justify-between items-center`}>
                            <div>
                                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{k.label}</p>
                                <p className={`text-xl font-black ${k.color} mt-1`}>{k.value}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{k.sub}</p>
                            </div>
                            <div className="p-2 bg-white rounded-lg"><k.icon size={18} className={k.color} /></div>
                        </div>
                    ))}
                </div>

                <Card className="border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <div className="relative group w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500" size={14} />
                            <input type="text" placeholder="SEARCH CREDIT NOTE, CUSTOMER..." className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-[10px] uppercase font-black tracking-widest focus:outline-none focus:border-cyan-300" />
                        </div>
                    </div>
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                {['CN No', 'Date', 'Customer', 'Ref Invoice', 'Type', 'Total Value', 'Status', 'Actions'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase tracking-widest py-4">{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map(cn => (
                                <TableRow key={cn._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <TableCell className="text-[11px] font-black text-cyan-600 uppercase italic">{cn.creditNoteNumber}</TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-500">{new Date(cn.creditNoteDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-[11px] font-black text-slate-800 uppercase">{cn.customerName}</TableCell>
                                    <TableCell className="text-[10px] font-black text-indigo-500">{cn.referenceInvoiceNo}</TableCell>
                                    <TableCell className="text-[10px] font-black text-slate-700">{cn.creditNoteType}</TableCell>
                                    <TableCell className="text-[11px] font-black text-slate-900">₹{cn.summary?.totalCreditNoteValue?.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${cn.status === 'Applied' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {cn.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded"><Download size={14} /></button>
                                            <button className="p-1.5 hover:bg-rose-50 text-rose-400 rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <td colSpan={8} className="py-20 text-center flex flex-col items-center gap-2">
                                        <ArrowUpRight size={32} className="text-slate-200" />
                                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No credit notes recorded for sales returns</p>
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
