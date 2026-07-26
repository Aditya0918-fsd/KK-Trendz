'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    Plus, Save, X, Search, Landmark, Smartphone,
    Banknote, CreditCard, CheckCircle2, AlertCircle,
    ChevronDown, ArrowRight, FileText, Printer, Send,
    Eye, Info
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function NewPaymentReceipt() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [parties, setParties] = useState<any[]>([]);
    const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([]);
    const [showPartyResults, setShowPartyResults] = useState(false);
    const { showToast } = useToast();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [form, setForm] = useState<any>({
        receiptNumber: `REC/${new Date().getFullYear()}/${Math.floor(Math.random() * 900) + 100}`,
        receiptDate: format(new Date(), 'yyyy-MM-dd'),
        partyId: '',
        partyName: '',
        partyType: 'Customer',
        paymentMode: 'Bank Transfer',
        amount: 0,
        amountInWords: '',
        bankDetails: {
            bankName: '',
            transactionReference: '',
            transactionDate: format(new Date(), 'yyyy-MM-dd'),
            chequeNumber: '',
            chequeDate: format(new Date(), 'yyyy-MM-dd'),
            drawnOnBank: '',
            upiId: '',
            upiAppName: '',
            denominations: [
                { note: 2000, count: 0 },
                { note: 500, count: 0 },
                { note: 200, count: 0 },
                { note: 100, count: 0 },
                { note: 50, count: 0 },
                { note: 20, count: 0 },
                { note: 10, count: 0 }
            ]
        },
        againstInvoices: []
    });

    useEffect(() => {
        api.get('/parties').then(r => setParties(r.data)).catch(() => { });
    }, []);

    const handlePartySelect = async (party: any) => {
        setForm({ ...form, partyId: party._id, partyName: party.partyName, partyType: party.partyType === 'Customer' ? 'Customer' : 'Supplier' });
        setShowPartyResults(false);

        // Fetch outstanding invoices
        try {
            const endpoint = party.partyType === 'Customer' ? '/finance/sales-invoices' : '/finance/purchase-invoices';
            const res = await api.get(endpoint, { params: { status: 'Pending', partyId: party._id } });
            const invoices = (res.data.invoices || res.data).filter((inv: any) =>
                (inv.payment?.paymentStatus || inv.status) !== 'Paid'
            );

            setOutstandingInvoices(invoices.map((inv: any) => ({
                invoiceId: inv._id,
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.invoiceDate,
                invoiceAmount: inv.summary.grandTotal || inv.summary.netPayable,
                dueDate: inv.payment?.dueDate,
                pendingAmount: (inv.summary.grandTotal || inv.summary.netPayable) - (inv.payment?.paidAmount || 0),
                amountApplied: 0
            })));
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    const handleAllocationChange = (idx: number, amount: number) => {
        const newInv = [...outstandingInvoices];
        if (amount > newInv[idx].pendingAmount) amount = newInv[idx].pendingAmount;
        newInv[idx].amountApplied = amount;
        setOutstandingInvoices(newInv);

        const totalApplied = newInv.reduce((sum, inv) => sum + inv.amountApplied, 0);
        setForm({ ...form, amount: totalApplied, againstInvoices: newInv.filter(i => i.amountApplied > 0) });
    };

    const handleDenominationChange = (idx: number, count: number) => {
        const newDenom = [...form.bankDetails.denominations];
        newDenom[idx].count = count;
        const total = newDenom.reduce((sum, d) => sum + (d.note * d.count), 0);
        setForm({
            ...form,
            amount: total,
            bankDetails: { ...form.bankDetails, denominations: newDenom }
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/finance/receipts', { ...form, status: 'Verified' });
            router.push('/dashboard/finance/receipts');
            showToast('Receipt generated successfully!', 'success');
        } catch (error: any) {
            console.error('Error generating receipt:', error);
            const msg = error?.response?.data?.message || 'Failed to generate receipt.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1200px] mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between border-b py-4 bg-white sticky top-0 z-10 transition-all duration-300">
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter text-slate-800 uppercase flex items-center gap-2">
                            <CheckCircle2 className="text-indigo-600" /> PAYMENT <span className="text-indigo-600">COLLECTION & RECEIPT</span>
                        </h1>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Section 8.4 • Receivables Management • Treasury Hub</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase"><X size={14} className="mr-2" /> CANCEL</Button>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="text-[10px] font-black uppercase"><Eye size={14} className="mr-2" /> PREVIEW PDF</Button>
                        <Button onClick={handleSubmit} disabled={loading || !form.partyId || form.amount <= 0} className="bg-indigo-600 text-white text-[10px] font-black uppercase px-6 shadow-lg shadow-indigo-100">
                            <Save size={14} className="mr-2" /> {loading ? 'SAVING...' : 'GENERATE RECEIPT'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Party & Mode Selection */}
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50 border-b py-3 flex justify-between items-center">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic underline decoration-indigo-200 underline-offset-4">Step 1-3: Party & Collection Mode</CardTitle>
                                <Smartphone size={14} className="text-indigo-400" />
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1 relative">
                                        <Label className="text-[9px] font-black uppercase text-slate-400">Select Customer / Party</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input
                                                className="w-full pl-9 pr-4 h-10 bg-slate-50 border rounded-lg text-[10px] font-black uppercase outline-none focus:border-indigo-400"
                                                placeholder="SEARCH BY NAME..."
                                                onFocus={() => setShowPartyResults(true)}
                                                value={form.partyName}
                                                readOnly
                                            />
                                        </div>
                                        {showPartyResults && (
                                            <div className="absolute z-20 w-full mt-2 bg-white border rounded-xl shadow-2xl max-h-[300px] overflow-y-auto p-2 space-y-1">
                                                {parties.map(p => (
                                                    <div key={p._id} onClick={() => handlePartySelect(p)} className="p-3 hover:bg-indigo-50 border-b last:border-0 cursor-pointer rounded-lg transition-colors group">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black uppercase text-slate-700 group-hover:text-indigo-600">{p.partyName}</span>
                                                            <span className="text-[8px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{p.partyType}</span>
                                                        </div>
                                                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase italic group-hover:text-indigo-300">{p.gstin || 'No GSTIN'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-slate-400">Payment Mode</Label>
                                        <div className="flex gap-2 p-1 bg-slate-50 border rounded-lg h-10">
                                            {['Bank Transfer', 'Cheque', 'Cash', 'UPI'].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => setForm({ ...form, paymentMode: m })}
                                                    className={`flex-1 flex items-center justify-center gap-2 rounded-md text-[9px] font-black uppercase transition-all ${form.paymentMode === m ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {m === 'Bank Transfer' ? <Landmark size={12} /> : m === 'UPI' ? <Smartphone size={12} /> : m === 'Cash' ? <Banknote size={12} /> : <FileText size={12} />}
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Allocation Section */}
                        {form.paymentMode !== 'Cash' && (
                            <Card className="border-slate-200 overflow-hidden shadow-sm">
                                <CardHeader className="bg-slate-50 border-b py-3 flex justify-between items-center">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Step 4: Outstanding Invoice Allocation</CardTitle>
                                    <ArrowRight size={14} className="text-indigo-400" />
                                </CardHeader>
                                <Table>
                                    <TableHeader className="bg-slate-100">
                                        <TableRow>
                                            {['Invoice Info', 'Due Date', 'Pending Amt', 'This Allocation', 'Action'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase py-4">{h}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {outstandingInvoices.map((inv, i) => (
                                            <TableRow key={i} className="hover:bg-indigo-50/20 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{inv.invoiceNumber}</span>
                                                        <span className="text-[8px] font-bold text-slate-400 italic">DT: {format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-[10px] font-bold text-rose-500">{inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                                <TableCell className="text-[11px] font-black text-slate-500 italic">₹{inv.pendingAmount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={inv.amountApplied}
                                                        onChange={(e) => handleAllocationChange(i, Number(e.target.value))}
                                                        className="h-8 w-28 text-[11px] font-black border-indigo-100 focus:border-indigo-400"
                                                        max={inv.pendingAmount}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" onClick={() => handleAllocationChange(i, inv.pendingAmount)} className="text-[8px] font-black uppercase text-indigo-600 hover:bg-indigo-50">SET FULL</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {outstandingInvoices.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center flex flex-col items-center gap-2">
                                                    <AlertCircle size={32} className="text-slate-100" />
                                                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] italic">No outstanding invoices for this party</p>
                                                </td>
                                            </tr>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        )}

                        {/* Mode Specific Details */}
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50 border-b py-3 flex justify-between items-center">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Step 5: Payment Details ({form.paymentMode})</CardTitle>
                                <FileText size={14} className="text-slate-400" />
                            </CardHeader>
                            <CardContent className="p-6">
                                {form.paymentMode === 'Bank Transfer' && (
                                    <div className="grid grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Transaction Ref No</Label>
                                            <Input className="h-10 text-[10px] font-black text-indigo-600 placeholder:text-slate-200" placeholder="UTR / REF NO..." value={form.bankDetails.transactionReference} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, transactionReference: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Bank Name</Label>
                                            <Input className="h-10 text-[10px] font-black uppercase" placeholder="ENTER BANK..." value={form.bankDetails.bankName} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Transaction Date</Label>
                                            <Input type="date" className="h-10 text-[10px] font-bold" value={form.bankDetails.transactionDate} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, transactionDate: e.target.value } })} />
                                        </div>
                                    </div>
                                )}

                                {form.paymentMode === 'Cheque' && (
                                    <div className="grid grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Cheque Number</Label>
                                            <Input className="h-10 text-[10px] font-black text-indigo-600" placeholder="6 DIGIT NO..." value={form.bankDetails.chequeNumber} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, chequeNumber: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Cheque Date</Label>
                                            <Input type="date" className="h-10 text-[10px] font-bold" value={form.bankDetails.chequeDate} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, chequeDate: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Drawn on Bank</Label>
                                            <Input className="h-10 text-[10px] font-black uppercase" placeholder="ISSUING BANK..." value={form.bankDetails.drawnOnBank} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, drawnOnBank: e.target.value } })} />
                                        </div>
                                    </div>
                                )}

                                {form.paymentMode === 'UPI' && (
                                    <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">UPI Transaction ID</Label>
                                            <Input className="h-10 text-[10px] font-black text-indigo-600" placeholder="REF ID..." value={form.bankDetails.transactionReference} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, transactionReference: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">UPI App Name</Label>
                                            <select
                                                className="w-full h-10 bg-slate-50 border rounded-lg text-[10px] font-black uppercase px-3 outline-none focus:border-indigo-400"
                                                value={form.bankDetails.upiAppName}
                                                onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, upiAppName: e.target.value } })}
                                            >
                                                <option>Google Pay</option>
                                                <option>PhonePe</option>
                                                <option>Paytm</option>
                                                <option>BHIM UPI</option>
                                                <option>Amazon Pay</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {form.paymentMode === 'Cash' && (
                                    <div className="animate-in fade-in zoom-in-95 duration-300">
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic border-b pb-2">Cash Denominations</p>
                                        <div className="grid grid-cols-4 gap-4">
                                            {form.bankDetails.denominations.map((d: any, i: number) => (
                                                <div key={i} className="bg-slate-50 p-3 rounded-xl border flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-slate-500 mb-1 italic">₹{d.note}</span>
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-full text-center text-[11px] font-black"
                                                        value={d.count}
                                                        onChange={(e) => handleDenominationChange(i, Number(e.target.value))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Summary Card */}
                        <Card className="bg-indigo-900 text-white shadow-2xl relative overflow-hidden border-none pt-2">
                            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <CardHeader className="pb-2 text-center uppercase tracking-[0.3em] font-black opacity-30 text-[8px] border-b border-white/5 py-4 italic">Treasury Collection Summary</CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest italic mb-2 leading-none">Total Receipt Value</p>
                                    <p className="text-4xl font-black italic tracking-tighter">₹{form.amount.toLocaleString()}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Internal Voucher Index</p>
                                        <p className="text-lg font-black italic tracking-tight">{form.receiptNumber}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                                            <p className="text-[8px] font-black text-slate-500 uppercase">Book Status</p>
                                            <p className="text-[10px] font-black uppercase text-indigo-400 italic mt-1 font-black underline decoration-indigo-800">Verified</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 space-y-3">
                                    <div className="flex items-center gap-2 text-indigo-400"><FileText size={14} /><span className="text-[9px] font-black uppercase tracking-widest italic">Ledger Impact (Step 7)</span></div>
                                    <div className="space-y-2 opacity-80">
                                        <div className="flex justify-between text-[9px] font-bold uppercase"><span>A/R Balance Red.</span> <span className="text-emerald-400">₹{form.amount.toLocaleString()}</span></div>
                                        <div className="flex justify-between text-[9px] font-bold uppercase"><span>Bank/Cash Inc.</span> <span className="text-emerald-400">₹{form.amount.toLocaleString()}</span></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4 transition-all hover:bg-white hover:shadow-xl group">
                            <Info size={16} className="text-indigo-400 shrink-0 group-hover:scale-125 transition-transform" />
                            <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase italic">Step 9: Bank Reconciliation and Statement Matching will be available in the 'Reconciliation Hub' once this voucher is settled.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 6: PDF Preview Modal */}
            <Modal title="Payment Receipt Verification PDF" isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} className="max-w-4xl">
                <div className="p-12 bg-white font-sans border-t-[14px] border-indigo-600 space-y-12">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">KK-TRADERS <span className="text-indigo-600 text-sm italic ml-2">Payment Receipt</span></h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] font-black italic">Acknowledging Customer Remittance • treasury portal</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-indigo-600 text-white px-8 py-2 text-[14px] font-black uppercase italic tracking-[0.3em] shadow-2xl skew-x-[-10deg]">RECEIPT VOUCHER</div>
                            <p className="text-[12px] font-black text-slate-800 mt-6 italic underline decoration-indigo-100">{form.receiptNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 pt-10 border-t border-slate-100 bg-slate-50/30 p-8 rounded-3xl">
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase text-slate-400 italic underline decoration-indigo-200 underline-offset-4 tracking-widest">Received From Customer:</h4>
                            <p className="text-2xl font-black text-slate-800 uppercase leading-none tracking-tight italic">{form.partyName || 'Select Customer...'}</p>
                            <p className="text-[11px] font-black text-slate-400 tracking-widest uppercase mt-4">Authorized Ledger Index: {form.partyId || 'Pending'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-w-4 gap-y-6">
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt Date</p><p className="text-[12px] font-black text-slate-800 italic underline decoration-indigo-50">{form.receiptDate}</p></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</p><p className="text-[12px] font-black text-indigo-600 uppercase italic tracking-tighter shadow-sm bg-indigo-50/50 w-fit px-2 rounded-sm">{form.paymentMode}</p></div>
                            <div className="col-span-2 bg-indigo-900 text-white p-4 rounded-2xl shadow-xl"><p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Total Amount Received</p><p className="text-3xl font-black tracking-tighter">₹{form.amount.toLocaleString()}.00</p></div>
                        </div>
                    </div>

                    {form.againstInvoices.length > 0 && (
                        <div className="space-y-4 pt-4 animate-in slide-in-from-bottom-5">
                            <h4 className="text-[11px] font-black uppercase text-slate-800 italic flex items-center gap-2"><ArrowRight size={14} className="text-indigo-600" /> Invoice Settlement Breakdown:</h4>
                            <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                                <thead>
                                    <tr className="bg-slate-900 text-white">
                                        <th className="p-4 text-left text-[11px] font-black uppercase italic tracking-widest border-r border-white/10">Invoice Ref</th>
                                        <th className="p-4 text-center text-[11px] font-black uppercase italic tracking-widest border-r border-white/10">Due Date</th>
                                        <th className="p-4 text-right text-[11px] font-black uppercase italic tracking-widest border-r border-white/10">Billed Amt</th>
                                        <th className="p-4 text-right text-[11px] font-black uppercase italic tracking-widest">Allocated Amt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {form.againstInvoices.map((it: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-indigo-50/10 transition-colors">
                                            <td className="p-5 text-[12px] font-black text-slate-700 uppercase tracking-tight">{it.invoiceNumber}</td>
                                            <td className="p-5 text-center text-[11px] font-bold text-slate-400 italic">{it.dueDate ? format(new Date(it.dueDate), 'dd MMM yyyy') : 'N/A'}</td>
                                            <td className="p-5 text-right text-[12px] font-bold text-slate-400 italic">₹{it.invoiceAmount.toLocaleString()}</td>
                                            <td className="p-5 text-right text-[13px] font-black bg-emerald-50 text-emerald-700 italic border-l border-emerald-100">₹{it.amountApplied.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-between items-end pt-20">
                        <div className="space-y-6">
                            <div className="h-28 w-44 border-2 border-dotted border-slate-200 flex items-center justify-center text-[10px] font-black uppercase text-slate-300 rotate-[-8deg] shadow-inner italic">Treasury Seal</div>
                            <p className="text-[11px] font-black uppercase text-slate-400 italic tracking-[0.2em] underline decoration-indigo-50 underline-offset-8">Voucher Section 8.4 Verified</p>
                        </div>
                        <div className="text-right space-y-16">
                            <div className="h-[1px] w-72 bg-slate-300 ml-auto shadow-sm" />
                            <p className="text-[12px] font-black uppercase text-slate-900 italic tracking-widest">For KK-TRADERS <span className="text-slate-400 block font-normal mt-2 tracking-normal not-italic">(Cashier / Authorized Signatory)</span></p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 shadow-inner">
                    <Button onClick={() => setIsPreviewOpen(false)} variant="ghost" className="text-[10px] font-black uppercase tracking-widest">Close</Button>
                    <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest italic border-slate-200"><Printer size={14} className="mr-2" /> PRINT</Button>
                    <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest italic border-slate-200"><Send size={14} className="mr-2" /> EMAIL PDF</Button>
                    <Button onClick={handleSubmit} className="bg-indigo-600 text-white text-[10px] font-black uppercase px-12 italic shadow-xl shadow-indigo-100">Post Receipt & Settle Invoices</Button>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
