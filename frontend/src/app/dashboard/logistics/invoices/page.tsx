'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    ReceiptText, Search, Download,
    Mail, Printer, MoreHorizontal,
    TrendingUp, ArrowUpRight, ArrowDownRight,
    CreditCard, ShieldCheck, FileText, BarChart3,
    Activity, Landmark, Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

const mockRevenueData = [
    { month: 'Jan', revenue: 450000 },
    { month: 'Feb', revenue: 520000 },
    { month: 'Mar', revenue: 480000 },
    { month: 'Apr', revenue: 610000 },
    { month: 'May', revenue: 550000 },
    { month: 'Jun', revenue: 670000 },
];

const mockPaymentData = [
    { name: 'Paid', value: 75, color: '#10b981' },
    { name: 'Overdue', value: 10, color: '#f43f5e' },
    { name: 'Pending', value: 15, color: '#8b5cf6' },
];

export default function InvoicesPage() {
    const { loading: authLoading } = useAuth();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        fetchData();
    }, [authLoading]);

    const fetchData = async () => {
        try {
            const res = await api.get('/sales-invoices');
            let data = res.data;
            if (!data || data.length === 0) {
                data = [
                    {
                        _id: 'i1',
                        invoiceNumber: 'INV/2024/001',
                        invoiceDate: new Date().toISOString(),
                        customerName: 'Global Retailers',
                        summary: { taxableAmount: 120000, totalTax: 21600, totalAmount: 141600 },
                        paymentStatus: 'Paid'
                    },
                    {
                        _id: 'i2',
                        invoiceNumber: 'INV/2024/002',
                        invoiceDate: new Date(Date.now() - 86400000).toISOString(),
                        customerName: 'Fashion Hub',
                        summary: { taxableAmount: 85000, totalTax: 15300, totalAmount: 100300 },
                        paymentStatus: 'Pending'
                    }
                ];
            }
            setInvoices(data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight font-montserrat italic">Revenue <span className="text-violet-600 dark:text-violet-400">Compliance</span></h2>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">GST Billing, payment reconciliation and financial records.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-10 px-6 font-black uppercase text-[10px] tracking-widest border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                        <Download className="h-4 w-4 mr-2" /> GSTR Report
                    </Button>
                    <Button className="bg-violet-600 hover:bg-violet-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6 shadow-violet-200 dark:shadow-none shadow-lg transition-all active:scale-95 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Generate Invoice
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: '₹ 12.4 L', icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                    { label: 'Outstanding', value: '₹ 1.2 L', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'GST Collected', value: '₹ 2.22 L', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Collection Rate', value: '92%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="p-4 flex items-center gap-4 border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-slate-900/50">
                        <div className={`h-11 w-11 rounded-md ${kpi.bg} flex items-center justify-center`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-montserrat">{kpi.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Top Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col items-center justify-center p-6">
                    <CardHeader className="p-0 mb-4 w-full text-center">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-montserrat tracking-widest">Collection Mix</CardTitle>
                    </CardHeader>
                    <div className="h-[150px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mockPaymentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {mockPaymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 900 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm">
                    <CardHeader className="pb-0 text-center">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-montserrat tracking-widest">Monthly Billing</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[180px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockRevenueData}>
                                <Tooltip
                                    cursor={{ fill: '#8b5cf6', opacity: 0.1 }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}
                                />
                                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                    {mockRevenueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 5 ? '#8b5cf6' : '#c4b5fd'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Table */}
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 pb-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search invoice number or customer..." className="pl-10 h-10 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black uppercase tracking-widest text-[10px]" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Invoice No</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Recipient</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Taxable</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Total Amount</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-center animate-pulse font-bold text-slate-400">Loading Invoices...</TableCell></TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-center font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">Zero Invoices Generated</TableCell></TableRow>
                            ) : (
                                invoices.map(invoice => (
                                    <TableRow key={invoice._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/10">
                                        <TableCell>
                                            <div className="flex flex-col items-center">
                                                <p className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">{invoice.invoiceNumber}</p>
                                                <p className="text-[9px] font-black text-slate-400">{format(new Date(invoice.invoiceDate), 'dd MMM yy')}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                            {invoice.customerName}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="text-[11px] font-black text-slate-600 dark:text-slate-400">₹ {(invoice.summary?.taxableAmount || 0).toLocaleString()}</p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white">₹ {(invoice.summary?.totalAmount || 0).toLocaleString()}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${invoice.paymentStatus === 'Paid'
                                                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10'
                                                    : 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/10'
                                                } uppercase tracking-tighter`}>
                                                {invoice.paymentStatus}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 dark:hover:bg-slate-800"><Printer className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 dark:hover:bg-slate-800"><Mail className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
