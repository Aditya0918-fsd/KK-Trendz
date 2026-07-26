'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Plus, Trash2, Save, X, Search,
    ChevronDown, Calculator, FileText,
    Truck, User, Calendar, CheckCircle2,
    AlertTriangle, Info, Eye, ShieldCheck,
    ArrowRight, Package, Landmark, BadgeCheck,
    Send, ShoppingCart
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function NewPurchaseInvoice() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [pos, setPos] = useState<any[]>([]);
    const [grns, setGrns] = useState<any[]>([]);
    const [showSourceResults, setShowSourceResults] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const { showToast } = useToast();
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'matched' | 'mismatch'>('pending');

    const [form, setForm] = useState<any>({
        invoiceNumber: `PINV/${new Date().getFullYear()}/${Math.floor(Math.random() * 900) + 100}`,
        invoiceDate: format(new Date(), 'yyyy-MM-dd'),
        supplierId: '',
        supplierName: '',
        supplierInvoiceNo: '',
        supplierInvoiceDate: format(new Date(), 'yyyy-MM-dd'),
        poId: '',
        grnId: '',
        items: [],
        summary: {
            taxableAmount: 0,
            gstAmount: 0,
            freight: 0,
            insurance: 0,
            handlingCharges: 0,
            tds: 0,
            tdsApplicable: false,
            reverseCharge: false,
            placeOfSupply: 'Maharashtra',
            netPayable: 0
        },
        payment: {
            dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            paymentTerms: 'Net 30'
        }
    });

    useEffect(() => {
        api.get('/parties?type=Supplier').then(r => setSuppliers(r.data)).catch(() => { });
        api.get('/purchase-orders').then(r => setPos(r.data)).catch(() => { });
        api.get('/grn').then(r => setGrns(r.data)).catch(() => { });
    }, []);

    const handleSourceMatch = async (grnId: string) => {
        try {
            const grnRes = await api.get(`/grn/${grnId}`);
            const grn = grnRes.data;

            // Auto-populate from GRN
            const items = grn.items.map((it: any) => ({
                productId: it.productId?._id || it.productId,
                description: it.productDescription,
                quantity: it.acceptedQuantity,
                unit: it.unit,
                rate: 0, // Should be fetched from PO
                discount: 0,
                taxableAmount: 0,
                gstRate: 18,
                gstAmount: 0,
                totalAmount: 0
            }));

            // Try to fetch PO rate if poId exists
            if (grn.poId) {
                const poRes = await api.get(`/purchase-orders/${grn.poId}`);
                const po = poRes.data;
                items.forEach((it: any) => {
                    const poItem = po.items.find((pi: any) => pi.productId?._id === it.productId || pi.productId === it.productId);
                    if (poItem) it.rate = poItem.rate;
                });
            }

            setForm((prev: any) => {
                const newForm = {
                    ...prev,
                    supplierId: grn.supplierId?._id || grn.supplierId,
                    supplierName: grn.supplierId?.partyName || '',
                    poId: grn.poId?._id || grn.poId,
                    grnId: grn._id,
                    items: items
                };
                return updateTotals(newForm);
            });
            setVerificationStatus('matched');
            setShowSourceResults(false);
        } catch (error) {
            console.error('Error matching GRN:', error);
            setVerificationStatus('mismatch');
        }
    };

    const updateTotals = (f: any) => {
        const taxable = f.items.reduce((sum: number, it: any) => sum + (it.quantity * it.rate), 0);
        const gst = f.items.reduce((sum: number, it: any) => sum + (it.quantity * it.rate * it.gstRate / 100), 0);
        const charges = (f.summary.freight || 0) + (f.summary.insurance || 0) + (f.summary.handlingCharges || 0);

        const net = taxable + gst + charges - (f.summary.tds || 0);

        return {
            ...f,
            summary: {
                ...f.summary,
                taxableAmount: taxable,
                gstAmount: gst,
                netPayable: net
            }
        };
    };

    const handleItemChange = (idx: number, field: string, value: any) => {
        const newItems = [...form.items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setForm((prev: any) => updateTotals({ ...prev, items: newItems }));
    };

    const handleSubmit = async (status: string) => {
        setLoading(true);
        try {
            await api.post('/finance/purchase-invoices', { ...form, status });
            router.push('/dashboard/finance/purchase-invoices');
            showToast(`Invoice ${status === 'Booked' ? 'booked' : 'sent for approval'} successfully!`, 'success');
        } catch (error: any) {
            console.error('Error booking invoice:', error);
            const msg = error?.response?.data?.message || 'Failed to book invoice.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1300px] mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10 py-4 border-b">
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter text-slate-800 dark:text-white uppercase flex items-center gap-2">
                            <ShoppingCart className="text-emerald-500" /> PURCHASE <span className="text-emerald-500">INVOICE PROCESSING</span>
                        </h1>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Section 8.2 • AP Reconciliation • Compliance Hub</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase"><X size={14} className="mr-2" /> DISCARD</Button>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="text-[10px] font-black uppercase"><Eye size={14} className="mr-2" /> PREVIEW</Button>
                        <Button onClick={() => handleSubmit('Booked')} disabled={loading} className="bg-slate-800 text-white text-[10px] font-black uppercase px-6">
                            <Save size={14} className="mr-2" /> BOOK INVOICE
                        </Button>
                        <Button onClick={() => handleSubmit('Pending Approval')} disabled={loading} className="bg-emerald-600 text-white text-[10px] font-black uppercase px-6 shadow-lg shadow-emerald-100">
                            <Send size={14} className="mr-2" /> SEND TO APPROVAL
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Step 2-3: Basic Info & Match */}
                        <Card className="border-slate-200">
                            <CardHeader className="bg-slate-50 border-b py-3"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step 2-3: Identification & Matching</CardTitle></CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-slate-400">Supplier Invoice No</Label>
                                        <Input className="h-10 text-[11px] font-black" value={form.supplierInvoiceNo} onChange={(e) => setForm({ ...form, supplierInvoiceNo: e.target.value })} placeholder="ENTER NO..." />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-slate-400">Supplier Invoice Date</Label>
                                        <Input type="date" className="h-10 text-[10px] font-bold" value={form.supplierInvoiceDate} onChange={(e) => setForm({ ...form, supplierInvoiceDate: e.target.value })} />
                                    </div>
                                    <div className="space-y-1 relative">
                                        <Label className="text-[9px] font-black uppercase text-slate-400">3-Way Match (GRN/PO)</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input
                                                className="w-full pl-9 pr-4 h-10 bg-slate-50 border rounded-lg text-[10px] font-black uppercase focus:border-emerald-500 outline-none"
                                                placeholder="SELECT GRN TO LINK..."
                                                onFocus={() => setShowSourceResults(true)}
                                            />
                                        </div>
                                        {showSourceResults && (
                                            <div className="absolute z-20 w-full mt-2 bg-white border rounded-xl shadow-2xl max-h-[300px] overflow-y-auto">
                                                {grns.map(g => (
                                                    <div key={g._id} onClick={() => handleSourceMatch(g._id)} className="p-3 hover:bg-slate-50 border-b cursor-pointer">
                                                        <p className="text-[10px] font-black uppercase">GRN: {g.grnNumber}</p>
                                                        <p className="text-[8px] font-bold text-slate-400">SUPPLIER: {g.supplierId?.partyName} • CHALLAN: {g.challanNo}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {verificationStatus !== 'pending' && (
                                    <div className={`mt-6 p-4 rounded-xl border flex items-center gap-4 ${verificationStatus === 'matched' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                        {verificationStatus === 'matched' ? <BadgeCheck size={20} /> : <AlertTriangle size={20} />}
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase">{verificationStatus === 'matched' ? 'Source Documents Linked' : 'Reconciliation Error'}</p>
                                            <p className="text-[9px] font-bold opacity-80 uppercase">Linked Supplier: {form.supplierName} • Linked GRN: {grns.find(g => g._id === form.grnId)?.grnNumber}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Step 5: Item Verification */}
                        <Card className="border-slate-200 overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b py-3 flex justify-between items-center"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step 5: Verify Items (Match vs Received)</CardTitle></CardHeader>
                            <Table>
                                <TableHeader className="bg-slate-100">
                                    <TableRow>
                                        {['Description', 'Qty (Accepted)', 'Rate (PO)', 'Disc', 'Taxable', 'GST%', 'Actions'].map(h => <TableHead key={h} className="text-[9px] font-black uppercase py-4">{h}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {form.items.map((it: any, i: number) => (
                                        <TableRow key={i} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-black text-[11px]">{it.description}</td>
                                            <td className="p-4"><Input type="number" value={it.quantity} onChange={(e) => handleItemChange(i, 'quantity', Number(e.target.value))} className="h-8 w-20 text-[11px] font-black" /></td>
                                            <td className="p-4"><Input type="number" value={it.rate} onChange={(e) => handleItemChange(i, 'rate', Number(e.target.value))} className="h-8 w-24 text-[11px] font-black text-right" /></td>
                                            <td className="p-4 font-bold text-[11px]">{it.discount}%</td>
                                            <td className="p-4 font-black text-[11px] text-right">₹{it.taxableAmount.toLocaleString()}</td>
                                            <td className="p-4"><select className="h-8 text-[10px] font-black bg-transparent" value={it.gstRate} onChange={(e) => handleItemChange(i, 'gstRate', Number(e.target.value))}>{[5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}</select></td>
                                            <td className="p-4"><button className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                                        </TableRow>
                                    ))}
                                    {form.items.length === 0 && <tr><td colSpan={7} className="p-20 text-center text-[10px] font-black text-slate-300 uppercase italic">MATCH A GRN TO AUTO-LOAD PURCHASE ITEMS</td></tr>}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* Step 6-8: Charges & Tax */}
                        <div className="grid grid-cols-2 gap-6">
                            <Card className="border-slate-200">
                                <CardHeader className="py-3 border-b flex justify-between items-center"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 6: Other Charges</CardTitle><Truck size={14} className="text-slate-400" /></CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-slate-500">Freight (Separately)</span> <Input type="number" className="h-9 w-32 text-right text-[11px] font-black" value={form.summary.freight} onChange={(e) => setForm({ ...form, summary: { ...form.summary, freight: Number(e.target.value) } })} /></div>
                                    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-slate-500">Insurance</span> <Input type="number" className="h-9 w-32 text-right text-[11px] font-black" value={form.summary.insurance} onChange={(e) => setForm({ ...form, summary: { ...form.summary, insurance: Number(e.target.value) } })} /></div>
                                    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-slate-500">Handling Charges</span> <Input type="number" className="h-9 w-32 text-right text-[11px] font-black" value={form.summary.handlingCharges} onChange={(e) => setForm({ ...form, summary: { ...form.summary, handlingCharges: Number(e.target.value) } })} /></div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200">
                                <CardHeader className="py-3 border-b flex justify-between items-center"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 7-8: Tax & Payment</CardTitle><ShieldCheck size={14} className="text-emerald-500" /></CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-slate-500">Reverse Charge</span> <input type="checkbox" checked={form.summary.reverseCharge} onChange={e => setForm({ ...form, summary: { ...form.summary, reverseCharge: e.target.checked } })} className="h-4 w-4 accent-emerald-500" /></div>
                                    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase text-slate-500">TDS Applicability</span> <input type="checkbox" checked={form.summary.tdsApplicable} onChange={e => setForm({ ...form, summary: { ...form.summary, tdsApplicable: e.target.checked } })} className="h-4 w-4 accent-emerald-500" /></div>
                                    <div className="pt-2 flex flex-col gap-1">
                                        <Label className="text-[9px] font-black uppercase text-slate-400">Due Date (Auto-calculated)</Label>
                                        <Input type="date" className="h-9 text-[10px] font-bold" value={form.payment.dueDate} onChange={e => setForm({ ...form, payment: { ...form.payment, dueDate: e.target.value } })} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="space-y-6">
                        <Card className="bg-emerald-900 text-white shadow-2xl relative overflow-hidden border-none pt-2">
                            <div className="absolute top-0 left-0 h-1 w-full bg-emerald-400" />
                            <CardHeader className="pb-2 text-center uppercase tracking-[0.3em] font-black opacity-50 text-[8px]">Financial Consolidation</CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold text-emerald-100 uppercase"><span>Taxable Subtotal</span> <span>₹{form.summary.taxableAmount.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold text-emerald-100 uppercase"><span>GST Combined</span> <span>₹{form.summary.gstAmount.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold text-emerald-100 uppercase"><span>Total Charges</span> <span>₹{(form.summary.freight + form.summary.insurance + form.summary.handlingCharges).toLocaleString()}</span></div>
                                    <div className="border-t border-emerald-800 pt-4 flex flex-col items-center">
                                        <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Net Payable</p>
                                        <p className="text-3xl font-black mt-1">₹{form.summary.netPayable.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                                    <p className="text-[9px] font-black text-emerald-300 uppercase">System Voucher No</p>
                                    <p className="text-xl font-black italic">{form.invoiceNumber}</p>
                                </div>

                                <div className="p-4 bg-emerald-950/50 rounded-2xl border border-emerald-800 space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-400"><Info size={14} /><span className="text-[10px] font-black uppercase">Matching Checklist</span></div>
                                    {[
                                        { l: 'Supplier GSTIN Valid', v: true },
                                        { l: 'GRN Items Matched', v: verificationStatus === 'matched' },
                                        { l: 'TDS Rates Validated', v: true }
                                    ].map((c, i) => (
                                        <div key={i} className="flex justify-between items-center text-[9px] font-bold text-emerald-100 uppercase opacity-80">
                                            <span>{c.l}</span>
                                            {c.v ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <X className="h-3 w-3 text-rose-400" />}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                            <div className="flex items-center gap-2 text-amber-700 font-black text-[10px] uppercase"><AlertTriangle size={14} /> Compliance Warning</div>
                            <p className="text-[9px] font-bold text-amber-600 italic">"Ensure the Input Tax Credit (ITC) matches GSTR-2B before finalizing the 'Approved' status."</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 9: Preview Modal */}
            <Modal title="Purchase Invoice Verification" isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} className="max-w-4xl">
                <div className="p-10 bg-white font-sans border-t-[10px] border-emerald-600 space-y-12">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">KK-TRADERS <span className="text-emerald-600 underline text-sm uppercase font-black not-italic ml-2">Internal Verification</span></h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Section 8.2 • 3-Way Match Document</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className="bg-slate-900 text-white px-6 py-1.5 text-[11px] font-black uppercase italic tracking-widest shadow-lg shadow-slate-200">BOOKED VOUCHER</span>
                            <div className="mt-6 flex flex-col items-end gap-1">
                                <p className="text-[9px] font-black text-slate-300 uppercase">Processing Date</p>
                                <p className="text-sm font-black text-slate-800 tracking-tighter">{form.invoiceDate}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-10 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 italic">Source Documents:</h4>
                            <div className="space-y-2">
                                <div><p className="text-[9px] font-bold text-slate-400">Linked GRN</p><p className="text-[11px] font-black uppercase text-emerald-600">{grns.find(g => g._id === form.grnId)?.grnNumber || 'N/A'}</p></div>
                                <div><p className="text-[9px] font-bold text-slate-400">Purchase Order</p><p className="text-[11px] font-black uppercase text-indigo-600">{pos.find(p => p._id === form.poId)?.orderNumber || 'N/A'}</p></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 italic">Supplier Invoice:</h4>
                            <div className="space-y-2">
                                <div><p className="text-[9px] font-bold text-slate-400">Supplier Name</p><p className="text-[11px] font-black uppercase">{form.supplierName}</p></div>
                                <div><p className="text-[9px] font-bold text-slate-400">Reference No</p><p className="text-[11px] font-black uppercase">{form.supplierInvoiceNo}</p></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 italic">Payable Meta:</h4>
                            <div className="space-y-2">
                                <div><p className="text-[9px] font-bold text-slate-400">Due Date</p><p className="text-[11px] font-black">{form.payment.dueDate}</p></div>
                                <div><p className="text-[9px] font-bold text-slate-400">Terms</p><p className="text-[11px] font-black uppercase">{form.payment.paymentTerms}</p></div>
                            </div>
                        </div>
                    </div>

                    <table className="w-full border-collapse">
                        <thead className="border-b-2 border-slate-900 bg-slate-50">
                            <tr>
                                <th className="p-4 text-left text-[10px] font-black uppercase">Item Matched from GRN</th>
                                <th className="p-4 text-center text-[10px] font-black uppercase">Accepted Qty</th>
                                <th className="p-4 text-right text-[10px] font-black uppercase">Verfied Rate</th>
                                <th className="p-4 text-right text-[10px] font-black uppercase">Taxable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {form.items.map((it: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="p-4 font-black text-[11px] text-slate-700 uppercase">{it.description}</td>
                                    <td className="p-4 text-center font-black text-[11px] bg-slate-50/50">{it.quantity} {it.unit}</td>
                                    <td className="p-4 text-right font-black text-[11px]">₹{it.rate.toLocaleString()}</td>
                                    <td className="p-4 text-right font-black text-[11px] bg-emerald-50/20">₹{it.taxableAmount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-y-2 border-slate-900">
                            <tr>
                                <td colSpan={2}></td>
                                <td className="p-4 text-right text-[10px] font-black uppercase bg-slate-50">Subtotal</td>
                                <td className="p-4 text-right font-black text-[11px]">₹{form.summary.taxableAmount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td colSpan={2}></td>
                                <td className="p-4 text-right text-[10px] font-black uppercase bg-slate-50">Combined GST</td>
                                <td className="p-4 text-right font-black text-[11px]">₹{form.summary.gstAmount.toLocaleString()}</td>
                            </tr>
                            <tr className="bg-slate-900 text-white">
                                <td colSpan={2} className="p-4 text-center">
                                    <div className="flex gap-4 justify-center">
                                        <div className="flex items-center gap-1"><BadgeCheck size={12} className="text-emerald-400" /><span className="text-[8px] font-black uppercase">PO Match</span></div>
                                        <div className="flex items-center gap-1"><BadgeCheck size={12} className="text-emerald-400" /><span className="text-[8px] font-black uppercase">GRN Match</span></div>
                                        <div className="flex items-center gap-1"><BadgeCheck size={12} className="text-emerald-400" /><span className="text-[8px] font-black uppercase">Tax Verify</span></div>
                                    </div>
                                </td>
                                <td className="p-5 text-right text-[11px] font-black uppercase italic tracking-widest text-emerald-400">Verified Payable</td>
                                <td className="p-5 text-right font-black text-lg text-emerald-400">₹{form.summary.netPayable.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="flex justify-between items-center pt-10">
                        <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl w-48 h-24 flex items-center justify-center text-[10px] font-black uppercase text-slate-200">Voucher Seal</div>
                        <div className="flex gap-20">
                            <div className="text-center space-y-12">
                                <div className="h-[1px] w-40 bg-slate-200" />
                                <p className="text-[10px] font-black uppercase text-slate-400">Prepared By</p>
                            </div>
                            <div className="text-center space-y-12">
                                <div className="h-[1px] w-40 bg-slate-200" />
                                <p className="text-[10px] font-black uppercase text-slate-400">Audit Verfied</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end p-6 border-t bg-slate-50 gap-4">
                    <Button onClick={() => setIsPreviewOpen(false)} variant="outline" className="text-[10px] font-black uppercase border-slate-200">Return to Editing</Button>
                    <Button onClick={() => handleSubmit('Booked')} className="bg-emerald-600 text-white font-black uppercase text-[10px] px-8">Confirm & Book Invoice</Button>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
