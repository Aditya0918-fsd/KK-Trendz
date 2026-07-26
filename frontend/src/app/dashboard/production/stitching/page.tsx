'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Calendar, User,
    Layers, CheckCircle2, MoreHorizontal, Activity, Zap,
    Archive, Scissors, ClipboardCheck, Trash2, Clock,
    Settings, ListChecks, Warehouse, AlertTriangle, Truck, Eye, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

import { Modal, FormField } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

export default function StitchingProductionPage() {
    const { loading: authLoading } = useAuth();
    const [stitchings, setStitchings] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [cuttings, setCuttings] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [activeStep, setActiveStep] = useState(1);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedStitching, setSelectedStitching] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const { showToast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        stitchingId: `ST-${Date.now().toString().slice(-6)}`,
        stitchingDate: format(new Date(), 'yyyy-MM-dd'),
        orderId: '',
        batchNumber: '',
        shift: 'Morning',
        supervisorId: '',
        productionLine: '',
        inputBundles: [{
            cuttingId: '',
            bundleNumber: '',
            size: '',
            color: '',
            quantity: 0,
            issuedFrom: '',
            issuedDate: format(new Date(), 'yyyy-MM-dd')
        }],
        inputAccessories: [{
            accessoryType: 'Label',
            productId: '',
            quantity: 0,
            issuedFrom: ''
        }],
        inputThread: [{
            threadId: '',
            color: '',
            quantity: 0,
            issuedFrom: ''
        }],
        operationSequence: [{
            operation: '',
            machineType: '',
            operatorId: '',
            startTime: '',
            endTime: '',
            inputQuantity: 0,
            outputQuantity: 0,
            defects: 0,
            efficiency: 0
        }],
        productionSummary: {
            totalInput: 0,
            totalOutput: 0,
            totalDefects: 0,
            efficiency: 0,
            totalManHours: 0
        },
        defectAnalysis: [{
            defectType: '',
            quantity: 0,
            cause: ''
        }],
        outputBundles: [{
            bundleNumber: '',
            size: '',
            color: '',
            quantity: 0
        }],
        outputStorage: {
            storedAt: '',
            binNumber: ''
        },
        finalQualityCheck: {
            parameters: [
                { parameter: 'Stitch Quality', result: '', status: 'Pending' },
                { parameter: 'Symmetry', result: '', status: 'Pending' },
                { parameter: 'Label Position', result: '', status: 'Pending' }
            ],
            status: 'Pending'
        },
        status: 'In Progress'
    });

    const fetchStitchings = async () => {
        try {
            const res = await api.get('/production/stitching');
            setStitchings(res.data);
        } catch (error) {
            console.error('Error fetching stitching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        setLoading(true);
        try {
            const [ordRes, empRes, cutRes, locRes, prodRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/employees'),
                api.get('/production/cutting'),
                api.get('/locations'),
                api.get('/products')
            ]);
            
            // Get IDs from cutting jobs (only if there's output)
            const cuttingOrderIds = new Set(cutRes.data.map((c: any) => c.orderId?._id || c.orderId));
            
            // Filter orders to only show those that have cutting data
            const filteredOrders = ordRes.data.filter((o: any) => cuttingOrderIds.has(o._id));
            
            setOrders(filteredOrders);
            setEmployees(empRes.data);
            setCuttings(cutRes.data);
            setLocations(locRes.data);
            setProducts(prodRes.data);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchStitchings();
        fetchDropdownData();
    }, [authLoading]);

    const handleAddStitching = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.orderId || !formData.supervisorId || !formData.productionLine) {
            showToast('Please select mandatory fields: Sales Order, Supervisor, and Line', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Sanitize payload
            const payload = {
                ...formData,
                inputBundles: formData.inputBundles.filter(b => b.bundleNumber).map(b => ({
                    ...b,
                    cuttingId: b.cuttingId || undefined,
                    issuedFrom: b.issuedFrom || undefined
                })),
                inputAccessories: formData.inputAccessories.filter(a => a.productId).map(a => ({
                    ...a,
                    issuedFrom: a.issuedFrom || undefined
                })),
                inputThread: formData.inputThread.filter(t => t.threadId).map(t => ({
                    ...t,
                    issuedFrom: t.issuedFrom || undefined
                })),
                operationSequence: formData.operationSequence.filter(o => o.operation).map(o => ({
                    ...o,
                    operatorId: o.operatorId || undefined,
                    startTime: o.startTime ? new Date(`${formData.stitchingDate}T${o.startTime}`) : undefined,
                    endTime: o.endTime ? new Date(`${formData.stitchingDate}T${o.endTime}`) : undefined
                })),
                defectAnalysis: formData.defectAnalysis.filter(d => d.defectType),
                outputBundles: formData.outputBundles.filter(b => b.bundleNumber),
                outputStorage: formData.outputStorage.storedAt ? formData.outputStorage : undefined
            };

            await api.post('/production/stitching', payload);
            setIsAddModalOpen(false);
            showToast('Stitching record added successfully!', 'success');
            fetchStitchings();

            // Reset form
            setActiveStep(1);
            setFormData({
                stitchingId: `ST-${Date.now().toString().slice(-6)}`,
                stitchingDate: format(new Date(), 'yyyy-MM-dd'),
                orderId: '',
                batchNumber: '',
                shift: 'Morning',
                supervisorId: '',
                productionLine: '',
                inputBundles: [{ cuttingId: '', bundleNumber: '', size: '', color: '', quantity: 0, issuedFrom: '', issuedDate: format(new Date(), 'yyyy-MM-dd') }],
                inputAccessories: [{ accessoryType: 'Label', productId: '', quantity: 0, issuedFrom: '' }],
                inputThread: [{ threadId: '', color: '', quantity: 0, issuedFrom: '' }],
                operationSequence: [{ operation: '', machineType: '', operatorId: '', startTime: '', endTime: '', inputQuantity: 0, outputQuantity: 0, defects: 0, efficiency: 0 }],
                productionSummary: { totalInput: 0, totalOutput: 0, totalDefects: 0, efficiency: 0, totalManHours: 0 },
                defectAnalysis: [{ defectType: '', quantity: 0, cause: '' }],
                outputBundles: [{ bundleNumber: '', size: '', color: '', quantity: 0 }],
                outputStorage: { storedAt: '', binNumber: '' },
                finalQualityCheck: {
                    parameters: [
                        { parameter: 'Stitch Quality', result: '', status: 'Pending' },
                        { parameter: 'Symmetry', result: '', status: 'Pending' },
                        { parameter: 'Label Position', result: '', status: 'Pending' }
                    ],
                    status: 'Pending'
                },
                status: 'In Progress'
            });
        } catch (error: any) {
            console.error('Error adding stitching record:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to add stitching record';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (s: any) => {
        if (!confirm(`Delete stitching batch ${s.batchNumber}? This cannot be undone.`)) return;
        setActionLoading(s._id);
        try {
            await api.delete(`/production/stitching/${s._id}`);
            showToast('Stitching record deleted', 'success');
            fetchStitchings();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete', 'error');
        } finally { setActionLoading(null); }
    };

    const handleToggleStatus = async (s: any) => {
        const nextStatus = s.status === 'In Progress' ? 'Completed' : 'In Progress';
        setActionLoading(s._id);
        try {
            await api.put(`/production/stitching/${s._id}`, { status: nextStatus });
            showToast(`Status updated to ${nextStatus}`, 'success');
            fetchStitchings();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update', 'error');
        } finally { setActionLoading(null); }
    };

    const handleViewDetails = (s: any) => {
        setSelectedStitching(s);
        setIsViewModalOpen(true);
    };

    const filtered = stitchings.filter(s =>
        !search ||
        s.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.productionLine?.toLowerCase().includes(search.toLowerCase()) ||
        s.supervisorId?.employeeName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/production">
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Stitching Lines</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-tight tracking-tight">Assembly lines monitoring with operation stage tracking.</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6 shadow-none"
                >
                    <Plus className="h-4 w-4 mr-2" /> New Batch Allocation
                </Button>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Active Lines', value: stitchings.filter(s => s.status === 'In Progress').length, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    { label: 'Total Stitched Out', value: stitchings.reduce((acc, s) => acc + (s.productionSummary?.totalOutput || 0), 0).toLocaleString(), icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                    { label: 'Avg Efficiency', value: stitchings.length > 0 ? `${Math.round(stitchings.reduce((acc, s) => acc + (s.productionSummary?.efficiency || 0), 0) / stitchings.length)}%` : '—', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="p-4 flex items-center gap-4 border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className={`h-11 w-11 rounded-md ${kpi.bg} flex items-center justify-center`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-tight tracking-wider">{kpi.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{kpi.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-center">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="relative flex-1 text-left">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search by batch #, line, or supervisor..." className="pl-10 h-10 text-sm border-slate-200" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center py-4">Batch #</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Line Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Output Pcs</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 font-medium text-center">Loading line data...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 font-medium text-center">{search ? `No results for "${search}"` : 'No stitching records found'}</TableCell></TableRow>
                            ) : (
                                filtered.map(s => (
                                    <TableRow key={s._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/10 tracking-tight font-montserrat tracking-tight font-montserrat tracking-tight font-montserrat">
                                        <TableCell>
                                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{s.batchNumber}</p>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-xs text-slate-700 dark:text-slate-300 tracking-tight">
                                            {format(new Date(s.stitchingDate), 'dd MMM yy')}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{s.productionLine}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{s.supervisorId?.employeeName || 'Supervisor Name'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-white">{s.productionSummary?.totalOutput || 0} Pcs</span>
                                                <span className="text-[9px] text-indigo-500 font-black uppercase tracking-tighter">{s.productionSummary?.efficiency || 0}% Efficiency</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${s.status === 'Completed' || s.status === 'Stitching Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                s.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {s.status || 'Pending'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(s)} className="h-8 w-8 p-0 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="View Details">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {s.status !== 'Completed' && s.status !== 'Stitching Completed' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(s)} disabled={actionLoading === s._id} className="h-7 px-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-md">
                                                        Mark Done
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(s)} disabled={actionLoading === s._id} className="h-8 w-8 p-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full" title="Delete">
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

            {/* ── Multi-Step Stitching Modal ── */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Stitching Section Process: ${formData.stitchingId}`}
                maxWidth="5xl"
            >
                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {[
                        { step: 1, label: 'Bundle Issue', icon: Archive },
                        { step: 2, label: 'Line Setup', icon: Settings },
                        { step: 3, label: 'Operation tracking', icon: Clock },
                        { step: 4, label: 'QC & Defects', icon: ClipboardCheck },
                        { step: 5, label: 'Completion', icon: Warehouse }
                    ].map((s, idx) => (
                        <div key={s.step} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => (s.step < activeStep) && setActiveStep(s.step)}>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${activeStep === s.step ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' :
                                    activeStep > s.step ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400'
                                    }`}>
                                    {activeStep > s.step ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeStep === s.step ? 'text-indigo-600' : 'text-slate-400'}`}>{s.label}</span>
                            </div>
                            {idx < 4 && <div className={`h-[2px] flex-1 mx-4 ${activeStep > s.step ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddStitching} className="mt-4">
                    {/* Step 1: Bundle Issue (Receive Cut Pieces) */}
                    {activeStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <FormField label="Stitching Date"><Input type="date" value={formData.stitchingDate} onChange={(e) => setFormData({ ...formData, stitchingDate: e.target.value })} /></FormField>
                                <FormField label="Sales Order">
                                    <Select
                                        value={formData.orderId}
                                        onChange={(val) => {
                                            const selectedOrder = orders.find(o => o._id === val);
                                            const relatedCutting = cuttings.find(c => c.orderId?._id === val || c.orderId === val);
                                            
                                            // Auto-populate accessories from the items' BOM in the Sales Order
                                            const autoAccessories: any[] = [];
                                            if (selectedOrder?.items) {
                                                selectedOrder.items.forEach((item: any) => {
                                                    const productDetails = products.find(p => p._id === (item.productId?._id || item.productId));
                                                    if (productDetails?.bom) {
                                                        productDetails.bom.forEach((bomItem: any) => {
                                                            const material = products.find(p => p._id === (bomItem.materialId?._id || bomItem.materialId));
                                                            if (material && ['Accessory', 'Packing Material'].includes(material.productCategory)) {
                                                                // Prevent duplicates
                                                                if (!autoAccessories.find(aa => aa.productId === material._id)) {
                                                                    autoAccessories.push({
                                                                        accessoryType: material.productSubCategory || 'Label',
                                                                        productId: material._id,
                                                                        quantity: bomItem.quantityPerProduct * (item.orderQuantity || 0),
                                                                        issuedFrom: ''
                                                                    });
                                                                }
                                                            }
                                                        });
                                                    }
                                                });
                                            }

                                            setFormData(prev => ({
                                                ...prev,
                                                orderId: val,
                                                batchNumber: prev.batchNumber || selectedOrder?.orderNumber || '',
                                                inputBundles: relatedCutting ? [{
                                                    cuttingId: relatedCutting._id,
                                                    bundleNumber: `BND-${relatedCutting.batchNumber}-01`,
                                                    size: relatedCutting.productionDetails?.[0]?.size || '',
                                                    color: relatedCutting.productionDetails?.[0]?.color || '',
                                                    quantity: relatedCutting.outputStorage?.totalPieces || relatedCutting.productionDetails?.[0]?.actualPieces || 0,
                                                    issuedFrom: relatedCutting.outputStorage?.storedAt || '',
                                                    issuedDate: prev.stitchingDate
                                                }] : prev.inputBundles,
                                                inputAccessories: autoAccessories.length > 0 ? autoAccessories : prev.inputAccessories
                                            }));
                                        }}
                                        options={orders.map(o => ({ value: o._id, label: o.orderNumber }))}
                                        placeholder="Select Order"
                                    />
                                </FormField>
                                <FormField label="Batch Number"><Input placeholder="Batch/PO#" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} /></FormField>
                                <FormField label="Shift">
                                    <Select
                                        value={formData.shift}
                                        onChange={(val) => setFormData({ ...formData, shift: val as any })}
                                        options={['Morning', 'Evening', 'Night'].map(s => ({ value: s, label: s }))}
                                    />
                                </FormField>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Input Bundles (From Cutting)</h4>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, inputBundles: [...formData.inputBundles, { cuttingId: '', bundleNumber: '', size: '', color: '', quantity: 0, issuedFrom: '', issuedDate: formData.stitchingDate }] })} className="h-7 text-[9px] px-2 font-black uppercase tracking-widest border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100"><Plus className="h-3 w-3 mr-1" /> Add Bundle</Button>
                                </div>
                                {formData.inputBundles.map((b, idx) => (
                                    <div key={idx} className="grid grid-cols-6 gap-3 items-end bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-md shadow-sm">
                                        <FormField label="Cutting Job" className="col-span-2">
                                            <Select
                                                value={b.cuttingId}
                                                onChange={(val) => {
                                                    const newB = [...formData.inputBundles]; newB[idx].cuttingId = val; setFormData({ ...formData, inputBundles: newB });
                                                }}
                                                options={cuttings.map(c => ({
                                                    value: c._id,
                                                    label: `${c.batchNumber} (${c.orderId?.orderNumber})`
                                                }))}
                                                placeholder="Select Cutting Job"
                                            />
                                        </FormField>
                                        <FormField label="Bundle #"><Input className="h-8 text-[11px]" value={b.bundleNumber} onChange={(e) => {
                                            const newB = [...formData.inputBundles]; newB[idx].bundleNumber = e.target.value; setFormData({ ...formData, inputBundles: newB });
                                        }} /></FormField>
                                        <FormField label="Size"><Input className="h-8 text-[11px]" value={b.size} onChange={(e) => {
                                            const newB = [...formData.inputBundles]; newB[idx].size = e.target.value; setFormData({ ...formData, inputBundles: newB });
                                        }} /></FormField>
                                        <FormField label="Qty"><Input type="number" className="h-8 text-[11px]" value={b.quantity} onChange={(e) => {
                                            const newB = [...formData.inputBundles]; newB[idx].quantity = Number(e.target.value); setFormData({ ...formData, inputBundles: newB });
                                        }} /></FormField>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, inputBundles: formData.inputBundles.filter((_, i) => i !== idx) })} className="h-8 w-8 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Line Setup */}
                    {activeStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4 col-span-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Line Assignment</h4>
                                    <FormField label="Production Line"><Input placeholder="e.g. Line-A1 / Floor-2" value={formData.productionLine} onChange={(e) => setFormData({ ...formData, productionLine: e.target.value })} /></FormField>
                                    <FormField label="Line Supervisor">
                                        <Select
                                            value={formData.supervisorId}
                                            onChange={(val) => setFormData({ ...formData, supervisorId: val })}
                                            options={employees.map(e => ({ value: e._id, label: e.employeeName }))}
                                            placeholder="Select Supervisor"
                                        />
                                    </FormField>
                                </div>

                                <div className="space-y-4 col-span-2">
                                    <div className="flex items-center justify-between border-b pb-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Thread & Accessories</h4>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, inputAccessories: [...formData.inputAccessories, { accessoryType: 'Label', productId: '', quantity: 0, issuedFrom: '' }] })} className="h-auto p-0 text-[10px] font-black uppercase text-indigo-600">Add Material</Button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.inputAccessories.map((a, idx) => (
                                            <div key={idx} className="flex gap-4 items-end bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-visible">
                                                <div className="flex-1 min-w-[200px]">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Material / Product</p>
                                                    <Select
                                                        className="w-full"
                                                        value={a.productId}
                                                        onChange={(val) => {
                                                            const newA = [...formData.inputAccessories]; newA[idx].productId = val; setFormData({ ...formData, inputAccessories: newA });
                                                        }}
                                                        options={products
                                                            .filter(p => ['Accessory', 'Packing Material'].includes(p.productCategory))
                                                            .map(p => ({ value: p._id, label: p.productName }))}
                                                        placeholder="Search & Select Product"
                                                    />
                                                </div>
                                                <div className="w-32">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Type</p>
                                                    <Select
                                                        value={a.accessoryType}
                                                        onChange={(val) => {
                                                            const newA = [...formData.inputAccessories]; newA[idx].accessoryType = val; setFormData({ ...formData, inputAccessories: newA });
                                                        }}
                                                        options={['Label', 'Thread', 'Button', 'Elastic', 'Tag'].map(t => ({ value: t, label: t }))}
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Qty</p>
                                                    <Input type="number" className="h-10 text-xs font-bold" value={a.quantity} onChange={(e) => {
                                                        const newA = [...formData.inputAccessories]; newA[idx].quantity = Number(e.target.value); setFormData({ ...formData, inputAccessories: newA });
                                                    }} />
                                                </div>
                                                <Button type="button" variant="ghost" className="h-10 w-10 p-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors" onClick={() => setFormData({ ...formData, inputAccessories: formData.inputAccessories.filter((_, i) => i !== idx) })}><Trash2 className="h-5 w-5" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Operation Tracking */}
                    {activeStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operation Sequence Tracking</h4>
                                <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, operationSequence: [...formData.operationSequence, { operation: '', machineType: '', operatorId: '', startTime: '', endTime: '', inputQuantity: 0, outputQuantity: 0, defects: 0, efficiency: 0 }] })} className="h-7 text-[9px] px-2 font-black uppercase border-indigo-200 text-indigo-600 bg-indigo-50"><Plus className="h-3 w-3 mr-1" /> Add Operation</Button>
                            </div>
                            <div className="space-y-3 pr-2">
                                {formData.operationSequence.map((op, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm grid grid-cols-12 gap-3 items-end group">
                                        <div className="col-span-3">
                                            <FormField label="Operation"><Input className="h-8 text-[11px]" placeholder="e.g. Shoulder Join" value={op.operation} onChange={(e) => {
                                                const newOp = [...formData.operationSequence]; newOp[idx].operation = e.target.value; setFormData({ ...formData, operationSequence: newOp });
                                            }} /></FormField>
                                        </div>
                                        <div className="col-span-2">
                                            <FormField label="Operator">
                                                <Select
                                                    value={op.operatorId}
                                                    onChange={(val) => {
                                                        const newOp = [...formData.operationSequence]; newOp[idx].operatorId = val; setFormData({ ...formData, operationSequence: newOp });
                                                    }}
                                                    options={employees.map(e => ({ value: e._id, label: e.employeeName }))}
                                                    placeholder="Operator"
                                                />
                                            </FormField>
                                        </div>
                                        <div className="col-span-2">
                                            <FormField label="Machine"><Input className="h-8 text-[11px]" placeholder="e.g. Overlock" value={op.machineType} onChange={(e) => {
                                                const newOp = [...formData.operationSequence]; newOp[idx].machineType = e.target.value; setFormData({ ...formData, operationSequence: newOp });
                                            }} /></FormField>
                                        </div>
                                        <div className="col-span-1">
                                            <FormField label="Start"><Input type="time" className="h-8 text-[9px] px-1" value={op.startTime} onChange={(e) => {
                                                const newOp = [...formData.operationSequence]; newOp[idx].startTime = e.target.value; setFormData({ ...formData, operationSequence: newOp });
                                            }} /></FormField>
                                        </div>
                                        <div className="col-span-1">
                                            <FormField label="End"><Input type="time" className="h-8 text-[9px] px-1" value={op.endTime} onChange={(e) => {
                                                const newOp = [...formData.operationSequence]; newOp[idx].endTime = e.target.value; setFormData({ ...formData, operationSequence: newOp });
                                            }} /></FormField>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <FormField label="Input"><Input type="number" className="h-8 text-[11px] text-center px-1" value={op.inputQuantity} onChange={(e) => {
                                                const newOp = [...formData.operationSequence]; newOp[idx].inputQuantity = Number(e.target.value); setFormData({ ...formData, operationSequence: newOp });
                                            }} /></FormField>
                                        </div>
                                        <div className="col-span-1 text-center font-bold">
                                            <FormField label="Output"><Input type="number" className="h-8 text-[11px] text-center px-1 border-indigo-200 bg-indigo-50/10" value={op.outputQuantity} onChange={(e) => {
                                                const newOp = [...formData.operationSequence]; newOp[idx].outputQuantity = Number(e.target.value); setFormData({ ...formData, operationSequence: newOp });
                                            }} /></FormField>
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, operationSequence: formData.operationSequence.filter((_, i) => i !== idx) })} className="h-8 w-8 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: QC & Defects */}
                    {activeStep === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Final Inspection Parameter</h4>
                                    {formData.finalQualityCheck.parameters.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-md border border-slate-100 dark:border-slate-700">
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold text-slate-700">{p.parameter}</p>
                                                <Input className="h-7 text-[10px] mt-1" placeholder="Inspection result notes..." value={p.result} onChange={(e) => {
                                                    const newQC = { ...formData.finalQualityCheck }; newQC.parameters[i].result = e.target.value; setFormData({ ...formData, finalQualityCheck: newQC });
                                                }} />
                                            </div>
                                            <Select
                                                value={p.status}
                                                onChange={(val) => {
                                                    const newQC = { ...formData.finalQualityCheck }; newQC.parameters[i].status = val as any; setFormData({ ...formData, finalQualityCheck: newQC });
                                                }}
                                                options={['Pass', 'Fail', 'Pending'].map(s => ({ value: s, label: s }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Defect Analysis</h4>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, defectAnalysis: [...formData.defectAnalysis, { defectType: '', quantity: 0, cause: '' }] })} className="h-auto p-0 text-[10px] font-black uppercase text-indigo-600">Add Defect</Button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.defectAnalysis.map((d, i) => (
                                            <div key={i} className="grid grid-cols-12 gap-2 bg-rose-50/50 dark:bg-rose-500/10 p-2 rounded border border-rose-100 dark:border-rose-500/20">
                                                <div className="col-span-5"><Input placeholder="Defect Type" className="h-7 text-[10px]" value={d.defectType} onChange={(e) => {
                                                    const newD = [...formData.defectAnalysis]; newD[i].defectType = e.target.value; setFormData({ ...formData, defectAnalysis: newD });
                                                }} /></div>
                                                <div className="col-span-2"><Input type="number" placeholder="Qty" className="h-7 text-[10px] text-center" value={d.quantity} onChange={(e) => {
                                                    const newD = [...formData.defectAnalysis]; newD[i].quantity = Number(e.target.value); setFormData({ ...formData, defectAnalysis: newD });
                                                }} /></div>
                                                <div className="col-span-4"><Input placeholder="Cause" className="h-7 text-[10px]" value={d.cause} onChange={(e) => {
                                                    const newD = [...formData.defectAnalysis]; newD[i].cause = e.target.value; setFormData({ ...formData, defectAnalysis: newD });
                                                }} /></div>
                                                <div className="col-span-1"><Button type="button" variant="ghost" className="h-7 w-7 p-0 text-rose-400" onClick={() => setFormData({ ...formData, defectAnalysis: formData.defectAnalysis.filter((_, idx) => idx !== i) })}><Trash2 className="h-3 w-3" /></Button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Completion */}
                    {activeStep === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center justify-center py-10">
                            <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                                <ListChecks className="h-10 w-10 text-indigo-600" />
                            </div>
                            <div className="text-center max-w-md">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Stitching Completion Report</h3>
                                <p className="text-sm text-slate-500 font-medium mt-2">Finished garments will be moved to the ironing/finishing section store.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-8 bg-slate-900 p-6 rounded-lg text-white">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Finishing Location</p>
                                    <Select
                                        value={formData.outputStorage.storedAt}
                                        onChange={(val) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, storedAt: val } })}
                                        options={locations.map(l => ({ value: l._id, label: l.name }))}
                                        placeholder="Select Store"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bin / Pallet #</p>
                                    <Input className="bg-transparent border-t-0 border-x-0 border-b border-slate-700 rounded-none h-8 px-0 text-sm focus-visible:ring-0" placeholder="e.g. BIN-FIN-01" value={formData.outputStorage.binNumber} onChange={(e) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, binNumber: e.target.value } })} />
                                </div>
                                <div className="col-span-2 pt-4 border-t border-slate-800 mt-4 flex justify-between">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Good Pieces</p>
                                        <p className="text-2xl font-black text-indigo-400">{formData.operationSequence[formData.operationSequence.length - 1]?.outputQuantity || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Total Defects</p>
                                        <p className="text-2xl font-black text-rose-400">{formData.defectAnalysis.reduce((acc, curr) => acc + curr.quantity, 0)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Efficiency</p>
                                        <p className="text-2xl font-black text-emerald-400">{formData.productionSummary.efficiency}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
                        <div className="flex gap-2">
                            {activeStep > 1 && (
                                <Button type="button" variant="ghost" onClick={() => setActiveStep(activeStep - 1)} className="text-slate-500 font-bold uppercase text-[10px] tracking-widest"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6 font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
                            {activeStep < 5 ? (
                                <Button type="button" onClick={() => setActiveStep(activeStep + 1)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">Next Step</Button>
                            ) : (
                                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100">
                                    {isSubmitting ? 'Submitting...' : 'Complete Stitching'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ── View Stitching Details Modal ── */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Stitching Record: ${selectedStitching?.batchNumber}`}
                maxWidth="5xl"
            >
                {selectedStitching && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Batch #</p>
                                <p className="text-xs font-black text-indigo-600">{selectedStitching.batchNumber}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</p>
                                <p className="text-xs font-bold">{format(new Date(selectedStitching.stitchingDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Line</p>
                                <p className="text-xs font-black uppercase">{selectedStitching.productionLine}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Supervisor</p>
                                <p className="text-xs font-bold">{selectedStitching.supervisorId?.employeeName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedStitching.status === 'Completed' || selectedStitching.status === 'Stitching Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {selectedStitching.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2 border-slate-100 shadow-none">
                                <CardHeader className="py-2 border-b bg-slate-50/50">
                                    <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-2"><ListChecks className="h-3 w-3" /> Operation Sequence</h4>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50/30">
                                            <TableRow className="h-8">
                                                <TableHead className="text-[9px] font-black uppercase px-2 text-center">Op #</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase px-2">Operation</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase px-2 text-center">Machine</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase px-2 text-right">In</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase px-2 text-right">Out</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase px-2 text-right">Def</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase px-2 text-right">Eff%</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="text-[11px]">
                                            {selectedStitching.operationSequence?.map((op: any, i: number) => (
                                                <TableRow key={i} className="h-8 border-b last:border-0">
                                                    <TableCell className="px-2 text-center font-bold text-slate-400">{i + 1}</TableCell>
                                                    <TableCell className="px-2 font-black uppercase">{op.operation}</TableCell>
                                                    <TableCell className="px-2 text-center text-slate-500">{op.machineType}</TableCell>
                                                    <TableCell className="px-2 text-right font-bold">{op.inputQuantity}</TableCell>
                                                    <TableCell className="px-2 text-right font-black text-indigo-600">{op.outputQuantity}</TableCell>
                                                    <TableCell className="px-2 text-right font-bold text-rose-500">{op.defects}</TableCell>
                                                    <TableCell className="px-2 text-right">
                                                        <span className="bg-slate-100 px-1 py-0.5 rounded font-black text-[9px] tracking-tighter">{op.efficiency}%</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <Card className="border-slate-100 shadow-none bg-indigo-50/5">
                                    <CardHeader className="py-2 border-b">
                                        <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2"><Zap className="h-3 w-3" /> Production Summary</h4>
                                    </CardHeader>
                                    <CardContent className="py-4 space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-bold uppercase tracking-tighter tracking-tight">Total Input</span>
                                            <span className="font-black">{selectedStitching.productionSummary?.totalInput || 0} Pcs</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-bold uppercase tracking-tighter tracking-tight">Total Output</span>
                                            <span className="font-black text-indigo-600">{selectedStitching.productionSummary?.totalOutput || 0} Pcs</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-bold uppercase tracking-tighter tracking-tight">Defects Found</span>
                                            <span className="font-black text-rose-500">{selectedStitching.productionSummary?.totalDefects || 0} Pcs</span>
                                        </div>
                                        <div className="pt-2 mt-2 border-t border-indigo-100 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-indigo-700">Line efficiency</span>
                                            <span className="text-xl font-black text-indigo-700">{selectedStitching.productionSummary?.efficiency || 0}%</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-100 shadow-none bg-emerald-50/5">
                                    <CardHeader className="py-2 border-b">
                                        <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Quality Check</h4>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-emerald-100">
                                            {selectedStitching.finalQualityCheck?.parameters?.map((p: any, i: number) => (
                                                <div key={i} className="px-3 py-2 flex justify-between items-center">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{p.parameter}</span>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${p.status === 'Pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={() => setIsViewModalOpen(false)} className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest px-8">Close Details</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
