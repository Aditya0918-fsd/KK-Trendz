'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Zap, ClipboardList,
    Box, CheckCircle2, MoreHorizontal, Link as LinkIcon, X, AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { useSearchParams } from 'next/navigation';

import { Modal, FormField } from '@/components/ui/Modal';
import { Trash2 } from 'lucide-react';

export default function OrderAllocationPage() {
    const { loading: authLoading } = useAuth();
    const [allocations, setAllocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedAllocation, setSelectedAllocation] = useState<any>(null);
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const [availableStock, setAvailableStock] = useState<any>({});

    // Master data
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);

    // Form state
    const [formData, setFormData] = useState<any>({
        allocationNumber: `AL-${format(new Date(), 'yyyy')}-${Math.floor(1000 + Math.random() * 9000)}`,
        allocationDate: format(new Date(), 'yyyy-MM-dd'),
        orderId: '',
        fabricAllocation: [],
        accessoriesAllocation: [],
        status: 'Draft'
    });

    const fetchAllocations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/order-allocations');
            setAllocations(res.data);
        } catch (error) {
            console.error('Error fetching allocations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const [ordersRes, productsRes, locationsRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/products'),
                api.get('/locations')
            ]);
            // Only confirmed or in production orders can have allocations
            setOrders(ordersRes.data.filter((o: any) => o.status === 'Confirmed' || o.status === 'In Production'));
            setProducts(productsRes.data);
            setLocations(locationsRes.data);
        } catch (error) {
            console.error('Error fetching master data:', error);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchAllocations();
            fetchMasterData();
        }
    }, [authLoading]);

    useEffect(() => {
        const orderId = searchParams.get('orderId');
        if (orderId && orders.length > 0) {
            setIsAddModalOpen(true);
            handleOrderSelect(orderId);
        }
    }, [searchParams, orders]);

    const fetchStockForProduct = async (productId: string) => {
        try {
            const res = await api.get(`/inventory/stock/${productId}`);
            setAvailableStock((prev: any) => ({ ...prev, [productId]: res.data }));
        } catch (error) {
            console.error('Error fetching stock:', error);
        }
    };

    // Initialize allocations when an order is selected
    const handleOrderSelect = async (orderId: string) => {
        const selectedOrder = orders.find(o => o._id === orderId);
        if (!selectedOrder) return;

        // 1. Fabric Allocation Map (Per Order Item)
        const fabricAlloc = selectedOrder.items.map((item: any) => {
            // Use the fabric material ID if available, otherwise fallback to item id (if item itself is fabric)
            const materialId = item.fabricRequirement?.fabricId || item.productId?._id || item.productId;
            fetchStockForProduct(materialId);
            
            return {
                productId: materialId,
                fabricType: item.productName || item.fabricRequirement?.fabricType || 'Main Fabric',
                requiredQuantity: item.fabricRequirement?.totalFabricWithWastage || 0,
                allocatedFrom: [{
                    sourceType: 'Stock',
                    sourceId: null,
                    batchNumber: '',
                    rollNumbers: [],
                    quantity: 0,
                    unit: 'Kgs',
                    allocatedQuantity: 0,
                    remainingQuantity: 0,
                    location: ''
                }]
            };
        });

        // 2. Accessories Aggregation (All Items)
        const allAccessories: any[] = [];
        selectedOrder.items.forEach((item: any) => {
            (item.accessories || []).forEach((acc: any) => {
                // Check if this material is already in the allocation list
                const existingIdx = allAccessories.findIndex(a => a.materialId === acc.materialId);
                if (existingIdx > -1) {
                    allAccessories[existingIdx].requiredQuantity += (acc.quantity || 0);
                } else {
                    allAccessories.push({
                        accessoryType: acc.type || acc.materialName || 'Component',
                        materialId: acc.materialId,
                        requiredQuantity: acc.quantity || 0,
                        unit: acc.unit || 'Pieces',
                        allocatedFrom: [{
                            sourceId: null,
                            batchNumber: '',
                            quantity: 0,
                            allocatedQuantity: 0,
                            location: ''
                        }]
                    });
                }
            });
        });

        setFormData({
            ...formData,
            orderId,
            fabricAllocation: fabricAlloc,
            accessoriesAllocation: allAccessories
        });
    };

    const handleAddFabricSource = (fabricIndex: number) => {
        const newFabricAlloc = [...formData.fabricAllocation];
        newFabricAlloc[fabricIndex].allocatedFrom.push({
            sourceType: 'Purchase',
            sourceId: null,
            batchNumber: '',
            quantity: 0,
            unit: 'Kgs',
            allocatedQuantity: '' as any,
            remainingQuantity: 0,
            location: ''
        });
        setFormData({ ...formData, fabricAllocation: newFabricAlloc });
    };

    const handleRemoveFabricSource = (fabricIndex: number, sourceIndex: number) => {
        const newFabricAlloc = [...formData.fabricAllocation];
        newFabricAlloc[fabricIndex].allocatedFrom = newFabricAlloc[fabricIndex].allocatedFrom.filter((_: any, i: number) => i !== sourceIndex);
        setFormData({ ...formData, fabricAllocation: newFabricAlloc });
    };

    const handleFabricSourceChange = (fabricIndex: number, sourceIndex: number, field: string, value: any) => {
        const newFabricAlloc = [...formData.fabricAllocation];
        newFabricAlloc[fabricIndex].allocatedFrom[sourceIndex][field] = value;
        setFormData({ ...formData, fabricAllocation: newFabricAlloc });
    };

    const handleAddAccessorySource = (accIndex: number) => {
        const newAccAlloc = [...formData.accessoriesAllocation];
        newAccAlloc[accIndex].allocatedFrom.push({
            sourceId: null,
            batchNumber: '',
            quantity: 0,
            allocatedQuantity: '' as any,
            location: ''
        });
        setFormData({ ...formData, accessoriesAllocation: newAccAlloc });
    };

    const handleRemoveAccessorySource = (accIndex: number, sourceIndex: number) => {
        const newAccAlloc = [...formData.accessoriesAllocation];
        newAccAlloc[accIndex].allocatedFrom = newAccAlloc[accIndex].allocatedFrom.filter((_: any, i: number) => i !== sourceIndex);
        setFormData({ ...formData, accessoriesAllocation: newAccAlloc });
    };

    const handleAccessoryFieldChange = (accIndex: number, field: string, value: any) => {
        const newAccAlloc = [...formData.accessoriesAllocation];
        newAccAlloc[accIndex][field] = value;
        setFormData({ ...formData, accessoriesAllocation: newAccAlloc });
    };

    const handleAccessorySourceChange = (accIndex: number, sourceIndex: number, field: string, value: any) => {
        const newAccAlloc = [...formData.accessoriesAllocation];
        newAccAlloc[accIndex].allocatedFrom[sourceIndex][field] = value;
        setFormData({ ...formData, accessoriesAllocation: newAccAlloc });
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/order-allocations', formData);
            setIsAddModalOpen(false);
            fetchAllocations();
            // Reset
            setFormData({
                allocationNumber: `AL-${format(new Date(), 'yyyy')}-${Math.floor(1000 + Math.random() * 9000)}`,
                allocationDate: format(new Date(), 'yyyy-MM-dd'),
                orderId: '',
                fabricAllocation: [],
                accessoriesAllocation: [],
                status: 'Draft'
            });
            showToast('Allocation created successfully!', 'success');
        } catch (error: any) {
            console.error('Error creating allocation:', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            showToast('Error creating allocation: ' + msg, 'error');
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
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Order Allocations</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Map fabric and accessories to confirmed sales orders</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" /> New Allocation
                </Button>
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-center">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="relative flex-1 text-left">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search allocations..." className="pl-10 h-10 text-sm border-slate-200" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Alloc #</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Target Order</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Fabric Items</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Alloc Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 text-center font-medium">Loading allocations...</TableCell></TableRow>
                            ) : allocations.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 text-sm text-center font-medium">No active allocations found in this period.</TableCell></TableRow>
                            ) : (
                                allocations.map(a => (
                                    <TableRow key={a._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/30">
                                        <TableCell>
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{a.allocationNumber}</p>
                                        </TableCell>
                                        <TableCell className="text-left font-bold text-xs">
                                            <div className="flex items-center gap-2 text-indigo-600 tracking-wider">
                                                <LinkIcon className="h-3 w-3" /> {a.orderId?.orderNumber}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left text-xs text-slate-600 font-bold">{a.fabricAllocation?.length || 0} Products</TableCell>
                                        <TableCell className="text-left text-[10px] font-bold text-slate-500">{a.allocationDate ? format(new Date(a.allocationDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${a.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {a.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50"
                                                    onClick={() => {
                                                        setSelectedAllocation(a);
                                                        setIsReportModalOpen(true);
                                                    }}
                                                >
                                                    <ClipboardList className="h-4 w-4 mr-1" /> Report
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400"><MoreHorizontal className="h-4 w-4" /></Button>
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
                title="Create Order Allocation"
                className="max-w-5xl"
            >
                <form onSubmit={handleAddSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="Allocation #">
                            <Input value={formData.allocationNumber} readOnly className="bg-slate-50 font-bold" />
                        </FormField>
                        <FormField label="Target Sales Order">
                            <select
                                className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                value={formData.orderId}
                                onChange={(e) => handleOrderSelect(e.target.value)}
                                required
                            >
                                <option value="">Select Confirmed Order</option>
                                {orders.map(o => (
                                    <option key={o._id} value={o._id}>{o.orderNumber} - {o.customerId?.partyName}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Allocation Date">
                            <Input
                                type="date"
                                value={formData.allocationDate}
                                onChange={(e) => setFormData({ ...formData, allocationDate: e.target.value })}
                                required
                            />
                        </FormField>
                    </div>

                    {formData.fabricAllocation.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4 italic underline">Fabric Allocation</h3>
                            <div className="space-y-6">
                                {formData.fabricAllocation.map((fabric: any, fIdx: number) => (
                                    <div key={fIdx} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                                    {products.find(p => p._id === fabric.productId)?.productName || fabric.fabricType || 'Unknown Material'}
                                                </span>
                                                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-200 rounded text-slate-600">
                                                    Req: {fabric.requiredQuantity} Pcs
                                                </span>
                                            </div>
                                            <Button type="button" size="sm" variant="outline" onClick={() => handleAddFabricSource(fIdx)} className="h-7 text-[9px] font-black uppercase tracking-widest py-0">
                                                <Plus className="h-3 w-3 mr-1" /> Add Source
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {fabric.allocatedFrom.map((source: any, sIdx: number) => {
                                                const productStock = availableStock[fabric.productId] || [];
                                                return (
                                                    <div key={sIdx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 relative group">
                                                        <FormField label="Stock Source (Batch/Roll)">
                                                            <select
                                                                className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                                                value={`${source.batchNumber}|${(source.rollNumbers || []).join(',')}`}
                                                                onChange={(e) => {
                                                                    const [batch, rollsStr] = e.target.value.split('|');
                                                                    const rolls = rollsStr ? rollsStr.split(',') : [];
                                                                    const selectedStock = productStock.find((s: any) =>
                                                                        s.batchNumber === batch &&
                                                                        (s.type === 'Batch' || (s.rollNumber && rolls.includes(s.rollNumber)))
                                                                    );
                                                                    handleFabricSourceChange(fIdx, sIdx, 'batchNumber', batch);
                                                                    handleFabricSourceChange(fIdx, sIdx, 'rollNumbers', rolls);
                                                                    if (selectedStock) {
                                                                        handleFabricSourceChange(fIdx, sIdx, 'sourceId', selectedStock.sourceId);
                                                                        handleFabricSourceChange(fIdx, sIdx, 'quantity', selectedStock.quantity);
                                                                        handleFabricSourceChange(fIdx, sIdx, 'location', selectedStock.location);
                                                                    }
                                                                }}
                                                            >
                                                                <option value="|">Select Stock</option>
                                                                {productStock.map((s: any, i: number) => (
                                                                    <option key={i} value={`${s.batchNumber}|${s.rollNumber || ''}`}>
                                                                        {s.batchNumber} {s.rollNumber ? `- Roll ${s.rollNumber}` : ''} ({s.quantity} {s.unit})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </FormField>
                                                        <FormField label="Batch #">
                                                            <Input
                                                                className="h-8 text-[10px] bg-slate-50 dark:bg-slate-800/50 dark:text-white"
                                                                value={source.batchNumber}
                                                                readOnly
                                                            />
                                                        </FormField>
                                                        <FormField label="Roll(s)">
                                                            <Input
                                                                className="h-8 text-[10px] bg-slate-50 dark:bg-slate-800/50 dark:text-white"
                                                                value={(source.rollNumbers || []).join(', ')}
                                                                readOnly
                                                            />
                                                        </FormField>
                                                        <FormField label="Alloc Qty">
                                                            <Input
                                                                type="number"
                                                                className="h-8 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 dark:bg-slate-900"
                                                                value={source.allocatedQuantity || ''}
                                                                onChange={(e) => handleFabricSourceChange(fIdx, sIdx, 'allocatedQuantity', e.target.value)}
                                                            />
                                                        </FormField>
                                                        <FormField label="Avail.">
                                                            <div className="h-8 flex items-center px-2 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                                {source.quantity || 0}
                                                            </div>
                                                        </FormField>
                                                        <div className="flex justify-end pb-1.5">
                                                            {fabric.allocatedFrom.length > 1 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveFabricSource(fIdx, sIdx)}
                                                                    className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between px-2">
                                            <div className="flex gap-4">
                                                <span className="text-[10px] font-bold text-slate-400">Total Allocated: <span className="text-slate-900 dark:text-slate-200">{fabric.allocatedFrom.reduce((sum: number, s: any) => sum + Number(s.allocatedQuantity || 0), 0)} Kgs</span></span>
                                                {fabric.requiredQuantity > fabric.allocatedFrom.reduce((sum: number, s: any) => sum + Number(s.allocatedQuantity || 0), 0) && (
                                                    <span className="text-[10px] font-black text-rose-500 animate-pulse uppercase tracking-tight flex items-center gap-1">
                                                        <Zap className="h-3 w-3" /> Shortage: {(fabric.requiredQuantity - fabric.allocatedFrom.reduce((sum: number, s: any) => sum + Number(s.allocatedQuantity || 0), 0)).toFixed(2)} Kgs
                                                    </span>
                                                )}
                                            </div>
                                            {fabric.requiredQuantity > fabric.allocatedFrom.reduce((sum: number, s: any) => sum + Number(s.allocatedQuantity || 0), 0) && (
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" id={`procure-${fIdx}`} className="h-3 w-3 rounded text-indigo-600" />
                                                    <label htmlFor={`procure-${fIdx}`} className="text-[10px] font-bold text-slate-600">Mark shortage as "To be Procured"</label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-0 italic underline">Accessories Allocation</h3>
                            <Button type="button" size="sm" variant="outline" onClick={() => setFormData({
                                ...formData,
                                accessoriesAllocation: [...formData.accessoriesAllocation, {
                                    accessoryType: '',
                                    requiredQuantity: 0,
                                    allocatedFrom: [{ sourceId: null, batchNumber: '', quantity: 0, allocatedQuantity: 0, location: '' }]
                                }]
                            })} className="h-7 text-[9px] font-black uppercase tracking-widest py-0">
                                <Plus className="h-3 w-3 mr-1" /> Add Accessory
                            </Button>
                        </div>
                        <div className="space-y-6">
                            {formData.accessoriesAllocation.length === 0 ? (
                                <p className="text-[10px] text-slate-400 font-medium italic">No accessories added yet.</p>
                            ) : (
                                formData.accessoriesAllocation.map((acc: any, aIdx: number) => (
                                    <div key={aIdx} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-800 relative">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, accessoriesAllocation: formData.accessoriesAllocation.filter((_: any, i: number) => i !== aIdx) })}
                                            className="absolute top-2 right-2 h-6 w-6 p-0 text-rose-400 hover:text-rose-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <FormField label="Accessory Type (e.g. Buttons, Thread)">
                                                <Input
                                                    className="h-8 text-[11px]"
                                                    value={acc.accessoryType}
                                                    onChange={(e) => handleAccessoryFieldChange(aIdx, 'accessoryType', e.target.value)}
                                                />
                                            </FormField>
                                            <FormField label="Required Qty">
                                                <Input
                                                    type="number"
                                                    className="h-8 text-[11px]"
                                                    value={acc.requiredQuantity}
                                                    onChange={(e) => handleAccessoryFieldChange(aIdx, 'requiredQuantity', e.target.value)}
                                                />
                                            </FormField>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">Allocation Sources</span>
                                                    {acc.requiredQuantity > acc.allocatedFrom.reduce((sum: number, s: any) => sum + Number(s.allocatedQuantity || 0), 0) && (
                                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-tight flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" /> Shortage: {acc.requiredQuantity - acc.allocatedFrom.reduce((sum: number, s: any) => sum + Number(s.allocatedQuantity || 0), 0)} Units
                                                        </span>
                                                    )}
                                                </div>
                                                <Button type="button" size="sm" variant="ghost" onClick={() => handleAddAccessorySource(aIdx)} className="h-6 text-[9px] font-black uppercase tracking-widest p-0 text-indigo-600">
                                                    <Plus className="h-3 w-3 mr-1" /> Add Source
                                                </Button>
                                            </div>
                                            {acc.allocatedFrom.map((source: any, sIdx: number) => (
                                                <div key={sIdx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
                                                    <FormField label="Batch #">
                                                        <Input
                                                            className="h-8 text-[11px]"
                                                            value={source.batchNumber}
                                                            onChange={(e) => handleAccessorySourceChange(aIdx, sIdx, 'batchNumber', e.target.value)}
                                                            placeholder="Batch #"
                                                        />
                                                    </FormField>
                                                    <FormField label="Alloc Qty">
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-[11px] font-bold text-indigo-600"
                                                            value={source.allocatedQuantity || ''}
                                                            onChange={(e) => handleAccessorySourceChange(aIdx, sIdx, 'allocatedQuantity', e.target.value)}
                                                        />
                                                    </FormField>
                                                    <FormField label="Location">
                                                        <Input
                                                            className="h-8 text-[11px]"
                                                            value={source.location}
                                                            onChange={(e) => handleAccessorySourceChange(aIdx, sIdx, 'location', e.target.value)}
                                                            placeholder="Location"
                                                        />
                                                    </FormField>
                                                    <div className="flex justify-end pb-1">
                                                        {acc.allocatedFrom.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveAccessorySource(aIdx, sIdx)}
                                                                className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8" disabled={!formData.orderId}>
                            Create Allocation
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                title="Material Allocation Sheet"
                className="max-w-4xl"
            >
                {selectedAllocation && (
                    <div className="space-y-8 p-1 sm:p-4 print:p-0">
                        {/* ─── Premium Header ─── */}
                        <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-8 text-white shadow-xl dark:bg-slate-950">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Material Allocation Reference</p>
                                    <h2 className="text-3xl font-black tracking-tighter">{selectedAllocation.allocationNumber}</h2>
                                    <div className="mt-4 flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedAllocation.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                            {selectedAllocation.status}
                                        </span>
                                        <span className="text-slate-400 text-xs font-medium">Created on {format(new Date(selectedAllocation.createdAt), 'dd MMMM, yyyy')}</span>
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 min-w-[200px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target Sales Order</p>
                                    <p className="text-xl font-black text-white flex items-center gap-2">
                                        <LinkIcon className="h-5 w-5 text-indigo-400" />
                                        {selectedAllocation.orderId?.orderNumber || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            {/* Decorative background element */}
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />
                        </div>

                        {/* ─── Fabric Allocation Section ─── */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <Box className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mt-1">
                                    Fabric & Material Items
                                </h4>
                            </div>
                            
                            <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <TableRow className="border-none hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest h-11 text-slate-500">Product / Item</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest h-11 text-slate-500">Batch Number</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest h-11 text-slate-500">Roll Details</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest h-11 text-slate-500 text-right">Alloc Qty</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest h-11 text-slate-500">Storage Location</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedAllocation.fabricAllocation.map((item: any, i: number) =>
                                            item.allocatedFrom.map((source: any, j: number) => (
                                                <TableRow key={`${i}-${j}`} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-slate-50 dark:border-slate-800">
                                                    <TableCell className="py-4">
                                                        <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{item.productId?.productName || 'N/A'}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                            {source.batchNumber || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4 font-bold text-xs text-slate-600 dark:text-slate-400">
                                                        {source.rollNumbers?.length > 0 ? `Roll: ${source.rollNumbers.join(', ')}` : 'Bulk / N/A'}
                                                    </TableCell>
                                                    <TableCell className="py-4 text-right">
                                                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                            {source.allocatedQuantity} <span className="text-[10px] text-slate-400 ml-0.5">{source.unit || 'Kgs'}</span>
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            {source.location || 'Main Store'}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* ─── Accessories Allocation Section ─── */}
                        {selectedAllocation.accessoriesAllocation?.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mt-1">
                                        Accessories & Trims
                                    </h4>
                                </div>

                                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-11 text-slate-500">Accessory Type</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-11 text-slate-500">Batch #</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-11 text-slate-500 text-right">Qty Allocated</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-11 text-slate-500">Location</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedAllocation.accessoriesAllocation.map((item: any, i: number) =>
                                                item.allocatedFrom.map((source: any, j: number) => (
                                                    <TableRow key={`${i}-${j}`} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-slate-50 dark:border-slate-800">
                                                        <TableCell className="py-4">
                                                            <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{item.accessoryType}</span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                                {source.batchNumber || 'Stock'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4 text-right">
                                                            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                                                                {source.allocatedQuantity} <span className="text-[10px] text-slate-400 ml-0.5">{item.unit || 'Units'}</span>
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                                {source.location || 'Main Store'}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-6 gap-4 print:hidden">
                            <Button 
                                variant="outline" 
                                onClick={() => window.print()} 
                                className="h-11 px-8 rounded-xl font-black uppercase text-[11px] tracking-widest border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Print Sheet
                            </Button>
                            <Button 
                                onClick={() => setIsReportModalOpen(false)} 
                                className="h-11 px-8 rounded-xl font-black uppercase text-[11px] tracking-widest bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-200 dark:shadow-none transition-all"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
