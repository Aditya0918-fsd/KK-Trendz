'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Search, Download, Calendar, Activity, Info, AlertCircle, TrendingDown, TrendingUp, ShieldCheck, ArrowRight, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

export default function GSTR3BReport() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(2);
    const [year, setYear] = useState(2024);

    useEffect(() => {
        setLoading(true);
        api.get('/finance/gst-report/gstr3b', { params: { month, year } })
            .then(r => setData(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [month, year]);

    if (loading) return <DashboardLayout><div className="flex h-screen items-center justify-center font-black animate-pulse text-rose-500 uppercase tracking-[0.5em]">SYSTEM CALCULATING ITC & LIABILITY...</div></DashboardLayout>;

    const netPayable = (data?.section3_1?.igst + data?.section3_1?.cgst + data?.section3_1?.sgst) - (data?.section4?.itcIgst + data?.section4?.itcCgst + data?.section4?.itcSgst);

    const exportToJSON = () => {
        if (!data) return;
        const portalJSON = {
            gstin: "27AABCK1234F1Z1",
            ret_period: `${month.toString().padStart(2, '0')}${year}`,
            "3.1": {
                osup_det: {
                    txval: data.section3_1?.totalTaxable || 0,
                    iamt: data.section3_1?.igst || 0,
                    camt: data.section3_1?.cgst || 0,
                    samt: data.section3_1?.sgst || 0,
                    csamt: 0
                },
                isup_rev: {
                    txval: data.section3_2?.totalTaxable || 0,
                    iamt: data.section3_2?.igst || 0,
                    camt: 0,
                    samt: 0,
                    csamt: 0
                }
            },
            "4": {
                itc_avl: [
                    {
                        ty: "ALL_OTHER_ITC",
                        iamt: data.section4?.itcIgst || 0,
                        camt: data.section4?.itcCgst || 0,
                        samt: data.section4?.itcSgst || 0,
                        csamt: 0
                    }
                ]
            }
        };

        const jsonStr = JSON.stringify(portalJSON, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GSTR3B_${month}_${year}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white flex items-center gap-4">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white">GSTR-3B</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">SUMMARY RETURN</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.4em] mt-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                            Monthly Summary • ITC Settlement • Tax Liability
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            className="bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 border border-slate-200 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-rose-400"
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                        >
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            className="bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 border border-slate-200 rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-rose-400"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                        >
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <Button onClick={exportToJSON} className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 transition-all duration-300 text-[10px] font-black uppercase tracking-widest px-6 shadow-[0_10px_20px_-5px_rgba(244,63,94,0.4)] border-none">
                            <Download size={16} className="mr-3" /> PORTAL READY: DEPLOY GSTR-3B JSON
                        </Button>
                    </div>
                </div>

                {/* Liability vs ITC Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-900 text-white border-none shadow-2xl p-8 space-y-4 relative overflow-hidden group rounded-3xl">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Total Output Liability</p>
                        <p className="text-4xl font-black tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">₹{(data?.section3_1?.igst + data?.section3_1?.cgst + data?.section3_1?.sgst).toLocaleString()}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                            <TrendingUp size={14} /> Tax on Outward Supplies
                        </div>
                    </Card>

                    <Card className="bg-emerald-600 text-white border-none shadow-2xl p-8 space-y-4 relative overflow-hidden group rounded-3xl">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300 opacity-70">Total Input Tax Credit (ITC)</p>
                        <p className="text-4xl font-black tracking-tighter tabular-nums">₹{(data?.section4?.itcIgst + data?.section4?.itcCgst + data?.section4?.itcSgst).toLocaleString()}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-100 uppercase tracking-widest">
                            <TrendingDown size={14} /> Eligible ITC from Purchases
                        </div>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 shadow-xl p-8 space-y-4 flex flex-col justify-center text-center rounded-3xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Net GST Payable (Cash)</p>
                        <p className={`text-4xl font-black tracking-tighter tabular-nums ${netPayable > 0 ? 'text-rose-600 underline decoration-double' : 'text-emerald-600'}`}>
                            ₹{Math.max(0, netPayable).toLocaleString()}
                        </p>
                        <p className="text-[9px] font-black uppercase text-slate-300 dark:text-slate-500 tracking-widest leading-relaxed">System calculated balance after ITC adjustment</p>
                    </Card>
                </div>

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 3.1 Outward & Inward RC */}
                    <Card className="border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-4"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 italic">3.1 Outward Taxable Supplies Summary</CardTitle></CardHeader>
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="text-[9px] font-black uppercase py-4">Supply Nature</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-right">Taxable Val</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-right">IGST</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-right">CGST / SGST</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="text-[10px] font-black uppercase italic">Outward Taxable Supplies (Other than zero rated, nil rated)</TableCell>
                                    <TableCell className="text-[11px] font-bold text-right">₹{data?.section3_1?.totalTaxable.toLocaleString()}</TableCell>
                                    <TableCell className="text-[11px] font-black text-right text-rose-500">₹{data?.section3_1?.igst.toLocaleString()}</TableCell>
                                    <TableCell className="text-[11px] font-black text-right text-rose-400 italic">₹{data?.section3_1?.cgst.toLocaleString()}</TableCell>
                                </TableRow>
                                <TableRow className="bg-slate-50/30">
                                    <TableCell className="text-[10px] font-black uppercase italic">Inward Supplies (Liable to Reverse Charge)</TableCell>
                                    <TableCell className="text-[11px] font-bold text-right">₹{data?.section3_2?.totalTaxable.toLocaleString()}</TableCell>
                                    <TableCell className="text-[11px] font-black text-right text-amber-500">₹{data?.section3_2?.igst.toLocaleString()}</TableCell>
                                    <TableCell className="text-[11px] font-black text-right text-slate-300">₹0</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Card>

                    {/* 4. Eligible ITC */}
                    <Card className="border-slate-200 overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50 border-b py-4"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">4. Eligible Input Tax Credit (ITC)</CardTitle></CardHeader>
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="text-[9px] font-black uppercase py-4">ITC Categorization</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-right">IGST</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-right">CGST</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-right">SGST</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="text-[10px] font-black uppercase italic">(A) ITC Available (In full or part)</TableCell>
                                    <TableCell className="text-[11px] font-bold text-right text-emerald-600">₹{data?.section4?.itcIgst.toLocaleString()}</TableCell>
                                    <TableCell className="text-[11px] font-bold text-right text-emerald-500">₹{data?.section4?.itcCgst.toLocaleString()}</TableCell>
                                    <TableCell className="text-[11px] font-bold text-right text-emerald-500">₹{data?.section4?.itcSgst.toLocaleString()}</TableCell>
                                </TableRow>
                                <TableRow className="text-slate-300">
                                    <TableCell className="text-[10px] font-black uppercase italic">(B) ITC Reversed</TableCell>
                                    <TableCell className="text-[11px] font-bold text-right">₹0</TableCell>
                                    <TableCell className="text-[11px] font-bold text-right">₹0</TableCell>
                                    <TableCell className="text-[11px] font-bold text-right">₹0</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Audit & Challan Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 flex gap-6 group hover:bg-white transition-all shadow-sm">
                        <AlertCircle className="text-amber-500 shrink-0 group-hover:scale-125 transition-transform" size={24} />
                        <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase text-amber-700 tracking-widest italic italic">Step 7: Pay Tax & Generate Challan</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed font-black opacity-60">
                                "Tax must be paid online through the GST portal before filing GSTR-3B. Once CIN (Challan Identification Number) is generated, it must be recorded in the system ledger."
                            </p>
                            <Button variant="outline" className="border-amber-200 text-amber-600 text-[10px] font-black uppercase mt-4 group-hover:bg-amber-50 transition-colors shadow-sm">INITIATE TAX PAYMENT <ChevronRight size={14} className="ml-2" /></Button>
                        </div>
                    </div>

                    <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100 flex gap-6 group hover:bg-white transition-all shadow-sm">
                        <ShieldCheck className="text-indigo-500 shrink-0 group-hover:scale-125 transition-transform" size={24} />
                        <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase text-indigo-700 tracking-widest italic">Step 9: GSTR-2B Reconciliation Audit</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed font-black opacity-60">
                                "Ensure your ITC claimed matches exactly with the supplier-uploaded GSTR-2B data. Any mismatches will trigger inward supply audit queries."
                            </p>
                            <Button variant="outline" className="border-indigo-200 text-indigo-600 text-[10px] font-black uppercase mt-4 group-hover:bg-indigo-50 transition-colors shadow-sm">MATCH WITH GSTR-2B <ArrowRight size={14} className="ml-2" /></Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}


