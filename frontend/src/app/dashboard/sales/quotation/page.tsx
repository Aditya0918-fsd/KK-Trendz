'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Calendar, User, FileText,
    CheckCircle2, Clock, XCircle, MoreHorizontal, Trash2,
    Eye, Pencil, X
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function SalesQuotationPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center font-black uppercase tracking-widest text-slate-400 animate-pulse">Initializing Sales Module...</div>}>
            <SalesQuotationContent />
        </Suspense>
    );
}

function SalesQuotationContent() {
    const { loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const enquiryIdParam = searchParams.get('enquiryId');
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [parties, setParties] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const generateQuotationNumber = () => {
        const year = new Date().getFullYear();
        const fiscalYear = `${year}-${(year + 1).toString().slice(-2)}`;
        const randomNum = Math.floor(100 + Math.random() * 900);
        return `QTN/${fiscalYear}/${randomNum}`;
    };

    const [formData, setFormData] = useState({
        quotationNumber: generateQuotationNumber(),
        quotationDate: new Date().toISOString().split('T')[0],
        enquiryId: '',
        customerId: '',
        validTill: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryTerms: '',
        paymentTerms: '',
        items: [{
            productId: '',
            description: '',
            specifications: { size: '', color: '', fabric: '', width: '', style: '', packing: '' },
            quantity: '' as any,
            unit: 'Pieces',
            rate: '' as any,
            discountPercentage: '' as any,
            discountAmount: 0,
            taxableAmount: 0,
            gstRate: 12,
            gstAmount: 0,
            totalAmount: 0
        }],
        summary: {
            totalTaxable: 0,
            totalGst: 0,
            totalAmount: 0,
            freightCharges: '' as any,
            insuranceCharges: '' as any,
            packingCharges: '' as any,
            netAmount: 0
        },
        termsAndConditions: '',
        status: 'Draft'
    });

    const calculateTotals = (items: any[], charges: any) => {
        let totalTaxable = 0;
        let totalGst = 0;

        const updatedItems = items.map(item => {
            const discAmt = (Number(item.rate) * Number(item.quantity) * Number(item.discountPercentage)) / 100;
            const taxable = (Number(item.rate) * Number(item.quantity)) - discAmt;
            const gst = (taxable * Number(item.gstRate)) / 100;

            totalTaxable += taxable;
            totalGst += gst;

            return {
                ...item,
                discountAmount: discAmt,
                taxableAmount: taxable,
                gstAmount: gst,
                totalAmount: taxable + gst
            };
        });

        const totalAmount = totalTaxable + totalGst;
        const netAmount = totalAmount + (Number(charges.freightCharges) || 0) + (Number(charges.insuranceCharges) || 0) + (Number(charges.packingCharges) || 0);

        return {
            items: updatedItems,
            summary: {
                totalTaxable,
                totalGst,
                totalAmount,
                freightCharges: charges.freightCharges,
                insuranceCharges: charges.insuranceCharges,
                packingCharges: charges.packingCharges,
                netAmount
            }
        };
    };

    const fetchQuotations = async () => {
        try {
            const res = await api.get('/sales-quotations');
            setQuotations(res.data);
        } catch (error) {
            console.error('Error fetching quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        const [e, p, prod] = await Promise.all([
            api.get('/sales-enquiries'),
            api.get('/parties'),
            api.get('/products')
        ]);
        setEnquiries(e.data.filter((x: any) => x.status === 'Open' || x._id === enquiryIdParam));
        setParties(p.data.filter((x: any) => x.partyType === 'Customer' || x.partyType === 'Both'));
        setProducts(prod.data);
    };

    useEffect(() => {
        if (!authLoading) {
            fetchQuotations();
            fetchMasters();
        }
    }, [authLoading, enquiryIdParam]);

    useEffect(() => {
        if (enquiryIdParam && enquiries.length > 0) {
            const enq = enquiries.find(x => x._id === enquiryIdParam);
            if (enq && !formData.enquiryId) {
                const newItems = enq.items.map((it: any) => ({
                    productId: it.productId?._id || it.productId,
                    description: it.productId?.productName || it.productName || 'Product',
                    specifications: { ...it.specifications },
                    quantity: it.quantity === 0 ? '' : it.quantity,
                    unit: it.unit || 'Pieces',
                    rate: '' as any,
                    discountPercentage: '' as any,
                    discountAmount: 0,
                    taxableAmount: 0,
                    gstRate: 12,
                    gstAmount: 0,
                    totalAmount: 0
                }));
                setFormData((prev: any) => ({
                    ...prev,
                    enquiryId: enquiryIdParam,
                    customerId: enq.customerId?._id || enq.customerId,
                    items: newItems
                }));
                setIsAddModalOpen(true);
            }
        }
    }, [enquiryIdParam, enquiries]);

    const handleAddQuotation = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerId) {
            showToast('Please select a Customer for the quotation.', 'warning');
            return;
        }

        if (formData.items.length === 0) {
            showToast('Please add at least one product to the quotation.', 'warning');
            return;
        }

        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            if (!item.productId) {
                showToast(`Please select a Product for Item ${i + 1}.`, 'warning');
                return;
            }
            if (!item.quantity || item.quantity <= 0) {
                showToast(`Please enter a valid Quantity for Item ${i + 1}.`, 'warning');
                return;
            }
            if (!item.rate || item.rate <= 0) {
                showToast(`Please enter a valid Rate for Item ${i + 1}.`, 'warning');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // Clean up empty strings for numeric and date fields
            const submissionData = {
                ...formData,
                items: formData.items.map(it => ({
                    ...it,
                    quantity: Number(it.quantity) || 0,
                    rate: Number(it.rate) || 0,
                    discountPercentage: Number(it.discountPercentage) || 0
                })),
                summary: {
                    ...formData.summary,
                    freightCharges: Number(formData.summary.freightCharges) || 0,
                    insuranceCharges: Number(formData.summary.insuranceCharges) || 0,
                    packingCharges: Number(formData.summary.packingCharges) || 0
                }
            };

            await api.post('/sales-quotations', submissionData);
            await fetchQuotations();
            setIsAddModalOpen(false);
            showToast('Quotation created successfully', 'success');
        } catch (error: any) {
            console.error('Error adding quotation:', error);
            let msg = error?.response?.data?.message || 'Failed to add quotation';
            if (msg.includes('validation failed') || msg.includes('Cast to ObjectId failed')) {
                msg = 'Please fill all required quotation fields correctly before submitting.';
            }
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditQuotation = (q: any) => {
        const cleanedItems = q.items.map((it: any) => ({
            ...it,
            productId: it.productId?._id || it.productId,
            quantity: it.quantity || '',
            rate: it.rate || '',
            discountPercentage: it.discountPercentage === 0 ? '' : (it.discountPercentage || ''),
            // usually discount can be 0, but quantity/rate/GSM shouldn't be 0 by default.
            specifications: {
                ...it.specifications,
                gsm: it.specifications.gsm || ''
            }
        }));

        setFormData({
            ...q,
            quotationDate: format(new Date(q.quotationDate), 'yyyy-MM-dd'),
            validTill: format(new Date(q.validTill), 'yyyy-MM-dd'),
            enquiryId: q.enquiryId?._id || q.enquiryId || '',
            customerId: q.customerId?._id || q.customerId,
            items: cleanedItems,
            summary: {
                ...q.summary,
                freightCharges: q.summary.freightCharges === 0 || !q.summary.freightCharges ? '' : q.summary.freightCharges,
                insuranceCharges: q.summary.insuranceCharges === 0 || !q.summary.insuranceCharges ? '' : q.summary.insuranceCharges,
                packingCharges: q.summary.packingCharges === 0 || !q.summary.packingCharges ? '' : q.summary.packingCharges
            }
        });
        setSelectedQuotation(q);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.customerId || formData.items.some(it => !it.productId)) {
            showToast('Please fill all required fields.', 'warning');
            return;
        }

        try {
            setIsSubmitting(true);
            const submissionData = {
                ...formData,
                items: formData.items.map(it => ({
                    ...it,
                    quantity: Number(it.quantity) || 0,
                    rate: Number(it.rate) || 0
                })),
                summary: {
                    ...formData.summary,
                    freightCharges: Number(formData.summary.freightCharges) || 0,
                    insuranceCharges: Number(formData.summary.insuranceCharges) || 0,
                    packingCharges: Number(formData.summary.packingCharges) || 0
                }
            };

            await api.patch(`/sales-quotations/${selectedQuotation._id}`, submissionData);
            await fetchQuotations();
            setIsEditModalOpen(false);
            showToast('Quotation updated successfully', 'success');
        } catch (error: any) {
            console.error('Error updating quotation:', error);
            showToast(error?.response?.data?.message || 'Failed to update quotation', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredQuotations = quotations.filter(q =>
        q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerId?.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/sales">
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sales Quotations</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Manage and send pricing offers to customers</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6">
                    <Plus className="h-4 w-4 mr-2" /> New Quotation
                </Button>
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search quotation..." className="pl-10 h-10 text-sm border-slate-200 dark:border-slate-700 rounded-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Reference</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Customer</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Valid Till</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 font-medium text-slate-500">Loading quotations...</TableCell></TableRow>
                            ) : filteredQuotations.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 font-medium text-slate-500">No quotations found</TableCell></TableRow>
                            ) : (
                                filteredQuotations.map((q) => (
                                    <TableRow key={q._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 font-medium text-center">
                                        <TableCell className="w-[180px]">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{q.quotationNumber}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{q.enquiryId?.enquiryNumber || 'Direct'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{q.customerId?.partyName}</span>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-xs">₹{q.summary?.netAmount?.toLocaleString()}</TableCell>
                                        <TableCell className="text-left text-[10px] text-slate-500 font-bold">{format(new Date(q.validTill), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${q.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {q.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    title="View Quotation"
                                                    onClick={() => {
                                                        setSelectedQuotation(q);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {q.status !== 'Accepted' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                        title="Edit Quotation"
                                                        onClick={() => handleEditQuotation(q)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {q.status !== 'Accepted' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-black text-[10px]"
                                                            onClick={async () => {
                                                                if (confirm('Accept this quotation?')) {
                                                                    try {
                                                                        await api.patch(`/sales-quotations/${q._id}`, { status: 'Accepted' });
                                                                        await fetchQuotations();
                                                                        showToast('Quotation accepted', 'success');
                                                                    } catch (error: any) {
                                                                        console.error('Error accepting quotation:', error);
                                                                        const msg = error?.response?.data?.message || 'Failed to accept quotation';
                                                                        showToast(msg, 'error');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-black text-[10px]"
                                                            onClick={async () => {
                                                                if (confirm('Reject this quotation?')) {
                                                                    try {
                                                                        await api.patch(`/sales-quotations/${q._id}`, { status: 'Rejected' });
                                                                        await fetchQuotations();
                                                                        showToast('Quotation rejected', 'info');
                                                                    } catch (error: any) {
                                                                        console.error('Error rejecting quotation:', error);
                                                                        const msg = error?.response?.data?.message || 'Failed to reject quotation';
                                                                        showToast(msg, 'error');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500" onClick={async () => {
                                                    if (confirm('Delete this quotation?')) {
                                                        try {
                                                            await api.delete(`/sales-quotations/${q._id}`);
                                                            await fetchQuotations();
                                                            showToast('Quotation deleted', 'info');
                                                        } catch (error: any) {
                                                            console.error('Error deleting quotation:', error);
                                                            const msg = error?.response?.data?.message || 'Failed to delete quotation';
                                                            showToast(msg, 'error');
                                                        }
                                                    }
                                                }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Sales Quotation" className="max-w-5xl">
                <form onSubmit={handleAddQuotation} className="space-y-6">
                    {/* Step 1: Source & Reference */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <FormField label="Quotation No.">
                                <Input value={formData.quotationNumber} disabled className="font-black bg-white dark:bg-slate-900" />
                            </FormField>
                            <FormField label="Quotation Date">
                                <Input type="date" value={formData.quotationDate} onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })} />
                            </FormField>
                            <FormField label="Create from Enquiry" className="md:col-span-2">
                                <Select
                                    value={formData.enquiryId}
                                    onChange={(val) => {
                                        const enq = enquiries.find(x => x._id === val);
                                        if (enq) {
                                            const newItems = enq.items.map((it: any) => ({
                                                productId: it.productId?._id || it.productId,
                                                description: it.productId?.productName || it.productName || 'Product',
                                                specifications: { ...it.specifications },
                                                quantity: it.quantity,
                                                unit: it.unit || 'Pieces',
                                                rate: '' as any,
                                                discountPercentage: '' as any,
                                                discountAmount: 0,
                                                taxableAmount: 0,
                                                gstRate: 12,
                                                gstAmount: 0,
                                                totalAmount: 0
                                            }));
                                            setFormData({
                                                ...formData,
                                                enquiryId: val,
                                                customerId: enq.customerId?._id || enq.customerId,
                                                items: newItems
                                            });
                                        } else {
                                            setFormData({ ...formData, enquiryId: val });
                                        }
                                    }}
                                    options={enquiries.map(e => ({ value: e._id, label: `${e.enquiryNumber} - ${e.customerId?.partyName}` }))}
                                    placeholder="Direct Quotation"
                                />
                            </FormField>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer & Terms</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <FormField label="Select Customer">
                                    <Select
                                        value={formData.customerId}
                                        onChange={(val) => setFormData({ ...formData, customerId: val })}
                                        options={parties.map(p => ({ value: p._id, label: p.partyName }))}
                                        placeholder="Choose Customer"
                                    />
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Valid Till">
                                        <Input type="date" value={formData.validTill} onChange={(e) => setFormData({ ...formData, validTill: e.target.value })} />
                                    </FormField>
                                    <FormField label="Payment Terms">
                                        <Select
                                            value={formData.paymentTerms}
                                            onChange={(val) => setFormData({ ...formData, paymentTerms: val })}
                                            options={[
                                                { value: '30% Advance', label: '30% Advance' },
                                                { value: 'Credit 30 Days', label: 'Credit 30 Days' },
                                                { value: 'Against Delivery', label: 'Against Delivery' },
                                                { value: 'Letter of Credit', label: 'Letter of Credit' }
                                            ]}
                                            placeholder="Select Terms"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Other Charges</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <FormField label="Freight">
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        value={formData.summary.freightCharges} 
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : Number(e.target.value);
                                            const res = calculateTotals(formData.items, { ...formData.summary, freightCharges: val });
                                            setFormData({ ...formData, items: res.items, summary: res.summary });
                                        }} 
                                    />
                                </FormField>
                                <FormField label="Insurance">
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        value={formData.summary.insuranceCharges} 
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : Number(e.target.value);
                                            const res = calculateTotals(formData.items, { ...formData.summary, insuranceCharges: val });
                                            setFormData({ ...formData, items: res.items, summary: res.summary });
                                        }} 
                                    />
                                </FormField>
                                <FormField label="Packing">
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        value={formData.summary.packingCharges} 
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : Number(e.target.value);
                                            const res = calculateTotals(formData.items, { ...formData.summary, packingCharges: val });
                                            setFormData({ ...formData, items: res.items, summary: res.summary });
                                        }} 
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 & 4: Products & Pricing */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Products & Pricing</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData({
                                    ...formData,
                                    items: [...formData.items, { productId: '', description: '', specifications: { size: '', color: '', fabric: '', width: '', style: '', packing: '' }, quantity: '' as any, unit: 'Pieces', rate: '' as any, discountPercentage: '' as any, discountAmount: 0, taxableAmount: 0, gstRate: 12, gstAmount: 0, totalAmount: 0 }]
                                })}
                            >
                                <Plus className="h-3 w-3 mr-2" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div className="md:col-span-2">
                                            <FormField label="Product">
                                                <Select
                                                    value={item.productId}
                                                    onChange={(val) => {
                                                        const p = products.find(prod => prod._id === val);
                                                        const updated = [...formData.items];
                                                        updated[idx].productId = val;
                                                        updated[idx].description = p?.productName || '';
                                                        setFormData({ ...formData, items: updated });
                                                    }}
                                                    options={products.map(p => ({ value: p._id, label: p.productName }))}
                                                    placeholder="Select Product"
                                                />
                                            </FormField>
                                        </div>
                                        <FormField label="Quantity">
                                            <Input 
                                                type="number" 
                                                value={item.quantity || ''} 
                                                onChange={(e) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                    const res = calculateTotals(updated, formData.summary);
                                                    setFormData({ ...formData, items: res.items, summary: res.summary });
                                                }} 
                                                required 
                                            />
                                        </FormField>
                                        <FormField label="Unit">
                                            <Select
                                                value={item.unit}
                                                onChange={(val) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].unit = val;
                                                    setFormData({ ...formData, items: updated });
                                                }}
                                                options={[
                                                    { value: 'Pieces', label: 'Pieces' },
                                                    { value: 'Meters', label: 'Meters' },
                                                    { value: 'Kg', label: 'Kg' }
                                                ]}
                                            />
                                        </FormField>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <FormField label="Rate">
                                            <Input 
                                                type="number" 
                                                value={item.rate || ''} 
                                                onChange={(e) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].rate = e.target.value === '' ? '' : Number(e.target.value);
                                                    const res = calculateTotals(updated, formData.summary);
                                                    setFormData({ ...formData, items: res.items, summary: res.summary });
                                                }} 
                                                required 
                                            />
                                        </FormField>
                                        <FormField label="Discount %">
                                            <Input 
                                                type="number" 
                                                value={item.discountPercentage || ''} 
                                                onChange={(e) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].discountPercentage = e.target.value === '' ? '' : Number(e.target.value);
                                                    const res = calculateTotals(updated, formData.summary);
                                                    setFormData({ ...formData, items: res.items, summary: res.summary });
                                                }} 
                                            />
                                        </FormField>
                                        <FormField label="GST %">
                                            <Select
                                                value={String(item.gstRate)}
                                                onChange={(val) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].gstRate = Number(val);
                                                    const res = calculateTotals(updated, formData.summary);
                                                    setFormData({ ...formData, items: res.items, summary: res.summary });
                                                }}
                                                options={[
                                                    { value: '0', label: '0%' },
                                                    { value: '5', label: '5%' },
                                                    { value: '12', label: '12%' },
                                                    { value: '18', label: '18%' }
                                                ]}
                                            />
                                        </FormField>
                                        <div className="flex flex-col justify-end">
                                            <div className="h-10 flex items-center px-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-md border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-black text-xs">
                                                Total: ₹{item.totalAmount?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {formData.items.length > 1 && (
                                        <button type="button" onClick={() => {
                                            const updated = formData.items.filter((_, i) => i !== idx);
                                            const res = calculateTotals(updated, formData.summary);
                                            setFormData({ ...formData, items: res.items, summary: res.summary });
                                        }} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 shadow-sm">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary & Terms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-4">
                            <FormField label="Terms & Conditions">
                                <textarea
                                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold min-h-[120px]"
                                    placeholder="Add any specific terms or notes..."
                                    value={formData.termsAndConditions}
                                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                                />
                            </FormField>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <span>Subtotal (Taxable)</span>
                                <span>₹{formData.summary.totalTaxable.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <span>Total Tax (GST)</span>
                                <span>₹{formData.summary.totalGst.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <span>Other Charges</span>
                                <span>₹{(Number(formData.summary.freightCharges) + Number(formData.summary.insuranceCharges) + Number(formData.summary.packingCharges)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Grand Total</span>
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">₹{formData.summary.netAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)} className="text-[11px] font-black uppercase tracking-widest h-11 px-8">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-widest h-11 px-8 min-w-[140px]">
                            {isSubmitting ? 'Saving...' : 'Generate Quotation'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Sales Quotation Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Sales Quotation" className="max-w-5xl">
                <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField label="Quotation No.">
                                <Input value={formData.quotationNumber} disabled className="font-black bg-white dark:bg-slate-900" />
                            </FormField>
                            <FormField label="Quotation Date">
                                <Input type="date" value={formData.quotationDate} onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })} />
                            </FormField>
                            <FormField label="Reference Enquiry">
                                <Input value={selectedQuotation?.enquiryId?.enquiryNumber || 'Direct Quotation'} disabled />
                            </FormField>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer & Terms</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <FormField label="Customer">
                                    <Select
                                        value={formData.customerId}
                                        onChange={(val) => setFormData({ ...formData, customerId: val })}
                                        options={parties.map(p => ({ value: p._id, label: p.partyName }))}
                                        placeholder="Choose Customer"
                                    />
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Valid Till">
                                        <Input type="date" value={formData.validTill} onChange={(e) => setFormData({ ...formData, validTill: e.target.value })} />
                                    </FormField>
                                    <FormField label="Payment Terms">
                                        <Select
                                            value={formData.paymentTerms}
                                            onChange={(val) => setFormData({ ...formData, paymentTerms: val })}
                                            options={[
                                                { value: '30% Advance', label: '30% Advance' },
                                                { value: 'Credit 30 Days', label: 'Credit 30 Days' },
                                                { value: 'Against Delivery', label: 'Against Delivery' },
                                                { value: 'Letter of Credit', label: 'Letter of Credit' }
                                            ]}
                                            placeholder="Select Terms"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Other Charges</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <FormField label="Freight">
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        value={formData.summary.freightCharges} 
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : Number(e.target.value);
                                            const res = calculateTotals(formData.items, { ...formData.summary, freightCharges: val });
                                            setFormData({ ...formData, items: res.items, summary: res.summary });
                                        }} 
                                    />
                                </FormField>
                                <FormField label="Insurance">
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        value={formData.summary.insuranceCharges} 
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : Number(e.target.value);
                                            const res = calculateTotals(formData.items, { ...formData.summary, insuranceCharges: val });
                                            setFormData({ ...formData, items: res.items, summary: res.summary });
                                        }} 
                                    />
                                </FormField>
                                <FormField label="Packing">
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        value={formData.summary.packingCharges} 
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : Number(e.target.value);
                                            const res = calculateTotals(formData.items, { ...formData.summary, packingCharges: val });
                                            setFormData({ ...formData, items: res.items, summary: res.summary });
                                        }} 
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Products & Pricing</h3>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <FormField label="Product" className="md:col-span-2">
                                            <Select
                                                value={item.productId}
                                                onChange={(val) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].productId = val;
                                                    setFormData({ ...formData, items: updated });
                                                }}
                                                options={products.map(p => ({ value: p._id, label: p.productName }))}
                                                placeholder="Select Product"
                                            />
                                        </FormField>
                                        <FormField label="Quantity">
                                            <Input 
                                                type="number" 
                                                value={item.quantity || ''} 
                                                onChange={(e) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                    const res = calculateTotals(updated, formData.summary);
                                                    setFormData({ ...formData, items: res.items, summary: res.summary });
                                                }} 
                                                required 
                                            />
                                        </FormField>
                                        <FormField label="Rate">
                                            <Input 
                                                type="number" 
                                                value={item.rate || ''} 
                                                onChange={(e) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].rate = e.target.value === '' ? '' : Number(e.target.value);
                                                    const res = calculateTotals(updated, formData.summary);
                                                    setFormData({ ...formData, items: res.items, summary: res.summary });
                                                }} 
                                                required 
                                            />
                                        </FormField>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <FormField label="Discount %">
                                            <Input 
                                                type="number" 
                                                value={item.discountPercentage || ''} 
                                                onChange={(e) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].discountPercentage = e.target.value === '' ? '' : Number(e.target.value);
                                                    const res = calculateTotals(updated, formData.summary);
                                                    setFormData({ ...formData, items: res.items, summary: res.summary });
                                                }} 
                                            />
                                        </FormField>
                                        <FormField label="GST %">
                                            <Select
                                                value={String(item.gstRate)}
                                                onChange={(val) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].gstRate = Number(val);
                                                    const res = calculateTotals(updated, formData.summary);
                                                    setFormData({ ...formData, items: res.items, summary: res.summary });
                                                }}
                                                options={[
                                                    { value: '0', label: '0%' },
                                                    { value: '5', label: '5%' },
                                                    { value: '12', label: '12%' },
                                                    { value: '18', label: '18%' }
                                                ]}
                                            />
                                        </FormField>
                                        <div className="flex flex-col justify-end md:col-span-2">
                                            <div className="h-10 flex items-center justify-end px-3 rounded-md border border-indigo-100 bg-indigo-50/50 dark:border-indigo-800 text-indigo-700 font-black">
                                                Item Total: ₹{(Number(item.totalAmount) || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <FormField label="Terms & Conditions">
                            <textarea
                                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold min-h-[100px]"
                                value={formData.termsAndConditions}
                                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                            />
                        </FormField>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex justify-between text-xs font-bold text-slate-500 tracking-widest">
                                <span>GRAND TOTAL</span>
                                <span className="text-lg font-black text-indigo-600">₹{formData.summary.netAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)} className="text-[11px] font-black uppercase h-11 px-8">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase h-11 px-8 min-w-[140px]">
                            {isSubmitting ? 'Updating...' : 'Update Quotation'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Quotation Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Quotation Details: ${selectedQuotation?.quotationNumber}`}>
                {selectedQuotation && (
                    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-8 text-sm">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-400">Customer</p>
                                <p className="font-bold text-slate-900 dark:text-white capitalize">{selectedQuotation.customerId?.partyName}</p>
                                <p className="text-xs text-slate-500">{selectedQuotation.customerId?.email || 'No email'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400">Quotation Date</p>
                                <p className="font-bold text-slate-900 dark:text-white">{format(new Date(selectedQuotation.quotationDate), 'dd MMM yyyy')}</p>
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-tighter mt-1">
                                    Valid Till: {format(new Date(selectedQuotation.validTill), 'dd MMM yyyy')}
                                </p>
                            </div>
                        </div>

                        <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                    <TableRow>
                                        <TableHead className="text-[10px] font-black uppercase">Product</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right">Quantity</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right">Rate</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedQuotation.items?.map((it: any, idx: number) => (
                                        <TableRow key={idx} className="text-xs border-b border-slate-50 dark:border-slate-800">
                                            <TableCell className="font-bold">{it.description}</TableCell>
                                            <TableCell className="text-right font-medium">{it.quantity} {it.unit}</TableCell>
                                            <TableCell className="text-right font-medium">₹{it.rate?.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-black">₹{it.taxableAmount?.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Terms & Conditions</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md line-clamp-4 leading-relaxed italic">
                                        {selectedQuotation.termsAndConditions || 'No specific terms provided.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Payment</p>
                                        <p className="text-xs font-bold text-slate-700">{selectedQuotation.paymentTerms || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Status</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${selectedQuotation.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {selectedQuotation.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg border border-indigo-100 dark:border-indigo-800 space-y-3 self-start">
                                <div className="flex justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                    <span>Taxable Amount</span>
                                    <span>₹{selectedQuotation.summary?.totalTaxable?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                    <span>GST Total</span>
                                    <span>₹{selectedQuotation.summary?.totalGst?.toLocaleString()}</span>
                                </div>
                                {Number(selectedQuotation.summary?.freightCharges) > 0 && (
                                    <div className="flex justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                        <span>Freight</span>
                                        <span>₹{selectedQuotation.summary?.freightCharges?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-3 border-t border-indigo-200 dark:border-indigo-800">
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Net Payable</span>
                                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">₹{selectedQuotation.summary?.netAmount?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button onClick={() => setIsViewModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest h-10 px-8">Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
