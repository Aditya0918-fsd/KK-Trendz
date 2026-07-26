'use client';

// Removed DashboardLayout as it's provided by ProcurementLayout
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus,
    Search,
    ShoppingCart,
    ArrowLeft,
    Calendar,
    User,
    CheckCircle2,
    Clock,
    XCircle,
    MoreHorizontal,
    ExternalLink,
    FileText,
    Truck,
    Package
} from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { Select, SelectSm } from '@/components/ui/Select';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function PurchaseOrderPage() {
    const { loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const { showToast } = useToast();

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

    const [products, setProducts] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [quotations, setQuotations] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        poDate: new Date().toISOString().split('T')[0],
        poType: 'Yarn',
        quotationId: '',
        supplierId: '',
        supplierReference: '',
        expectedDelivery: '',
        deliveryTerms: '',
        paymentTerms: '',
        items: [{
            itemId: `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
            productId: '',
            productDescription: '',
            yarnSpecs: {
                count: '',
                ply: '',
                blend: '',
                lotNumber: '',
                brand: ''
            },
            fabricSpecs: {
                construction: '',
                gsm: 0,
                width: 0,
                color: '',
                shadeCode: '',
                finish: ''
            },
            orderQuantity: '' as any,
            unit: 'Kgs',
            rate: '' as any,
            discountPercentage: '' as any,
            gstRate: 5,
            taxableAmount: 0,
            gstAmount: 0,
            totalAmount: 0,
            pendingQuantity: 0,
            deliverySchedule: [] as any[]
        }],
        financialSummary: {
            subtotal: 0,
            discountTotal: 0,
            taxableTotal: 0,
            gstTotal: 0,
            freightCharges: 0,
            insuranceCharges: 0,
            packingCharges: 0,
            grandTotal: 0
        },
        status: 'Draft'
    });

    const fetchOrders = async () => {
        try {
            const res = await api.get('/purchase-orders');
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataForForm = async () => {
        try {
            const [prodRes, partyRes, quotRes] = await Promise.all([
                api.get('/products'),
                api.get('/parties'),
                api.get('/purchase-quotations')
            ]);
            setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
            setSuppliers((Array.isArray(partyRes.data) ? partyRes.data : []).filter((p: any) => p.partyType === 'Supplier' || p.category === 'Supplier'));
            setQuotations((Array.isArray(quotRes.data) ? quotRes.data : []).filter((q: any) => q.status === 'Accepted'));
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchOrders();
        fetchDataForForm();
    }, [authLoading]);

    // Financial Calculation Logic
    useEffect(() => {
        let subtotal = 0;
        let discountTotal = 0;
        let taxableTotal = 0;
        let gstTotal = 0;

        const updatedItems = formData.items.map(item => {
            const qty = Number(item.orderQuantity) || 0;
            const rate = Number(item.rate) || 0;
            const disc = Number(item.discountPercentage) || 0;
            const gstR = Number(item.gstRate) || 0;

            const lineSubtotal = rate * qty;
            const lineDiscount = (lineSubtotal * disc) / 100;
            const lineTaxable = lineSubtotal - lineDiscount;
            const lineGst = (lineTaxable * gstR) / 100;
            const lineTotal = lineTaxable + lineGst;

            subtotal += lineSubtotal;
            discountTotal += lineDiscount;
            taxableTotal += lineTaxable;
            gstTotal += lineGst;

            return {
                ...item,
                taxableAmount: lineTaxable,
                gstAmount: lineGst,
                totalAmount: lineTotal,
                pendingQuantity: qty
            };
        });

        const otherCharges = (Number(formData.financialSummary.freightCharges) || 0) +
                            (Number(formData.financialSummary.insuranceCharges) || 0) +
                            (Number(formData.financialSummary.packingCharges) || 0);

        setFormData(prev => ({
            ...prev,
            financialSummary: {
                ...prev.financialSummary,
                subtotal,
                discountTotal,
                taxableTotal,
                gstTotal,
                grandTotal: taxableTotal + gstTotal + otherCharges
            }
        }));
    }, [formData.items, formData.financialSummary.freightCharges, formData.financialSummary.insuranceCharges, formData.financialSummary.packingCharges]);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                itemId: `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
                productId: '',
                productDescription: '',
                yarnSpecs: {
                    count: '',
                    ply: '',
                    blend: '',
                    lotNumber: '',
                    brand: ''
                },
                fabricSpecs: {
                    construction: '',
                    gsm: 0,
                    width: 0,
                    color: '',
                    shadeCode: '',
                    finish: ''
                },
                orderQuantity: '' as any,
                unit: 'Kgs',
                rate: '' as any,
                discountPercentage: '' as any,
                gstRate: 5,
                taxableAmount: 0,
                gstAmount: 0,
                totalAmount: 0,
                pendingQuantity: 0,
                deliverySchedule: []
            }]
        });
    };

    const handleQuotationChange = (quotationId: string) => {
        const quot = quotations.find((q: any) => q._id === quotationId);
        if (quot) {
            setFormData({
                ...formData,
                quotationId,
                supplierId: (typeof quot.supplierId === 'object' ? quot.supplierId?._id : quot.supplierId) || '',
                deliveryTerms: quot.deliveryTerms || '',
                paymentTerms: quot.paymentTerms || '',
                items: (quot.items || []).map((item: any) => ({
                    itemId: `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
                    productId: item.productId?._id || item.productId,
                    productDescription: item.productName || item.productDescription,
                    yarnSpecs: item.yarnSpecs || {
                        count: '',
                        ply: '',
                        blend: '',
                        lotNumber: '',
                        brand: ''
                    },
                    fabricSpecs: item.fabricSpecs || {
                        construction: '',
                        gsm: 0,
                        width: 0,
                        color: '',
                        shadeCode: '',
                        finish: ''
                    },
                    orderQuantity: item.quantity || item.orderQuantity || '',
                    unit: item.unit || 'Kgs',
                    rate: item.rate || '',
                    discountPercentage: item.discountPercentage || '',
                    gstRate: item.gstRate || 5,
                    taxableAmount: item.taxableAmount || 0,
                    gstAmount: item.gstAmount || 0,
                    totalAmount: item.totalAmount || 0,
                    pendingQuantity: item.quantity || item.orderQuantity || 0,
                    deliverySchedule: item.deliverySchedule || []
                }))
            });
        } else {
            setFormData({ ...formData, quotationId: '' });
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        if (field === 'productId') {
            const product = products.find((p: any) => p._id === value);
            newItems[index] = {
                ...newItems[index],
                productId: value,
                productDescription: product ? (product as any).productName : '',
                unit: product ? (product as any).inventory.unitOfMeasure : 'Kgs',
                rate: product ? ((product as any).costing?.lastPurchaseRate || '') : ''
            };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // VALIDATION
        const errors = [];
        if (!formData.supplierId) errors.push("Supplier is required");
        if (!formData.poType) errors.push("PO Type is required");

        if (formData.items.length === 0) {
            errors.push("At least one item is required");
        } else {
            formData.items.forEach((item, idx) => {
                const label = `Item #${idx + 1}`;
                if (!item.productId) errors.push(`${label}: Product is required`);
                if (!item.orderQuantity || item.orderQuantity <= 0) errors.push(`${label}: Quantity must be greater than 0`);
                if (!item.rate || item.rate <= 0) errors.push(`${label}: Rate must be greater than 0`);
            });
        }

        if (errors.length > 0) {
            showToast("Required fields are missing. Please check your input.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            // Helper: Mongoose rejects empty strings for ObjectId fields → send undefined instead
            const orUndefined = (val: string) => val && val.trim() !== '' ? val : undefined;

            const dataToSubmit = {
                ...formData,
                supplierId: orUndefined(formData.supplierId),
                quotationId: orUndefined(formData.quotationId),
                items: formData.items.map(item => ({
                    ...item,
                    productId: orUndefined(item.productId),
                    orderQuantity: Number(item.orderQuantity) || 0,
                    rate: Number(item.rate) || 0,
                    discountPercentage: Number(item.discountPercentage) || 0,
                    gstRate: Number(item.gstRate) || 0
                }))
            };

            await api.post('/purchase-orders', dataToSubmit);
            setIsAddModalOpen(false);
            fetchOrders();
        } catch (error: any) {
            console.error('Error creating PO:', error);
            const msg = error?.response?.data?.message || 'Failed to create PO';
            showToast(msg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewOrder = (order: any) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
        setActiveDropdown(null);
    };

    const handleQuickAction = async (id: string, action: 'submit' | 'approve' | 'send') => {
        try {
            if (action === 'send') {
                await api.post(`/purchase-orders/${id}/send`);
                showToast('PO sent successfully to supplier', 'success');
            } else {
                await api.put(`/purchase-orders/${id}/${action}`);
                showToast(`PO ${action}ed successfully`, 'success');
            }
            fetchOrders();
            setActiveDropdown(null);
        } catch (error: any) {
            showToast(error?.response?.data?.message || `Failed to ${action} PO`, 'error');
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!window.confirm('Are you sure you want to completely delete this Purchase Order? This action cannot be undone.')) return;
        try {
            await api.delete(`/purchase-orders/${id}`);
            showToast('Purchase Order deleted permanently', 'success');
            fetchOrders();
            setActiveDropdown(null);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete Purchase Order', 'error');
        }
    };

    const filteredOrders = orders.filter((o: any) =>
        o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.supplierId?.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Active Orders</h2>
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest transition-all hover:scale-[1.02]" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" />
                    New Purchase Order
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm h-full">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total POs</p>
                            <p className="text-2xl font-bold">{orders.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm h-full">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Pending Approval</p>
                            <p className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'Pending Approval').length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm h-full">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Approved</p>
                            <p className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'Approved').length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm h-full">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Ordered</p>
                            <p className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'Ordered').length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="border-none shadow-sm">
                <CardHeader className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search POs..."
                            className="pl-10 h-10 border-none bg-slate-50 dark:bg-slate-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableHead className="font-semibold">Order Details</TableHead>
                                <TableHead className="font-semibold">Supplier</TableHead>
                                <TableHead className="font-semibold">Expected Delivery</TableHead>
                                <TableHead className="font-semibold">Items Value</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">Loading orders...</TableCell>
                                </TableRow>
                            ) : filteredOrders.map((po: any) => (
                                <TableRow key={po._id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white uppercase">{po.poNumber}</span>
                                            <span className="text-[10px] text-slate-500 font-medium">TYPE: {po.poType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                                        {po.supplierId?.partyName}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                        {format(new Date(po.expectedDelivery || po.poDate), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-bold text-indigo-600">
                                            ₹{po.financialSummary?.grandTotal?.toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${po.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                                            po.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' :
                                                po.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    po.status === 'Ordered' ? 'bg-blue-100 text-blue-700' :
                                                        po.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                                                            'bg-slate-100 text-slate-700'
                                            }`}>
                                            {po.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Order Details" onClick={() => handleViewOrder(po)}>
                                                <ExternalLink className="h-4 w-4 text-indigo-600" />
                                            </Button>
                                            
                                            <div className="relative dropdown-container">
                                                <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${activeDropdown === po._id ? 'bg-slate-100 dark:bg-slate-800' : ''}`} onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === po._id ? null : po._id);
                                                }}>
                                                    <MoreHorizontal className="h-4 w-4 font-bold" />
                                                </Button>

                                                {activeDropdown === po._id && (
                                                    <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
                                                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            Quick Actions
                                                        </div>
                                                        <div className="p-1">
                                                            <button 
                                                                onClick={() => handleViewOrder(po)}
                                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-sm font-medium transition-colors"
                                                            >
                                                                View Full Details
                                                            </button>
                                                            {po.status === 'Draft' && (
                                                                <button 
                                                                    onClick={() => handleQuickAction(po._id, 'submit')}
                                                                    className="w-full text-left px-3 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-sm font-medium transition-colors"
                                                                >
                                                                    Submit for Approval
                                                                </button>
                                                            )}
                                                            {po.status === 'Pending Approval' && (
                                                                <button 
                                                                    onClick={() => handleQuickAction(po._id, 'approve')}
                                                                    className="w-full text-left px-3 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-sm font-medium transition-colors"
                                                                >
                                                                    Approve Order
                                                                </button>
                                                            )}
                                                            {po.status === 'Approved' && (
                                                                <button 
                                                                    onClick={() => handleQuickAction(po._id, 'send')}
                                                                    className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-sm font-medium transition-colors"
                                                                >
                                                                    Send to Supplier
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => handleDeleteOrder(po._id)}
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Create Purchase Order"
                className="max-w-6xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField label="Create from Quotation">
                            <Select
                                value={formData.quotationId}
                                onChange={(val) => handleQuotationChange(val)}
                                placeholder="Draft from Scratch"
                                options={quotations.map((q: any) => ({ value: q._id, label: `${q.quotationNumber} - ${q.supplierId?.partyName}` }))}
                            />
                        </FormField>
                        <FormField label="PO Number">
                            <Input disabled value={formData.poNumber} />
                        </FormField>
                        <FormField label="PO Date">
                            <Input type="date" value={formData.poDate} onChange={(e) => setFormData({ ...formData, poDate: e.target.value })} />
                        </FormField>
                        <FormField label="PO Type">
                            <Select
                                value={formData.poType}
                                onChange={(val) => setFormData({ ...formData, poType: val as any })}
                                options={[
                                    { value: 'Yarn', label: 'Yarn Purchase' },
                                    { value: 'Fabric', label: 'Fabric Purchase (Direct)' },
                                    { value: 'Accessories', label: 'Accessory Purchase' },
                                    { value: 'JobWork', label: 'Job Work Order' },
                                ]}
                            />
                        </FormField>
                        <FormField label="Supplier">
                            <Select
                                value={formData.supplierId}
                                onChange={(val) => setFormData({ ...formData, supplierId: val })}
                                placeholder="Select Supplier"
                                options={suppliers.map((s: any) => ({ value: s._id, label: s.partyName }))}
                            />
                        </FormField>
                        <FormField label="Supplier Reference">
                            <Input
                                placeholder="Their PO number, if any"
                                value={formData.supplierReference}
                                onChange={(e) => setFormData({ ...formData, supplierReference: e.target.value })}
                            />
                        </FormField>
                    </div>

                    {/* Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Order Items</h3>
                            <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="text-emerald-600">
                                <Plus className="mr-1 h-4 w-4" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-4 mt-4">
                            {formData.items.map((item, index) => (
                                <div key={index} className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-5 space-y-2">
                                            <FormField label="Product">
                                                <Select
                                                    value={item.productId}
                                                    onChange={(val) => handleItemChange(index, 'productId', val)}
                                                    placeholder="Select Product"
                                                    options={products.map((p: any) => ({ value: p._id, label: p.productName }))}
                                                />
                                            </FormField>
                                            {formData.poType === 'Yarn' && (
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <input
                                                        placeholder="Count/Ply/Blend"
                                                        className="text-[10px] sm:text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none w-full"
                                                        value={`${item.yarnSpecs?.count || ''} ${item.yarnSpecs?.ply || ''} ${item.yarnSpecs?.blend || ''}`.trim()}
                                                        onChange={(e) => {
                                                            const parts = e.target.value.split(' ');
                                                            const newItems = [...formData.items];
                                                            newItems[index].yarnSpecs = {
                                                                ...newItems[index].yarnSpecs,
                                                                count: parts[0] || '',
                                                                ply: parts[1] || '',
                                                                blend: parts[2] || ''
                                                            };
                                                            setFormData({ ...formData, items: newItems });
                                                        }}
                                                    />
                                                    <input
                                                        placeholder="Brand"
                                                        className="text-[10px] sm:text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none w-full"
                                                        value={item.yarnSpecs?.brand || ''}
                                                        onChange={(e) => {
                                                            const newItems = [...formData.items];
                                                            newItems[index].yarnSpecs = { ...newItems[index].yarnSpecs, brand: e.target.value };
                                                            setFormData({ ...formData, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField label={`Qty (${item.unit})`}>
                                                <Input type="number" value={item.orderQuantity || ''} onChange={(e) => handleItemChange(index, 'orderQuantity', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                            </FormField>
                                        </div>
                                        <div className="md:col-span-2">
                                            <FormField label="Rate (₹)">
                                                <Input type="number" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                            </FormField>
                                        </div>
                                        <div className="md:col-span-3 grid grid-cols-2 gap-2">
                                            <FormField label="Disc %">
                                                <Input type="number" value={item.discountPercentage || ''} onChange={(e) => handleItemChange(index, 'discountPercentage', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                            </FormField>
                                            <FormField label="GST %">
                                                <Input type="number" value={item.gstRate} onChange={(e) => handleItemChange(index, 'gstRate', e.target.value === '' ? '' : parseFloat(e.target.value))} />
                                            </FormField>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-3 bg-white dark:bg-slate-950 rounded-md border border-dashed border-slate-200 dark:border-slate-800">
                                        {formData.poType === 'Yarn' && (
                                            <FormField label="Lot Number">
                                                <Input placeholder="Enter Lot #" value={item.yarnSpecs?.lotNumber || ''} onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[index].yarnSpecs = { ...newItems[index].yarnSpecs, lotNumber: e.target.value };
                                                    setFormData({ ...formData, items: newItems });
                                                }} className="h-8 text-xs font-mono" />
                                            </FormField>
                                        )}
                                        {(formData.poType === 'Fabric' || formData.poType === 'JobWork') && (
                                            <>
                                                <FormField label="Construction">
                                                    <Input placeholder="e.g. 40s Comb" value={item.fabricSpecs?.construction || ''} onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[index].fabricSpecs = { ...newItems[index].fabricSpecs, construction: e.target.value };
                                                        setFormData({ ...formData, items: newItems });
                                                    }} className="h-8 text-xs" />
                                                </FormField>
                                                <FormField label="GSM">
                                                    <Input type="number" placeholder="160" value={item.fabricSpecs?.gsm || ''} onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[index].fabricSpecs = { ...newItems[index].fabricSpecs, gsm: parseFloat(e.target.value) || 0 };
                                                        setFormData({ ...formData, items: newItems });
                                                    }} className="h-8 text-xs" />
                                                </FormField>
                                                <FormField label="Width (Inch)">
                                                    <Input type="number" placeholder="72" value={item.fabricSpecs?.width || ''} onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[index].fabricSpecs = { ...newItems[index].fabricSpecs, width: parseFloat(e.target.value) || 0 };
                                                        setFormData({ ...formData, items: newItems });
                                                    }} className="h-8 text-xs" />
                                                </FormField>
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Delivery Schedule</h4>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => {
                                                const newItems = [...formData.items];
                                                newItems[index].deliverySchedule.push({ scheduledDate: new Date().toISOString().split('T')[0], quantity: 0 });
                                                setFormData({ ...formData, items: newItems });
                                            }} className="h-6 text-[10px] text-indigo-600">
                                                <Plus size={12} className="mr-1" /> Add Phase
                                            </Button>
                                        </div>
                                        {(item.deliverySchedule || []).map((sch, sIdx) => (
                                            <div key={sIdx} className="grid grid-cols-2 gap-2 max-w-sm">
                                                <Input type="date" value={sch.scheduledDate as any} onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[index].deliverySchedule[sIdx].scheduledDate = e.target.value as any;
                                                    setFormData({ ...formData, items: newItems });
                                                }} className="h-7 text-[10px]" />
                                                <Input type="number" placeholder="Qty" value={sch.quantity || ''} onChange={(e) => {
                                                    const newItems = [...formData.items];
                                                    newItems[index].deliverySchedule[sIdx].quantity = parseFloat(e.target.value) || 0;
                                                    setFormData({ ...formData, items: newItems });
                                                }} className="h-7 text-[10px] font-bold" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                                        <div className="text-indigo-600 dark:text-indigo-400 font-black text-sm">
                                            Total: ₹{item.totalAmount.toFixed(2)}
                                        </div>
                                        {formData.items.length > 1 && (
                                             <Button type="button" variant="ghost" size="sm" onClick={() => {
                                                const newItems = formData.items.filter((_, i) => i !== index);
                                                setFormData({ ...formData, items: newItems });
                                             }} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30">
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Remove Item
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 margin-t border-t border-slate-200 dark:border-slate-800">
                        <div className="space-y-5">
                            <FormField label="Expected Delivery Date">
                                <Input type="date" value={formData.expectedDelivery} onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })} className="w-full sm:max-w-xs" />
                            </FormField>
                            <div className="grid grid-cols-2 gap-4 max-w-sm">
                                <FormField label="Delivery Terms">
                                    <Input placeholder="e.g. FOB" value={formData.deliveryTerms} onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })} />
                                </FormField>
                                <FormField label="Payment Terms">
                                    <Input placeholder="e.g. Credit" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} />
                                </FormField>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 space-y-3">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    Other Charges (Additions)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <FormField label="Freight">
                                        <Input type="number" placeholder="0" value={formData.financialSummary.freightCharges || ''} onChange={(e) => setFormData({ ...formData, financialSummary: { ...formData.financialSummary, freightCharges: parseFloat(e.target.value) || 0 } })} className="h-9 text-sm font-semibold" />
                                    </FormField>
                                    <FormField label="Insurance">
                                        <Input type="number" placeholder="0" value={formData.financialSummary.insuranceCharges || ''} onChange={(e) => setFormData({ ...formData, financialSummary: { ...formData.financialSummary, insuranceCharges: parseFloat(e.target.value) || 0 } })} className="h-9 text-sm font-semibold" />
                                    </FormField>
                                    <FormField label="Packing">
                                        <Input type="number" placeholder="0" value={formData.financialSummary.packingCharges || ''} onChange={(e) => setFormData({ ...formData, financialSummary: { ...formData.financialSummary, packingCharges: parseFloat(e.target.value) || 0 } })} className="h-9 text-sm font-semibold" />
                                    </FormField>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 overflow-hidden w-full p-6 sm:p-8 rounded-xl space-y-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                            <div className="space-y-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="font-medium whitespace-nowrap">Subtotal</span>
                                    <span className="font-semibold text-slate-900 dark:text-white truncate">₹{formData.financialSummary.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-rose-500">
                                    <span className="font-medium whitespace-nowrap">Discount</span>
                                    <span className="font-semibold truncate">-₹{formData.financialSummary.discountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-base text-slate-800 dark:text-slate-200 font-bold">
                                    <span className="whitespace-nowrap">Taxable Total</span>
                                    <span className="truncate">₹{formData.financialSummary.taxableTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="font-medium whitespace-nowrap">GST Total</span>
                                    <span className="font-semibold text-slate-900 dark:text-white truncate">+₹{formData.financialSummary.gstTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                {(formData.financialSummary.freightCharges > 0 || formData.financialSummary.insuranceCharges > 0 || formData.financialSummary.packingCharges > 0) && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                        <span className="whitespace-nowrap">Other Charges (F/I/P)</span>
                                        <span className="truncate">+₹{(formData.financialSummary.freightCharges + formData.financialSummary.insuranceCharges + formData.financialSummary.packingCharges).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
                                <span className="text-xl font-black text-slate-900 dark:text-white capitalize">Grand Total</span>
                                <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter break-all text-right">
                                    <span className="text-xl sm:text-2xl mr-1 opacity-70">₹</span>
                                    {formData.financialSummary.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-6 mt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddModalOpen(false)}>
                            Cancel / Save Draft
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 min-w-[200px] text-white shadow-lg shadow-indigo-600/30">
                            {isSubmitting ? 'Processing...' : 'Place Order'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Purchase Order: ${selectedOrder?.poNumber}`}
                className="max-w-5xl"
            >
                {selectedOrder && (
                    <div className="space-y-8">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-md border border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {format(new Date(selectedOrder.poDate), 'dd MMM yyyy')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier</p>
                                <p className="font-semibold text-indigo-600">
                                    {selectedOrder.supplierId?.partyName}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Delivery</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {selectedOrder.expectedDelivery ? format(new Date(selectedOrder.expectedDelivery), 'dd MMM yyyy') : 'Not Specified'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier Ref</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {selectedOrder.supplierReference || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${selectedOrder.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                                    selectedOrder.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' :
                                        selectedOrder.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                            selectedOrder.status === 'Ordered' ? 'bg-blue-100 text-blue-700' :
                                                selectedOrder.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-slate-100 text-slate-700'
                                    }`}>
                                    {selectedOrder.status}
                                </span>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Items</h3>
                            <div className="rounded-md border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                            <th className="text-left p-4">Product</th>
                                            <th className="text-center p-4">Quantity</th>
                                            <th className="text-center p-4">Received</th>
                                            <th className="text-right p-4">Rate</th>
                                            <th className="text-right p-4">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {selectedOrder.items?.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <p className="font-bold text-slate-900 dark:text-white">{item.productId?.productName || item.productDescription}</p>
                                                        {item.yarnSpecs && (item.yarnSpecs.count || item.yarnSpecs.brand) && (
                                                            <p className="text-[10px] text-indigo-500 font-bold">
                                                                SPECS: {item.yarnSpecs.count} {item.yarnSpecs.ply} {item.yarnSpecs.blend} | BRAND: {item.yarnSpecs.brand}
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-slate-500 font-medium">UNIT: {item.unit}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                                                    {item.orderQuantity} {item.unit}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`font-bold ${item.receivedQuantity >= item.orderQuantity ? 'text-emerald-600' : 'text-amber-500'}`}>
                                                        {item.receivedQuantity || 0}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 ml-1">/{item.orderQuantity}</span>
                                                </td>
                                                <td className="p-4 text-right font-medium">₹{item.rate?.toLocaleString()}</td>
                                                <td className="p-4 text-right font-bold text-indigo-600 italic">₹{item.totalAmount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Terms & Financials */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="p-6 rounded-md bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4">Terms & Conditions</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600">
                                                <Truck className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Delivery Terms</p>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedOrder.deliveryTerms || 'Standard'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Payment Terms</p>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedOrder.paymentTerms || 'As per contract'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-md bg-slate-900 dark:bg-black border border-slate-800 shadow-2xl space-y-4 text-white">
                                <div className="flex justify-between text-sm text-slate-400 font-medium">
                                    <span>Taxable Total</span>
                                    <span>₹{selectedOrder.financialSummary?.taxableTotal?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-400 font-medium pb-4 border-b border-slate-800">
                                    <span>GST (Integrated)</span>
                                    <span>₹{selectedOrder.financialSummary?.gstTotal?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-lg font-bold text-slate-300">Net Amount</span>
                                    <span className="text-3xl font-black text-emerald-400 tracking-tighter italic">
                                        ₹{selectedOrder.financialSummary?.grandTotal?.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-500 text-right font-medium italic mt-4">
                                    * Values inclusive of all applicable taxes
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t gap-3">
                            {selectedOrder.status === 'Draft' && (
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={async () => {
                                        try {
                                            await api.put(`/purchase-orders/${selectedOrder._id}/submit`);
                                            setIsViewModalOpen(false);
                                            fetchOrders();
                                            showToast('PO submitted successfully', 'success');
                                        } catch (error: any) {
                                            const msg = error?.response?.data?.message || 'Failed to submit PO';
                                            showToast(msg, 'error');
                                        }
                                    }}
                                >
                                    Submit for Approval
                                </Button>
                            )}
                            {selectedOrder.status === 'Pending Approval' && (
                                <>
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={async () => {
                                            try {
                                                await api.put(`/purchase-orders/${selectedOrder._id}/approve`);
                                                setIsViewModalOpen(false);
                                                fetchOrders();
                                                showToast('PO approved successfully', 'success');
                                            } catch (error: any) {
                                                const msg = error?.response?.data?.message || 'Failed to approve PO';
                                                showToast(msg, 'error');
                                            }
                                        }}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-rose-500 text-rose-500 hover:bg-rose-50"
                                        onClick={() => setIsRejecting(true)}
                                    >
                                        Reject
                                    </Button>
                                </>
                            )}
                            {selectedOrder.status === 'Approved' && (
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={async () => {
                                        try {
                                            await api.post(`/purchase-orders/${selectedOrder._id}/send`);
                                            setIsViewModalOpen(false);
                                            fetchOrders();
                                            showToast('PO sent successfully to supplier', 'success');
                                        } catch (error: any) {
                                            const msg = error?.response?.data?.message || 'Failed to send PO';
                                            showToast(msg, 'error');
                                        }
                                    }}
                                >
                                    Send PO to Supplier
                                </Button>
                            )}
                            <Button variant="outline" className="rounded-md px-8" onClick={() => setIsViewModalOpen(false)}>
                                Close Preview
                            </Button>
                            {isRejecting && (
                                <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h4 className="text-sm font-bold text-rose-600 uppercase mb-3 text-center">Rejection Reason</h4>
                                    <textarea
                                        className="w-full h-24 p-3 text-sm rounded-md border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all outline-none"
                                        placeholder="Please provide a reason for rejection..."
                                        value={rejectRemarks}
                                        onChange={(e) => setRejectRemarks(e.target.value)}
                                    />
                                    <div className="flex justify-center gap-3 mt-4">
                                        <Button
                                            variant="ghost"
                                            className="text-slate-500 font-bold uppercase text-xs"
                                            onClick={() => {
                                                setIsRejecting(false);
                                                setRejectRemarks('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8"
                                            onClick={async () => {
                                                if (!rejectRemarks.trim()) {
                                                    showToast('Please provide a reason for rejection', 'warning');
                                                    return;
                                                }
                                                try {
                                                    await api.put(`/purchase-orders/${selectedOrder._id}/reject`, { remarks: rejectRemarks });
                                                    setIsViewModalOpen(false);
                                                    setIsRejecting(false);
                                                    setRejectRemarks('');
                                                    fetchOrders();
                                                    showToast('PO has been rejected', 'info');
                                                } catch (error: any) {
                                                    const msg = error?.response?.data?.message || 'Failed to reject PO';
                                                    showToast(msg, 'error');
                                                }
                                            }}
                                        >
                                            Confirm Rejection
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
