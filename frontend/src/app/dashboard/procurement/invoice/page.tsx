'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus,
    Search,
    Receipt,
    FileCheck,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    ExternalLink,
    FileText,
    Camera,
    Image as ImageIcon,
    X,
    File as FileIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function PurchaseInvoicePage() {
    const { loading: authLoading } = useAuth();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: 0,
        mode: 'Bank Transfer',
        referenceNo: '',
        remarks: '',
        paymentDate: new Date().toISOString().split('T')[0]
    });
    const { showToast } = useToast();
    const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
    const [paymentReceiptPreview, setPaymentReceiptPreview] = useState<string | null>(null);

    const [grns, setGrns] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNo: '',
        supplierInvoiceDate: '',
        poId: '',
        grnId: '',
        supplierId: '',
        items: [{
            productId: '',
            description: '',
            quantity: 0,
            unit: 'Kgs',
            rate: 0,
            discount: 0,
            gstRate: 5,
            taxableAmount: 0,
            gstAmount: 0,
            totalAmount: 0
        }],
        summary: {
            taxableAmount: 0,
            gstAmount: 0,
            freight: 0,
            insurance: 0,
            tds: 0,
            netPayable: 0
        },
        payment: {
            dueDate: '',
            paymentStatus: 'Pending'
        },
        paymentTerms: '',
        status: 'Pending'
    });

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/purchase-invoices');
            const data = res.data;
            setInvoices(Array.isArray(data) ? data : (data.invoices || []));
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataForForm = async () => {
        try {
            const [grnRes, partyRes] = await Promise.all([
                api.get('/grns'),
                api.get('/parties')
            ]);
            setGrns(grnRes.data.filter((g: any) => g.status === 'Completed'));
            setSuppliers(partyRes.data.filter((p: any) => p.partyType === 'Supplier' || p.category === 'Supplier'));
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchInvoices();
        fetchDataForForm();
    }, [authLoading]);

    // Recalculate financials
    useEffect(() => {
        let taxableTotal = 0;
        let gstTotal = 0;

        formData.items.forEach(item => {
            const lineTaxable = (item.rate * item.quantity) * (1 - item.discount / 100);
            const lineGst = (lineTaxable * item.gstRate) / 100;
            taxableTotal += lineTaxable;
            gstTotal += lineGst;
        });

        const totalValue = taxableTotal + gstTotal + Number(formData.summary.freight);
        const netPayable = Math.round(totalValue);

        setFormData(prev => ({
            ...prev,
            summary: {
                ...prev.summary,
                taxableAmount: taxableTotal,
                gstAmount: gstTotal,
                netPayable
            }
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.items, formData.summary.freight]);

    const handleSelectGRN = (grnId: string) => {
        const grn = grns.find((g: any) => g._id === grnId);
        if (grn) {
            setFormData({
                ...formData,
                grnId: grnId,
                poId: grn.poId?._id || grn.poId,
                supplierId: grn.supplierId?._id || grn.supplierId,
                items: grn.items.map((item: any) => ({
                    productId: item.productId?._id || item.productId,
                    description: item.productDescription,
                    quantity: item.acceptedQuantity,
                    unit: item.unit,
                    rate: item.rate || 0,
                    discount: 0,
                    gstRate: 5,
                    taxableAmount: 0,
                    gstAmount: 0,
                    totalAmount: 0
                }))
            });
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            
            // Add basic fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'items' && key !== 'summary' && key !== 'payment') {
                    data.append(key, value as string);
                }
            });

            // Add complex fields as strings (the backend will parse them)
            data.append('items', JSON.stringify(formData.items));
            data.append('summary', JSON.stringify(formData.summary));
            data.append('payment', JSON.stringify(formData.payment));

            await api.post('/purchase-invoices', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setIsAddModalOpen(false);
            fetchInvoices();
            showToast('Invoice created successfully', 'success');
        } catch (error: any) {
            console.error('Error creating invoice:', error);
            let msg = error?.response?.data?.message || 'Failed to create invoice';
            if (msg.includes('Invalid Signature')) {
                msg = 'File Upload Failed: Please contact your system administrator to verify the cloud storage configuration.';
            }
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewInvoice = (inv: any) => {
        const token = localStorage.getItem('token');
        setSelectedInvoice({ ...inv, authToken: token });
        setIsViewModalOpen(true);
    };

    const handleOpenPayment = () => {
        setPaymentForm({
            amount: selectedInvoice?.summary?.netPayable || 0,
            mode: 'Bank Transfer',
            referenceNo: '',
            remarks: '',
            paymentDate: new Date().toISOString().split('T')[0]
        });
        setPaymentReceiptFile(null);
        setPaymentReceiptPreview(null);
        setIsPaymentModalOpen(true);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        setIsPaymentSubmitting(true);
        try {
            const data = new FormData();
            Object.entries(paymentForm).forEach(([key, value]) => {
                data.append(key, value.toString());
            });

            if (paymentReceiptFile) {
                data.append('paymentReceipt', paymentReceiptFile);
            }

            await api.patch(`/purchase-invoices/${selectedInvoice._id}/payment`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showToast('Payment recorded successfully!', 'success');
            setIsPaymentModalOpen(false);
            setIsViewModalOpen(false);
            fetchInvoices();
        } catch (error: any) {
            let msg = error?.response?.data?.message || 'Failed to record payment';
            if (msg.includes('Invalid Signature')) {
                msg = 'File Upload Failed: Please contact your system administrator to verify the cloud storage configuration.';
            }
            showToast(msg, 'error');
        } finally {
            setIsPaymentSubmitting(false);
        }
    };

    const filteredInvoices = invoices.filter((inv: any) =>
        inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.supplierInvoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.supplierId?.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <Button
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="mr-2 h-5 w-5" />
                    New Purchase Invoice
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Invoiced</p>
                            <p className="text-2xl font-bold font-mono">
                                ₹{invoices.reduce((acc, curr: any) => acc + (curr.summary?.netPayable || 0), 0).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium font-bold uppercase tracking-widest text-[10px]">Unpaid / Partial</p>
                            <p className="text-2xl font-black italic tracking-tight">
                                {invoices.filter((i: any) => i.payment?.paymentStatus !== 'Paid').length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Paid</p>
                            <p className="text-2xl font-bold">
                                {invoices.filter((i: any) => i.payment?.paymentStatus === 'Paid').length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <FileCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">This Month</p>
                            <p className="text-2xl font-bold">
                                {invoices.filter((i: any) => new Date(i.invoiceDate).getMonth() === new Date().getMonth()).length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by invoice or vendor..."
                            className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 border-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableHead className="font-semibold">Invoice No</TableHead>
                                <TableHead className="font-semibold">Vendor & Bill No</TableHead>
                                <TableHead className="font-semibold">Supplier</TableHead>
                                <TableHead className="font-semibold">Amount</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">Loading invoices...</TableCell>
                                </TableRow>
                            ) : filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">No invoices found.</TableCell>
                                </TableRow>
                            ) : filteredInvoices.map((inv: any) => (
                                <TableRow key={inv._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white uppercase">{inv.invoiceNumber}</span>
                                            <span className="text-[10px] text-slate-500">{format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-indigo-600">{inv.supplierInvoiceNo || 'N/A'}</span>
                                            <span className="text-[10px] text-slate-500 uppercase">
                                                DT: {inv.supplierInvoiceDate ? format(new Date(inv.supplierInvoiceDate), 'dd/MM/yy') : 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{inv.supplierId?.partyName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                ₹{inv.summary?.netPayable?.toLocaleString()}
                                            </span>
                                            <span className={`text-[10px] font-bold ${
                                                inv.payment?.paymentStatus === 'Paid' ? 'text-slate-400' :
                                                new Date(inv.payment?.dueDate) < new Date() ? 'text-rose-500' : 
                                                'text-slate-400'
                                            }`}>
                                                {inv.payment?.paymentStatus === 'Paid' ? 'DUE WAS: ' : 'DUE: '}
                                                {inv.payment?.dueDate ? format(new Date(inv.payment.dueDate), 'dd MMM yyyy') : 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${inv.payment?.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                            inv.payment?.paymentStatus === 'Partially Paid' ? 'bg-blue-100 text-blue-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                            {inv.payment?.paymentStatus || 'Pending'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewInvoice(inv)}>
                                                <ExternalLink className="h-4 w-4 text-rose-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4 font-bold" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Process Supplier Invoice"
                className="max-w-6xl font-sans"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-md text-slate-900 dark:text-white">
                        <FormField label="System Invoice #">
                            <Input disabled value={formData.invoiceNumber} />
                        </FormField>
                        <FormField label="Invoice Date">
                            <Input
                                type="date"
                                value={formData.invoiceDate}
                                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Select Receipt (GRN)">
                            <select
                                required
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 font-mono"
                                value={formData.grnId}
                                onChange={(e) => handleSelectGRN(e.target.value)}
                            >
                                <option value="">Select Completed GRN</option>
                                {grns.map((grn: any) => (
                                    <option key={grn._id} value={grn._id}>{grn.grnNumber} - {grn.supplierId?.partyName}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Due Date">
                            <Input
                                type="date"
                                required
                                value={formData.payment.dueDate}
                                onChange={(e) => setFormData({ ...formData, payment: { ...formData.payment, dueDate: e.target.value } })}
                            />
                        </FormField>
                        <div className="md:col-span-2">
                            <FormField label="Vendor Invoice Number">
                                <Input
                                    required
                                    placeholder="Enter supplier's bill number"
                                    value={formData.supplierInvoiceNo}
                                    onChange={(e) => setFormData({ ...formData, supplierInvoiceNo: e.target.value })}
                                />
                            </FormField>
                        </div>
                        <div className="md:col-span-2">
                            <FormField label="Vendor Invoice Date">
                                <Input
                                    type="date"
                                    required
                                    value={formData.supplierInvoiceDate}
                                    onChange={(e) => setFormData({ ...formData, supplierInvoiceDate: e.target.value })}
                                />
                            </FormField>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 text-slate-900 dark:text-white">
                            <FileText className="h-4 w-4" /> Billing Items
                        </h3>
                        <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                    <tr className="text-slate-500 uppercase text-[10px] font-bold">
                                        <th className="text-left px-4 py-3">Product</th>
                                        <th className="text-left px-4 py-3">Billed Qty</th>
                                        <th className="text-left px-4 py-3">Rate</th>
                                        <th className="text-left px-4 py-3">Disc%</th>
                                        <th className="text-left px-4 py-3">GST%</th>
                                        <th className="text-right px-4 py-3">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 font-medium w-[30%] text-slate-900 dark:text-white">{item.description || 'Select GRN'}</td>
                                            <td className="px-4 py-3 w-[12%]">
                                                <Input type="number" step="0.01" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} />
                                            </td>
                                            <td className="px-4 py-3 w-[15%]">
                                                <Input type="number" step="0.01" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))} />
                                            </td>
                                            <td className="px-4 py-3 w-[10%]">
                                                <Input type="number" step="0.1" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value))} />
                                            </td>
                                            <td className="px-4 py-3 w-[10%]">
                                                <Input type="number" step="1" value={item.gstRate} onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value))} />
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                                ₹{item.totalAmount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-col md:flex-row justify-between gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex-1 text-slate-900 dark:text-white">
                            <FormField label="Payment Terms & Notes">
                                <textarea
                                    className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950 min-h-[120px] focus:ring-2 focus:ring-rose-500/20"
                                    placeholder="Enter payment terms, bank details etc..."
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                />
                            </FormField>
                        </div>
                        <div className="w-full md:w-96 space-y-3 bg-slate-900 text-white p-6 rounded-md shadow-xl">
                            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <span>Taxable Value</span>
                                <span className="text-white">₹{formData.summary.taxableAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <span>Total Tax (GST)</span>
                                <span className="text-white">₹{formData.summary.gstAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <span>Other Charges</span>
                                <Input
                                    type="number"
                                    className="w-24 h-8 bg-slate-800 border-none text-right text-white text-xs"
                                    value={formData.summary.freight}
                                    onChange={(e) => setFormData({ ...formData, summary: { ...formData.summary, freight: parseFloat(e.target.value) || 0 } })}
                                />
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                                <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest leading-none">Net Payable</span>
                                <div className="text-3xl font-black flex items-center gap-1">
                                    <span className="text-sm font-light text-slate-500">₹</span>
                                    {formData.summary.netPayable.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="text-slate-900 dark:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 min-w-[200px] rounded-md h-12 font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                            {isSubmitting ? 'Posting Invoice...' : 'Post Purchase Invoice'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Purchase Invoice: ${selectedInvoice?.invoiceNumber}`}
                className="max-w-5xl"
            >
                {selectedInvoice && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-rose-50/30 dark:bg-rose-900/10 p-6 rounded-md border border-rose-100 dark:border-rose-900/30">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Date</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {format(new Date(selectedInvoice.invoiceDate), 'dd MMM yyyy')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</p>
                                <p className={`font-bold ${
                                    selectedInvoice.payment?.paymentStatus === 'Paid' ? 'text-slate-900 dark:text-white' :
                                    new Date(selectedInvoice.payment?.dueDate) < new Date() ? 'text-rose-600' : 
                                    'text-slate-900 dark:text-white'
                                }`}>
                                    {selectedInvoice.payment?.dueDate ? format(new Date(selectedInvoice.payment.dueDate), 'dd MMM yyyy') : 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Bill #</p>
                                <p className="font-bold text-indigo-600 uppercase font-mono">{selectedInvoice.supplierInvoiceNo || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${selectedInvoice.payment?.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                    selectedInvoice.payment?.paymentStatus === 'Partially Paid' ? 'bg-blue-100 text-blue-700' :
                                        'bg-rose-100 text-rose-700'
                                    }`}>
                                    {selectedInvoice.payment?.paymentStatus || 'Pending'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier Information</h4>
                                <div className="p-5 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <p className="font-black text-xl text-slate-900 dark:text-white mb-1">{selectedInvoice.supplierId?.partyName}</p>
                                    <p className="text-xs text-slate-500 font-medium">GSTIN: {selectedInvoice.supplierId?.gstNumber || 'Not Provided'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">References</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <a 
                                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/purchase-orders/${selectedInvoice.poId?._id || selectedInvoice.poId}/download?token=${selectedInvoice.authToken}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-4 rounded-md border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">PO Ref</p>
                                                <p className="text-sm font-mono font-bold text-indigo-600 group-hover:text-indigo-700">{selectedInvoice.poId?.poNumber || 'Direct'}</p>
                                            </div>
                                            <ExternalLink className="h-3 w-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </a>
                                    <a 
                                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/grns/${selectedInvoice.grnId?._id || selectedInvoice.grnId}/download?token=${selectedInvoice.authToken}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-4 rounded-md border border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">GRN Ref</p>
                                                <p className="text-sm font-mono font-bold text-emerald-600 group-hover:text-emerald-700">{selectedInvoice.grnId?.grnNumber || 'N/A'}</p>
                                            </div>
                                            <ExternalLink className="h-3 w-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {selectedInvoice.grnImage && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    {selectedInvoice.grnImage.toLowerCase().includes('.pdf') ? <FileIcon className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />} 
                                    Attachment: GRN / Bill Copy
                                </h4>
                                <div className="rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 group relative max-w-lg min-h-[100px] flex items-center justify-center">
                                    {selectedInvoice.grnImage.toLowerCase().includes('.pdf') ? (
                                        <div className="p-10 flex flex-col items-center gap-4 text-center">
                                            <div className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                                                <FileIcon className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">Attachment: Bill Scan</p>
                                                <p className="text-xs text-slate-500">The uploaded supplier invoice document.</p>
                                            </div>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <a 
                                                        href={selectedInvoice.grnImage.includes('/upload/') ? selectedInvoice.grnImage.replace('/upload/', '/upload/fl_attachment/') : (selectedInvoice.grnImage.startsWith('http') ? selectedInvoice.grnImage : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${selectedInvoice.grnImage}`)} 
                                                        download
                                                        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900 transition-colors"
                                                    >
                                                        <FileIcon className="h-4 w-4 text-rose-600" /> Download Scan
                                                    </a>
                                                    {selectedInvoice.grnId && (
                                                        <a 
                                                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/grns/${selectedInvoice.grnId?._id || selectedInvoice.grnId}/download?token=${selectedInvoice.authToken}`}
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
                                                        >
                                                            <FileText className="h-4 w-4" /> System GRN Slip
                                                        </a>
                                                    )}
                                                </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={selectedInvoice.grnImage.startsWith('http') ? selectedInvoice.grnImage : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${selectedInvoice.grnImage}`} 
                                                alt="GRN Copy" 
                                                className="w-full h-auto max-h-[400px] object-contain group-hover:scale-[1.02] transition-transform duration-500" 
                                            />
                                            <a 
                                                href={selectedInvoice.grnImage.startsWith('http') ? selectedInvoice.grnImage : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${selectedInvoice.grnImage}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="absolute top-4 right-4 h-10 w-10 bg-white/90 dark:bg-slate-900/90 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ExternalLink className="h-5 w-5 text-indigo-600" />
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-rose-600" /> Billed Items
                            </h3>
                            <div className="rounded-md border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                            <th className="text-left p-4">Item Description</th>
                                            <th className="text-center p-4">Quantity</th>
                                            <th className="text-right p-4">Rate</th>
                                            <th className="text-right p-4">GST</th>
                                            <th className="text-right p-4">Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {selectedInvoice.items?.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                                                <td className="p-4 font-bold text-slate-900 dark:text-white">
                                                    {item.productId?.productName || item.description}
                                                </td>
                                                <td className="p-4 text-center font-medium">{item.quantity} {item.unit}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col">
                                                        <span>₹{item.rate?.toLocaleString()}</span>
                                                        {item.discount > 0 && <span className="text-[10px] text-emerald-600">-{item.discount}% Disc.</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-600">₹{item.gstAmount?.toLocaleString()}</span>
                                                        <span className="text-[10px] text-slate-400">(@{item.gstRate}%)</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-black italic text-rose-600">
                                                    ₹{item.totalAmount?.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Receipt className="h-4 w-4" /> Transaction Ledger
                            </h4>
                            <div className="rounded-md border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                            <th className="text-left p-4">Date</th>
                                            <th className="text-left p-4">Description</th>
                                            <th className="text-right p-4">Debit (+)</th>
                                            <th className="text-right p-4">Credit (-)</th>
                                            <th className="text-right p-4">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {/* Initial Invoice entry */}
                                        <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors bg-rose-50/20">
                                            <td className="p-4 font-medium text-slate-900 dark:text-white">
                                                {format(new Date(selectedInvoice.invoiceDate), 'dd MMM yyyy')}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">Invoice Generated</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-mono">{selectedInvoice.invoiceNumber}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right text-rose-600 font-bold">₹{selectedInvoice.summary?.netPayable?.toLocaleString()}</td>
                                            <td className="p-4 text-right text-slate-300">-</td>
                                            <td className="p-4 text-right font-black italic">₹{selectedInvoice.summary?.netPayable?.toLocaleString()}</td>
                                        </tr>

                                        {/* Payment entries with running balance */}
                                        {(() => {
                                            let runningBalance = selectedInvoice.summary?.netPayable || 0;
                                            return selectedInvoice.payment?.payments?.map((p: any, idx: number) => {
                                                runningBalance -= (p.amount || 0);
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors bg-emerald-50/10">
                                                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                                                            {format(new Date(p.paymentDate), 'dd MMM yyyy')}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-emerald-700">Payment Processed</span>
                                                                <span className="text-[10px] text-slate-400 font-mono italic">{p.mode} {p.referenceNo ? `(Ref: ${p.referenceNo})` : ''}</span>
                                                                {p.remarks && <span className="text-[10px] text-slate-500 mt-1">"{p.remarks}"</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right text-slate-300">
                                                            {p.receiptImage ? (
                                                                <a 
                                                                    href={p.receiptImage.startsWith('http') ? p.receiptImage : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${p.receiptImage}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400 transition-colors shadow-sm"
                                                                    title="View Receipt"
                                                                >
                                                                    <ImageIcon className="h-4 w-4" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right text-emerald-600 font-bold">₹{p.amount?.toLocaleString()}</td>
                                                        <td className="p-4 text-right font-black italic">₹{runningBalance.toLocaleString()}</td>
                                                    </tr>
                                                );
                                            });
                                        })()}

                                        {/* Final Summary Row */}
                                        <tr className="bg-slate-900 text-white font-black">
                                            <td colSpan={2} className="p-4 text-right uppercase text-[10px] tracking-widest text-slate-400">Current Outstanding Balance</td>
                                            <td colSpan={2} className="p-4 text-right text-rose-400">Total Paid: ₹{selectedInvoice.payment?.payments?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0).toLocaleString()}</td>
                                            <td className="p-4 text-right text-white">
                                                ₹{(selectedInvoice.summary.netPayable - (selectedInvoice.payment?.payments?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0)).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 rounded-md bg-slate-50 dark:bg-slate-900/50 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Terms & Notes</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                    {selectedInvoice.paymentTerms || 'No specific terms recorded.'}
                                </p>
                            </div>
                            <div className="p-8 rounded-md bg-slate-900 text-white shadow-2xl space-y-4">
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>Taxable Total</span>
                                    <span>₹{selectedInvoice.summary?.taxableAmount?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>Total GST</span>
                                    <span>₹{selectedInvoice.summary?.gstAmount?.toLocaleString()}</span>
                                </div>
                                {selectedInvoice.summary?.freight > 0 && (
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>Other Charges</span>
                                        <span>₹{selectedInvoice.summary?.freight?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-rose-400 uppercase tracking-tighter">Net Payable</span>
                                        {selectedInvoice.payment?.paymentStatus !== 'Pending' && (
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase">
                                                Balance: ₹{(selectedInvoice.summary.netPayable - selectedInvoice.payment.payments.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0)).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-4xl font-black italic tracking-tighter">
                                        ₹{selectedInvoice.summary?.netPayable?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Button variant="outline" className="rounded-md px-10" onClick={() => setIsViewModalOpen(false)}>
                                Close Preview
                            </Button>
                            {selectedInvoice?.payment?.paymentStatus !== 'Paid' && (
                                <Button
                                    className="rounded-md bg-indigo-600 hover:bg-indigo-700 px-8 flex items-center gap-2"
                                    onClick={handleOpenPayment}
                                >
                                    <FileCheck className="h-4 w-4" /> Record Payment
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title={`Record Payment — ${selectedInvoice?.invoiceNumber}`}
                className="max-w-4xl font-sans"
            >
                <form onSubmit={handleRecordPayment} className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-5 shadow-xl">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Net Payable</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-medium text-slate-500">₹</span>
                                <span className="text-2xl font-black text-white">{selectedInvoice?.summary?.netPayable?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-5 shadow-xl">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Outstanding</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-medium text-slate-500">₹</span>
                                <span className="text-2xl font-black text-white">
                                    {(selectedInvoice?.summary?.netPayable - (selectedInvoice?.payment?.payments?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 shadow-xl">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Total Paid</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-medium text-slate-500">₹</span>
                                <span className="text-2xl font-black text-amber-500">
                                    {(selectedInvoice?.payment?.payments?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 shadow-xl">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Final Payout</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-medium text-slate-500">₹</span>
                                <span className="text-2xl font-black text-emerald-500">
                                    {Math.max(0, (selectedInvoice?.summary?.netPayable - (selectedInvoice?.payment?.payments?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0)) - paymentForm.amount).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Payment Mode">
                                    <select
                                        required
                                        className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                        value={paymentForm.mode}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                                    >
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Cash">Cash</option>
                                    </select>
                                </FormField>
                                <FormField label="Payment Date">
                                    <Input
                                        type="date"
                                        required
                                        className="h-12 rounded-lg border border-slate-200 dark:border-slate-800"
                                        value={paymentForm.paymentDate}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                    />
                                </FormField>
                            </div>

                            <FormField label="Amount (₹)">
                                <Input
                                    type="number"
                                    required
                                    step="0.1"
                                    className="h-12 rounded-lg border border-slate-200 dark:border-slate-800 text-lg font-black bg-slate-50 dark:bg-slate-900/40"
                                    placeholder={`Outstanding: ₹${(selectedInvoice?.summary?.netPayable - (selectedInvoice?.payment?.payments?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0)).toLocaleString()}`}
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                                />
                            </FormField>

                            <FormField label="Reference / Transaction No.">
                                <Input
                                    className="h-12 rounded-lg border border-slate-200 dark:border-slate-800"
                                    placeholder="e.g. UTR NO, CHEQUE NO etc."
                                    value={paymentForm.referenceNo}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                                />
                            </FormField>
                        </div>

                        <div className="space-y-5">
                            <FormField label="Remarks / Notes">
                                <textarea
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 h-[105px] resize-none"
                                    placeholder="Add any specific note about this installment..."
                                    value={paymentForm.remarks}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                />
                            </FormField>

                            <FormField label="Payment Screenshot / Receipt">
                                {!paymentReceiptPreview ? (
                                    <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-indigo-500/50 hover:bg-indigo-50/50 transition-all cursor-pointer group h-[105px]">
                                        <Camera className="h-6 w-6 group-hover:text-indigo-600 transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Click to Upload Receipt</span>
                                        <input 
                                            type="file" 
                                            hidden 
                                            accept="image/*,application/pdf"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setPaymentReceiptFile(file);
                                                    setPaymentReceiptPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                    </label>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 h-[105px] bg-slate-50 dark:bg-slate-900/40">
                                        {paymentReceiptFile?.type === 'application/pdf' ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-1">
                                                <FileIcon className="h-8 w-8 text-rose-600" />
                                                <span className="text-[8px] font-bold uppercase truncate max-w-[120px]">{paymentReceiptFile?.name}</span>
                                            </div>
                                        ) : (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={paymentReceiptPreview || ''} alt="Receipt preview" className="w-full h-full object-contain" />
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => { setPaymentReceiptFile(null); setPaymentReceiptPreview(null); }}
                                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </FormField>
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-6">
                        <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            disabled={isPaymentSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 min-w-[220px] h-12 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                        >
                            {isPaymentSubmitting ? 'Recording...' : '✓ Record Payment'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

