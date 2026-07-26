'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus,
    Search,
    FileText,
    ArrowLeft,
    Calendar,
    BadgePercent,
    IndianRupee,
    Clock,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    ExternalLink
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { Select, SelectSm } from '@/components/ui/Select';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function PurchaseQuotationPage() {
    const { loading: authLoading } = useAuth();
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    // Features states
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (activeDropdown && !(e.target as Element).closest('.dropdown-container')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown]);

    // For Form Data
    const [products, setProducts] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [enquiries, setEnquiries] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        quotationNumber: `PQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        quotationDate: new Date().toISOString().split('T')[0],
        enquiryId: '',
        supplierId: '',
        validTill: '',
        deliveryTerms: 'FOB',
        paymentTerms: 'Credit',
        items: [{
            productId: '',
            productName: '',
            quantity: '' as any,
            unit: 'Kgs',
            rate: '' as any,
            discountPercentage: '' as any,
            gstRate: 5,
            deliveryDate: '',
            minOrderQuantity: 1,
            taxableAmount: 0,
            gstAmount: 0,
            totalAmount: 0
        }],
        summary: {
            totalTaxable: 0,
            totalGst: 0,
            totalAmount: 0,
            freightCharges: '' as any,
            insuranceCharges: '' as any,
            netAmount: 0
        },
        termsAndConditions: '',
        status: 'Pending'
    });

    const fetchQuotations = async () => {
        try {
            const res = await api.get('/purchase-quotations');
            setQuotations(res.data);
        } catch (error) {
            console.error('Error fetching quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataForForm = async () => {
        try {
            const [prodRes, partyRes, enqRes] = await Promise.all([
                api.get('/products'),
                api.get('/parties'),
                api.get('/purchase-enquiries')
            ]);
            setProducts(prodRes.data);
            setSuppliers(partyRes.data.filter((p: any) => p.partyType === 'Supplier' || p.category === 'Supplier'));
            setEnquiries(enqRes.data.filter((e: any) => e.status === 'Open'));
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchQuotations();
        fetchDataForForm();
    }, [authLoading]);

    // Calculate totals whenever items or charges change
    useEffect(() => {
        const calculateTotals = () => {
            let totalTaxable = 0;
            let totalGst = 0;

            const updatedItems = formData.items.map(item => {
                const qty = Number(item.quantity) || 0;
                const rate = Number(item.rate) || 0;
                const disc = Number(item.discountPercentage) || 0;
                const gstR = Number(item.gstRate) || 0;

                const discountAmount = (rate * qty * disc) / 100;
                const itemTaxable = (rate * qty) - discountAmount;
                const itemGst = (itemTaxable * gstR) / 100;
                const itemTotal = itemTaxable + itemGst;

                totalTaxable += itemTaxable;
                totalGst += itemGst;

                return {
                    ...item,
                    discountAmount,
                    taxableAmount: itemTaxable,
                    gstAmount: itemGst,
                    totalAmount: itemTotal
                };
            });

            const totalAmount = totalTaxable + totalGst;
            const netAmount = totalAmount + (Number(formData.summary.freightCharges) || 0) + (Number(formData.summary.insuranceCharges) || 0);

            setFormData(prev => ({
                ...prev,
                summary: {
                    ...prev.summary,
                    totalTaxable,
                    totalGst,
                    totalAmount,
                    netAmount
                }
            }));
        };

        calculateTotals();
    }, [formData.items, formData.summary.freightCharges, formData.summary.insuranceCharges]);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                productId: '',
                productName: '',
                quantity: '' as any,
                unit: 'Kgs',
                rate: '' as any,
                discountPercentage: '' as any,
                gstRate: 5,
                deliveryDate: '',
                minOrderQuantity: 1,
                taxableAmount: 0,
                gstAmount: 0,
                totalAmount: 0
            }]
        });
    };

    const handleEnquiryChange = (enquiryId: string) => {
        if (!enquiryId) {
            setFormData({ ...formData, enquiryId: '' });
            return;
        }

        const enquiry = enquiries.find((e: any) => e._id === enquiryId);
        if (enquiry) {
            const mappedItems = enquiry.items?.map((item: any) => ({
                productId: item.productId?._id || item.productId || '',
                productName: item.productName || item.productId?.productName || '',
                quantity: item.quantity || '',
                unit: item.unit || 'Kgs',
                rate: '',
                discountPercentage: '',
                gstRate: 5,
                deliveryDate: '',
                minOrderQuantity: 1,
                taxableAmount: 0,
                gstAmount: 0,
                totalAmount: 0
            })) || [];

            setFormData({
                ...formData,
                enquiryId,
                items: mappedItems.length > 0 ? mappedItems : formData.items
            });
        } else {
            setFormData({ ...formData, enquiryId });
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        if (field === 'productId') {
            const product = products.find((p: any) => p._id === value);
            newItems[index] = {
                ...newItems[index],
                productId: value,
                productName: product ? (product as any).productName : '',
                unit: product ? (product as any).inventory.unitOfMeasure : 'Kgs',
                rate: product ? ((product as any).costing?.lastPurchaseRate || '') : ''
            };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setFormData({ ...formData, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDATION
        const errors = [];
        if (!formData.supplierId) errors.push("Supplier is required");
        if (!formData.validTill) errors.push("Validity Date (Valid Till) is required");

        if (formData.items.length === 0) {
            errors.push("At least one item is required");
        } else {
            formData.items.forEach((item, idx) => {
                const label = `Item #${idx + 1}`;
                if (!item.productId) errors.push(`${label}: Product is required`);
                if (!item.quantity || item.quantity <= 0) errors.push(`${label}: Quantity must be greater than 0`);
                if (!item.rate || item.rate <= 0) errors.push(`${label}: Rate must be greater than 0`);
            });
        }

        if (errors.length > 0) {
            showToast("Required fields are missing. Please check items and validity.", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            // Helper: Mongoose rejects empty strings for ObjectId fields → send undefined instead
            const orUndefined = (val: string) => val && val.trim() !== '' ? val : undefined;

            const dataToSubmit = {
                ...formData,
                supplierId: orUndefined(formData.supplierId),
                enquiryId: orUndefined(formData.enquiryId),
                items: formData.items.map(item => ({
                    ...item,
                    productId: orUndefined(item.productId),
                    quantity: Number(item.quantity) || 0,
                    rate: Number(item.rate) || 0,
                    discountPercentage: Number(item.discountPercentage) || 0,
                    gstRate: Number(item.gstRate) || 0
                })),
                summary: {
                    ...formData.summary,
                    freightCharges: Number(formData.summary.freightCharges) || 0,
                    insuranceCharges: Number(formData.summary.insuranceCharges) || 0
                }
            };

            await api.post('/purchase-quotations', dataToSubmit);
            setIsAddModalOpen(false);
            fetchQuotations();
            showToast('Quotation saved successfully', 'success');
            // Reset form
            setFormData({
                quotationNumber: `PQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                quotationDate: new Date().toISOString().split('T')[0],
                enquiryId: '',
                supplierId: '',
                validTill: '',
                deliveryTerms: 'FOB',
                paymentTerms: 'Credit',
                items: [{
                    productId: '',
                    productName: '',
                    quantity: '' as any,
                    unit: 'Kgs',
                    rate: '' as any,
                    discountPercentage: '' as any,
                    gstRate: '' as any,
                    deliveryDate: '',
                    minOrderQuantity: 1,
                    taxableAmount: 0,
                    gstAmount: 0,
                    totalAmount: 0
                }],
                summary: {
                    totalTaxable: 0,
                    totalGst: 0,
                    totalAmount: 0,
                    freightCharges: '' as any,
                    insuranceCharges: '' as any,
                    netAmount: 0
                },
                termsAndConditions: '',
                status: 'Pending'
            });
        } catch (error: any) {
            console.error('Error creating quotation:', error);
            const msg = error?.response?.data?.message || 'Failed to create quotation';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewQuotation = (quotation: any) => {
        setSelectedQuotation(quotation);
        setIsViewModalOpen(true);
        setActiveDropdown(null);
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await api.put(`/purchase-quotations/${id}`, { status });
            showToast(`Quotation marked as ${status}`, 'success');
            fetchQuotations();
            setActiveDropdown(null);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    const handleAcceptQuotation = async (id: string) => {
        try {
            await api.post(`/purchase-quotations/${id}/accept`);
            showToast(`Quotation Accepted successfully`, 'success');
            fetchQuotations();
            setActiveDropdown(null);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to accept quotation', 'error');
        }
    };

    const handleDeleteQuotation = async (id: string) => {
        if (!window.confirm('Are you sure you want to completely delete this quotation? This action cannot be undone.')) return;
        try {
            await api.delete(`/purchase-quotations/${id}`);
            showToast('Quotation deleted permanently', 'success');
            fetchQuotations();
            setActiveDropdown(null);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete quotation (Admin only)', 'error');
        }
    };

    const filteredQuotations = quotations.filter((q: any) =>
        q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.supplierId?.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" />
                    Receive Quote
                </Button>
            </div>

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Total Quotes</p>
                            <p className="text-xl font-bold">{quotations.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Pending</p>
                            <p className="text-xl font-bold">{quotations.filter((q: any) => q.status === 'Pending').length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Accepted</p>
                            <p className="text-xl font-bold">{quotations.filter((q: any) => q.status === 'Accepted').length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                            <XCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Rejected</p>
                            <p className="text-xl font-bold">{quotations.filter((q: any) => q.status === 'Rejected').length}</p>
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
                            placeholder="Search by quote no or supplier..."
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
                                <TableHead className="font-semibold">Quotation Details</TableHead>
                                <TableHead className="font-semibold">Supplier</TableHead>
                                <TableHead className="font-semibold">Validity</TableHead>
                                <TableHead className="font-semibold">Items & Value</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center text-slate-500">
                                        Loading quotations...
                                    </TableCell>
                                </TableRow>
                            ) : filteredQuotations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                        No quotations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredQuotations.map((quot: any) => (
                                    <TableRow key={quot._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white uppercase">{quot.quotationNumber}</span>
                                                <span className="text-[10px] text-slate-500 uppercase mt-0.5">
                                                    REF: {quot.enquiryId?.enquiryNumber || 'Direct Quote'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {quot.supplierId?.partyName}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex flex-col">
                                                <span>Till {format(new Date(quot.validTill), 'dd MMM yyyy')}</span>
                                                <span className="text-[10px] text-slate-400">{quot.paymentTerms}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    ₹{quot.summary?.netAmount?.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    {quot.items?.length || 0} Items
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${quot.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                                                quot.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                                                }`}>
                                                {quot.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {quot.status === 'Pending' && (
                                                    <Button variant="ghost" size="sm" className="h-8 p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 flex items-center gap-1" title="Accept Quate" onClick={() => handleAcceptQuotation(quot._id)}>
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-xs font-semibold">Accept</span>
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Quotation Details" onClick={() => handleViewQuotation(quot)}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                
                                                <div className="relative dropdown-container">
                                                    <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${activeDropdown === quot._id ? 'bg-slate-100 dark:bg-slate-800' : ''}`} onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === quot._id ? null : quot._id);
                                                    }}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>

                                                    {activeDropdown === quot._id && (
                                                        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
                                                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                                Options
                                                            </div>
                                                            <div className="p-1">
                                                                <button 
                                                                    onClick={() => handleViewQuotation(quot)}
                                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-sm font-medium transition-colors"
                                                                >
                                                                    View Details
                                                                </button>
                                                                {quot.status === 'Pending' && (
                                                                    <button 
                                                                        onClick={() => handleUpdateStatus(quot._id, 'Rejected')}
                                                                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-sm font-medium transition-colors"
                                                                    >
                                                                        Reject Quotation
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    onClick={() => handleDeleteQuotation(quot._id)}
                                                                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-sm font-medium transition-colors mt-1 border-t border-slate-100 dark:border-slate-700 pt-2"
                                                                >
                                                                    Permanently Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Purchase Quotation"
                className="max-w-5xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="Quotation Number">
                            <Input disabled value={formData.quotationNumber} />
                        </FormField>
                        <FormField label="Supplier">
                            <Select
                                value={formData.supplierId}
                                onChange={(val) => setFormData({ ...formData, supplierId: val })}
                                placeholder="Select Supplier"
                                options={suppliers.map((s: any) => ({ value: s._id, label: s.partyName }))}
                            />
                        </FormField>
                        <FormField label="Enquiry Reference (Optional)">
                            <Select
                                value={formData.enquiryId}
                                onChange={handleEnquiryChange}
                                placeholder="Direct Quotation"
                                options={enquiries.map((e: any) => ({ value: e._id, label: `${e.enquiryNumber} (${e.enquiryType})` }))}
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField label="Quotation Date">
                            <Input type="date" value={formData.quotationDate} onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })} />
                        </FormField>
                        <FormField label="Valid Till">
                            <Input type="date" value={formData.validTill} onChange={(e) => setFormData({ ...formData, validTill: e.target.value })} />
                        </FormField>
                        <FormField label="Delivery Terms">
                            <Input placeholder="e.g. FOB Mumbai" value={formData.deliveryTerms} onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })} />
                        </FormField>
                        <FormField label="Payment Terms">
                            <Input placeholder="e.g. 30 Days Credit" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} />
                        </FormField>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <IndianRupee className="h-4 w-4" /> Item Pricing
                            </h3>
                            <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="text-indigo-600">
                                <Plus className="mr-1 h-4 w-4" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-4 mt-4">
                            {formData.items.map((item, index) => (
                                <div key={index} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                        <div className="md:col-span-2">
                                            <FormField label="Product">
                                                <Select
                                                    value={item.productId}
                                                    onChange={(val) => handleItemChange(index, 'productId', val)}
                                                    placeholder="Select Product"
                                                    options={products.map((p: any) => ({ value: p._id, label: p.productName }))}
                                                />
                                            </FormField>
                                        </div>
                                        <FormField label="Qty">
                                            <Input type="number" step="0.01" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                        </FormField>
                                        <FormField label="Rate">
                                            <Input type="number" step="0.01" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                        </FormField>
                                        <FormField label="Disc %">
                                            <Input type="number" step="0.1" value={item.discountPercentage || ''} onChange={(e) => handleItemChange(index, 'discountPercentage', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                        </FormField>
                                        <FormField label="GST %">
                                            <Input type="number" value={item.gstRate || ''} onChange={(e) => handleItemChange(index, 'gstRate', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                        </FormField>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                                        <div className="text-indigo-600 dark:text-indigo-400 font-black text-sm">
                                            Total: ₹{(( (Number(item.rate) || 0) * (Number(item.quantity) || 0) * (1 - (Number(item.discountPercentage) || 0) / 100)) * (1 + (Number(item.gstRate) || 0) / 100)).toFixed(2)}
                                        </div>
                                        {formData.items.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30">
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Remove Item
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
                        <div className="space-y-4">
                            <FormField label="Terms & Conditions">
                                <textarea
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 min-h-[100px]"
                                    placeholder="Enter any additional terms..."
                                    value={formData.termsAndConditions}
                                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                                />
                            </FormField>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-md space-y-3">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Total Taxable</span>
                                <span>₹{formData.summary.totalTaxable.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Total GST</span>
                                <span>₹{formData.summary.totalGst.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                <div className="relative">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 absolute -top-4">Freight</span>
                                    <Input 
                                        type="number" 
                                        value={formData.summary.freightCharges || ''} 
                                        className="h-8 mt-1" 
                                        onChange={(e) => setFormData({ ...formData, summary: { ...formData.summary, freightCharges: e.target.value === '' ? '' : parseFloat(e.target.value) } })} 
                                    />
                                </div>
                                <div className="relative">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 absolute -top-4">Insurance</span>
                                    <Input 
                                        type="number" 
                                        value={formData.summary.insuranceCharges || ''} 
                                        className="h-8 mt-1" 
                                        onChange={(e) => setFormData({ ...formData, summary: { ...formData.summary, insuranceCharges: e.target.value === '' ? '' : parseFloat(e.target.value) } })} 
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white pt-2">
                                <span>Net Amount</span>
                                <span className="text-indigo-600">₹{formData.summary.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 min-w-[150px]">
                            {isSubmitting ? 'Saving...' : 'Save Quotation'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Quotation Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Purchase Quotation: ${selectedQuotation?.quotationNumber}`}
                className="max-w-5xl"
            >
                {selectedQuotation && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Supplier</p>
                                <p className="font-bold text-slate-900 dark:text-white mt-1">{selectedQuotation.supplierId?.partyName}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedQuotation.supplierId?.city}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date & Validity</p>
                                <p className="font-semibold text-slate-900 dark:text-white mt-1">{format(new Date(selectedQuotation.quotationDate), 'dd MMM yyyy')}</p>
                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> Valid Till {format(new Date(selectedQuotation.validTill), 'dd MMM yy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Terms</p>
                                <p className="font-semibold text-slate-900 dark:text-white mt-1 text-sm">{selectedQuotation.deliveryTerms || 'Standard Delivery'}</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">{selectedQuotation.paymentTerms || 'Standard Payment'}</p>
                            </div>
                            <div className="flex flex-col items-end justify-center border-l dark:border-slate-700 pl-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Value</p>
                                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{selectedQuotation.summary?.netAmount?.toLocaleString()}</p>
                                <span className={`inline-flex mt-1 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    selectedQuotation.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                                    selectedQuotation.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {selectedQuotation.status}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 mt-6">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <IndianRupee className="h-4 w-4 text-indigo-500" /> Quoted Items
                            </h3>
                            <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900">
                                        <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <th className="px-4 py-3">Item Description</th>
                                            <th className="px-4 py-3 text-right">Qty</th>
                                            <th className="px-4 py-3 text-right">Rate (₹)</th>
                                            <th className="px-4 py-3 text-right">Disc. %</th>
                                            <th className="px-4 py-3 text-right">GST %</th>
                                            <th className="px-4 py-3 text-right font-bold">Total (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                                        {selectedQuotation.items.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-900 dark:text-white">{item.productName || item.productId?.productName}</p>
                                                    {item.deliveryDate && <p className="text-[10px] text-slate-500 mt-0.5">Del. by: {format(new Date(item.deliveryDate), 'dd MMM')}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-semibold text-slate-900 dark:text-white">{item.quantity}</span> <span className="text-xs text-slate-500">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">{item.rate?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-rose-600">{item.discountPercentage > 0 ? `${item.discountPercentage}%` : '-'}</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{item.gstRate}%</td>
                                                <td className="px-4 py-3 text-right font-bold text-indigo-600">{item.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                            <div className="w-full md:w-1/2 space-y-3">
                                {selectedQuotation.termsAndConditions && (
                                    <>
                                        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-emerald-500" /> T&C / Remarks
                                        </h3>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md border text-sm text-slate-700 dark:text-slate-300 italic">
                                            {selectedQuotation.termsAndConditions}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="w-full md:w-1/2">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Financial Summary</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Total Taxable Value</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">₹{selectedQuotation.summary?.totalTaxable?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-medium">Total GST</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">₹{selectedQuotation.summary?.totalGst?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-rose-600">
                                            <span className="font-medium">Total Discount</span>
                                            <span className="font-semibold">- ₹{selectedQuotation.items.reduce((sum: number, it: any) => sum + (it.discountAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {(selectedQuotation.summary?.freightCharges > 0 || selectedQuotation.summary?.insuranceCharges > 0) && (
                                            <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                                                <span className="text-slate-500 font-medium">Additional Charges</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">₹{((selectedQuotation.summary?.freightCharges || 0) + (selectedQuotation.summary?.insuranceCharges || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-indigo-100 dark:border-slate-700">
                                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Grand Total</span>
                                            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">₹{selectedQuotation.summary?.netAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-2 border-t border-slate-200 dark:border-slate-800">
                            {selectedQuotation.status === 'Pending' && (
                                <>
                                    <Button 
                                        variant="outline" 
                                        className="text-rose-600 hover:bg-rose-50 border-rose-200"
                                        onClick={() => {
                                            handleUpdateStatus(selectedQuotation._id, 'Rejected');
                                            setIsViewModalOpen(false);
                                        }}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" /> Reject Quote
                                    </Button>
                                    <Button 
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => {
                                            handleAcceptQuotation(selectedQuotation._id);
                                            setIsViewModalOpen(false);
                                        }}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Accept Quotation
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
