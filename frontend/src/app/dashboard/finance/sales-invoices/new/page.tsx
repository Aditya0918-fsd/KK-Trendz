'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Plus, Trash2, Save, X, Search,
    ChevronDown, Calculator, FileText,
    Percent, Truck, User, Calendar,
    FileCheck, ArrowRight, Package,
    Layers, ShieldCheck, BadgeCheck,
    CreditCard, Landmark, Eye, Info
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function NewSalesInvoice() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [sourceType, setSourceType] = useState<'Order' | 'Dispatch'>('Dispatch');
    const [orders, setOrders] = useState<any[]>([]);
    const [dispatches, setDispatches] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const { showToast } = useToast();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [form, setForm] = useState<any>({
        invoiceNumber: `SINV/${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${Math.floor(Math.random() * 900) + 100}`,
        invoiceDate: format(new Date(), 'yyyy-MM-dd'),
        orderId: '',
        dispatchId: '',
        customerId: '',
        customerName: '',
        billingAddress: '',
        shippingAddress: '',
        invoiceType: 'Tax Invoice',
        placeOfSupply: '',
        reverseCharge: false,
        items: [],
        summary: {
            totalTaxable: 0,
            totalCgst: 0,
            totalSgst: 0,
            totalIgst: 0,
            totalGst: 0,
            totalInvoiceValue: 0,
            roundOff: 0,
            grandTotal: 0
        },
        transport: {
            transporterName: '',
            vehicleNumber: '',
            lrNumber: '',
            lrDate: '',
            distance: 0,
            eWayBillRequired: false,
            eWayBillNumber: ''
        },
        additionalCharges: [
            { chargeType: 'Freight', amount: 0, gstRate: 18, gstAmount: 0 },
            { chargeType: 'Packing', amount: 0, gstRate: 12, gstAmount: 0 },
            { chargeType: 'Insurance', amount: 0, gstRate: 18, gstAmount: 0 }
        ],
        payment: {
            dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            paymentTerms: 'Net 30',
            bankDetails: {
                bankName: 'HDFC BANK',
                accountNumber: '50200012345678',
                ifscCode: 'HDFC0001234',
                branch: 'MAIN BRANCH, MUMBAI'
            }
        }
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [ordRes, dispRes, partyRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/dispatch'),
                api.get('/parties')
            ]);
            setOrders(ordRes.data || []);
            setDispatches(dispRes.data || []);
            setCustomers(partyRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSourceSelect = async (id: string) => {
        try {
            let selectedSource: any;
            if (sourceType === 'Order') {
                const res = await api.get(`/sales-orders/${id}`);
                selectedSource = res.data;
                populateFromOrder(selectedSource);
            } else {
                const res = await api.get(`/dispatch/${id}`);
                selectedSource = res.data;
                populateFromDispatch(selectedSource);
            }
            setShowResults(false);
        } catch (error) {
            console.error('Error selecting source:', error);
        }
    };

    const populateFromOrder = (order: any) => {
        const items = order.items.map((it: any) => ({
            productId: it.productId?._id || it.productId,
            description: it.productName || it.description,
            hsnCode: it.hsnCode || '6201',
            quantity: it.quantity,
            unit: it.unit || 'PCS',
            rate: it.rate,
            discountPercentage: 0,
            discountAmount: 0,
            taxableValue: it.quantity * it.rate,
            gstRate: 12,
            gstAmount: (it.quantity * it.rate * 0.12),
            totalValue: (it.quantity * it.rate * 1.12)
        }));

        setForm((prev: any) => {
            const newForm = {
                ...prev,
                orderId: order._id,
                customerId: order.customerId?._id || order.customerId,
                customerName: order.customerId?.partyName || '',
                billingAddress: order.billingAddress || '',
                shippingAddress: order.shippingAddress || '',
                placeOfSupply: order.shippingAddress?.state || '',
                items: items
            };
            return updateTotals(newForm);
        });
    };

    const populateFromDispatch = (dispatch: any) => {
        const items = dispatch.items.map((it: any) => ({
            productId: it.productId?._id || it.productId,
            description: it.productName || it.description,
            hsnCode: it.hsnCode || '6201',
            quantity: it.quantity,
            unit: it.unit || 'PCS',
            rate: it.rate || 0,
            discountPercentage: 0,
            discountAmount: 0,
            taxableValue: it.quantity * (it.rate || 0),
            gstRate: 12,
            gstAmount: (it.quantity * (it.rate || 0) * 0.12),
            totalValue: (it.quantity * (it.rate || 0) * 1.12)
        }));

        setForm((prev: any) => {
            const newForm = {
                ...prev,
                dispatchId: dispatch._id,
                orderId: dispatch.orderId?._id || dispatch.orderId,
                customerId: dispatch.customerId?._id || dispatch.customerId,
                customerName: dispatch.customerId?.partyName || '',
                shippingAddress: dispatch.shippingAddress || '',
                placeOfSupply: dispatch.shippingAddress?.state || '',
                transport: {
                    ...prev.transport,
                    transporterName: dispatch.transporter?.name || '',
                    vehicleNumber: dispatch.transporter?.vehicleNumber || '',
                    lrNumber: dispatch.documents?.lrNumber || '',
                    lrDate: dispatch.documents?.lrDate ? format(new Date(dispatch.documents.lrDate), 'yyyy-MM-dd') : ''
                },
                items: items
            };
            return updateTotals(newForm);
        });
    };

    const updateTotals = (currentForm: any) => {
        const itemsTotalTaxable = currentForm.items.reduce((sum: number, it: any) => sum + it.taxableValue, 0);
        const chargesTotalTaxable = currentForm.additionalCharges.reduce((sum: number, c: any) => sum + c.amount, 0);

        const totalTaxable = itemsTotalTaxable + chargesTotalTaxable;

        // Split GST
        const isInterstate = currentForm.placeOfSupply !== 'Maharashtra'; // Assume Maharashtra is base
        const totalGst = currentForm.items.reduce((sum: number, it: any) => sum + it.gstAmount, 0) +
            currentForm.additionalCharges.reduce((sum: number, c: any) => sum + (c.amount * c.gstRate / 100), 0);

        const totalIgst = isInterstate ? totalGst : 0;
        const totalCgst = isInterstate ? 0 : totalGst / 2;
        const totalSgst = isInterstate ? 0 : totalGst / 2;

        const totalInvoiceValue = totalTaxable + totalGst;
        const grandTotal = Math.round(totalInvoiceValue);
        const roundOff = Number((grandTotal - totalInvoiceValue).toFixed(2));

        return {
            ...currentForm,
            summary: {
                totalTaxable,
                totalCgst,
                totalSgst,
                totalIgst,
                totalGst,
                totalInvoiceValue,
                roundOff,
                grandTotal
            },
            transport: {
                ...currentForm.transport,
                eWayBillRequired: grandTotal > 50000
            }
        };
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...form.items];
        const item = { ...newItems[index], [field]: value };

        item.taxableValue = (item.quantity * item.rate) - (item.discountAmount || 0);
        item.gstAmount = item.taxableValue * (item.gstRate / 100);
        item.totalValue = item.taxableValue + item.gstAmount;

        newItems[index] = item;
        setForm((prev: any) => updateTotals({ ...prev, items: newItems }));
    };

    const handleChargeChange = (index: number, value: number) => {
        const newCharges = [...form.additionalCharges];
        newCharges[index].amount = value;
        setForm((prev: any) => updateTotals({ ...prev, additionalCharges: newCharges }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/sales-invoices', form);
            router.push('/dashboard/finance/sales-invoices');
            showToast('Invoice saved successfully!', 'success');
        } catch (error: any) {
            console.error('Error saving invoice:', error);
            const msg = error?.response?.data?.message || 'Failed to save invoice.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1300px] mx-auto space-y-6 pb-20">
                {/* Fixed Top Header */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter text-slate-800 dark:text-white uppercase flex items-center gap-2">
                            <FileText className="text-indigo-600" /> SALES <span className="text-indigo-600">INVOICE PREP</span>
                        </h1>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Section 8.1 • Billing Workflow FY 2024-25</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase tracking-wider"><X size={14} className="mr-2" /> DISCARD</Button>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="text-[10px] font-black uppercase tracking-wider border-indigo-200 text-indigo-600"><Eye size={14} className="mr-2" /> PREVIEW INVOICE</Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-8 shadow-lg shadow-indigo-100 dark:shadow-none">
                            <Save size={14} className="mr-2" /> {loading ? 'GENERATING...' : 'FINALIZE & SAVE'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Step 2-3: Navigation & Source Selection */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <ArrowRight size={14} className="text-indigo-500" /> Step 2-3: Select Source Document
                                </CardTitle>
                                <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 shadow-inner">
                                    <button
                                        onClick={() => setSourceType('Dispatch')}
                                        className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${sourceType === 'Dispatch' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >From Dispatch</button>
                                    <button
                                        onClick={() => setSourceType('Order')}
                                        className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${sourceType === 'Order' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >From Order</button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 relative">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                                        placeholder={sourceType === 'Dispatch' ? "SEARCH CONSIGNMENT / CHALLAN NO..." : "SEARCH PENDING SALES ORDERS..."}
                                        onFocus={() => setShowResults(true)}
                                    />
                                    {showResults && (
                                        <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[300px] overflow-y-auto">
                                            {sourceType === 'Dispatch' ? (
                                                dispatches.map(d => (
                                                    <div key={d._id} onClick={() => handleSourceSelect(d._id)} className="p-3 hover:bg-slate-50 border-b last:border-0 cursor-pointer">
                                                        <p className="text-[11px] font-black text-slate-800">DC NO: {d.documents?.challanNumber} • {d.customerId?.partyName}</p>
                                                        <p className="text-[9px] text-slate-400">{d.dispatchDate ? format(new Date(d.dispatchDate), 'dd MMM yy') : ''} • {d.status}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                orders.map(o => (
                                                    <div key={o._id} onClick={() => handleSourceSelect(o._id)} className="p-3 hover:bg-slate-50 border-b last:border-0 cursor-pointer">
                                                        <p className="text-[11px] font-black text-slate-800">ORD: {o.orderNumber} • {o.customerId?.partyName}</p>
                                                        <p className="text-[9px] text-slate-400">{o.orderDate ? format(new Date(o.orderDate), 'dd MMM yy') : ''} • {o.status}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Step 4-5: Invoice Details & Items */}
                        <div className="grid grid-cols-2 gap-6">
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="py-3 border-b"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 4: Billing Meta</CardTitle></CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400">Invoice Type</Label><select className="h-9 w-full rounded border px-3 text-[10px] font-black" value={form.invoiceType} onChange={(e) => setForm({ ...form, invoiceType: e.target.value })}><option value="Tax Invoice">Tax Invoice (Domestic)</option><option value="Export Invoice">Export Invoice (IGST)</option><option value="Retail Invoice">Retail Invoice</option></select></div>
                                        <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400">Place of Supply</Label><Input className="h-9 text-[10px] font-black" value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} /></div>
                                    </div>
                                    <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400">Customer Name (Auto-filled)</Label><Input className="h-9 text-[10px] font-black bg-slate-50" value={form.customerName} disabled /></div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="py-3 border-b"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Step 9: Payment Terms</CardTitle></CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400">Due Date</Label><Input type="date" className="h-9 text-[10px] font-black" value={form.payment.dueDate} onChange={(e) => setForm({ ...form, payment: { ...form.payment, dueDate: e.target.value } })} /></div>
                                        <div className="space-y-1"><Label className="text-[9px] font-black uppercase text-slate-400">Terms</Label><Input className="h-9 text-[10px] font-black" value={form.payment.paymentTerms} onChange={(e) => setForm({ ...form, payment: { ...form.payment, paymentTerms: e.target.value } })} /></div>
                                    </div>
                                    <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center gap-3">
                                        <Landmark className="h-4 w-4 text-indigo-500" />
                                        <div>
                                            <p className="text-[8px] font-black text-indigo-400 uppercase">Bank Selected</p>
                                            <p className="text-[10px] font-black text-slate-700 uppercase">{form.payment.bankDetails.bankName} - XXXX87</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Step 5: Item Grid */}
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b py-3 flex flex-row justify-between items-center text-white"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step 5: Verify Quantities & Rates</CardTitle></CardHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200">
                                        <tr>
                                            {['Product Description', 'HSN', 'Qty', 'Rate', 'Total Taxable', 'GST%', 'Actions'].map(h => (
                                                <th key={h} className="px-4 py-2 text-left text-[9px] font-black uppercase text-slate-500 tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {form.items.map((item: any, i: number) => (
                                            <tr key={i} className="group hover:bg-slate-50/50 transition-colors font-medium">
                                                <td className="p-4"><Input value={item.description} onChange={(e) => handleItemChange(i, 'description', e.target.value)} className="h-8 text-[11px] font-black border-none bg-transparent" /></td>
                                                <td className="p-4"><Input value={item.hsnCode} onChange={(e) => handleItemChange(i, 'hsnCode', e.target.value)} className="h-8 w-16 text-[11px] font-bold border-none bg-transparent" /></td>
                                                <td className="p-4"><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(i, 'quantity', Number(e.target.value))} className="h-8 w-20 text-[11px] font-black text-center" /></td>
                                                <td className="p-4"><Input type="number" value={item.rate} onChange={(e) => handleItemChange(i, 'rate', Number(e.target.value))} className="h-8 w-24 text-[11px] font-black text-right" /></td>
                                                <td className="p-4 text-[11px] font-black text-slate-800 text-right">₹{item.taxableValue.toLocaleString()}</td>
                                                <td className="p-4"><select value={item.gstRate} onChange={(e) => handleItemChange(i, 'gstRate', Number(e.target.value))} className="h-8 text-[10px] font-black border-none bg-transparent">{[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}</select></td>
                                                <td className="p-4"><button onClick={() => setForm({ ...form, items: form.items.filter((_: any, idx: number) => idx !== i) })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button></td>
                                            </tr>
                                        ))}
                                        {form.items.length === 0 && <tr className="text-center"><td colSpan={7} className="p-10 text-[10px] font-black text-slate-400 border-none">PLEASE SELECT A SOURCE DOCUMENT TO LOAD ITEMS</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Step 6-8: Other Charges & E-Way */}
                        <div className="grid grid-cols-2 gap-6">
                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="py-3 border-b flex justify-between items-center"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 6: Additional Charges</CardTitle><Percent className="h-3 w-3 text-emerald-500" /></CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    {form.additionalCharges.map((charge: any, idx: number) => (
                                        <div key={charge.chargeType} className="flex items-center justify-between gap-4">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase flex-1">{charge.chargeType}</span>
                                            <div className="flex items-center gap-2">
                                                <Input type="number" className="h-8 w-24 text-[11px] font-black text-right" value={charge.amount} onChange={(e) => handleChargeChange(idx, Number(e.target.value))} />
                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">@{charge.gstRate}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 shadow-sm">
                                <CardHeader className="py-3 border-b flex justify-between items-center"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 7: Transport Link</CardTitle><Truck className="h-3 w-3 text-indigo-500" /></CardHeader>
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase"><span className="text-slate-400">Carrier</span> <span className="text-slate-800">{form.transport.transporterName || 'SELECT SOURCE'}</span></div>
                                        <div className="flex justify-between text-[11px] font-black uppercase"><span className="text-slate-400">Vehicle</span> <span className="text-indigo-600 font-black">{form.transport.vehicleNumber || 'N/A'}</span></div>
                                        <div className="flex justify-between text-[11px] font-black uppercase border-b pb-2"><span className="text-slate-400">LR No</span> <span className="text-slate-800">{form.transport.lrNumber || 'N/A'}</span></div>

                                        <div className="pt-2 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-slate-600">Step 8: E-Way Bill Requirement</span>
                                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${form.transport.eWayBillRequired ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400'}`}>
                                                {form.transport.eWayBillRequired ? 'REQUIRED (>50K)' : 'NOT REQUIRED'}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Left Column: Summary (Steps 10-12) */}
                    <div className="space-y-6">
                        <Card className="bg-slate-900 text-white shadow-2xl overflow-hidden relative border-none">
                            <CardHeader className="border-b border-white/10 py-4"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Billing Consolidation</CardTitle></CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>Taxable Value</span> <span>₹{form.summary.totalTaxable.toLocaleString()}</span></div>
                                    {form.summary.totalIgst > 0 ? (
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>IGST Total</span> <span>₹{form.summary.totalIgst.toLocaleString()}</span></div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>CGST Total</span> <span>₹{form.summary.totalCgst.toLocaleString()}</span></div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>SGST Total</span> <span>₹{form.summary.totalSgst.toLocaleString()}</span></div>
                                        </>
                                    )}
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span>GST Combined</span> <span>₹{form.summary.totalGst.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold text-emerald-400 border-t border-white/10 pt-3 uppercase"><span>Estimated Total</span> <span>₹{form.summary.totalInvoiceValue.toLocaleString()}</span></div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase italic">Invoice Series Allocation</p>
                                    <p className="text-xl font-black text-white">{form.invoiceNumber}</p>
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase mt-1">Status: STEP 11 PRE-GENERATION</p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase italic border-b border-white/10 pb-2">Step 12: Compliance Sync</p>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${form.summary.grandTotal > 100000 ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 bg-white/5'}`}>
                                            <ShieldCheck className={`h-4 w-4 ${form.summary.grandTotal > 100000 ? 'text-cyan-400' : 'text-slate-600'}`} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase">E-Invoice Gateway</p>
                                            <p className="text-[8px] font-bold text-slate-500">{form.summary.grandTotal > 100000 ? 'ELIGIBLE (>₹1L)' : 'EXEMPT'}</p>
                                        </div>
                                    </div>
                                </div>

                                <Button onClick={handleSubmit} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-[12px] h-12 shadow-2xl rounded-xl transition-all active:scale-95">
                                    {loading ? 'SYNCING GST PORTAL...' : 'GENERATE TAX INVOICE'}
                                </Button>
                            </CardContent>
                            <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                        </Card>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                            <div className="flex items-center gap-2 text-amber-700"><Info size={14} /><span className="text-[10px] font-black uppercase">Audit Tip</span></div>
                            <p className="text-[9px] font-bold text-amber-600 italic">"Always verify quantities against Dispatch Challan (DC) to prevent billing discrepancies during POD reconciliation."</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 10: Preview Modal */}
            <Modal
                title="Commercial Invoice Preview"
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                className="max-w-4xl"
            >
                <div className="p-8 bg-white space-y-10 font-sans border-t-8 border-indigo-600">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900">KK-TRADERS</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 leading-relaxed">Industrial Area Phase II, Textile Hub<br />Surat, Gujarat, India - 395001<br />GSTIN: 24AAABC1234A1Z5</p>
                        </div>
                        <div className="text-right">
                            <span className="bg-indigo-600 text-white px-4 py-1 text-[11px] font-black uppercase italic tracking-widest">TAX INVOICE</span>
                            <div className="mt-4 space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400">Invoice No</p>
                                <p className="text-sm font-black text-slate-800">{form.invoiceNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-100">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 italic">Bill To:</h4>
                            <p className="text-sm font-black text-slate-800 uppercase leading-snug">{form.customerName}</p>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">{form.billingAddress}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[9px] font-black uppercase text-slate-400">Date</p><p className="text-[11px] font-black">{form.invoiceDate}</p></div>
                            <div><p className="text-[9px] font-black uppercase text-slate-400">Challan Ref</p><p className="text-[11px] font-black">{form.dispatchId || 'N/A'}</p></div>
                            <div><p className="text-[9px] font-black uppercase text-slate-400">Vehicle</p><p className="text-[11px] font-black">{form.transport.vehicleNumber || 'N/A'}</p></div>
                            <div><p className="text-[9px] font-black uppercase text-slate-400">Place of Supply</p><p className="text-[11px] font-black uppercase">{form.placeOfSupply}</p></div>
                        </div>
                    </div>

                    <table className="w-full border-collapse">
                        <thead className="border-y-2 border-slate-900 bg-slate-50">
                            <tr>
                                <th className="p-3 text-left text-[10px] font-black uppercase">Description</th>
                                <th className="p-3 text-center text-[10px] font-black uppercase">HSN</th>
                                <th className="p-3 text-center text-[10px] font-black uppercase">Qty</th>
                                <th className="p-3 text-right text-[10px] font-black uppercase">Rate</th>
                                <th className="p-3 text-right text-[10px] font-black uppercase">Gst%</th>
                                <th className="p-3 text-right text-[10px] font-black uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {form.items.map((it: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="p-3 font-black text-[11px] text-slate-800 uppercase">{it.description}</td>
                                    <td className="p-3 text-center font-bold text-[11px] text-slate-500">{it.hsnCode}</td>
                                    <td className="p-3 text-center font-black text-[11px]">{it.quantity}</td>
                                    <td className="p-3 text-right font-black text-[11px]">₹{it.rate.toLocaleString()}</td>
                                    <td className="p-3 text-right font-bold text-[11px] text-indigo-600">{it.gstRate}%</td>
                                    <td className="p-3 text-right font-black text-[11px]">₹{it.taxableValue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-900">
                            <tr>
                                <td colSpan={4}></td>
                                <td className="p-3 text-right text-[10px] font-black bg-slate-50 uppercase">Subtotal</td>
                                <td className="p-3 text-right font-black text-[11px]">₹{form.summary.totalTaxable.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td colSpan={4}></td>
                                <td className="p-3 text-right text-[10px] font-black bg-slate-50 uppercase">GST Amount</td>
                                <td className="p-3 text-right font-black text-[11px]">₹{form.summary.totalGst.toLocaleString()}</td>
                            </tr>
                            <tr className="bg-slate-900 text-white">
                                <td colSpan={4} className="p-3 text-[10px] font-black italic">Amount in words: One Hundred and Two Thousand Only...</td>
                                <td className="p-3 text-right text-[11px] font-black uppercase">Invoice Total</td>
                                <td className="p-3 text-right font-black text-sm text-indigo-400">₹{form.summary.grandTotal.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="grid grid-cols-2 gap-12 pt-10">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 italic">Bank Details (For Transfer)</h4>
                            <div className="text-[11px] font-bold text-slate-600 space-y-1">
                                <p>Bank: {form.payment.bankDetails.bankName}</p>
                                <p>A/C: {form.payment.bankDetails.accountNumber}</p>
                                <p>IFSC: {form.payment.bankDetails.ifscCode}</p>
                            </div>
                        </div>
                        <div className="text-right pt-10 space-y-6">
                            <div className="h-20 w-32 border border-slate-100 flex items-center justify-center text-[10px] font-black italic text-slate-300 ml-auto">Company Seal</div>
                            <p className="text-[10px] font-black uppercase text-slate-800">For KK-TRADERS<br /><span className="text-slate-400 font-normal">Authorized Signatory</span></p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end p-6 border-t bg-slate-50">
                    <Button onClick={() => setIsPreviewOpen(false)} className="bg-indigo-600 text-white font-black uppercase text-[10px]">Back to Editing</Button>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
