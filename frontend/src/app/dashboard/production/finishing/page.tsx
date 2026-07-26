'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Calendar, User,
    Waves, CheckCircle2, MoreHorizontal, Activity, Zap,
    Settings, ListChecks, Warehouse, AlertTriangle, Truck, Trash2, Scale, Eye, X, Thermometer, Scissors, ClipboardCheck, Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

import { Modal, FormField } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function FinishingProductionPage() {
    const { loading: authLoading } = useAuth();
    const [finishings, setFinishings] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const [stitchings, setStitchings] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [activeStep, setActiveStep] = useState(1);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedFinishing, setSelectedFinishing] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        finishingId: `FIN-${Date.now().toString().slice(-6)}`,
        finishingDate: format(new Date(), 'yyyy-MM-dd'),
        orderId: '',
        batchNumber: '',
        shift: 'Morning',
        supervisorId: '',
        inputBundles: [{
            stitchingId: '',
            bundleNumber: '',
            quantity: 0,
            issuedFrom: ''
        }],
        threadCutting: {
            operatorId: '',
            startTime: '',
            endTime: '',
            inputQuantity: 0,
            outputQuantity: 0,
            defects: 0,
            defectsDetails: [{ defectType: 'Fabric Cut', quantity: 0 }],
            remarks: ''
        },
        ironing: {
            machineId: '',
            operatorId: '',
            startTime: '',
            endTime: '',
            inputQuantity: 0,
            outputQuantity: 0,
            defects: 0,
            parameters: {
                temperature: '180°C',
                pressure: 'Normal',
                steamConsumption: 0
            },
            defectsDetails: [{ defectType: 'Shine Mark', quantity: 0 }],
            remarks: ''
        },
        outputBundles: [{
            bundleNumber: '',
            quantity: 0,
            pieceNumbers: ''
        }],
        outputStorage: {
            storedAt: '',
            binNumber: ''
        },
        qualityCheck: {
            parameters: [
                { parameter: 'No Loose Threads (Inside/Outside)', result: '', status: 'Pending' },
                { parameter: 'No Wrinkles / Water Marks', result: '', status: 'Pending' },
                { parameter: 'Button/Label Strength', result: '', status: 'Pending' },
                { parameter: 'Proper Shape Maintained', result: '', status: 'Pending' }
            ],
            remarks: '',
            status: 'Pending'
        },
        status: 'In Progress'
    });

    const fetchFinishings = async () => {
        try {
            const res = await api.get('/production/finishing');
            setFinishings(res.data);
        } catch (error) {
            console.error('Error fetching finishing entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        setLoading(true);
        try {
            const [ordRes, empRes, stitchRes, locRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/employees'),
                api.get('/production/stitching'),
                api.get('/locations')
            ]);
            
            // Get IDs from stitching batches
            const stitchingOrderIds = new Set(stitchRes.data.map((s: any) => s.orderId?._id || s.orderId));
            
            // Filter orders to only show those that have stitching data
            const filteredOrders = ordRes.data.filter((o: any) => stitchingOrderIds.has(o._id));
            
            setOrders(filteredOrders);
            setEmployees(empRes.data);
            setStitchings(stitchRes.data);
            setLocations(locRes.data);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchFinishings();
        fetchDropdownData();
    }, [authLoading]);

    const handleAddFinishing = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.orderId || !formData.supervisorId) {
            showToast('Please select mandatory fields: Sales Order and Supervisor', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Sanitize payload
            const payload = {
                ...formData,
                status: 'Finished',
                inputBundles: formData.inputBundles.filter(b => b.bundleNumber).map(b => ({
                    ...b,
                    stitchingId: b.stitchingId || undefined,
                    issuedFrom: b.issuedFrom || undefined
                })),
                threadCutting: {
                    ...formData.threadCutting,
                    operatorId: formData.threadCutting.operatorId || undefined,
                    startTime: formData.threadCutting.startTime ? new Date(`${formData.finishingDate}T${formData.threadCutting.startTime}`) : undefined,
                    endTime: formData.threadCutting.endTime ? new Date(`${formData.finishingDate}T${formData.threadCutting.endTime}`) : undefined,
                    defectsDetails: formData.threadCutting.defectsDetails.filter(d => d.quantity > 0)
                },
                ironing: {
                    ...formData.ironing,
                    operatorId: formData.ironing.operatorId || undefined,
                    startTime: formData.ironing.startTime ? new Date(`${formData.finishingDate}T${formData.ironing.startTime}`) : undefined,
                    endTime: formData.ironing.endTime ? new Date(`${formData.finishingDate}T${formData.ironing.endTime}`) : undefined,
                    defectsDetails: formData.ironing.defectsDetails.filter(d => d.quantity > 0)
                },
                outputBundles: formData.outputBundles.filter(b => b.bundleNumber),
                outputStorage: formData.outputStorage.storedAt ? formData.outputStorage : undefined
            };

            await api.post('/production/finishing', payload);
            setIsAddModalOpen(false);
            showToast('Finishing record added successfully!', 'success');
            fetchFinishings();

            // Reset form
            setActiveStep(1);
            setFormData({
                finishingId: `FIN-${Date.now().toString().slice(-6)}`,
                finishingDate: format(new Date(), 'yyyy-MM-dd'),
                orderId: '',
                batchNumber: '',
                shift: 'Morning',
                supervisorId: '',
                inputBundles: [{ stitchingId: '', bundleNumber: '', quantity: 0, issuedFrom: '' }],
                threadCutting: { operatorId: '', startTime: '', endTime: '', inputQuantity: 0, outputQuantity: 0, defects: 0, defectsDetails: [{ defectType: 'Fabric Cut', quantity: 0 }], remarks: '' },
                ironing: { machineId: '', operatorId: '', startTime: '', endTime: '', inputQuantity: 0, outputQuantity: 0, defects: 0, parameters: { temperature: '180°C', pressure: 'Normal', steamConsumption: 0 }, defectsDetails: [{ defectType: 'Shine Mark', quantity: 0 }], remarks: '' },
                outputBundles: [{ bundleNumber: '', quantity: 0, pieceNumbers: '' }],
                outputStorage: { storedAt: '', binNumber: '' },
                qualityCheck: {
                    parameters: [
                        { parameter: 'No Loose Threads (Inside/Outside)', result: '', status: 'Pending' },
                        { parameter: 'No Wrinkles / Water Marks', result: '', status: 'Pending' },
                        { parameter: 'Button/Label Strength', result: '', status: 'Pending' },
                        { parameter: 'Proper Shape Maintained', result: '', status: 'Pending' }
                    ],
                    remarks: '',
                    status: 'Pending'
                },
                status: 'In Progress'
            });
        } catch (error: any) {
            console.error('Error adding finishing record:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to add finishing record';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (f: any) => {
        if (!confirm(`Delete finishing record ${f.finishingId}? This cannot be undone.`)) return;
        setActionLoading(f._id);
        try {
            await api.delete(`/production/finishing/${f._id}`);
            showToast('Finishing record deleted', 'success');
            fetchFinishings();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete', 'error');
        } finally { setActionLoading(null); }
    };

    const handleToggleStatus = async (f: any) => {
        const nextStatus = f.status === 'In Progress' ? 'Finished' : 'In Progress';
        setActionLoading(f._id);
        try {
            await api.put(`/production/finishing/${f._id}`, { status: nextStatus });
            showToast(`Status updated to ${nextStatus}`, 'success');
            fetchFinishings();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update', 'error');
        } finally { setActionLoading(null); }
    };

    const handleViewDetails = (f: any) => {
        setSelectedFinishing(f);
        setIsViewModalOpen(true);
    };

    const filtered = finishings.filter(f =>
        !search ||
        f.finishingId?.toLowerCase().includes(search.toLowerCase()) ||
        f.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
        f.orderId?.orderNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/production">
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 border border-slate-100"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight tracking-tight tracking-tight">Finishing Hub</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Quality control, ironing, and final packaging tracking.</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[11px] tracking-widest h-10 px-6 shadow-none"
                >
                    <Plus className="h-4 w-4 mr-2" /> Final QC Entry
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Batches Finished', value: finishings.length, icon: Waves, color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'Total Rejects', value: finishings.reduce((acc, f) => acc + ((f.ironing?.defects || 0) + (f.threadCutting?.defects || 0)), 0), icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                    { label: 'Total Output Pcs', value: finishings.reduce((acc, f) => acc + (f.ironing?.outputQuantity || 0), 0).toLocaleString(), icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="p-4 flex items-center gap-4 border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className={`h-11 w-11 rounded-md ${kpi.bg} flex items-center justify-center`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider text-left tracking-tighter">{kpi.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white text-left tracking-tight">{kpi.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-center">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="relative flex-1 text-left">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search by finishing ID, batch, or order..." className="pl-10 h-10 text-sm border-slate-200" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center py-4">Finishing #</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Batch Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Output Pcs</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 font-medium text-center">Scanning records...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 font-medium text-center">{search ? `No results for "${search}"` : 'No finishing records found'}</TableCell></TableRow>
                            ) : (
                                filtered.map(f => (
                                    <TableRow key={f._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-emerald-50/10 tracking-tight font-montserrat">
                                        <TableCell>
                                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{f.finishingId}</p>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-xs text-slate-700 dark:text-slate-300">
                                            {format(new Date(f.finishingDate), 'dd MMM yy')}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase">{f.batchNumber}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ORDER: {f.orderId?.orderNumber || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6 font-bold">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-white">{f.ironing?.outputQuantity || 0} Pcs</span>
                                                <span className="text-[8px] text-rose-500 font-black uppercase tracking-tighter">{f.ironing?.defects + f.threadCutting?.defects || 0} Rejects</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${f.status === 'Finished' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                f.qualityCheck?.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    'bg-amber-100 text-amber-700 border-amber-200'
                                                } border shadow-sm`}>
                                                {f.status || f.qualityCheck?.status || 'Pending'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(f)} className="h-8 w-8 p-0 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="View Details">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {f.status !== 'Finished' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(f)} disabled={actionLoading === f._id} className="h-7 px-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-md">
                                                        Mark Done
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(f)} disabled={actionLoading === f._id} className="h-8 w-8 p-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full" title="Delete">
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

            {/* ── Multi-Step Finishing Modal ── */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Finishing Process: ${formData.finishingId}`}
                maxWidth="5xl"
            >
                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {[
                        { step: 1, label: 'Thread Cutting', icon: Scissors },
                        { step: 2, label: 'Ironing Process', icon: Thermometer },
                        { step: 3, label: 'Quality Check', icon: ClipboardCheck },
                        { step: 4, label: 'Bundle & Ship', icon: Warehouse }
                    ].map((s, idx) => (
                        <div key={s.step} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => (s.step < activeStep) && setActiveStep(s.step)}>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${activeStep === s.step ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' :
                                    activeStep > s.step ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400'
                                    }`}>
                                    {activeStep > s.step ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${activeStep === s.step ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span>
                            </div>
                            {idx < 3 && <div className={`h-[2px] flex-1 mx-4 ${activeStep > s.step ? 'bg-indigo-500' : 'bg-slate-100'}`} />}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddFinishing}>
                    {/* Step 1: Thread Cutting */}
                    {activeStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <FormField label="Finishing Date"><Input type="date" value={formData.finishingDate} onChange={(e) => setFormData({ ...formData, finishingDate: e.target.value })} /></FormField>
                                <FormField label="Sales Order">
                                    <select className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none" value={formData.orderId} onChange={(e) => {
                                        const val = e.target.value;
                                        const selectedOrder = orders.find(o => o._id === val);
                                        const relatedStitching = stitchings.find(s => s.orderId?._id === val || s.orderId === val);
                                        
                                        setFormData(prev => ({
                                            ...prev,
                                            orderId: val,
                                            batchNumber: prev.batchNumber || selectedOrder?.orderNumber || '',
                                            inputBundles: relatedStitching ? [{
                                                stitchingId: relatedStitching._id,
                                                bundleNumber: relatedStitching.batchNumber,
                                                quantity: relatedStitching.productionSummary?.totalOutput || 0,
                                                issuedFrom: relatedStitching.outputStorage?.storedAt || ''
                                            }] : prev.inputBundles,
                                            threadCutting: {
                                                ...prev.threadCutting,
                                                inputQuantity: relatedStitching?.productionSummary?.totalOutput || prev.threadCutting.inputQuantity
                                            },
                                            ironing: {
                                                ...prev.ironing,
                                                inputQuantity: relatedStitching?.productionSummary?.totalOutput || prev.ironing.inputQuantity
                                            }
                                        }));
                                    }}>
                                        <option value="">Select Order</option>
                                        {orders.map(o => <option key={o._id} value={o._id}>{o.orderNumber}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Batch Number"><Input placeholder="e.g. Navy-Blue-M" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} /></FormField>
                                <FormField label="Main Supervisor">
                                    <select className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none" value={formData.supervisorId} onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}>
                                        <option value="">Select Supervisor</option>
                                        {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName}</option>)}
                                    </select>
                                </FormField>
                            </div>

                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Scissors className="h-4 w-4 text-indigo-600" />
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Manual Thread Cutting Activity</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Cutting Operator">
                                        <select className="w-full text-xs h-9 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 rounded" value={formData.threadCutting.operatorId} onChange={(e) => setFormData({ ...formData, threadCutting: { ...formData.threadCutting, operatorId: e.target.value } })}>
                                            <option value="">Operator</option>
                                            {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Start Time"><Input type="time" className="h-9" value={formData.threadCutting.startTime} onChange={(e) => setFormData({ ...formData, threadCutting: { ...formData.threadCutting, startTime: e.target.value } })} /></FormField>
                                    <FormField label="End Time"><Input type="time" className="h-9" value={formData.threadCutting.endTime} onChange={(e) => setFormData({ ...formData, threadCutting: { ...formData.threadCutting, endTime: e.target.value } })} /></FormField>
                                </div>
                                <div className="grid grid-cols-3 gap-4 pt-2">
                                    <FormField label="Input Bundle Pieces"><Input type="number" className="h-9" value={formData.threadCutting.inputQuantity} onChange={(e) => setFormData({ ...formData, threadCutting: { ...formData.threadCutting, inputQuantity: Number(e.target.value) } })} /></FormField>
                                    <FormField label="Passed QC"><Input type="number" className="h-9 text-emerald-600 font-bold" value={formData.threadCutting.outputQuantity} onChange={(e) => setFormData({ ...formData, threadCutting: { ...formData.threadCutting, outputQuantity: Number(e.target.value) } })} /></FormField>
                                    <FormField label="Fabric Cut Defect"><Input type="number" className="h-9 text-rose-500 font-bold" value={formData.threadCutting.defects} onChange={(e) => setFormData({ ...formData, threadCutting: { ...formData.threadCutting, defects: Number(e.target.value) } })} /></FormField>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Ironing Process */}
                    {activeStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Ironing Station Setup</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Machine #"><Input placeholder="e.g. Iron-04" value={formData.ironing.machineId} onChange={(e) => setFormData({ ...formData, ironing: { ...formData.ironing, machineId: e.target.value } })} /></FormField>
                                        <FormField label="Operator">
                                            <select className="w-full text-xs h-10 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 rounded" value={formData.ironing.operatorId} onChange={(e) => setFormData({ ...formData, ironing: { ...formData.ironing, operatorId: e.target.value } })}>
                                                <option value="">Operator</option>
                                                {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName}</option>)}
                                            </select>
                                        </FormField>
                                    </div>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-md border border-amber-100 dark:border-amber-500/20 flex gap-4 items-center">
                                        <Thermometer className="h-8 w-8 text-amber-500" />
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase text-amber-700">Temperature Setting</p>
                                            <div className="flex gap-2 mt-1">
                                                <button type="button" onClick={() => setFormData({ ...formData, ironing: { ...formData.ironing, parameters: { ...formData.ironing.parameters, temperature: '190°C' } } })} className={`px-2 py-1 text-[9px] font-black rounded ${formData.ironing.parameters.temperature === '190°C' ? 'bg-amber-500 text-white' : 'bg-white text-amber-700'}`}>Cotton (190°C)</button>
                                                <button type="button" onClick={() => setFormData({ ...formData, ironing: { ...formData.ironing, parameters: { ...formData.ironing.parameters, temperature: '150°C' } } })} className={`px-2 py-1 text-[9px] font-black rounded ${formData.ironing.parameters.temperature === '150°C' ? 'bg-amber-500 text-white' : 'bg-white text-amber-700'}`}>Polyester (150°C)</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Ironing Output Tracking</h4>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <FormField label="Input Quantity"><Input type="number" className="h-10" value={formData.ironing.inputQuantity} onChange={(e) => setFormData({ ...formData, ironing: { ...formData.ironing, inputQuantity: Number(e.target.value) } })} /></FormField>
                                        <FormField label="Finished Output"><Input type="number" className="h-10 text-emerald-600 font-black" value={formData.ironing.outputQuantity} onChange={(e) => setFormData({ ...formData, ironing: { ...formData.ironing, outputQuantity: Number(e.target.value) } })} /></FormField>
                                    </div>
                                    <FormField label="Ironing Defects (Shine/Water Marks)">
                                        <div className="relative">
                                            <Input type="number" className="h-10 text-rose-500 font-bold pr-10" value={formData.ironing.defects} onChange={(e) => setFormData({ ...formData, ironing: { ...formData.ironing, defects: Number(e.target.value) } })} />
                                            <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-rose-300" />
                                        </div>
                                    </FormField>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Quality Check */}
                    {activeStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Final Finishing Inspection</h4>
                                    {formData.qualityCheck.parameters.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-md border border-slate-100 dark:border-slate-700">
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold text-slate-700">{p.parameter}</p>
                                                <Input className="h-7 text-[10px] mt-1" placeholder="Inspection result notes..." value={p.result} onChange={(e) => {
                                                    const newQC = { ...formData.qualityCheck }; newQC.parameters[i].result = e.target.value; setFormData({ ...formData, qualityCheck: newQC });
                                                }} />
                                            </div>
                                            <select className="h-8 text-[10px] font-black uppercase rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 outline-none" value={p.status} onChange={(e) => {
                                                const newQC = { ...formData.qualityCheck }; newQC.parameters[i].status = e.target.value as any; setFormData({ ...formData, qualityCheck: newQC });
                                            }}>
                                                <option value="Pass">Pass</option><option value="Fail">Fail</option><option value="Pending">Pending</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                    <ClipboardCheck className="h-16 w-16 text-slate-200 mb-4" />
                                    <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest">Supervisor Review</p>
                                    <FormField label="Overall Status" className="w-full mt-6">
                                        <select className="w-full h-10 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 rounded font-black uppercase tracking-widest text-xs" value={formData.qualityCheck.status} onChange={(e) => setFormData({ ...formData, qualityCheck: { ...formData.qualityCheck, status: e.target.value } })}>
                                            <option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Final Remarks" className="w-full mt-4"><Input placeholder="General observations..." value={formData.qualityCheck.remarks} onChange={(e) => setFormData({ ...formData, qualityCheck: { ...formData.qualityCheck, remarks: e.target.value } })} /></FormField>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Completion */}
                    {activeStep === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center justify-center py-10">
                            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-50">
                                <Truck className="h-10 w-10 text-emerald-600" />
                            </div>
                            <div className="text-center max-w-md">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Finishing Hub Completion</h3>
                                <p className="text-sm text-slate-500 font-medium mt-2">Ironed and folded garments are ready for bundle formation and final packing.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-8 bg-slate-900 p-6 rounded-lg text-white">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">WIP Finishing Store</p>
                                    <select className="bg-transparent border-b border-slate-700 w-full py-1 text-sm focus:outline-none" value={formData.outputStorage.storedAt} onChange={(e) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, storedAt: e.target.value } })}>
                                        <option value="" className="text-slate-900">Select Bin</option>
                                        {locations.map(l => <option key={l._id} value={l._id} className="text-slate-900">{l.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bin / Pallet #</p>
                                    <Input className="bg-transparent border-t-0 border-x-0 border-b border-slate-700 rounded-none h-8 px-0 text-sm focus-visible:ring-0" placeholder="e.g. FIN-BIN-01" value={formData.outputStorage.binNumber} onChange={(e) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, binNumber: e.target.value } })} />
                                </div>
                                <div className="col-span-2 pt-4 border-t border-slate-800 mt-4 flex justify-between">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Ready for Pack</p>
                                        <p className="text-2xl font-black text-emerald-400">{formData.ironing.outputQuantity || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Total Rejects</p>
                                        <p className="text-2xl font-black text-rose-400">{formData.ironing.defects + formData.threadCutting.defects}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Bundles (20/pcs)</p>
                                        <p className="text-2xl font-black text-indigo-400">{Math.ceil(formData.ironing.outputQuantity / 20)}</p>
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
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6 font-bold uppercase text-[10px] tracking-widest text-slate-600">Cancel</Button>
                            {activeStep < 4 ? (
                                <Button type="button" onClick={() => setActiveStep(activeStep + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-50">Next Step</Button>
                            ) : (
                                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-50">
                                    {isSubmitting ? 'Finalizing...' : 'Complete Process'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Modal>
            {/* ── View Finishing Details Modal ── */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Finishing Record: ${selectedFinishing?.finishingId}`}
                maxWidth="5xl"
            >
                {selectedFinishing && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Finishing ID</p>
                                <p className="text-xs font-black text-indigo-600 uppercase">{selectedFinishing.finishingId}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</p>
                                <p className="text-xs font-bold">{format(new Date(selectedFinishing.finishingDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Supervisor</p>
                                <p className="text-xs font-bold">{selectedFinishing.supervisorId?.employeeName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedFinishing.status === 'Finished' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {selectedFinishing.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-slate-100 shadow-none bg-indigo-50/5">
                                <CardHeader className="py-2 border-b">
                                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2"><Scissors className="h-3 w-3" /> Thread Cutting</h4>
                                </CardHeader>
                                <CardContent className="py-4 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter">Input Qty</span>
                                        <span className="font-black">{selectedFinishing.threadCutting?.inputQuantity || 0} Pcs</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter text-indigo-600">Output Qty</span>
                                        <span className="font-black text-indigo-600">{selectedFinishing.threadCutting?.outputQuantity || 0} Pcs</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter text-rose-500">Defects</span>
                                        <span className="font-black text-rose-500">{selectedFinishing.threadCutting?.defects || 0} Pcs</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-100 shadow-none bg-emerald-50/5">
                                <CardHeader className="py-2 border-b">
                                    <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2"><Thermometer className="h-3 w-3" /> Ironing Process</h4>
                                </CardHeader>
                                <CardContent className="py-4 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter">Input Qty</span>
                                        <span className="font-black">{selectedFinishing.ironing?.inputQuantity || 0} Pcs</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter text-emerald-600">Output Qty</span>
                                        <span className="font-black text-emerald-600">{selectedFinishing.ironing?.outputQuantity || 0} Pcs</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter text-rose-500">Defects</span>
                                        <span className="font-black text-rose-500">{selectedFinishing.ironing?.defects || 0} Pcs</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-100 shadow-none bg-amber-50/5">
                                <CardHeader className="py-2 border-b">
                                    <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Final QC</h4>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-amber-100">
                                        {selectedFinishing.qualityCheck?.parameters?.map((p: any, i: number) => (
                                            <div key={i} className="px-3 py-2 flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase">{p.parameter}</span>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${p.status === 'Pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-amber-100 bg-amber-50/20">
                                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Overall Status</p>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${selectedFinishing.qualityCheck?.status === 'Approved' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                            {selectedFinishing.qualityCheck?.status || 'Pending'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
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
