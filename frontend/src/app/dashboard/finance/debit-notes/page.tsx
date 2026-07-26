'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    Plus, Search, Filter, Download,
    ArrowLeftRight, FileWarning, CheckCircle2,
    Clock, MoreVertical, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function DebitNotesPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/finance/debit-notes').then(r => setData(r.data.debitNotes || [])).catch(() => { });
        setLoading(false);
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tight text-slate-800 dark:text-white">
                            DEBIT NOTES <span className="text-rose-500">& RETURNS</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1 italic">Section 8.3 • Purchase Returns • Adjustment Hub</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/finance/debit-notes/new" className="flex items-center gap-2 text-[10px] font-black uppercase bg-rose-500 text-white rounded-lg px-4 py-2 hover:bg-rose-600 transition-all shadow-lg shadow-rose-100">
                            <Plus size={14} /> CREATE DEBIT NOTE
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Return Volume MTD', value: '₹420K', sub: '14 Transactions', icon: FileWarning, color: 'text-rose-500', bg: 'bg-rose-50' },
                        { label: 'Adjusted in AP', value: '₹310K', sub: 'Closed Ledger', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Pending Returns', value: '₹110K', sub: 'Awaited Credit', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500" size={14} />
                            <input type="text" placeholder="SEARCH NOTE NO, SUPPLIER OR INVOICE REF..." className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-[10px] uppercase font-black tracking-widest focus:outline-none focus:border-rose-300" />
                        </div>
                    </div>
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                {['Note No', 'Date', 'Supplier', 'Ref Invoice', 'Type/Reason', 'Total Value', 'Status', 'Actions'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase tracking-widest py-4">{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map(dn => (
                                <TableRow key={dn._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <TableCell className="text-[11px] font-black text-rose-600 uppercase italic">{dn.debitNoteNumber}</TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-500">{new Date(dn.debitNoteDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-[11px] font-black text-slate-800 uppercase">{dn.supplierName}</TableCell>
                                    <TableCell className="text-[10px] font-black text-indigo-500">{dn.referenceInvoiceNo}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-700">{dn.debitNoteType}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">{dn.reason}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[11px] font-black text-slate-900">₹{dn.summary?.totalDebitNoteValue?.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${dn.status === 'Adjusted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {dn.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded" title="Print Step 4"><Download size={14} /></button>
                                            <button className="p-1.5 hover:bg-rose-50 text-rose-400 rounded"><Trash2 size={14} /></button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {data.length === 0 && (
                                <TableRow>
                                    <td colSpan={8} className="py-20 text-center flex flex-col items-center gap-2">
                                        <ArrowLeftRight size={32} className="text-slate-200" />
                                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No debit notes recorded for returns</p>
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
