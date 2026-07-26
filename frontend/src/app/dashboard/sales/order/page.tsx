'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Calendar, User, ShoppingCart,
    Truck, CheckCircle2, MoreHorizontal, Layers, Package, Box,
    Eye, Pencil, Trash2, X
} from 'lucide-react';
import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function SalesOrderPage() {
    const { loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { showToast } = useToast();
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectionRemarks, setRejectionRemarks] = useState('');
    const [selectedOrderForAction, setSelectedOrderForAction] = useState<any>(null);

    // Master data for dropdowns
    const [parties, setParties] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [quotations, setQuotations] = useState<any[]>([]);

    // Form state
    const generateOrderNumber = () => {
        const year = new Date().getFullYear();
        const fiscalYear = `${year}-${(year + 1).toString().slice(-2)}`;
        const randomNum = Math.floor(100 + Math.random() * 900);
        return `SO/${fiscalYear}/${randomNum}`;
    };

    const [formData, setFormData] = useState<any>({
        orderNumber: generateOrderNumber(),
        orderDate: format(new Date(), 'yyyy-MM-dd'),
        orderType: 'Domestic',
        customerId: '',
        quotationId: '',
        customerOrderNo: '',
        customerOrderDate: format(new Date(), 'yyyy-MM-dd'),
        priority: 'Normal',
        deliveryDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        items: [{
            itemId: '1',
            productId: '',
            productName: '',
            specifications: { size: '', color: '', fabric: '', width: '', style: '', gsm: '' as any },
            orderQuantity: '' as any,
            unit: 'Pieces',
            rate: '' as any,
            discountPercentage: 0,
            discountAmount: 0,
            taxableAmount: 0,
            gstRate: 12,
            gstAmount: 0,
            totalAmount: 0,
            sizeBreakup: [
                { size: 'S', quantity: '' as any },
                { size: 'M', quantity: '' as any },
                { size: 'L', quantity: '' as any },
                { size: 'XL', quantity: '' as any }
            ],
            colorBreakup: [],
            accessories: []
        }],
        summary: {
            totalQuantity: 0,
            totalAmount: 0,
            advanceAmount: '' as any,
            balanceAmount: 0,
            currency: 'INR'
        },
        status: 'Draft'
    });

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/sales-orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const [partiesRes, productsRes, quotationsRes] = await Promise.all([
                api.get('/parties'),
                api.get('/products'),
                api.get('/sales-quotations')
            ]);
            setParties(partiesRes.data.filter((p: any) => p.partyType === 'Customer' || p.partyType === 'Both'));
            setProducts(productsRes.data);
            setQuotations(quotationsRes.data.filter((q: any) => q.status === 'Accepted'));
        } catch (error) {
            console.error('Error fetching master data:', error);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchOrders();
            fetchMasterData();
        }
    }, [authLoading]);

    const calculateTotals = (items: any[], advanceAmount: number = 0) => {
        const totalQuantity = items.reduce((sum, item) => sum + (Number(item.orderQuantity) || 0), 0);
        const totalAmount = items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
        return {
            totalQuantity,
            totalAmount,
            advanceAmount: advanceAmount,
            balanceAmount: totalAmount - advanceAmount,
            currency: 'INR'
        };
    };

    const calculateRequirement = (item: any) => {
        const qty = Number(item.orderQuantity) || 0;


        const updatedItem = {
            ...item,
            accessories: (item.accessories || []).map((acc: any) => {
                const baseQty = Number(acc.quantityPerProduct) || Number(acc.baseQty) || 0;
                const wastage = Number(acc.wastagePercentage) || 0;
                const totalWithWastage = (qty * baseQty) * (1 + (wastage / 100));
                
                return { 
                    ...acc, 
                    quantity: Number(totalWithWastage.toFixed(3)) 
                };
            })
        };
        return updatedItem;
    };

    const getAccessoryStock = (type: string, materialId?: string) => {
        if (materialId) {
            const product = products.find(p => p._id === materialId);
            return product?.inventory?.currentStock || 0;
        }
        return products
            .filter(p => {
                const sub = p.productSubCategory?.toLowerCase().replace(/\s+/g, '') || '';
                const name = p.productName?.toLowerCase() || '';

                if (type === 'Buttons') return sub === 'button' || name.includes('button');
                if (type === 'Main Labels') return sub === 'label' && (name.includes('main') || !name.includes('care'));
                if (type === 'Care Labels') return sub === 'label' && name.includes('care');
                if (type === 'Poly Bags') return sub === 'polybag' || sub === 'packing' || name.includes('poly bag');
                if (type === 'Cartons') return sub === 'carton' || name.includes('carton');
                if (type === 'Sewing Thread') return sub === 'thread' || name.includes('thread');
                return false;
            })
            .reduce((sum, p) => sum + (p.inventory?.currentStock || 0), 0);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        let item = { ...newItems[index] };

        if (field === 'productId') {
            const product = products.find(p => p._id === value);
            item.productId = value;
            item.productName = product?.productName || '';

            if (product && product.bom && product.bom.length > 0) {
                item.accessories = product.bom.map((b: any) => {
                    const matProd = products.find(p => p._id === b.materialId);
                    return {
                        materialId: b.materialId,
                        type: matProd ? matProd.productName : 'Component',
                        quantityPerProduct: b.quantityPerProduct || 0,
                        baseQty: b.quantityPerProduct || 0, // Fallback for backward compatibility
                        wastagePercentage: b.wastagePercentage || 0,
                        quantity: 0,
                        unit: b.unit || 'Pieces'
                    };
                });
            } else {
                item.accessories = [];
            }
        } else if (field.includes('.')) {
            const [parent, child] = field.split('.');
            item[parent] = { ...item[parent], [child]: value };
        } else {
            item[field] = value;
        }

        // Auto-calculate amounts
        if (['orderQuantity', 'rate', 'gstRate', 'discountPercentage', 'productId'].includes(field)) {
            const qty = Number(item.orderQuantity) || 0;
            const rate = Number(item.rate) || 0;
            const discPer = Number(item.discountPercentage) || 0;
            const gstRate = Number(item.gstRate) || 0;

            const discAmt = (qty * rate * discPer) / 100;
            item.discountAmount = Number(discAmt.toFixed(2));
            item.taxableAmount = Number((qty * rate - discAmt).toFixed(2));
            item.gstAmount = Number((item.taxableAmount * (gstRate / 100)).toFixed(2));
            item.totalAmount = Number((item.taxableAmount + item.gstAmount).toFixed(2));

            // Re-calculate requirements when quantity changes
            item = calculateRequirement(item);
        }

        newItems[index] = item;
        setFormData({
            ...formData,
            items: newItems,
            summary: calculateTotals(newItems, formData.summary.advanceAmount)
        });
    };

    const handleEditOrder = (order: any) => {
        const cleanedItems = order.items.map((it: any) => ({
            ...it,
            productId: it.productId?._id || it.productId,
            orderQuantity: it.orderQuantity || '',
            rate: it.rate || '',
            specifications: {
                ...it.specifications,
                gsm: it.specifications.gsm || ''
            }
        }));
        setFormData({
            ...order,
            orderDate: format(new Date(order.orderDate), 'yyyy-MM-dd'),
            customerOrderDate: order.customerOrderDate ? format(new Date(order.customerOrderDate), 'yyyy-MM-dd') : '',
            deliveryDate: format(new Date(order.deliveryDate), 'yyyy-MM-dd'),
            customerId: order.customerId?._id || order.customerId,
            quotationId: order.quotationId?._id || order.quotationId || '',
            items: cleanedItems
        });
        setSelectedOrderForAction(order);
        setIsEditModalOpen(true);
    };

    const handleViewOrder = (order: any) => {
        setFormData(order);
        setSelectedOrderForAction(order);
        setIsViewModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent, isSubmitted: boolean = false) => {
        e.preventDefault();

        if (!formData.customerId) {
            showToast('Please select a Customer.', 'warning');
            return;
        }

        try {
            setIsSubmitting(true);
            const dataToSave = {
                ...formData,
                status: isSubmitted ? 'Submitted' : formData.status
            };
            await api.patch(`/sales-orders/${selectedOrderForAction._id}`, dataToSave);
            setIsEditModalOpen(false);
            fetchOrders();
            showToast('Sales order updated successfully', 'success');
        } catch (error: any) {
            console.error('Error updating order:', error);
            showToast(error?.response?.data?.message || 'Error updating order', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                itemId: (formData.items.length + 1).toString(),
                productId: '',
                productName: '',
                specifications: { size: '', color: '', fabric: '', width: '', style: '', gsm: 0 },
                orderQuantity: '' as any,
                unit: 'Pieces',
                rate: '' as any,
                discountPercentage: 0,
                discountAmount: 0,
                taxableAmount: 0,
                gstRate: 12,
                gstAmount: 0,
                totalAmount: 0,
                sizeBreakup: [{ size: 'S', quantity: 0 }, { size: 'M', quantity: 0 }, { size: 'L', quantity: 0 }, { size: 'XL', quantity: 0 }],
                colorBreakup: [],
                accessories: []
            }]
        });
    };

    const removeItem = (index: number) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_: any, i: number) => i !== index);
        setFormData({
            ...formData,
            items: newItems,
            summary: calculateTotals(newItems)
        });
    };

    const handleAddSubmit = async (e: React.FormEvent, isSubmitted: boolean = false) => {
        e.preventDefault();

        // Frontend Validation Checks
        if (!formData.customerId) {
            showToast('Please select a Customer for the Sales Order.', 'warning');
            return;
        }

        if (formData.items.length === 0) {
            showToast('Please add at least one product item to the order.', 'warning');
            return;
        }

        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            if (!item.productId) {
                showToast(`Please select a Product for Item ${i + 1}.`, 'warning');
                return;
            }
            if (!item.orderQuantity || item.orderQuantity <= 0) {
                showToast(`Please enter a valid Quantity for Item ${i + 1}.`, 'warning');
                return;
            }
            if (!item.rate || item.rate <= 0) {
                showToast(`Please enter a valid Rate for Item ${i + 1}.`, 'warning');
                return;
            }
        }

        try {
            setIsSubmitting(true);
            const dataToSave = {
                ...formData,
                status: isSubmitted ? 'Submitted' : 'Draft'
            };
            await api.post('/sales-orders', dataToSave);
            setFormData({
                orderNumber: generateOrderNumber(),
                orderDate: format(new Date(), 'yyyy-MM-dd'),
                orderType: 'Domestic',
                customerId: '',
                quotationId: '',
                customerOrderNo: '',
                customerOrderDate: format(new Date(), 'yyyy-MM-dd'),
                priority: 'Normal',
                deliveryDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                items: [{
                    itemId: '1',
                    productId: '',
                    productName: '',
                    specifications: { size: '', color: '', fabric: '', width: '', style: '', gsm: '' as any },
                    orderQuantity: '' as any,
                    unit: 'Pieces',
                    rate: '' as any,
                    discountPercentage: 0,
                    discountAmount: 0,
                    taxableAmount: 0,
                    gstRate: 12,
                    gstAmount: 0,
                    totalAmount: 0,
                    sizeBreakup: [
                        { size: 'S', quantity: 0 },
                        { size: 'M', quantity: 0 },
                        { size: 'L', quantity: 0 },
                        { size: 'XL', quantity: 0 }
                    ],
                    colorBreakup: [],
                    accessories: []
                }],
                summary: {
                    totalQuantity: 0,
                    totalAmount: 0,
                    advanceAmount: 0,
                    balanceAmount: 0,
                    currency: 'INR'
                },
                status: 'Draft'
            });
            setIsAddModalOpen(false);
            fetchOrders();
            showToast(`Sales Order ${isSubmitted ? 'submitted' : 'draft saved'} successfully`, 'success');
        } catch (error: any) {
            console.error('Error creating sales order:', error);
            showToast('Error creating sales order', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Confirmed': return 'bg-emerald-100 text-emerald-700';
            case 'Submitted': return 'bg-indigo-100 text-indigo-700';
            case 'In Production': return 'bg-violet-100 text-violet-700';
            case 'Materials Allocated': return 'bg-amber-100 text-amber-700';
            case 'Completed': return 'bg-blue-100 text-blue-700';
            case 'Draft': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/sales">
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Main Sales Orders</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Core order documents tracking production and delivery</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" /> New Sales Order
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 flex items-center gap-4 border-slate-100 dark:border-slate-800">
                    <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-500">Confirmed Orders</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{orders.filter(o => o.status === 'Confirmed').length}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-slate-100 dark:border-slate-800">
                    <div className="h-10 w-10 rounded-md bg-violet-50 flex items-center justify-center"><Layers className="h-5 w-5 text-violet-600" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-500">In Production</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{orders.filter(o => o.status === 'In Production').length}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 border-slate-100 dark:border-slate-800">
                    <div className="h-10 w-10 rounded-md bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-500">Completed</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{orders.filter(o => o.status === 'Completed').length}</p>
                    </div>
                </Card>
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-center">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="relative flex-1 text-left">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search orders..." className="pl-10 h-10 text-sm border-slate-200" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Order #</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Customer</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Items</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Qty</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Delivery</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="py-10 text-slate-500">Loading orders...</TableCell></TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="py-10 text-slate-500">No orders found</TableCell></TableRow>
                            ) : (
                                orders.map(o => (
                                    <TableRow key={o._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/30">
                                        <TableCell>
                                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{o.orderNumber}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{format(new Date(o.orderDate), 'dd MMM yyyy')}</p>
                                        </TableCell>
                                        <TableCell className="text-left font-bold text-xs">{o.customerId?.partyName}</TableCell>
                                        <TableCell className="text-xs font-bold text-slate-500">{o.items?.length || 0}</TableCell>
                                        <TableCell className="text-left font-black text-xs text-slate-700 dark:text-slate-300">{o.summary?.totalQuantity} Pcs</TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500">
                                                <Calendar className="h-3 w-3" /> {format(new Date(o.deliveryDate), 'dd MMM')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusColor(o.status)}`}>
                                                {o.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex items-center justify-end gap-1">
                                                {o.status === 'Submitted' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-black text-[10px]"
                                                            onClick={async () => {
                                                                if (confirm('Approve this Sales Order?')) {
                                                                    try {
                                                                        await api.patch(`/sales-orders/${o._id}`, { status: 'Confirmed' });
                                                                        await fetchOrders();
                                                                        showToast('Sales order approved', 'success');
                                                                    } catch (error: any) {
                                                                        console.error('Error approving order:', error);
                                                                        const msg = error?.response?.data?.message || 'Failed to approve order';
                                                                        showToast(msg, 'error');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-black text-[10px]"
                                                            onClick={() => {
                                                                setSelectedOrderForAction(o);
                                                                setIsRejectModalOpen(true);
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {o.status === 'Confirmed' && (
                                                    <Link href={`/dashboard/sales/allocation?orderId=${o._id}`}>
                                                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-black uppercase text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100">
                                                            <Box className="h-3 w-3 mr-1" /> Allocate
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => handleViewOrder(o)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => handleEditOrder(o)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={async () => {
                                                    if (confirm('Delete this order?')) {
                                                        try {
                                                            await api.delete(`/sales-orders/${o._id}`);
                                                            await fetchOrders();
                                                            showToast('Order deleted', 'info');
                                                        } catch (error: any) {
                                                            showToast('Failed to delete order', 'error');
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

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Create New Sales Order"
                className="max-w-5xl"
            >
                <form onSubmit={handleAddSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <FormField label="Order Number">
                            <Input value={formData.orderNumber || ''} readOnly className="bg-slate-50 font-black" />
                        </FormField>
                        <FormField label="Create from Quotation" className="md:col-span-2">
                            <Select
                                value={formData.quotationId}
                                onChange={(val) => {
                                    const quot = quotations.find(q => q._id === val);
                                    if (quot) {
                                        const newItems = quot.items.map((it: any, idx: number) => {
                                            const prodId = it.productId?._id || it.productId;
                                            const product = products.find(p => p._id === prodId);
                                            
                                            let orderItem = {
                                                itemId: (idx + 1).toString(),
                                                productId: prodId,
                                                productName: product?.productName || it.description || 'Product',
                                                specifications: { ...it.specifications },
                                                orderQuantity: it.quantity,
                                                unit: it.unit || 'Pieces',
                                                rate: it.rate,
                                                discountPercentage: it.discountPercentage || 0,
                                                discountAmount: it.discountAmount || 0,
                                                taxableAmount: it.taxableAmount,
                                                gstRate: it.gstRate || 12,
                                                gstAmount: it.gstAmount,
                                                totalAmount: it.totalAmount,
                                                sizeBreakup: [{ size: 'S', quantity: it.quantity }, { size: 'M', quantity: 0 }, { size: 'L', quantity: 0 }, { size: 'XL', quantity: 0 }],
                                                colorBreakup: [],
                                                accessories: [] as any[]
                                            };

                                            if (product && product.bom && product.bom.length > 0) {
                                                orderItem.accessories = product.bom.map((b: any) => {
                                                    const matProd = products.find(p => p._id === b.materialId);
                                                    return {
                                                        materialId: b.materialId,
                                                        type: matProd ? matProd.productName : 'Component',
                                                        quantityPerProduct: b.quantityPerProduct || 0,
                                                        baseQty: b.quantityPerProduct || 0,
                                                        wastagePercentage: b.wastagePercentage || 0,
                                                        quantity: 0,
                                                        unit: b.unit || 'Pieces'
                                                    };
                                                });
                                            }

                                            // Trigger calculation for the initial quantity
                                            return calculateRequirement(orderItem);
                                        });
                                        setFormData({
                                            ...formData,
                                            quotationId: val,
                                            customerId: quot.customerId?._id || quot.customerId,
                                            items: newItems,
                                            summary: calculateTotals(newItems)
                                        });
                                    } else {
                                        setFormData({ ...formData, quotationId: val });
                                    }
                                }}
                                options={quotations.map(q => ({ value: q._id, label: `${q.quotationNumber} - ${q.customerId?.partyName}` }))}
                                placeholder="Direct Order"
                            />
                        </FormField>
                        <FormField label="Order Date">
                            <Input type="date" value={formData.orderDate || ''} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })} required />
                        </FormField>
                        <FormField label="Priority">
                            <Select
                                value={formData.priority || 'Normal'}
                                onChange={(val) => setFormData({ ...formData, priority: val })}
                                options={[
                                    { value: 'Normal', label: 'Normal' },
                                    { value: 'High', label: 'High' },
                                    { value: 'Emergency', label: 'Emergency' }
                                ]}
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField label="Customer">
                            <Select
                                value={formData.customerId}
                                onChange={(val) => setFormData({ ...formData, customerId: val })}
                                options={parties.map(p => ({ value: p._id, label: p.partyName }))}
                                placeholder="Select Customer"
                            />
                        </FormField>
                        <FormField label="Customer PO #">
                            <Input value={formData.customerOrderNo || ''} onChange={(e) => setFormData({ ...formData, customerOrderNo: e.target.value })} placeholder="PO-123" />
                        </FormField>
                        <FormField label="PO Date">
                            <Input type="date" value={formData.customerOrderDate || ''} onChange={(e) => setFormData({ ...formData, customerOrderDate: e.target.value })} />
                        </FormField>
                        <FormField label="Delivery Date">
                            <Input
                                type="date"
                                value={formData.deliveryDate || ''}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                required
                            />
                        </FormField>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white italic underline">Order Items</h3>
                            <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-8 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all">
                                <Plus className="h-3 w-3 mr-1" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                            {formData.items.map((item: any, index: number) => (
                                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 relative group space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter">Item {index + 1} - Product Details</h4>
                                        {formData.items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <FormField label="Product" className="md:col-span-2">
                                            <Select
                                                value={item.productId}
                                                onChange={(val) => handleItemChange(index, 'productId', val)}
                                                options={products.map(p => ({
                                                    value: p._id,
                                                    label: `${p.productName} (${p.productCode})`
                                                }))}
                                                placeholder="Select Product"
                                            />
                                        </FormField>
                                        <FormField label="Quantity">
                                            <Input
                                                type="number"
                                                value={item.orderQuantity || ''}
                                                onChange={(e) => handleItemChange(index, 'orderQuantity', e.target.value)}
                                                required
                                            />
                                        </FormField>
                                        <FormField label="Rate">
                                            <Input
                                                type="number"
                                                value={item.rate || ''}
                                                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                required
                                            />
                                        </FormField>
                                    </div>

                                    {/* Breakups Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-3 bg-white dark:bg-slate-950 rounded-md border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Size Breakup</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {item.sizeBreakup.map((sz: any, szIdx: number) => (
                                                    <div key={sz.size}>
                                                        <label className="text-[8px] font-black uppercase text-slate-500 block mb-1 text-center">{sz.size}</label>
                                                        <Input
                                                            type="number"
                                                            value={sz.quantity || ''}
                                                            className="h-8 text-[10px] text-center p-0"
                                                            onChange={(e) => {
                                                                const updated = [...item.sizeBreakup];
                                                                updated[szIdx].quantity = Number(e.target.value);
                                                                const total = updated.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
                                                                handleItemChange(index, 'sizeBreakup', updated);
                                                                handleItemChange(index, 'orderQuantity', total);
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Other Details</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <FormField label="GSM">
                                                    <Input type="number" className="h-8 text-[10px]" value={item.specifications.gsm || ''} onChange={(e) => handleItemChange(index, 'specifications.gsm', e.target.value)} />
                                                </FormField>
                                                <FormField label="Style">
                                                    <Input className="h-8 text-[10px]" value={item.specifications.style || ''} onChange={(e) => handleItemChange(index, 'specifications.style', e.target.value)} />
                                                </FormField>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requirements Section */}
                                    <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-md border border-indigo-100/50">
                                        <p className="text-[9px] font-black uppercase text-indigo-400 mb-2 tracking-widest">Accessories & Components (Standard)</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {item.accessories?.map((acc: any) => {
                                                const stock = getAccessoryStock(acc.type, acc.materialId);
                                                return (
                                                    <div key={acc.type} className="flex flex-col p-2 bg-white/80 dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-indigo-200">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[8px] font-black uppercase text-slate-500">{acc.type}</span>
                                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${stock < (Number(acc.quantity) || 0) ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                Stock: {stock}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-baseline justify-between gap-1 mt-1 border-t border-slate-50 dark:border-slate-900/50 pt-1">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-sm font-black text-indigo-600">{acc.quantity || 0}</span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase">{acc.unit}</span>
                                                            </div>
                                                            <div className="text-[9px] font-black text-indigo-400/80 italic text-right">
                                                                ({item.orderQuantity || 0} × {acc.quantityPerProduct || acc.baseQty || 0}) + {acc.wastagePercentage || 0}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                        <span>Taxable: ₹{item.taxableAmount || 0}</span>
                                        <span>GST ({item.gstRate}%): ₹{item.gstAmount || 0}</span>
                                        <span className="text-indigo-600 font-black">Total: ₹{item.totalAmount || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg border border-indigo-100 dark:border-indigo-900/30 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Total Pieces</p>
                            <p className="text-xl font-black text-slate-800 dark:text-slate-200">{formData.summary.totalQuantity}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Advance Received</p>
                            <Input
                                type="number"
                                className="h-8 text-sm font-bold bg-white"
                                value={formData.summary.advanceAmount || ''}
                                onChange={(e) => setFormData({ ...formData, summary: calculateTotals(formData.items, Number(e.target.value)) })}
                            />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Balance Due</p>
                            <p className="text-xl font-black text-rose-500">₹{formData.summary.balanceAmount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Grand Total</p>
                            <p className="text-2xl font-black text-indigo-600">₹{formData.summary.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" className="text-[11px] font-black uppercase tracking-widest h-11 px-8" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button type="button" variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-[11px] font-black uppercase tracking-widest h-11 px-8" onClick={(e) => handleAddSubmit(e as any, false)}>Save Draft</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-widest h-11 px-8 min-w-[180px]" onClick={(e) => handleAddSubmit(e as any, true)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Submit for Approval
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Rejection Modal */}
            <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Sales Order">
                <div className="space-y-4">
                    <FormField label="Rejection Remarks">
                        <textarea
                            className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold min-h-[100px]"
                            placeholder="Reason for rejection..."
                            value={rejectionRemarks}
                            onChange={(e) => setRejectionRemarks(e.target.value)}
                        />
                    </FormField>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} className="text-[10px] font-black uppercase">Cancel</Button>
                        <Button
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase"
                            onClick={async () => {
                                if (!rejectionRemarks) {
                                    showToast('Please provide rejection remarks', 'warning');
                                    return;
                                }
                                try {
                                    await api.patch(`/sales-orders/${selectedOrderForAction._id}`, {
                                        status: 'Draft',
                                        'approval.remarks': rejectionRemarks
                                    });
                                    await fetchOrders();
                                    setIsRejectModalOpen(false);
                                    setRejectionRemarks('');
                                    showToast('Order rejected back to draft', 'info');
                                } catch (error) {
                                    showToast('Failed to reject order', 'error');
                                }
                            }}
                        >
                            Confirm Reject
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Sales Order Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Sales Order"
                className="max-w-4xl"
            >
                <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField label="Order Number">
                            <Input value={formData.orderNumber || ''} readOnly className="bg-slate-50 font-black" />
                        </FormField>
                        <FormField label="Order Date">
                            <Input type="date" value={formData.orderDate || ''} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })} required />
                        </FormField>
                        <FormField label="Priority">
                            <Select
                                value={formData.priority || 'Normal'}
                                onChange={(val) => setFormData({ ...formData, priority: val })}
                                options={[
                                    { value: 'Normal', label: 'Normal' },
                                    { value: 'High', label: 'High' },
                                    { value: 'Emergency', label: 'Emergency' }
                                ]}
                            />
                        </FormField>
                        <FormField label="Delivery Date">
                            <Input
                                type="date"
                                value={formData.deliveryDate || ''}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                required
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="Customer">
                            <Select
                                value={formData.customerId}
                                onChange={(val) => setFormData({ ...formData, customerId: val })}
                                options={parties.map(p => ({ value: p._id, label: p.partyName }))}
                                placeholder="Select Customer"
                            />
                        </FormField>
                        <FormField label="Customer PO #">
                            <Input value={formData.customerOrderNo || ''} onChange={(e) => setFormData({ ...formData, customerOrderNo: e.target.value })} placeholder="PO-123" />
                        </FormField>
                        <FormField label="PO Date">
                            <Input type="date" value={formData.customerOrderDate || ''} onChange={(e) => setFormData({ ...formData, customerOrderDate: e.target.value })} />
                        </FormField>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white italic underline">Order Items</h3>
                            <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-8 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                <Plus className="h-3 w-3 mr-1" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                            {formData.items.map((item: any, index: number) => (
                                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 relative group space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter">Item {index + 1} - Product Details</h4>
                                        {formData.items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <FormField label="Product" className="md:col-span-2">
                                            <Select
                                                value={item.productId}
                                                onChange={(val) => handleItemChange(index, 'productId', val)}
                                                options={products.map(p => ({
                                                    value: p._id,
                                                    label: `${p.productName} (${p.productCode})`
                                                }))}
                                                placeholder="Select Product"
                                            />
                                        </FormField>
                                        <FormField label="Quantity">
                                            <Input
                                                type="number"
                                                value={item.orderQuantity || ''}
                                                onChange={(e) => handleItemChange(index, 'orderQuantity', e.target.value)}
                                                required
                                            />
                                        </FormField>
                                        <FormField label="Rate">
                                            <Input
                                                type="number"
                                                value={item.rate || ''}
                                                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                required
                                            />
                                        </FormField>
                                    </div>

                                    {/* Breakups Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-3 bg-white dark:bg-slate-950 rounded-md border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Size Breakup</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {item.sizeBreakup?.map((sz: any, szIdx: number) => (
                                                    <div key={sz.size}>
                                                        <label className="text-[8px] font-black uppercase text-slate-500 block mb-1 text-center">{sz.size}</label>
                                                        <Input
                                                            type="number"
                                                            value={sz.quantity || ''}
                                                            className="h-8 text-[10px] text-center p-0"
                                                            onChange={(e) => {
                                                                const updated = [...item.sizeBreakup];
                                                                updated[szIdx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                                const total = updated.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
                                                                handleItemChange(index, 'sizeBreakup', updated);
                                                                handleItemChange(index, 'orderQuantity', total);
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Other Details</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <FormField label="GSM">
                                                    <Input type="number" className="h-8 text-[10px]" value={item.specifications.gsm || ''} onChange={(e) => handleItemChange(index, 'specifications.gsm', e.target.value)} />
                                                </FormField>
                                                <FormField label="Style">
                                                    <Input className="h-8 text-[10px]" value={item.specifications.style || ''} onChange={(e) => handleItemChange(index, 'specifications.style', e.target.value)} />
                                                </FormField>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requirements Section */}
                                    <div className="p-3 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-md border border-indigo-100/50">
                                        <p className="text-[9px] font-black uppercase text-indigo-400 mb-2 tracking-widest">Accessories & Components (Standard)</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {item.accessories?.map((acc: any) => {
                                                const stock = getAccessoryStock(acc.type, acc.materialId);
                                                return (
                                                    <div key={acc.type} className="flex flex-col p-2 bg-white/80 dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-indigo-200">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[8px] font-black uppercase text-slate-500">{acc.type}</span>
                                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${stock < (Number(acc.quantity) || 0) ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                Stock: {stock}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-baseline justify-between gap-1 mt-1 border-t border-slate-50 dark:border-slate-900/50 pt-1">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-sm font-black text-indigo-600">{acc.quantity || 0}</span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase">{acc.unit}</span>
                                                            </div>
                                                            <div className="text-[9px] font-black text-indigo-400/80 italic text-right">
                                                                ({item.orderQuantity || 0} × {acc.quantityPerProduct || acc.baseQty || 0}) + {acc.wastagePercentage || 0}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                        <span>Taxable: ₹{item.taxableAmount || 0}</span>
                                        <span>GST ({item.gstRate}%): ₹{item.gstAmount || 0}</span>
                                        <span className="text-indigo-600 font-black">Total: ₹{item.totalAmount || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" className="text-[11px] font-black uppercase tracking-widest h-11 px-8" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-widest h-11 px-8 min-w-[180px]">
                            {isSubmitting ? 'Updating...' : 'Update Sales Order'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Sales Order Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Sales Order: ${formData.orderNumber}`}
                className="max-w-4xl"
            >
                <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                <Package className="h-3 w-3" /> Order Number
                            </p>
                            <p className="font-black text-slate-900 dark:text-white border-b border-indigo-100 dark:border-indigo-900/50 pb-1 text-sm">{formData.orderNumber}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Order Date
                            </p>
                            <p className="font-black text-slate-900 dark:text-white border-b border-indigo-100 dark:border-indigo-900/50 pb-1 text-sm">
                                {formData.orderDate ? format(new Date(formData.orderDate), 'dd-MM-yyyy') : 'N/A'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                                <User className="h-3 w-3" /> Customer
                            </p>
                            <p className="font-black text-slate-900 dark:text-white border-b border-indigo-100 dark:border-indigo-900/50 pb-1 text-sm truncate">
                                {(formData.customerId as any)?.partyName || formData.customerId || 'N/A'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Current Status</p>
                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(formData.status)}`}>
                                {formData.status}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-500 italic">Order Line Items</p>
                        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                    <TableRow className="border-b border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Product</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Quantity</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Unit Rate</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Total Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.items.map((it: any, idx: number) => (
                                        <Fragment key={idx}>
                                            <TableRow className="text-xs border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/20">
                                                <TableCell className="font-bold py-4 text-slate-900 dark:text-white">
                                                    {it.productName || (it.productId as any)?.productName || 'Product'}
                                                </TableCell>
                                                <TableCell className="text-center font-black text-slate-700 dark:text-slate-300">
                                                    {it.orderQuantity} {it.unit || 'Pieces'}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-slate-600 dark:text-slate-400">
                                                    ₹{it.rate?.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-black text-indigo-600 px-6">
                                                    ₹{it.totalAmount?.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                            {it.accessories?.length > 0 && (
                                                <TableRow className="bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-50 dark:border-slate-800">
                                                    <TableCell colSpan={4} className="py-2 pl-8">
                                                        <div className="flex flex-wrap gap-4">
                                                            {it.accessories.map((acc: any, aidx: number) => (
                                                                <div key={aidx} className="flex flex-col bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm min-w-[120px]">
                                                                    <div className="flex justify-between items-center gap-4">
                                                                        <span className="text-[8px] font-black uppercase text-indigo-500">{acc.type}</span>
                                                                        <span className="text-[7px] font-bold text-slate-400 italic">
                                                                            ({it.orderQuantity} × {acc.quantityPerProduct || acc.baseQty || 0}) + {acc.wastagePercentage || 0}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1 mt-0.5">
                                                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{acc.quantity}</span>
                                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{acc.unit}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-2xl flex justify-between items-center shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="relative">
                            <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Summary</p>
                            <p className="text-xs font-bold">Total quantity: {formData.summary?.totalQuantity || 0} units</p>
                        </div>
                        <div className="text-right relative">
                            <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-1">Grand Total</p>
                            <p className="text-4xl font-black tracking-tighter">₹{formData.summary?.totalAmount?.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setIsViewModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-widest h-11 px-8">Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
