'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus,
    Search,
    Truck,
    ArrowLeft,
    Calendar,
    Package,
    CheckCircle2,
    XCircle,
    User,
    MoreHorizontal,
    ExternalLink,
    AlertCircle,
    MapPin
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function GoodsReceiptPage() {
    const { loading: authLoading } = useAuth();
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [locations, setLocations] = useState([]);
    const [employees, setEmployees] = useState([]);

    const getInitialFormData = () => ({
        grnNumber: `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        grnDate: new Date().toISOString().split('T')[0],
        poId: '',
        supplierId: '',
        receiptType: 'Yarn',
        challanNo: '',
        challanDate: '',
        vehicleNumber: '',
        transporterName: '',
        items: [{
            productId: '',
            productDescription: '',
            receivedQuantity: 0,
            acceptedQuantity: 0,
            rejectedQuantity: 0,
            shortageQuantity: 0,
            excessAccepted: 0,
            unit: 'Kgs',
            batchNumber: '',
            storageLocation: '',
            binNumber: '',
            rejectionReason: '',
            status: 'Accepted',
            orderedQuantity: 0,
            pendingQuantity: 0,
            rollDetails: [] as any[]
        }],
        summary: {
            totalReceived: 0,
            totalAccepted: 0,
            totalRejected: 0,
            totalPackages: 0
        },
        status: 'Completed'
    });

    const [formData, setFormData] = useState(getInitialFormData());

    const fetchGrns = async () => {
        try {
            const res = await api.get('/grns');
            setGrns(res.data);
        } catch (error) {
            console.error('Error fetching GRNs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataForForm = async () => {
        try {
            const [poRes, locRes, empRes] = await Promise.all([
                api.get('/purchase-orders'),
                api.get('/locations'),
                api.get('/employees')
            ]);
            setPurchaseOrders(poRes.data.filter((po: any) => po.status === 'Ordered' || po.status === 'Partially Received'));
            setLocations(locRes.data);
            setEmployees(empRes.data);
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchGrns();
        fetchDataForForm();
    }, [authLoading]);

    const handleSelectPO = (poId: string) => {
        const po = purchaseOrders.find((p: any) => p._id === poId);
        if (po) {
            setFormData({
                ...formData,
                poId: poId,
                supplierId: (po as any).supplierId?._id || (po as any).supplierId,
                receiptType: (po as any).poType,
                items: (po as any).items.map((item: any) => ({
                    poItemId: item._id,
                    productId: item.productId?._id || item.productId,
                    productDescription: item.productDescription || item.productId?.productName || 'Unknown Product',
                    orderedQuantity: item.orderQuantity || item.quantity || 0,
                    pendingQuantity: item.pendingQuantity || item.orderQuantity || 0,
                    receivedQuantity: item.pendingQuantity || item.orderQuantity || 0,
                    acceptedQuantity: item.pendingQuantity || item.orderQuantity || 0,
                    rejectedQuantity: 0,
                    unit: item.unit || 'Kgs',
                    uom: item.unit || 'Kgs',
                    batchNumber: '',
                    storageLocation: '',
                    status: 'Accepted',
                    shortageQuantity: 0,
                    excessAccepted: 0,
                    rollDetails: []
                }))
            });
        }
    };

    const handleAddRoll = (itemIndex: number) => {
        const newItems = [...formData.items];
        newItems[itemIndex].rollDetails.push({
            supplierRollNo: '',
            weight: 0,
            length: 0,
            gsm: 0,
            width: 0,
            shade: 'Match',
            damageCheck: 'No',
            remarks: '',
            status: 'Accepted'
        });
        setFormData({ ...formData, items: newItems });
    };

    const handleRollChange = (itemIndex: number, rollIndex: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[itemIndex].rollDetails[rollIndex] = {
            ...newItems[itemIndex].rollDetails[rollIndex],
            [field]: value
        };

        // Recalculate item totals
        const rolls = newItems[itemIndex].rollDetails;
        const totalReceived = rolls.reduce((acc: number, r: any) => acc + (Number(r.weight) || 0), 0);
        const totalAccepted = rolls.filter((r: any) => r.status === 'Accepted').reduce((acc: number, r: any) => acc + (Number(r.weight) || 0), 0);
        const totalRejected = rolls.filter((r: any) => r.status === 'Rejected').reduce((acc: number, r: any) => acc + (Number(r.weight) || 0), 0);

        newItems[itemIndex].receivedQuantity = totalReceived;
        newItems[itemIndex].acceptedQuantity = totalAccepted;
        newItems[itemIndex].rejectedQuantity = totalRejected;

        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-calculate rejected and shortage/excess
        if (field === 'acceptedQuantity' || field === 'receivedQuantity') {
            const received = field === 'receivedQuantity' ? value : newItems[index].receivedQuantity;
            const accepted = field === 'acceptedQuantity' ? value : newItems[index].acceptedQuantity;
            const pending = newItems[index].pendingQuantity;

            newItems[index].rejectedQuantity = (received || 0) - (accepted || 0);

            if (received < pending) {
                newItems[index].shortageQuantity = pending - received;
                newItems[index].excessAccepted = 0;
            } else if (received > pending) {
                newItems[index].shortageQuantity = 0;
                newItems[index].excessAccepted = received - pending;
            } else {
                newItems[index].shortageQuantity = 0;
                newItems[index].excessAccepted = 0;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedGrn, setSelectedGrn] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.poId || formData.poId === 'Select Order') {
            showToast('Please select a Purchase Order first', 'warning');
            return;
        }

        if (formData.items.length === 0 || !formData.items[0].productId) {
            showToast('No valid items found to receive', 'warning');
            return;
        }

        setIsSubmitting(true);

        const summary = formData.items.reduce((acc: any, item: any) => ({
            totalReceived: acc.totalReceived + (item.receivedQuantity || 0),
            totalAccepted: acc.totalAccepted + (item.acceptedQuantity || 0),
            totalRejected: acc.totalRejected + (item.rejectedQuantity || 0),
            totalShortage: acc.totalShortage + (item.shortageQuantity || 0),
            totalPackages: acc.totalPackages
        }), { totalReceived: 0, totalAccepted: 0, totalRejected: 0, totalShortage: 0, totalPackages: 0 });

        // Ensure uom property perfectly exists for DB validation (catches stale states from hot reloads)
        const finalItems = formData.items.map((item: any) => ({
            ...item,
            uom: item.uom || item.unit || 'Kgs'
        }));

        try {
            await api.post('/grns', { ...formData, items: finalItems, summary });
            setIsAddModalOpen(false);
            setFormData(getInitialFormData()); // Reset form with fresh GRN number
            fetchGrns();
            showToast('Goods Receipt recorded successfully', 'success');
        } catch (error: any) {
            console.error('Error creating GRN:', error);
            const msg = error?.response?.data?.message || 'Failed to create GRN';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewGrn = (grn: any) => {
        setSelectedGrn(grn);
        setIsViewModalOpen(true);
    };

    const handleDownloadSlip = async (grn: any) => {
        try {
            const response = await api.get(`/grns/${grn._id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GRN_${grn.grnNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('GRN Slip downloaded', 'success');
        } catch (error) {
            console.error('Download Error:', error);
            showToast('Failed to download GRN slip', 'error');
        }
    };

    const filteredGrns = grns.filter((g: any) =>
        g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.challanNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" />
                    New Goods Receipt
                </Button>
            </div>

            {/* Listing */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by GRN or Challan..."
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
                                <TableHead className="font-semibold">GRN Info</TableHead>
                                <TableHead className="font-semibold">PO Reference</TableHead>
                                <TableHead className="font-semibold">Supplier & Challan</TableHead>
                                <TableHead className="font-semibold">Receipt Qty</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">Loading receipts...</TableCell>
                                </TableRow>
                            ) : filteredGrns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">No GRNs recorded yet.</TableCell>
                                </TableRow>
                            ) : filteredGrns.map((grn: any) => (
                                <TableRow key={grn._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white uppercase">{grn.grnNumber}</span>
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(grn.grnDate), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                                            {grn.poId?.poNumber || 'Direct'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{grn.supplierId?.partyName}</span>
                                            <span className="text-[10px] text-slate-500 uppercase">CH: {grn.challanNo}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-emerald-600">{grn.summary?.totalAccepted} {grn.items[0]?.unit}</span>
                                            {grn.summary?.totalRejected > 0 && (
                                                <span className="text-[10px] text-rose-500 font-medium font-mono italic">
                                                    Rejected: {grn.summary?.totalRejected}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${grn.summary?.totalShortage > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {grn.summary?.totalShortage > 0 ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                                                {grn.summary?.totalShortage > 0 ? 'Shortage Reported' : 'Completed'}
                                            </span>
                                            {grn.debitNoteGenerated && (
                                                <span className="text-[9px] text-indigo-500 font-bold mt-1 uppercase italic tracking-tighter">Debit Note Created</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewGrn(grn)}>
                                                <ExternalLink className="h-4 w-4 text-indigo-600" />
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
                title="Capture Material Receipt (GRN)"
                className="max-w-6xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-md space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-indigo-600" /> General Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField label="GRN Number">
                                <Input disabled value={formData.grnNumber} />
                            </FormField>
                            <FormField label="Select PO Record">
                                <select
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 font-mono"
                                    value={formData.poId}
                                    onChange={(e) => handleSelectPO(e.target.value)}
                                >
                                    <option value="">Select Order</option>
                                    {purchaseOrders.map((po: any) => (
                                        <option key={po._id} value={po._id}>{po.poNumber} ({po.supplierId?.partyName})</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Registration Type">
                                <Input disabled value={formData.receiptType} />
                            </FormField>
                            <FormField label="GRN Date">
                                <Input type="date" value={formData.grnDate} onChange={(e) => setFormData({ ...formData, grnDate: e.target.value })} />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                            <FormField label="Challan No">
                                <Input required placeholder="SUP/CH/123" value={formData.challanNo} onChange={(e) => setFormData({ ...formData, challanNo: e.target.value })} />
                            </FormField>
                            <FormField label="Challan Date">
                                <Input type="date" value={formData.challanDate} onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })} />
                            </FormField>
                            <FormField label="Vehicle Details">
                                <Input placeholder="e.g. MH 12 AB 1234" value={formData.vehicleNumber} onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })} />
                            </FormField>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                            <Package className="h-4 w-4 text-indigo-600" /> Items Information
                        </h3>
                        <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                    <tr className="text-slate-500 uppercase text-[10px] font-bold">
                                        <th className="text-left px-4 py-3">Product Description</th>
                                        <th className="text-center px-4 py-3">Ordered / Pending</th>
                                        <th className="text-center px-4 py-3">Received</th>
                                        <th className="text-center px-4 py-3">Accepted</th>
                                        <th className="text-center px-4 py-3 italic">Shortage/Excess</th>
                                        <th className="text-left px-4 py-3">Details & Storage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {formData.items.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="px-4 py-3 font-medium truncate">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{item.productDescription || 'Select PO first'}</span>
                                                        {formData.receiptType === 'Fabric' && (
                                                            <Button type="button" onClick={() => handleAddRoll(index)} className="h-7 w-fit text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50 dark:hover:bg-indigo-900/50 mt-2 px-3 rounded">
                                                                <Plus className="mr-1 h-3 w-3" /> Add Roll Entry
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex flex-col text-[10px] items-center">
                                                        <span className="font-bold text-slate-400">{item.orderedQuantity} {item.unit}</span>
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.pendingQuantity} Pnd.</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 w-[10%]">
                                                    <Input type="number" step="0.01" value={item.receivedQuantity} onChange={(e) => handleItemChange(index, 'receivedQuantity', parseFloat(e.target.value))} disabled={formData.receiptType === 'Fabric'} className="text-center font-bold h-8" />
                                                </td>
                                                <td className="px-4 py-3 w-[10%]">
                                                    <Input type="number" step="0.01" value={item.acceptedQuantity} onChange={(e) => handleItemChange(index, 'acceptedQuantity', parseFloat(e.target.value))} disabled={formData.receiptType === 'Fabric'} className="text-center font-bold h-8 text-emerald-600 dark:text-emerald-500" />
                                                </td>
                                                 <td className="px-4 py-3 w-[10%] text-center font-bold text-[10px]">
                                                    {item.shortageQuantity > 0 ? (
                                                        <span className="text-rose-600 dark:text-rose-500">-{item.shortageQuantity.toFixed(2)} (Short)</span>
                                                    ) : item.excessAccepted > 0 ? (
                                                        <span className="text-indigo-600 dark:text-indigo-400">+{item.excessAccepted.toFixed(2)} (Excess)</span>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600">OK</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 w-[20%]">
                                                    <div className="space-y-1">
                                                        <Input placeholder="Rejection Reason" value={item.rejectionReason} onChange={(e) => handleItemChange(index, 'rejectionReason', e.target.value)} className="h-7 text-[10px] placeholder:italic" />
                                                        <div className="flex items-center gap-1">
                                                            <Input placeholder="Batch #" value={item.batchNumber} onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)} className="h-7 text-[10px] font-mono" />
                                                            <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">Rj: {item.rejectedQuantity.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 w-[15%]">
                                                    <div className="space-y-1">
                                                        <select
                                                            required
                                                            className="w-full rounded border border-slate-200 dark:border-slate-800 px-2 py-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-[10px] h-8 outline-none focus:ring-1 focus:ring-indigo-500"
                                                            value={item.storageLocation}
                                                            onChange={(e) => handleItemChange(index, 'storageLocation', e.target.value)}
                                                        >
                                                            <option value="">Choose Loc.</option>
                                                            {locations.map((loc: any) => (
                                                                <option key={loc._id} value={loc._id}>{loc.locationName}</option>
                                                            ))}
                                                        </select>
                                                        <Input placeholder="Bin #" value={item.binNumber} onChange={(e) => handleItemChange(index, 'binNumber', e.target.value)} className="h-7 text-[10px] border-dashed" />
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Roll Level Table for Fabric */}
                                            {item.rollDetails.length > 0 && (
                                                <tr className="bg-slate-50 dark:bg-slate-950/40">
                                                    <td colSpan={6} className="px-8 py-4">
                                                        <div className="border border-slate-200 dark:border-slate-800 rounded shadow-inner overflow-hidden">
                                                            <table className="w-full text-[10px]">
                                                                <thead className="bg-white dark:bg-slate-900 font-bold text-slate-400 uppercase">
                                                                    <tr>
                                                                        <th className="px-3 py-2 text-left">Supp. Roll #</th>
                                                                        <th className="px-3 py-2 text-center">Wt (Kgs)</th>
                                                                        <th className="px-3 py-2 text-center">Ltr (Mtr)</th>
                                                                        <th className="px-3 py-2 text-center">GSM</th>
                                                                        <th className="px-3 py-2 text-center">Width</th>
                                                                        <th className="px-3 py-2 text-center">Shade</th>
                                                                        <th className="px-3 py-2 text-center">Dmg?</th>
                                                                        <th className="px-3 py-2 text-left">Remarks</th>
                                                                        <th className="px-3 py-2 text-center">Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white/50 dark:bg-slate-950/50">
                                                                    {item.rollDetails.map((roll, rIdx) => (
                                                                        <tr key={rIdx}>
                                                                            <td className="px-2 py-1"><Input value={roll.supplierRollNo} onChange={(e) => handleRollChange(index, rIdx, 'supplierRollNo', e.target.value)} className="h-7 w-full text-[10px]" /></td>
                                                                            <td className="px-2 py-1"><Input type="number" value={roll.weight} onChange={(e) => handleRollChange(index, rIdx, 'weight', parseFloat(e.target.value))} className="h-7 w-full text-[10px] text-center font-bold" /></td>
                                                                            <td className="px-2 py-1"><Input type="number" value={roll.length} onChange={(e) => handleRollChange(index, rIdx, 'length', parseFloat(e.target.value))} className="h-7 w-full text-[10px] text-center" /></td>
                                                                            <td className="px-2 py-1"><Input type="number" value={roll.gsm} onChange={(e) => handleRollChange(index, rIdx, 'gsm', parseFloat(e.target.value))} className="h-7 w-full text-[10px] text-center" /></td>
                                                                            <td className="px-2 py-1"><Input type="number" value={roll.width} onChange={(e) => handleRollChange(index, rIdx, 'width', parseFloat(e.target.value))} className="h-7 w-full text-[10px] text-center" /></td>
                                                                            <td className="px-2 py-1">
                                                                                <select value={roll.shade} onChange={(e) => handleRollChange(index, rIdx, 'shade', e.target.value)} className="h-7 w-full text-[10px] border-none bg-transparent dark:bg-slate-900 dark:text-slate-200 outline-none rounded">
                                                                                    <option value="Match">Match</option>
                                                                                    <option value="Off">Off-Shade</option>
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-2 py-1 text-center">
                                                                                <select value={roll.damageCheck} onChange={(e) => handleRollChange(index, rIdx, 'damageCheck', e.target.value)} className="h-7 w-full text-[10px] border-none bg-transparent dark:bg-slate-900 dark:text-slate-200 outline-none rounded">
                                                                                    <option value="No">No</option>
                                                                                    <option value="Yes">Yes</option>
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-2 py-1"><Input value={roll.remarks} onChange={(e) => handleRollChange(index, rIdx, 'remarks', e.target.value)} className="h-7 w-full text-[10px] italic placeholder:text-[8px]" placeholder="Roll condition..." /></td>
                                                                            <td className="px-2 py-1">
                                                                                <select value={roll.status} onChange={(e) => handleRollChange(index, rIdx, 'status', e.target.value)} className={`h-7 w-full text-[10px] font-bold border-none bg-transparent dark:bg-slate-900 outline-none rounded ${roll.status === 'Accepted' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                                                                                    <option value="Accepted">Accepted</option>
                                                                                    <option value="Rejected">Rejected</option>
                                                                                </select>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                            Close
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 px-8">
                            {isSubmitting ? 'Recording...' : 'Submit GRN'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`GRN Details: ${selectedGrn?.grnNumber}`}
                className="max-w-5xl"
            >
                {selectedGrn && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-indigo-50/30 dark:bg-indigo-900/10 p-6 rounded-md border border-indigo-100 dark:border-indigo-900/30">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                                <p className="font-semibold">{format(new Date(selectedGrn.grnDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PO Reference</p>
                                <p className="font-semibold text-indigo-600 uppercase font-mono">{selectedGrn.poId?.poNumber || 'Direct'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Challan Info</p>
                                <p className="font-semibold">{selectedGrn.challanNo}</p>
                                {selectedGrn.challanDate && (
                                    <p className="text-[10px] text-slate-500 font-medium">({format(new Date(selectedGrn.challanDate), 'dd MMM yyyy')})</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier</p>
                                <p className="font-semibold">{selectedGrn.supplierId?.partyName}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Package className="h-5 w-5 text-indigo-600" /> Received Items
                            </h3>
                            <div className="rounded-md border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                            <th className="text-left p-4">Product</th>
                                            <th className="text-center p-4">Received</th>
                                            <th className="text-center p-4">Accepted</th>
                                            <th className="text-center p-4">Rejected</th>
                                            <th className="text-left p-4">Batch & Location</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {selectedGrn.items.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <p className="font-bold text-slate-900 dark:text-white">{item.productId?.productName || item.productDescription}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">PO ITEM ID: {item.poItemId || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center font-medium">{item.receivedQuantity} {item.unit}</td>
                                                <td className="p-4 text-center font-bold text-emerald-600">{item.acceptedQuantity} {item.unit}</td>
                                                <td className="p-4 text-center">
                                                    {item.rejectedQuantity > 0 ? (
                                                        <span className="font-bold text-rose-500 italic">{item.rejectedQuantity} {item.unit}</span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        {item.batchNumber && (
                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono w-fit">
                                                                BATCH: {item.batchNumber}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] flex items-center gap-1 text-slate-500">
                                                            <MapPin className="h-3 w-3" />
                                                            {item.storageLocation?.locationName}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-md bg-slate-50 dark:bg-slate-900/50 space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logistics Info</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Vehicle No</span>
                                        <span className="font-bold">{selectedGrn.vehicleNumber || 'Not Recorded'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Received By</span>
                                        <span className="font-bold capitalize">{selectedGrn.receivedBy?.name || 'Admin'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 rounded-md bg-emerald-600 shadow-xl shadow-emerald-500/20 text-white space-y-4">
                                <h4 className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Total Receipts Summary</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-medium opacity-80">Net Accepted</p>
                                        <p className="text-2xl font-black">{selectedGrn.summary?.totalAccepted} {selectedGrn.items[0]?.unit}</p>
                                    </div>
                                    {selectedGrn.summary?.totalRejected > 0 && (
                                        <div>
                                            <p className="text-[10px] font-medium opacity-80 text-rose-200">Total Rejected</p>
                                            <p className="text-2xl font-black text-rose-200">{selectedGrn.summary?.totalRejected} {selectedGrn.items[0]?.unit}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                             <Button variant="outline" className="rounded-md px-10" onClick={() => setIsViewModalOpen(false)}>
                                Close Details
                            </Button>
                            {selectedGrn.summary?.totalRejected > 0 && !selectedGrn.debitNoteGenerated && (
                                <Button
                                    className="rounded-md bg-rose-600 hover:bg-rose-700 px-6 animate-pulse"
                                    onClick={async () => {
                                        try {
                                            await api.post(`/debit-notes/from-grn/${selectedGrn._id}`);
                                            showToast('Debit Note draft created for rejections', 'success');
                                            fetchGrns();
                                            setIsViewModalOpen(false);
                                        } catch (e) {
                                            showToast('Failed to create Debit Note', 'error');
                                        }
                                    }}
                                >
                                    Generate Debit Note
                                </Button>
                            )}
                            <Button
                                className="rounded-md bg-indigo-600 hover:bg-indigo-700 px-6"
                                onClick={() => handleDownloadSlip(selectedGrn)}
                            >
                                Download Slip (PDF)
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
