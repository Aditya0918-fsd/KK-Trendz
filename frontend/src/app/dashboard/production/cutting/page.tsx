'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Calendar, User,
    Scissors, CheckCircle2, MoreHorizontal, Activity, Layers,
    Archive, ClipboardCheck, AlertTriangle, Scale, Warehouse, Trash2, ListChecks, Eye, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

import { Modal, FormField } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function CuttingProductionPage() {
    const { loading: authLoading } = useAuth();
    const [cuttings, setCuttings] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const [activeStep, setActiveStep] = useState(1);
    const [locations, setLocations] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedCutting, setSelectedCutting] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        cuttingId: `CUT-${Date.now().toString().slice(-6)}`,
        cuttingDate: format(new Date(), 'yyyy-MM-dd'),
        orderId: '',
        batchNumber: '',
        shift: 'Morning',
        supervisorId: '',
        inputFabric: [
            {
                allocationId: '',
                fabricId: '',
                batchNumber: '',
                rollNumbers: '' as any,
                issuedQuantity: 0,
                unit: 'Kgs'
            }
        ],
        cuttingPlan: {
            markerName: '',
            markerLength: 0,
            markerWidth: 0,
            layers: 0,
            piecesPerLayer: 0,
            totalExpectedPieces: 0,
            fabricConsumptionPerPiece: 0,
            totalFabricConsumption: 0,
            efficiency: 0
        },
        productionDetails: [
            {
                size: '',
                color: '',
                plannedQuantity: 0,
                actualPieces: 0,
                bundles: [] as any[]
            }
        ],
        defects: {
            total: 0,
            reasons: [] as any[]
        },
        wastage: {
            fabric: 0,
            reason: ''
        },
        outputStorage: {
            binNumber: '',
            storedAt: ''
        },
        qualityCheck: {
            parameters: [
                { parameter: 'Measurements (Chest/Length)', result: '', status: 'Pending' },
                { parameter: 'Edge Quality (Clean Cut)', result: '', status: 'Pending' },
                { parameter: 'Notch Alignment', result: '', status: 'Pending' }
            ],
            status: 'Pending'
        },
        status: 'In Progress'
    });

    const fetchCuttings = async () => {
        try {
            const res = await api.get('/production/cutting');
            setCuttings(res.data);
        } catch (error) {
            console.error('Error fetching cutting entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        setLoading(true);
        try {
            const [ordRes, empRes, locRes, planRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/employees'),
                api.get('/locations'),
                api.get('/production/plans')
            ]);

            // Get IDs of orders that have a production plan
            const plannedOrderIds = new Set(
                planRes.data.flatMap((p: any) => (p.productionSchedule || []).map((s: any) => s.orderId?._id || s.orderId))
            );

            // Filter orders to only show those with planning
            const filteredOrders = ordRes.data.filter((o: any) => plannedOrderIds.has(o._id));

            setOrders(filteredOrders);
            setEmployees(empRes.data);
            setLocations(locRes.data);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchCuttings();
        fetchDropdownData();
    }, [authLoading]);

    const handleAddCutting = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.orderId || !formData.supervisorId) {
            showToast('Please select mandatory fields: Sales Order and Supervisor', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Clean up the payload before sending to satisfy backend ObjectId validation
            const payload = {
                ...formData,
                inputFabric: formData.inputFabric.filter(f => f.batchNumber).map(f => ({
                    ...f,
                    rollNumbers: typeof f.rollNumbers === 'string' 
                        ? (f.rollNumbers as string).split(',').map(s => s.trim()).filter(s => s !== '') 
                        : f.rollNumbers,
                    allocationId: f.allocationId || undefined,
                    fabricId: f.fabricId || undefined,
                })),
                productionDetails: formData.productionDetails.filter(d => d.size || d.color).map(d => ({
                    ...d,
                    bundles: d.bundles.length > 0 ? d.bundles : undefined
                })),
                outputStorage: formData.outputStorage.storedAt ? formData.outputStorage : undefined,
                qualityCheck: {
                    ...formData.qualityCheck,
                    parameters: formData.qualityCheck.parameters.filter(p => p.result)
                }
            };

            await api.post('/production/cutting', payload);
            setIsAddModalOpen(false);
            showToast('Cutting record added successfully!', 'success');
            fetchCuttings();

            // Reset form and steps
            setActiveStep(1);
            setFormData({
                cuttingId: `CUT-${Date.now().toString().slice(-6)}`,
                cuttingDate: format(new Date(), 'yyyy-MM-dd'),
                orderId: '',
                batchNumber: '',
                shift: 'Morning',
                supervisorId: '',
                inputFabric: [{ allocationId: '', fabricId: '', batchNumber: '', rollNumbers: '', issuedQuantity: 0, unit: 'Kgs' }],
                cuttingPlan: { markerName: '', markerLength: 0, markerWidth: 0, layers: 0, piecesPerLayer: 0, totalExpectedPieces: 0, fabricConsumptionPerPiece: 0, totalFabricConsumption: 0, efficiency: 0 },
                productionDetails: [{ size: '', color: '', plannedQuantity: 0, actualPieces: 0, bundles: [] }],
                defects: { total: 0, reasons: [] },
                wastage: { fabric: 0, reason: '' },
                outputStorage: { binNumber: '', storedAt: '' },
                qualityCheck: {
                    parameters: [
                        { parameter: 'Measurements (Chest/Length)', result: '', status: 'Pending' },
                        { parameter: 'Edge Quality (Clean Cut)', result: '', status: 'Pending' },
                        { parameter: 'Notch Alignment', result: '', status: 'Pending' }
                    ],
                    status: 'Pending'
                },
                status: 'In Progress'
            });
        } catch (error: any) {
            console.error('Error adding cutting record:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to add cutting record';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => setActiveStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setActiveStep(prev => Math.max(prev - 1, 1));

    const handleDelete = async (cutting: any) => {
        if (!confirm(`Delete cutting batch ${cutting.batchNumber}? This cannot be undone.`)) return;
        setActionLoading(cutting._id);
        try {
            await api.delete(`/production/cutting/${cutting._id}`);
            showToast('Cutting record deleted', 'success');
            fetchCuttings();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDetails = (c: any) => {
        setSelectedCutting(c);
        setIsViewModalOpen(true);
    };

    const handleToggleStatus = async (cutting: any) => {
        const nextStatus = cutting.status === 'In Progress' ? 'Completed' : 'In Progress';
        setActionLoading(cutting._id);
        try {
            await api.put(`/production/cutting/${cutting._id}`, { status: nextStatus });
            showToast(`Status updated to ${nextStatus}`, 'success');
            fetchCuttings();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = cuttings.filter(c =>
        !search ||
        c.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
        c.cuttingPlan?.markerName?.toLowerCase().includes(search.toLowerCase()) ||
        c.supervisorId?.employeeName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/production">
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight tracking-tight">Cutting Section</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Track fabric markers, layers, and bundle creation.</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6 shadow-none"
                >
                    <Plus className="h-4 w-4 mr-2" /> New Cutting Job
                </Button>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Active Jobs', value: cuttings.filter(c => c.status !== 'Completed').length, icon: Scissors, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    { label: 'Total Pieces Cut', value: cuttings.reduce((acc, c) => acc + (c.outputStorage?.totalPieces || 0), 0).toLocaleString(), icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                    { label: 'Avg Efficiency', value: cuttings.length > 0 ? `${Math.round(cuttings.reduce((acc, c) => acc + (c.cuttingPlan?.efficiency || 0), 0) / cuttings.length)}%` : '—', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="p-4 flex items-center gap-4 border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className={`h-11 w-11 rounded-md ${kpi.bg} flex items-center justify-center`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-montserrat">{kpi.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-center">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="relative flex-1 text-left">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search by batch #, marker, or supervisor..." className="pl-10 h-10 text-sm border-slate-200" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center py-4">Batch ID</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Marker Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Output Pcs</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Supervisor</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="py-10 text-slate-500 font-medium text-center">Loading entries...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="py-10 text-slate-500 font-medium text-center">{search ? `No results for "${search}"` : 'No cutting records found'}</TableCell></TableRow>
                            ) : (
                                filtered.map(c => (
                                    <TableRow key={c._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/10 font-montserrat tracking-tight">
                                        <TableCell>
                                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{c.batchNumber}</p>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-[11px] text-slate-700 dark:text-slate-300">
                                            {format(new Date(c.cuttingDate), 'dd MMM yy')}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{c.cuttingPlan?.markerName || 'N/A'}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{c.orderId?.orderNumber || 'STOCK ORDER'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded bg-violet-100 text-[10px] font-black uppercase text-violet-700 tracking-wider">
                                                {c.outputStorage?.totalPieces || 0} Pcs
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
                                                <User className="h-3 w-3 text-slate-400" /> {c.supervisorId?.employeeName || 'Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${c.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                c.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {c.status || 'Pending'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(c)} className="h-8 w-8 p-0 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="View Details">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {c.status !== 'Completed' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(c)} disabled={actionLoading === c._id} className="h-7 px-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-md">
                                                        Mark Done
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(c)} disabled={actionLoading === c._id} className="h-8 w-8 p-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full" title="Delete">
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

            {/* ── Multi-Step Cutting Job Modal ── */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Cutting Section Process: ${formData.cuttingId}`}
                maxWidth="4xl"
            >
                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {[
                        { step: 1, label: 'Fabric Issue', icon: Archive },
                        { step: 2, label: 'Marker/Spread', icon: Layers },
                        { step: 3, label: 'Bundling', icon: Archive },
                        { step: 4, label: 'QC & Wastage', icon: ClipboardCheck },
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

                <form onSubmit={handleAddCutting} className="space-y-6 min-h-[400px]">
                    {/* Step 1: Basic Info & Fabric Issue */}
                    {activeStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Cutting Date"><Input type="date" value={formData.cuttingDate} onChange={(e) => setFormData({ ...formData, cuttingDate: e.target.value })} /></FormField>
                                <FormField label="Shift">
                                    <select className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}>
                                        <option value="Morning">Morning</option><option value="Evening">Evening</option><option value="Night">Night</option>
                                    </select>
                                </FormField>
                                <FormField label="Batch/Challan #"><Input placeholder="CH-1001" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} /></FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Sales Order">
                                    <select className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.orderId} onChange={(e) => {
                                        const orderId = e.target.value;
                                        const selectedOrder = orders.find(o => o._id === orderId);
                                        if (selectedOrder) {
                                            const items = selectedOrder.items || [];
                                            const firstItem = items[0] || {};
                                            const fabricInfo = firstItem.specifications?.fabric || firstItem.productId?.productName || firstItem.productName || "";
                                            setFormData(prev => ({
                                                ...prev,
                                                orderId: orderId,
                                                batchNumber: prev.batchNumber || selectedOrder.orderNumber,
                                                inputFabric: [{
                                                    ...prev.inputFabric[0],
                                                    batchNumber: fabricInfo,
                                                    unit: 'Kgs'
                                                }],
                                                productionDetails: items.map((it: any) => ({
                                                    size: it.specifications?.size || it.size || '',
                                                    color: it.specifications?.color || it.color || '',
                                                    plannedQuantity: it.orderQuantity || 0,
                                                    actualPieces: it.orderQuantity || 0,
                                                    bundles: []
                                                })),
                                                cuttingPlan: {
                                                    ...prev.cuttingPlan,
                                                    totalExpectedPieces: items.reduce((sum: number, it: any) => sum + (it.orderQuantity || 0), 0)
                                                }
                                            }));
                                        } else {
                                            setFormData(prev => ({ ...prev, orderId }));
                                        }
                                    }}>
                                        <option value="">Select Order</option>
                                        {orders.map(o => <option key={o._id} value={o._id}>{o.orderNumber}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Cutting Supervisor">
                                    <select className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.supervisorId} onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}>
                                        <option value="">Select Supervisor</option>
                                        {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName}</option>)}
                                    </select>
                                </FormField>
                            </div>
                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-md">
                                <div className="flex items-center justify-between mb-4 border-b border-indigo-100 pb-2">
                                    <h4 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Fabric Issue from Store</h4>
                                    <span className="text-[9px] font-bold text-indigo-400 italic">Verify rolls against issue challan</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Fabric/Item">
                                        <Input placeholder="Single Jersey 160 GSM" value={formData.inputFabric[0].batchNumber} onChange={(e) => {
                                            const newFabric = [...formData.inputFabric]; newFabric[0].batchNumber = e.target.value; setFormData({ ...formData, inputFabric: newFabric });
                                        }} />
                                    </FormField>
                                    <FormField label="Roll ID(s) Separated by Comma">
                                        <Input 
                                            placeholder="R01, R05, R09" 
                                            value={formData.inputFabric[0].rollNumbers || ''}
                                            onChange={(e) => {
                                                const newFabric = [...formData.inputFabric]; 
                                                newFabric[0].rollNumbers = e.target.value; 
                                                setFormData({ ...formData, inputFabric: newFabric });
                                            }} 
                                        />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <FormField label="Issued Quantity"><Input type="number" value={formData.inputFabric[0].issuedQuantity} onChange={(e) => {
                                        const newFabric = [...formData.inputFabric]; newFabric[0].issuedQuantity = Number(e.target.value); setFormData({ ...formData, inputFabric: newFabric });
                                    }} /></FormField>
                                    <FormField label="Unit"><Input value={formData.inputFabric[0].unit} disabled /></FormField>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Marker Making & Spreading */}
                    {activeStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 rounded-md grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Marker Details</h4>
                                    <FormField label="Marker Name/ID"><Input placeholder="MRK-2024-XL" value={formData.cuttingPlan.markerName} onChange={(e) => setFormData({ ...formData, cuttingPlan: { ...formData.cuttingPlan, markerName: e.target.value } })} /></FormField>
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField label="Marker Length (m)"><Input type="number" value={formData.cuttingPlan.markerLength} onChange={(e) => setFormData({ ...formData, cuttingPlan: { ...formData.cuttingPlan, markerLength: Number(e.target.value) } })} /></FormField>
                                        <FormField label="Efficiency (%)"><Input type="number" placeholder="Aim for >90%" value={formData.cuttingPlan.efficiency} onChange={(e) => setFormData({ ...formData, cuttingPlan: { ...formData.cuttingPlan, efficiency: Number(e.target.value) } })} /></FormField>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Fabric Spreading</h4>
                                    <FormField label="Number of Layers"><Input type="number" placeholder="e.g. 100" value={formData.cuttingPlan.layers} onChange={(e) => setFormData({ ...formData, cuttingPlan: { ...formData.cuttingPlan, layers: Number(e.target.value) } })} /></FormField>
                                    <FormField label="Pieces Per Layer"><Input type="number" value={formData.cuttingPlan.piecesPerLayer} onChange={(e) => setFormData({ ...formData, cuttingPlan: { ...formData.cuttingPlan, piecesPerLayer: Number(e.target.value) } })} /></FormField>
                                </div>
                            </div>
                            <div className="p-4 bg-violet-50/50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-3 w-3 text-violet-500" />
                                    <span className="text-[10px] font-black uppercase text-violet-900 tracking-widest">Consumption Analysis</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Consumption Per Piece (m)"><Input type="number" value={formData.cuttingPlan.fabricConsumptionPerPiece} onChange={(e) => setFormData({ ...formData, cuttingPlan: { ...formData.cuttingPlan, fabricConsumptionPerPiece: Number(e.target.value) } })} /></FormField>
                                    <FormField label="Total Expected Pieces"><Input type="number" value={formData.cuttingPlan.totalExpectedPieces} onChange={(e) => setFormData({ ...formData, cuttingPlan: { ...formData.cuttingPlan, totalExpectedPieces: Number(e.target.value) } })} /></FormField>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Numbering & Bundling */}
                    {activeStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bundle tickets creation</h4>
                                <Button type="button" size="sm" variant="outline" className="h-7 text-[9px] uppercase font-black" onClick={() => {
                                    const newDetails = [...formData.productionDetails]; newDetails.push({ size: '', color: '', plannedQuantity: 0, actualPieces: 0, bundles: [] }); setFormData({ ...formData, productionDetails: newDetails });
                                }}><Plus className="h-3 w-3 mr-1" /> Add Size/Color Group</Button>
                            </div>
                            {formData.productionDetails.map((detail, idx) => (
                                <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 space-y-4 relative">
                                    {idx > 0 && <button type="button" className="absolute right-2 top-2 text-slate-300 hover:text-red-500" onClick={() => {
                                        const newDetails = [...formData.productionDetails]; newDetails.splice(idx, 1); setFormData({ ...formData, productionDetails: newDetails });
                                    }}><Trash2 className="h-4 w-4" /></button>}
                                    <div className="grid grid-cols-4 gap-4">
                                        <FormField label="Size"><Input placeholder="XL" value={detail.size} onChange={(e) => {
                                            const newDetails = [...formData.productionDetails]; newDetails[idx].size = e.target.value; setFormData({ ...formData, productionDetails: newDetails });
                                        }} /></FormField>
                                        <FormField label="Color"><Input placeholder="Navy Blue" value={detail.color} onChange={(e) => {
                                            const newDetails = [...formData.productionDetails]; newDetails[idx].color = e.target.value; setFormData({ ...formData, productionDetails: newDetails });
                                        }} /></FormField>
                                        <FormField label="Planned Qty"><Input type="number" value={detail.plannedQuantity} onChange={(e) => {
                                            const newDetails = [...formData.productionDetails]; newDetails[idx].plannedQuantity = Number(e.target.value); setFormData({ ...formData, productionDetails: newDetails });
                                        }} /></FormField>
                                        <FormField label="Actual Cut Pcs"><Input type="number" value={detail.actualPieces} onChange={(e) => {
                                            const newDetails = [...formData.productionDetails]; newDetails[idx].actualPieces = Number(e.target.value); setFormData({ ...formData, productionDetails: newDetails });
                                        }} /></FormField>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                        <Archive className="h-3 w-3" />
                                        <span>Bundles: Generate tickets (e.g., 50 per bundle) based on actual pieces</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Step 4: Quality Check & Wastage Recording */}
                    {activeStep === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Quality Inspection</h4>
                                    {formData.qualityCheck.parameters.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-md border border-slate-200 dark:border-slate-700">
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
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Wastage Recording</h4>
                                    <FormField label="Fabric Waste (Kgs)"><div className="relative"><Input type="number" step="0.01" value={formData.wastage.fabric} onChange={(e) => setFormData({ ...formData, wastage: { ...formData.wastage, fabric: Number(e.target.value) } })} /><Scale className="absolute right-3 top-3 h-4 w-4 text-slate-300" /></div></FormField>
                                    <FormField label="Reason for Waste">
                                        <select className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none" value={formData.wastage.reason} onChange={(e) => setFormData({ ...formData, wastage: { ...formData.wastage, reason: e.target.value } })}>
                                            <option value="">Select Reason</option>
                                            <option value="Marker Margin">Marker Margin</option>
                                            <option value="Edge Cutting">Edge Cutting</option>
                                            <option value="Defected Fabric">Defected Fabric</option>
                                            <option value="End Bits">End Bits</option>
                                        </select>
                                    </FormField>
                                    <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-md">
                                        <FormField label="Total Defect Pieces"><Input type="number" value={formData.defects.total} onChange={(e) => setFormData({ ...formData, defects: { ...formData.defects, total: Number(e.target.value) } })} /></FormField>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Completion Report & WIP Transfer */}
                    {activeStep === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center justify-center py-10">
                            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                                <Warehouse className="h-10 w-10 text-emerald-600" />
                            </div>
                            <div className="text-center max-w-md">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cutting Completion Report</h3>
                                <p className="text-sm text-slate-500 font-medium mt-2">All pieces will be bundled and moved to the Work In Progress (WIP) store.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-8 bg-slate-900 p-6 rounded-lg text-white">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Store Location</p>
                                    <select className="bg-transparent border-b border-slate-700 w-full py-1 text-sm focus:outline-none" value={formData.outputStorage.storedAt} onChange={(e) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, storedAt: e.target.value } })}>
                                        <option value="" className="text-slate-900">Select WIP Bin</option>
                                        {locations.map(l => <option key={l._id} value={l._id} className="text-slate-900">{l.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bin / Pallet #</p>
                                    <Input className="bg-transparent border-t-0 border-x-0 border-b border-slate-700 rounded-none h-8 px-0 text-sm focus-visible:ring-0" placeholder="e.g. BIN-42" value={formData.outputStorage.binNumber} onChange={(e) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, binNumber: e.target.value } })} />
                                </div>
                                <div className="col-span-2 pt-4 border-t border-slate-800 mt-4 flex justify-between h-auto">
                                    <div className="text-center h-auto">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Accepted Pieces</p>
                                        <p className="text-2xl font-black text-emerald-400">{formData.productionDetails.reduce((acc, curr) => acc + curr.actualPieces, 0) - formData.defects.total}</p>
                                    </div>
                                    <div className="text-center h-auto">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Total Bundles</p>
                                        <p className="text-2xl font-black text-indigo-400">{formData.productionDetails.length * 4}</p>
                                    </div>
                                    <div className="text-center h-auto">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Wastage (Kgs)</p>
                                        <p className="text-2xl font-black text-rose-400">{formData.wastage.fabric}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step Navigation Buttons */}
                    <div className="flex justify-between items-center pt-8 border-t mt-auto">
                        <Button type="button" variant="ghost" onClick={prevStep} disabled={activeStep === 1} className="font-bold uppercase text-[10px] tracking-widest">Back</Button>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="font-bold uppercase text-[10px] tracking-widest px-8">Save Draft</Button>
                            {activeStep < 5 ? (
                                <Button type="button" onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[10px] tracking-widest px-10">Next Process</Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest px-12 h-11 shadow-lg shadow-emerald-200"
                                >
                                    {isSubmitting ? 'Submitting Report...' : 'Finalize & Complete Cutting'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ── View Cutting Record Modal ── */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Cutting Record: ${selectedCutting?.batchNumber}`}
                maxWidth="4xl"
            >
                {selectedCutting && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plan/Batch</p>
                                <p className="text-xs font-black text-indigo-600 uppercase">{selectedCutting.batchNumber}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cutting Date</p>
                                <p className="text-xs font-bold">{format(new Date(selectedCutting.cuttingDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Supervisor</p>
                                <p className="text-xs font-bold">{selectedCutting.supervisorId?.employeeName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedCutting.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {selectedCutting.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-slate-100 shadow-none bg-indigo-50/5">
                                <CardHeader className="py-2 border-b">
                                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2"><Scissors className="h-3 w-3" /> Marker & Plan</h4>
                                </CardHeader>
                                <CardContent className="py-4 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter">Marker Name</span>
                                        <span className="font-black">{selectedCutting.cuttingPlan?.markerName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter">Layers</span>
                                        <span className="font-black text-slate-900 dark:text-white">{selectedCutting.cuttingPlan?.layers || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tighter">Pieces / Layer</span>
                                        <span className="font-black text-slate-900 dark:text-white">{selectedCutting.cuttingPlan?.piecesPerLayer || 0}</span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-indigo-100 flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-indigo-700">Expected Total</span>
                                        <span className="text-lg font-black text-indigo-700">{selectedCutting.cuttingPlan?.totalExpectedPieces || 0} <span className="text-[10px]">Pcs</span></span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-100 shadow-none bg-emerald-50/5">
                                <CardHeader className="py-2 border-b">
                                    <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2"><Layers className="h-3 w-3" /> Actual Output</h4>
                                </CardHeader>
                                <CardContent className="py-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-100 shadow-sm">
                                            <p className="text-[10px] font-black uppercase text-slate-400">Total Output</p>
                                            <p className="text-xl font-black text-emerald-600">{selectedCutting.outputStorage?.totalPieces || 0}</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-100 shadow-sm">
                                            <p className="text-[10px] font-black uppercase text-slate-400">Defects</p>
                                            <p className="text-xl font-black text-rose-500">{selectedCutting.outputStorage?.defects || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                        <span className="uppercase text-slate-500 tracking-widest">Efficiency</span>
                                        <span className="font-black py-0.5 px-2 bg-slate-100 rounded tracking-widest">
                                            {selectedCutting.cuttingPlan?.totalExpectedPieces ?
                                                Math.round((selectedCutting.outputStorage?.totalPieces / selectedCutting.cuttingPlan?.totalExpectedPieces) * 100) : 0}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-l-2 border-indigo-600 pl-2">Size Breakdown</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {selectedCutting.outputStorage?.sizeBreakdown?.map((s: any, idx: number) => (
                                    <div key={idx} className="p-2 border rounded-md text-center bg-white dark:bg-slate-800 shadow-sm border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">{s.size}</p>
                                        <p className="text-xs font-black text-indigo-600">{s.quantity} <span className="text-[8px]">Pcs</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={() => setIsViewModalOpen(false)} className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest px-8">Close Overview</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
