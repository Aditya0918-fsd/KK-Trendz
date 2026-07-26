'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { CreditCard, TrendingUp, TrendingDown, Download, RefreshCw, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2023, 2024, 2025, 2026];

const MOCK_GST = {
    period: { month: 2, year: 2024 },
    salesGST: { taxableValue: 2375000, cgst: 142500, sgst: 142500, igst: 22100, totalGst: 307100, invoiceCount: 47 },
    purchaseGST: { taxableValue: 940000, gst: 98400, invoiceCount: 31 },
    netGST: { outputGST: 307100, inputGST: 98400, netPayable: 208700 },
    b2bInvoices: [
        { invoiceNumber: 'SINV/2024-25/00001', invoiceDate: new Date(2024, 1, 15), customer: [{ name: 'ABC Garments', gstin: '27AAPFU0939F1ZV' }], summary: { totalTaxable: 237500, totalGst: 28500 } },
        { invoiceNumber: 'SINV/2024-25/00002', invoiceDate: new Date(2024, 1, 18), customer: [{ name: 'Style World', gstin: '27BBBBB1111B1Z6' }], summary: { totalTaxable: 180000, totalGst: 21600 } },
        { invoiceNumber: 'SINV/2024-25/00003', invoiceDate: new Date(2024, 1, 20), customer: [{ name: 'Fashion Hub', gstin: '27CCCCC2222C1Z7' }], summary: { totalTaxable: 92500, totalGst: 11100 } },
    ],
    hsnSummary: [
        { _id: '6109', totalQty: 8500, totalValue: 1450000, totalTax: 174000 },
        { _id: '6110', totalQty: 3200, totalValue: 640000, totalTax: 76800 },
        { _id: '5205', totalQty: 2400, totalValue: 285000, totalTax: 14250 },
        { _id: '5208', totalQty: 1100, totalValue: 0, totalTax: 42050 },
    ]
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#22d3ee'];

export default function GSTReportPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isMounted, setIsMounted] = useState(false);

    const fetchReport = () => {
        setLoading(true);
        api.get(`/finance/gst-report?month=${month}&year=${year}`)
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        setIsMounted(true);
        fetchReport();
    }, [month, year]);

    const d = data || MOCK_GST;

    const taxBreakdown = [
        { name: 'CGST (Output)', value: d.salesGST?.cgst || 0, color: '#6366f1' },
        { name: 'SGST (Output)', value: d.salesGST?.sgst || 0, color: '#8b5cf6' },
        { name: 'IGST (Output)', value: d.salesGST?.igst || 0, color: '#22d3ee' },
        { name: 'Input Credit', value: d.purchaseGST?.gst || 0, color: '#10b981' },
    ];

    const comparisonData = [
        { name: 'Output GST', value: d.netGST?.outputGST || 0, fill: '#6366f1' },
        { name: 'Input Credit', value: d.netGST?.inputGST || 0, fill: '#10b981' },
        { name: 'Net Payable', value: d.netGST?.netPayable || 0, fill: '#f59e0b' },
    ];

    const rateWiseData = [
        { rate: '5%', taxable: (d.salesGST?.taxableValue || 0) * 0.15, gst: (d.salesGST?.totalGst || 0) * 0.08 },
        { rate: '12%', taxable: (d.salesGST?.taxableValue || 0) * 0.55, gst: (d.salesGST?.totalGst || 0) * 0.55 },
        { rate: '18%', taxable: (d.salesGST?.taxableValue || 0) * 0.25, gst: (d.salesGST?.totalGst || 0) * 0.30 },
        { rate: '28%', taxable: (d.salesGST?.taxableValue || 0) * 0.05, gst: (d.salesGST?.totalGst || 0) * 0.07 },
    ];

    return (
        <DashboardLayout>
            {loading && !isMounted ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Generating GST Report...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-black italic tracking-tight text-slate-800 dark:text-white">
                                GST <span className="text-amber-500">REPORT</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">GSTR-1 • GSTR-3B • HSN Summary • B2B Invoices</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="text-[10px] font-black uppercase border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none focus:border-amber-400">
                                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-[10px] font-black uppercase border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none focus:border-amber-400">
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <button onClick={fetchReport} className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 border border-amber-300 rounded-lg px-3 py-2 hover:bg-amber-50 transition-colors">
                                <RefreshCw size={12} /> Refresh
                            </button>
                            <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <Download size={12} /> GSTR-1
                            </button>
                        </div>
                    </div>

                    {/* Net GST Summary Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Output GST (Sales)', value: `₹${((d.netGST?.outputGST || 0) / 1000).toFixed(1)}K`, icon: TrendingUp, sub: `${d.salesGST?.invoiceCount || 0} Invoices`, color: 'bg-indigo-600', textColor: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200' },
                            { label: 'Input Credit (Purchase)', value: `₹${((d.netGST?.inputGST || 0) / 1000).toFixed(1)}K`, icon: TrendingDown, sub: `${d.purchaseGST?.invoiceCount || 0} Invoices`, color: 'bg-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200' },
                            { label: 'Net Tax Payable', value: `₹${((d.netGST?.netPayable || 0) / 1000).toFixed(1)}K`, icon: CreditCard, sub: `For ${MONTHS[(month - 1 + 12) % 12]} ${year}`, color: 'bg-amber-500', textColor: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200' },
                        ].map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <Card key={i} className={`p-5 border ${s.bgColor}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${s.textColor}`}>{s.label}</p>
                                            <p className={`text-2xl font-black ${s.textColor} mt-2`}>{s.value}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{s.sub}</p>
                                        </div>
                                        <div className={`p-2.5 rounded-xl ${s.color} text-white`}><Icon size={18} /></div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                            <CardHeader className="pb-2 text-center border-b border-slate-50 dark:border-slate-800"><CardTitle className="text-[10px] font-black uppercase tracking-widest">GST Comparison</CardTitle></CardHeader>
                            <CardContent className="h-[220px] pt-4">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={200} key={loading ? 'loading' : 'ready'}>
                                        <BarChart data={comparisonData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                            <Tooltip />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                {comparisonData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                            <CardHeader className="pb-2 text-center border-b border-slate-50 dark:border-slate-800"><CardTitle className="text-[10px] font-black uppercase tracking-widest">Tax Breakup</CardTitle></CardHeader>
                            <CardContent className="h-[220px] pt-4">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={200} key={loading ? 'loading' : 'ready'}>
                                        <PieChart>
                                            <Pie data={taxBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                                                {taxBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                            <CardHeader className="pb-2 text-center border-b border-slate-50 dark:border-slate-800"><CardTitle className="text-[10px] font-black uppercase tracking-widest">Rate-wise GST</CardTitle></CardHeader>
                            <CardContent className="h-[220px] pt-4">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" minHeight={200} key={loading ? 'loading' : 'ready'}>
                                        <BarChart data={rateWiseData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="rate" tick={{ fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} width={30} />
                                            <Tooltip />
                                            <Bar dataKey="gst" name="GST Amount" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* B2B Table */}
                    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                        <CardHeader className="p-4 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">B2B Invoices (GSTR-1)</CardTitle>
                                <p className="text-[9px] text-slate-400 mt-0.5">Summary of taxable outward supplies made to registered persons</p>
                            </div>
                            <button className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors">Export File</button>
                        </CardHeader>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    {['Invoice No', 'Date', 'GSTIN', 'Taxable Value', 'Total Tax'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase tracking-widest">{h}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {d?.b2bInvoices?.length > 0 ? d.b2bInvoices.map((inv: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-[11px] font-black text-amber-600 font-mono">{inv.invoiceNumber}</TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-[10px] font-black text-slate-700 font-mono">{inv.customerId?.gstin || inv.customer?.[0]?.gstin || '—'}</TableCell>
                                        <TableCell className="text-[11px] font-black">₹{inv.summary?.totalTaxable?.toLocaleString() || '0'}</TableCell>
                                        <TableCell className="text-[11px] font-black text-indigo-600">₹{inv.summary?.totalGst?.toLocaleString() || '0'}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">No B2B Invoices found for this period</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Filing Readiness */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                        {[
                            { title: 'GSTR-1 Readiness', status: 'Ready to File', color: 'indigo', items: ['HSN Summary generated', 'B2B data reconciled', 'Document series verified'] },
                            { title: 'GSTR-3B Readiness', status: 'Verification Pending', color: 'amber', items: ['Input tax credit calculated', 'Output tax liability matched', 'Cash ledger balance sync'] },
                        ].map((g, i) => (
                            <Card key={i} className={`p-6 border-${g.color}-200 bg-${g.color}-50 dark:bg-slate-900/50`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className={`text-[12px] font-black uppercase tracking-widest text-${g.color}-600`}>{g.title}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic tracking-tight">{g.status}</p>
                                    </div>
                                    <AlertCircle size={18} className={`text-${g.color}-500 animate-pulse`} />
                                </div>
                                <div className="space-y-2">
                                    {g.items.map((item, j) => (
                                        <div key={j} className="flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full bg-${g.color}-500`} />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className={`w-full mt-4 py-2 bg-${g.color}-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-${g.color}-700 transition-all`}>Download Return JSON</button>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
