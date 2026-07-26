'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    Plus, Trash2, Save, X, Search,
    ArrowLeftRight, FileCheck, CheckCircle2,
    AlertTriangle, Info, Eye, ShieldCheck,
    FileText, ShoppingBag, Truck
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/Toast';

export default function NewCreditNote() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [showInvoiceResults, setShowInvoiceResults] = useState(false);
    const { showToast } = useToast();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [form, setForm] = useState<any>({
        creditNoteNumber: `CN/${new Date().getFullYear()}/${Math.floor(Math.random() * 900) + 100}`,
        creditNoteType: 'Sales Return',
        creditNoteDate: format(new Date(), 'yyyy-MM-dd'),
        referenceInvoiceId: '',
        referenceInvoiceNo: '',
        customerId: '',
        customerName: '',
        customerGSTIN: '',
        reason: 'Material Defective / QC Failure',
        items: [],
        summary: {
            totalCreditNoteValue: 0
        }
    });

    useEffect(() => {
        api.get('/finance/sales-invoices').then(r => setInvoices(r.data.invoices || [])).catch(() => { });
    }, []);

    const handleInvoiceLink = async (invId: string) => {
        try {
            const inv = invoices.find(i => i._id === invId);
            if (!inv) return;

            setForm((prev: any) => ({
                ...prev,
                referenceInvoiceId: inv._id,
                referenceInvoiceNo: inv.invoiceNumber,
                customerId: inv.customerId?._id || inv.customerId,
                customerName: inv.customerId?.partyName || inv.customerId?.name || '',
                customerGSTIN: inv.customerId?.gstin || '',
                items: inv.items.map((it: any) => ({
                    productId: it.productId?._id || it.productId,
                    productName: it.description,
                    originalQuantity: it.quantity,
                    returnedQuantity: 0,
                    unit: it.unit,
                    rate: it.rate,
                    taxableValue: 0,
                    taxRate: it.gstRate,
                    totalAmount: 0
                }))
            }));
            setShowInvoiceResults(false);
        } catch (error) {
            console.error('Error linking invoice:', error);
        }
    };

    const handleItemChange = (idx: number, value: number) => {
        const newItems = [...form.items];
        const it = newItems[idx];
        it.returnedQuantity = value;
        it.taxableValue = value * it.rate;
        it.totalAmount = it.taxableValue * (1 + it.taxRate / 100);

        const total = newItems.reduce((sum, i) => sum + i.totalAmount, 0);
        setForm((prev: any) => ({ ...prev, items: newItems, summary: { totalCreditNoteValue: total } }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/finance/credit-notes', form);
            router.push('/dashboard/finance/credit-notes');
            showToast('Credit note generated successfully!', 'success');
        } catch (error: any) {
            console.error('Error generating credit note:', error);
            const msg = error?.response?.data?.message || 'Failed to generate credit note.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1200px] mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between border-b py-4 bg-white sticky top-0 z-10">
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter text-slate-800 uppercase flex items-center gap-2">
                            <FileCheck className="text-cyan-600" /> CREATE <span className="text-cyan-600">CREDIT NOTE</span>
                        </h1>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Section 8.3 • Sales Returns • Balance Adjustment</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase"><X size={14} className="mr-2" /> CANCEL</Button>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="text-[10px] font-black uppercase"><Eye size={14} className="mr-2" /> PREVIEW VOUCHER</Button>
                        <Button onClick={handleSubmit} disabled={loading || !form.referenceInvoiceId} className="bg-cyan-600 text-white text-[10px] font-black uppercase px-6 shadow-lg shadow-cyan-100 italic">
                            {loading ? 'GENERATING...' : 'POST CREDIT NOTE'} <Save size={14} className="ml-2" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Source Linking */}
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50 border-b py-3 flex justify-between items-center">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Step 1: Reference Sales Invoice</CardTitle>
                                <Search size={14} className="text-cyan-400" />
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1 relative">
                                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Select Sales Invoice</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input
                                                className="w-full pl-9 pr-4 h-10 bg-slate-50 border rounded-lg text-[10px] font-black uppercase outline-none focus:border-cyan-400"
                                                placeholder="SEARCH INVOICE TO ISSUE CREDIT FOR..."
                                                onFocus={() => setShowInvoiceResults(true)}
                                                value={form.referenceInvoiceNo}
                                                readOnly
                                            />
                                        </div>
                                        {showInvoiceResults && (
                                            <div className="absolute z-20 w-full mt-2 bg-white border rounded-xl shadow-2xl max-h-[250px] overflow-y-auto">
                                                {invoices.map(inv => (
                                                    <div key={inv._id} onClick={() => handleInvoiceLink(inv._id)} className="p-3 hover:bg-slate-50 border-b cursor-pointer transition-colors">
                                                        <p className="text-[10px] font-black uppercase">{inv.invoiceNumber}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{inv.customerId?.partyName || inv.customerId?.name} • ₹{inv.summary?.grandTotal?.toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Adjustment Reason</Label>
                                        <select
                                            className="w-full h-10 bg-slate-50 border rounded-lg text-[10px] font-black uppercase px-3 outline-none focus:border-cyan-400"
                                            value={form.reason}
                                            onChange={e => setForm({ ...form, reason: e.target.value })}
                                        >
                                            <option>Material Defective / Damaged</option>
                                            <option>Shortage in Shipment</option>
                                            <option>Wrong Material Sent</option>
                                            <option>Sales Discount / Rebate</option>
                                            <option>Price Adjustment (Post Bill)</option>
                                        </select>
                                    </div>
                                </div>

                                {form.customerName && (
                                    <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer Entity</p>
                                            <p className="text-sm font-black text-slate-700 uppercase italic tracking-tighter">{form.customerName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">GSTIN</p>
                                            <p className="text-[11px] font-black text-slate-900">{form.customerGSTIN || 'UNREGISTERED'}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Items Selection */}
                        <Card className="border-slate-200 overflow-hidden shadow-sm">
                            <CardHeader className="bg-slate-50 border-b py-3 flex justify-between items-center"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Select Returned Items</CardTitle></CardHeader>
                            <Table>
                                <TableHeader className="bg-slate-100">
                                    <TableRow>
                                        {['Description', 'Billed Qty', 'Return Qty', 'Unit Price', 'Credit Value'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase py-4">{h}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.items.map((it: any, i: number) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-black text-[11px] uppercase text-slate-700">{it.productName}</td>
                                            <td className="p-4 text-[11px] font-bold text-slate-400 italic">{it.originalQuantity} {it.unit}</td>
                                            <td className="p-4">
                                                <Input
                                                    type="number"
                                                    value={it.returnedQuantity}
                                                    onChange={(e) => handleItemChange(i, Number(e.target.value))}
                                                    className="h-8 w-24 text-[11px] font-black border-cyan-100 focus:border-cyan-400"
                                                    max={it.originalQuantity}
                                                />
                                            </td>
                                            <td className="p-4 text-[11px] font-black text-slate-400">₹{it.rate.toLocaleString()}</td>
                                            <td className="p-4 text-right font-black text-[12px] text-cyan-600 italic">₹{it.totalAmount.toLocaleString()}</td>
                                        </TableRow>
                                    ))}
                                    {form.items.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center flex flex-col items-center gap-2">
                                                <ShoppingBag size={32} className="text-slate-100" />
                                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] italic uppercase">Reference a Sales Invoice to process credit</p>
                                            </td>
                                        </tr>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Adjustment Card */}
                        <Card className="bg-slate-900 text-white shadow-2xl relative overflow-hidden border-none pt-2">
                            <div className="absolute top-0 left-0 h-1 w-full bg-cyan-400" />
                            <CardHeader className="pb-2 text-center uppercase tracking-[0.3em] font-black opacity-40 text-[8px] border-b border-white/5 py-4">AR Adjustment summary</CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-cyan-400 tracking-widest italic mb-2 leading-none">Total Credit Value</p>
                                    <p className="text-4xl font-black italic tracking-tighter">₹{form.summary.totalCreditNoteValue.toLocaleString()}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Note Number</p>
                                        <p className="text-lg font-black italic tracking-tight">{form.creditNoteNumber}</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                                        <p className="text-[8px] font-black text-slate-500 uppercase">Adjustment Status</p>
                                        <p className="text-[10px] font-black uppercase text-cyan-500 italic mt-1 font-black">Applied to AR</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 space-y-2">
                                    <div className="flex items-center gap-2 text-cyan-400"><Info size={14} /><span className="text-[9px] font-black uppercase tracking-widest">GSTR-1 Impact</span></div>
                                    <p className="text-[8px] font-bold text-cyan-200/50 italic leading-relaxed uppercase">"Issuing this note will adjust your Output GST Liability in the next GSTR-1 filing."</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4">
                            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                            <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase italic">Approved Credit Notes will be automatically deducted from the Customer's Outstanding Balance (Sundry Debtors).</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <Modal title="Credit Note Commercial Preview" isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} className="max-w-4xl">
                <div className="p-12 bg-white font-sans border-t-[12px] border-cyan-600 space-y-12">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">KK-TRADERS <span className="text-cyan-600 text-sm italic ml-2">Credit Note</span></h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tax Document • Sales Return Adjustment</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-cyan-600 text-white px-6 py-2 text-[12px] font-black uppercase italic tracking-[0.2em] shadow-xl">CREDIT NOTE</div>
                            <p className="text-[11px] font-black text-slate-800 mt-4 italic">{form.creditNoteNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 pt-10 border-t border-slate-100">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 italic underline decoration-cyan-200 underline-offset-4">Customer Entity:</h4>
                            <p className="text-lg font-black text-slate-800 uppercase leading-none tracking-tight">{form.customerName}</p>
                            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">GSTIN: {form.customerGSTIN}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase">Note Date</p><p className="text-[11px] font-black">{form.creditNoteDate}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase">Orig. Inv Ref</p><p className="text-[11px] font-black">{form.referenceInvoiceNo}</p></div>
                            <div className="col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase">Reason</p><p className="text-[11px] font-black text-cyan-600 italic uppercase underline decoration-cyan-100">{form.reason}</p></div>
                        </div>
                    </div>

                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-4 text-left text-[11px] font-black uppercase border-r border-white/10">Goods Description</th>
                                <th className="p-4 text-center text-[11px] font-black uppercase border-r border-white/10">Qty Ret.</th>
                                <th className="p-4 text-right text-[11px] font-black uppercase border-r border-white/10">Rate</th>
                                <th className="p-4 text-right text-[11px] font-black uppercase">Taxable Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 border-x border-slate-100">
                            {form.items.filter((it: any) => it.returnedQuantity > 0).map((it: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="p-5 text-[12px] font-black text-slate-700 uppercase">{it.productName}</td>
                                    <td className="p-5 text-center text-[12px] font-black text-cyan-600 bg-cyan-50/20">{it.returnedQuantity} {it.unit}</td>
                                    <td className="p-5 text-right text-[12px] font-bold text-slate-400">₹{it.rate.toLocaleString()}</td>
                                    <td className="p-5 text-right text-[12px] font-black bg-slate-50">₹{it.taxableValue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-900">
                            <tr className="bg-slate-50">
                                <td colSpan={3} className="p-6 text-right text-[11px] font-black uppercase tracking-widest italic">Net Credit Adjustment (Incl. Taxes)</td>
                                <td className="p-6 text-right text-xl font-black text-cyan-700 underline decoration-double">₹{form.summary.totalCreditNoteValue.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="flex justify-between items-end pt-24">
                        <div className="space-y-4">
                            <div className="h-24 w-40 border-2 border-dotted border-slate-200 flex items-center justify-center text-[9px] font-black uppercase text-slate-200 rotate-[-5deg]">Authorized Seal</div>
                            <p className="text-[10px] font-black uppercase text-slate-400 italic">For Sales Return Tracking</p>
                        </div>
                        <div className="text-right space-y-12">
                            <div className="h-[1px] w-64 bg-slate-200 ml-auto shadow-sm" />
                            <p className="text-[11px] font-black uppercase text-slate-900 italic tracking-widest">For KK-TRADERS <span className="text-slate-400 block font-normal mt-1 tracking-normal not-italic">(Verified Signatory)</span></p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 shadow-inner">
                    <Button onClick={() => setIsPreviewOpen(false)} variant="ghost" className="text-[10px] font-black uppercase tracking-widest">Close</Button>
                    <Button onClick={handleSubmit} className="bg-cyan-600 text-white text-[10px] font-black uppercase px-12 italic shadow-lg shadow-cyan-100">Confirm & Post Adjustment</Button>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
