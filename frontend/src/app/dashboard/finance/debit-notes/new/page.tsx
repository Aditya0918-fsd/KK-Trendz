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
    ArrowLeftRight, FileWarning, CheckCircle2,
    AlertTriangle, Info, Eye, ShieldCheck,
    FileText, ShoppingBag, Truck
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/Toast';

export default function NewDebitNote() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [showInvoiceResults, setShowInvoiceResults] = useState(false);
    const { showToast } = useToast();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [form, setForm] = useState<any>({
        debitNoteNumber: `DN/${new Date().getFullYear()}/${Math.floor(Math.random() * 900) + 100}`,
        debitNoteType: 'Purchase Return',
        debitNoteDate: format(new Date(), 'yyyy-MM-dd'),
        referenceInvoiceId: '',
        referenceInvoiceNo: '',
        supplierId: '',
        supplierName: '',
        supplierGSTIN: '',
        reason: 'Material Defective / Damaged',
        items: [],
        summary: {
            totalDebitNoteValue: 0
        }
    });

    useEffect(() => {
        api.get('/finance/purchase-invoices').then(r => setInvoices(r.data.invoices || [])).catch(() => { });
    }, []);

    const handleInvoiceLink = async (invId: string) => {
        try {
            const inv = invoices.find(i => i._id === invId);
            if (!inv) return;

            setForm((prev: any) => ({
                ...prev,
                referenceInvoiceId: inv._id,
                referenceInvoiceNo: inv.invoiceNumber,
                supplierId: inv.supplierId?._id || inv.supplierId,
                supplierName: inv.supplierId?.partyName || inv.supplierId?.name || '',
                supplierGSTIN: inv.supplierId?.gstin || '',
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
        setForm((prev: any) => ({ ...prev, items: newItems, summary: { totalDebitNoteValue: total } }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/finance/debit-notes', form);
            router.push('/dashboard/finance/debit-notes');
            showToast('Debit note generated successfully!', 'success');
        } catch (error: any) {
            console.error('Error generating debit note:', error);
            const msg = error?.response?.data?.message || 'Failed to generate debit note.';
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
                            <FileWarning className="text-rose-500" /> CREATE <span className="text-rose-500">DEBIT NOTE</span>
                        </h1>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Section 8.3 • Purchase Returns • Account Adjustment</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase"><X size={14} className="mr-2" /> CANCEL</Button>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="text-[10px] font-black uppercase"><Eye size={14} className="mr-2" /> PREVIEW NOTE</Button>
                        <Button onClick={handleSubmit} disabled={loading || !form.referenceInvoiceId} className="bg-rose-600 text-white text-[10px] font-black uppercase px-6 shadow-lg shadow-rose-100 italic">
                            {loading ? 'GENERATING...' : 'GENERATE DEBIT NOTE'} <Save size={14} className="ml-2" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Source Linking */}
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50 border-b py-3 flex justify-between items-center">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Step 3: Document Reconciliation</CardTitle>
                                <ArrowLeftRight size={14} className="text-rose-400" />
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1 relative">
                                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Select Purchase Invoice</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input
                                                className="w-full pl-9 pr-4 h-10 bg-slate-50 border rounded-lg text-[10px] font-black uppercase outline-none focus:border-rose-400"
                                                placeholder="SEARCH INVOICE TO RETURN FROM..."
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
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{inv.supplierId?.partyName || inv.supplierId?.name} • ₹{inv.summary?.netPayable?.toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Reason for Return</Label>
                                        <select
                                            className="w-full h-10 bg-slate-50 border rounded-lg text-[10px] font-black uppercase px-3 outline-none focus:border-rose-400"
                                            value={form.reason}
                                            onChange={e => setForm({ ...form, reason: e.target.value })}
                                        >
                                            <option>Material Defective / Damaged</option>
                                            <option>Shortage in Shipment</option>
                                            <option>Wrong Material Received</option>
                                            <option>Price Difference Adjustment</option>
                                        </select>
                                    </div>
                                </div>

                                {form.supplierName && (
                                    <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Linked Supplier</p>
                                            <p className="text-sm font-black text-slate-700 uppercase italic tracking-tighter">{form.supplierName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">GSTIN</p>
                                            <p className="text-[11px] font-black text-slate-900">{form.supplierGSTIN || 'N/A'}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Items Selection */}
                        <Card className="border-slate-200 overflow-hidden shadow-sm">
                            <CardHeader className="bg-slate-50 border-b py-3 flex justify-between items-center"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Select Items & Quantities</CardTitle></CardHeader>
                            <Table>
                                <TableHeader className="bg-slate-100">
                                    <TableRow>
                                        {['Description', 'Original Qty', 'Return Qty', 'Unit Fee', 'Total Ret Value'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase py-4">{h}</TableHead>)}
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
                                                    className="h-8 w-24 text-[11px] font-black border-rose-100 focus:border-rose-400"
                                                    max={it.originalQuantity}
                                                />
                                            </td>
                                            <td className="p-4 text-[11px] font-black text-slate-400">₹{it.rate.toLocaleString()}</td>
                                            <td className="p-4 text-right font-black text-[12px] text-rose-600 italic">₹{it.totalAmount.toLocaleString()}</td>
                                        </TableRow>
                                    ))}
                                    {form.items.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center flex flex-col items-center gap-2">
                                                <ShoppingBag size={32} className="text-slate-100" />
                                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] italic">Select a Purchase Invoice to start return</p>
                                            </td>
                                        </tr>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Adjustment Card */}
                        <Card className="bg-slate-900 text-white shadow-2xl relative overflow-hidden border-none">
                            <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <CardHeader className="pb-2 text-center uppercase tracking-[0.3em] font-black opacity-40 text-[8px] border-b border-white/5 py-4">Financial Write-Back</CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest italic mb-2 leading-none">Net Adjustment Value</p>
                                    <p className="text-4xl font-black italic tracking-tighter">₹{form.summary.totalDebitNoteValue.toLocaleString()}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Note Index Allocation</p>
                                        <p className="text-lg font-black italic tracking-tight">{form.debitNoteNumber}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                                            <p className="text-[8px] font-black text-slate-500 uppercase">Return Status</p>
                                            <p className="text-[10px] font-black uppercase text-rose-500 italic mt-1">Pending Approval</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 space-y-2">
                                    <div className="flex items-center gap-2 text-orange-400"><AlertTriangle size={14} /><span className="text-[9px] font-black uppercase">Accounting Lock</span></div>
                                    <p className="text-[8px] font-bold text-orange-200/50 italic leading-relaxed uppercase italic">"Generating this note will automatically deduct the balance from Accounts Payable (Sundry Creditors) for this vendor."</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audit Note */}
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4">
                            <Info size={16} className="text-slate-400 shrink-0" />
                            <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase italic">Step 5-6: After generation, print 2 copies of document. One for Supplier (Return Goods) and one for Accounts Record.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 4: Preview Modal */}
            <Modal title="Debit Note Preview (Form GST DRC-03 Ref)" isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} className="max-w-4xl">
                <div className="p-12 bg-white font-sans border-t-[12px] border-rose-600 space-y-12">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">KK-TRADERS <span className="text-rose-600 text-sm italic ml-2">Debit Note (Purchase Return)</span></h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Compliance Document • Section 8.3 Adjustment</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-rose-600 text-white px-6 py-2 text-[12px] font-black uppercase italic tracking-[0.2em] shadow-2xl">DEBIT NOTE</div>
                            <p className="text-[11px] font-black text-slate-800 mt-4 italic">{form.debitNoteNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20 pt-10 border-t border-slate-100">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 italic underline decoration-rose-200 underline-offset-4">Return To Supplier:</h4>
                            <p className="text-lg font-black text-slate-800 uppercase leading-none tracking-tight">{form.supplierName}</p>
                            <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">GSTIN: {form.supplierGSTIN}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase">Note Date</p><p className="text-[11px] font-black">{form.debitNoteDate}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase">Inv. Ref</p><p className="text-[11px] font-black">{form.referenceInvoiceNo}</p></div>
                            <div className="col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase">Reason</p><p className="text-[11px] font-black text-rose-600 italic uppercase">{form.reason}</p></div>
                        </div>
                    </div>

                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-4 text-left text-[11px] font-black uppercase border-r border-white/10">Description of Returned Goods</th>
                                <th className="p-4 text-center text-[11px] font-black uppercase border-r border-white/10">Qty Ret.</th>
                                <th className="p-4 text-right text-[11px] font-black uppercase border-r border-white/10">Rate</th>
                                <th className="p-4 text-right text-[11px] font-black uppercase">Total Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 border-x border-slate-100">
                            {form.items.filter((it: any) => it.returnedQuantity > 0).map((it: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="p-5 text-[12px] font-black text-slate-700 uppercase">{it.productName}</td>
                                    <td className="p-5 text-center text-[12px] font-black text-rose-600 bg-rose-50/20">{it.returnedQuantity} {it.unit}</td>
                                    <td className="p-5 text-right text-[12px] font-bold text-slate-400">₹{it.rate.toLocaleString()}</td>
                                    <td className="p-5 text-right text-[12px] font-black bg-slate-50">₹{it.totalAmount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-900">
                            <tr className="bg-slate-50">
                                <td colSpan={3} className="p-6 text-right text-[11px] font-black uppercase tracking-widest">Gross Adjustment Amount (Incl. GST)</td>
                                <td className="p-6 text-right text-xl font-black text-rose-600 underline">₹{form.summary.totalDebitNoteValue.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="flex justify-between items-end pt-20">
                        <div className="space-y-4">
                            <div className="h-24 w-40 border-2 border-dotted border-slate-200 flex items-center justify-center text-[9px] font-black uppercase text-slate-200 rotate-[-5deg]">Internal Auditor Stamp</div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Section 8.3 Verified</p>
                        </div>
                        <div className="text-right space-y-12">
                            <div className="h-[1px] w-64 bg-slate-200 ml-auto" />
                            <p className="text-[11px] font-black uppercase text-slate-900">For KK-TRADERS <span className="text-slate-400 block font-normal mt-1">(Authorized Signatory)</span></p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                    <Button onClick={() => setIsPreviewOpen(false)} variant="ghost" className="text-[10px] font-black uppercase">Close Preview</Button>
                    <Button onClick={handleSubmit} className="bg-rose-600 text-white text-[10px] font-black uppercase px-10 italic">Generate Note & Update Ledger</Button>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
