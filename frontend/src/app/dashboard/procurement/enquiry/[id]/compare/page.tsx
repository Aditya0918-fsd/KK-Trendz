'use client';

import { use, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import {
    ArrowLeft,
    ClipboardList,
    TrendingDown,
    CheckCircle2,
    Package,
    ShieldCheck,
    Clock,
    AlertCircle,
    Check
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

export default function EnquiryComparisonPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const { loading: authLoading } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComparisonData = async () => {
        try {
            const res = await api.get(`/purchase-enquiries/${id}/comparison`);
            setData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchComparisonData();
        }
    }, [authLoading, id]);

    const handleAccept = async (qId: string) => {
        if (!confirm('Are you sure you want to accept this quotation? This will automatically reject other pending quotes for this enquiry.')) return;
        try {
            await api.post(`/purchase-quotations/${qId}/accept`);
            alert('Quotation accepted successfully!');
            fetchComparisonData();
        } catch (err: any) {
            alert('Failed to accept quotation: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-xl shadow-indigo-500/20" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-500 animate-pulse">Analyzing Quotations...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg mx-auto mt-20 border border-rose-100 dark:border-rose-900/30">
                <AlertCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-2">Analysis Failed</h2>
                <p className="text-slate-500 mb-6 font-medium">{error || 'Enquiry not found'}</p>
                <Link href="/dashboard/procurement/enquiry">
                    <Button className="bg-slate-900 dark:bg-white dark:text-slate-900 font-bold uppercase tracking-widest px-8">Back to Enquiries</Button>
                </Link>
            </div>
        );
    }

    const { enquiry, quotations } = data;

    // Find best price for each product
    const bestPrices: Record<string, number> = {};
    enquiry.items.forEach((item: any) => {
        const productId = item.productId?._id;
        let minRate = Infinity;
        quotations.forEach((q: any) => {
            const qItem = q.items.find((qi: any) => qi.productId?._id === productId);
            if (qItem && qItem.rate < minRate) {
                minRate = qItem.rate;
            }
        });
        bestPrices[productId] = minRate === Infinity ? 0 : minRate;
    });

    return (
        <div className="p-1 sm:p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <Link href="/dashboard/procurement/enquiry" className="group flex items-center text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 hover:translate-x-[-4px] transition-transform">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Enquiries
                    </Link>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20">
                            <ClipboardList className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Comparison Matrix</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">{enquiry.enquiryNumber} • {enquiry.enquiryType}</p>
                        </div>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-100 dark:border-slate-800">
                    <div className="px-6 py-2 border-r border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Items Req.</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{enquiry.items.length}</p>
                    </div>
                    <div className="px-6 py-2 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Quotes Recv.</p>
                        <p className="text-xl font-black text-emerald-600 leading-none mt-1">{quotations.length}</p>
                    </div>
                </div>
            </div>

            {/* Matrix View */}
            <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 p-8">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-emerald-500" /> Quotation Analysis
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" /> Best Value Indicator Active
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900 border-none">
                                    <TableHead className="w-[300px] font-black uppercase text-[10px] tracking-widest p-6 text-slate-400">Products Breakdown</TableHead>
                                    {quotations.map((q: any) => (
                                        <TableHead key={q._id} className="min-w-[240px] p-6 border-l border-slate-100 dark:border-slate-800">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">{q.supplierId?.partyName}</span>
                                                    {q.status === 'Accepted' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{q.quotationNumber}</span>
                                                    <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full">{q.paymentTerms}</span>
                                                </div>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enquiry.items.map((item: any, idx: number) => (
                                    <TableRow key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 border-b border-slate-50 dark:border-slate-800 transition-colors group">
                                        <TableCell className="p-8">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                    <Package className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{item.productId?.productName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Req Qty: {item.quantity} {item.unit}</p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {quotations.map((q: any) => {
                                            const qi = q.items.find((i: any) => i.productId?._id === item.productId?._id);
                                            const isBest = qi && qi.rate === bestPrices[item.productId?._id];

                                            return (
                                                <TableCell key={q._id} className={`p-8 border-l border-slate-50 dark:border-slate-800 ${isBest ? 'bg-emerald-50/20 dark:bg-emerald-500/5' : ''}`}>
                                                    {qi ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-baseline justify-between gap-4">
                                                                <span className={`text-xl font-black ${isBest ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                                                    ₹{qi.rate.toLocaleString()}<span className="text-[10px] font-medium text-slate-400">/{qi.unit}</span>
                                                                </span>
                                                                {isBest && (
                                                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-1 rounded-lg">
                                                                        <TrendingDown className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                                    <span>GST: {qi.gstRate}%</span>
                                                                    <span>Disc: {qi.discountPercentage}%</span>
                                                                </div>
                                                                <p className="text-[10px] font-black text-slate-900 dark:text-white pt-1">
                                                                    Net: ₹{qi.totalAmount.toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700 italic text-xs font-bold uppercase">
                                                            <AlertCircle className="h-4 w-4" /> Not Quoted
                                                        </div>
                                                    )}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))}

                                {/* Footer Row for Totals */}
                                <TableRow className="bg-slate-50 dark:bg-slate-900/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                                    <TableCell className="p-8 text-slate-500 uppercase font-black text-xs tracking-widest">Grand Summary</TableCell>
                                    {quotations.map((q: any) => (
                                        <TableCell key={q._id} className="p-8 border-l border-slate-100 dark:border-slate-800">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Net Worth</p>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">₹{q.summary?.netAmount?.toLocaleString()}</p>
                                                </div>

                                                {q.status !== 'Accepted' ? (
                                                    <Button
                                                        onClick={() => handleAccept(q._id)}
                                                        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 font-black uppercase text-[10px] tracking-widest h-10 rounded-xl group transition-all"
                                                    >
                                                        Accept Quote <Check className="ml-2 h-4 w-4 group-hover:scale-125 transition-transform" />
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase tracking-widest">
                                                        <CheckCircle2 className="h-4 w-4" /> Quotation Finalized
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Details Section */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-slate-900 border-none shadow-xl rounded-3xl p-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-emerald-500" /> Best Average Value
                    </h4>
                    {quotations.length > 0 ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xl font-black text-slate-900 dark:text-white uppercase">
                                    {quotations.reduce((prev: any, curr: any) => (prev.summary.netAmount < curr.summary.netAmount ? prev : curr)).supplierId?.partyName}
                                </p>
                                <p className="text-xs font-bold text-slate-500 mt-1 italic tracking-tight">Lowest overall procurement cost identified.</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-400 italic font-medium">No quotations to analyze.</p>
                    )}
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-none shadow-xl rounded-3xl p-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-500" /> Lead Time Analysis
                    </h4>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        Most suppliers offer <span className="text-indigo-600 dark:text-indigo-400 font-black">7-10 Days</span> delivery cycle based on current quote terms.
                    </p>
                </Card>

                <Card className="bg-indigo-600 border-none shadow-xl shadow-indigo-500/20 rounded-3xl p-6 text-white">
                    <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Market Insight</h4>
                    <p className="text-sm font-medium leading-relaxed italic">
                        Ensure you check the <span className="font-black text-white">payment terms</span> before finalizing, as lower rates might involve shorter credit cycles.
                    </p>
                </Card>
            </div>
        </div>
    );
}
