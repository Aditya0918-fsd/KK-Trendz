'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Truck, Plus, Search, MapPin,
    Calendar, Ship, MoreHorizontal,
    TrendingUp, Activity, Timer, CheckCircle,
    BarChart3, FileText, QrCode, ShieldCheck, ClipboardList,
    Clock, Gauge, BadgeCheck, ArrowRight, User, Phone, Trash2,
    PackageCheck, Container, Landmark, Mail, MessageSquare,
    Eye, Edit3, CheckCircle2, AlertCircle, Upload
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Modal, FormField } from '@/components/ui/Modal';
import { Select, SelectSm } from '@/components/ui/Select';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';


export default function DispatchPage() {
    const { loading: authLoading } = useAuth();
    const [dispatches, setDispatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedDispatch, setSelectedDispatch] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('planning');
    const [updateTab, setUpdateTab] = useState('transit');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    // Dropdowns
    const [orders, setOrders] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [parties, setParties] = useState<any[]>([]);

    const [formData, setFormData] = useState<any>({
        dispatchId: `DSP-${format(new Date(), 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`,
        dispatchDate: format(new Date(), 'yyyy-MM-dd'),
        orderId: '',
        packingId: '',
        dispatchType: 'Road',
        priority: 'Normal',
        customerId: '',
        shippingAddress: { address1: '', city: '', state: '', zipCode: '' },
        transporter: {
            name: '', transporterId: '', vehicleNumber: '', vehicleType: 'Truck',
            driverName: '', driverLicense: '', driverPhone: '', vehicleCondition: 'Good'
        },
        execution: { arrivalTime: '', departureTime: '', odometerStart: 0, gatePassNumber: '', loadingSupervisor: '' },
        documents: { lrNumber: '', eWayBillNumber: '', challanNumber: `DC-${format(new Date(), 'yyMM')}-${Math.floor(1000 + Math.random() * 9000)}`, challanDate: format(new Date(), 'yyyy-MM-dd') },
        status: 'Dispatched'
    });

    useEffect(() => {
        if (authLoading) return;
        fetchData();
        fetchDropdowns();
    }, [authLoading]);

    const fetchData = async () => {
        try {
            const res = await api.get('/dispatch');
            setDispatches(res.data || []);
        } catch (error) {
            console.error('Error fetching dispatch:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [ordRes, empRes, partyRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/employees'),
                api.get('/parties')
            ]);
            setOrders(ordRes.data || []);
            setEmployees(empRes.data || []);
            setParties(partyRes.data || []);
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    };

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDATION
        const errors = [];
        if (!formData.orderId) errors.push("Sales Order is required");
        if (!formData.transporter.transporterId) errors.push("Carrier / Transporter is required");

        // Step-specific validation based on flow (assuming basic fields are required for initial creation)
        if (activeTab === 'execution' && !formData.execution.loadingSupervisor) {
            errors.push("Loading Supervisor is required for execution");
        }

        if (errors.length > 0) {
            showToast("REQUIRED FIELDS MISSING:\n\n• " + errors.join("\n• "), 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Helper: Mongoose rejects empty strings for ObjectId fields → send undefined instead
            const orUndefined = (val: string) => val && val.trim() !== '' ? val : undefined;

            const dataToSubmit = {
                ...formData,
                orderId: orUndefined(formData.orderId),
                customerId: orUndefined(formData.customerId),
                transporter: {
                    ...formData.transporter,
                    transporterId: orUndefined(formData.transporter.transporterId)
                },
                execution: {
                    ...formData.execution,
                    loadingSupervisor: orUndefined(formData.execution.loadingSupervisor)
                }
            };

            await api.post('/dispatch', dataToSubmit);
            setIsAddModalOpen(false);
            showToast('Dispatch record saved successfully', 'success');
            fetchData();
        } catch (error: any) {
            console.error('Error saving dispatch:', error);
            const msg = error?.response?.data?.message || 'Failed to save dispatch';
            showToast(`Error: ${msg}`, 'error');
        } finally {
            setIsSubmitting(false);

        }
    };

    const handleUpdateStatus = async (dispatchId: string, newStatus: string, extraData = {}) => {
        try {
            await api.patch(`/dispatch/${dispatchId}`, { status: newStatus, ...extraData });
            showToast(`Status updated to ${newStatus}`, 'success');
            fetchData();
            if (selectedDispatch?._id === dispatchId) {
                setSelectedDispatch((prev: any) => ({ ...prev, status: newStatus, ...extraData }));
            }
        } catch (error: any) {
            console.error('Error updating status:', error);
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    const openUpdateModal = (dispatch: any) => {
        setSelectedDispatch(dispatch);
        setIsUpdateModalOpen(true);
        setUpdateTab('transit');
    };

    const simulateNotification = (type: string) => {
        showToast(`Simulating ${type} notification to customer: ${selectedDispatch?.customerId?.partyName || 'Customer'}`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight font-montserrat">Dispatch <span className="text-emerald-600 dark:text-emerald-400">Control</span></h2>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Lifecycle management from booking to final delivery confirmation.</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6 shadow-emerald-200 dark:shadow-none shadow-lg transition-all active:scale-95 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" /> Start New Dispatch
                </Button>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'In Transit', value: dispatches.filter(d => d.status === 'In Transit').length, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                    { label: 'Delivered (MTD)', value: dispatches.filter(d => d.status === 'Delivered').length, icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Pending POD', value: dispatches.filter(d => d.status === 'Delivered' && !d.pod?.signature).length, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Avg Transit', value: '1.2 Days', icon: Timer, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="p-4 flex items-center gap-4 border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-slate-900/50">
                        <div className={`h-11 w-11 rounded-md ${kpi.bg} flex items-center justify-center`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-montserrat">{kpi.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Table */}
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 pb-4 flex flex-row items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search manifests or carriers..." className="pl-10 h-10 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black uppercase tracking-widest text-[10px]" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Status & Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Customer / Destination</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Transporter / Vehicle</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Docs & EWB</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="py-10 text-center animate-pulse font-bold text-slate-400">Loading Logistics Intel...</TableCell></TableRow>
                            ) : dispatches.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="py-10 text-center font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">No Dispatch Activity Recorded</TableCell></TableRow>
                            ) : (
                                dispatches.map(dispatch => (
                                    <TableRow key={dispatch._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/10 cursor-pointer" onClick={() => openUpdateModal(dispatch)}>
                                        <TableCell>
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border mb-1 ${dispatch.status === 'Delivered' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' :
                                                    dispatch.status === 'In Transit' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' :
                                                        'border-slate-300 text-slate-500 bg-slate-50'
                                                    } uppercase tracking-tighter`}>
                                                    {dispatch.status}
                                                </span>
                                                <p className="text-[9px] font-black text-slate-400">{format(new Date(dispatch.dispatchDate), 'dd MMM yy')}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                            <div className="flex flex-col">
                                                <span>{dispatch.customerId?.partyName || 'N/A'}</span>
                                                <span className="text-[9px] text-slate-400 font-normal">{dispatch.shippingAddress?.city}, {dispatch.shippingAddress?.state}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800"><Truck className="h-3 w-3 text-slate-500" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{dispatch.transporter?.name}</span>
                                                    <span className="text-[9px] text-indigo-600 font-bold">{dispatch.transporter?.vehicleNumber}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">LR: {dispatch.documents?.lrNumber || 'PEND'}</span>
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase">EWB: {dispatch.documents?.eWayBillNumber ? 'OK' : 'MISSING'}</span>
                                                </div>
                                                <span className="text-[9px] text-slate-400">Inv: {dispatch.documents?.invoiceNumber || 'Not Gen'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-slate-400 hover:bg-emerald-50"><Edit3 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal for New Dispatch (Steps 1-7 Planning & Initiation) */}
            <Modal
                title="Initialize Dispatch Workflow"
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                className="max-w-5xl"
            >
                <div className="flex border-b dark:border-slate-700 mb-6 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'planning', label: '1. PLANNING', icon: ClipboardList },
                        { id: 'execution', label: '2. EXECUTION', icon: Truck },
                        { id: 'documentation', label: '3. DOCUMENTATION', icon: FileText },
                        { id: 'completion', label: '4. SYSTEM UPDATE', icon: CheckCircle2 }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-b-2 border-emerald-600 text-emerald-600 bg-emerald-50/30 dark:bg-emerald-500/10'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleAddRecord} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                    {activeTab === 'planning' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-2 flex items-center gap-2"><Search className="h-3 w-3" /> Step 1-2: Order Selection</h3>
                                    <FormField label="Select Sales Order">
                                        <Select
                                            value={formData.orderId}
                                            onChange={(val) => {
                                                const order = orders.find((o: any) => o._id === val);
                                                setFormData({ ...formData, orderId: val, customerId: order?.customerId?._id || '', shippingAddress: order?.shippingAddress || formData.shippingAddress });
                                            }}
                                            placeholder="Search Ready Orders"
                                            options={orders.map((o: any) => ({ value: o._id, label: `${o.orderNumber} - ${o.customerId?.partyName}` }))}
                                        />
                                    </FormField>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Mode">
                                            <Select
                                                value={formData.dispatchType}
                                                onChange={(val) => setFormData({ ...formData, dispatchType: val })}
                                                options={[
                                                    { value: 'Road', label: 'Road' },
                                                    { value: 'Air', label: 'Air' },
                                                    { value: 'Sea', label: 'Sea' },
                                                    { value: 'Rail', label: 'Rail' },
                                                ]}
                                            />
                                        </FormField>
                                        <FormField label="Priority">
                                            <Select
                                                value={formData.priority}
                                                onChange={(val) => setFormData({ ...formData, priority: val })}
                                                options={[
                                                    { value: 'Normal', label: 'Normal' },
                                                    { value: 'Express', label: 'Express' },
                                                ]}
                                            />
                                        </FormField>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-2 flex items-center gap-2"><Container className="h-3 w-3" /> Step 3-4: Transporter Booking</h3>
                                    <FormField label="Select Carrier">
                                        <Select
                                            value={formData.transporter.transporterId}
                                            onChange={(val) => {
                                                const party = parties.find((p: any) => p._id === val);
                                                setFormData({ ...formData, transporter: { ...formData.transporter, transporterId: val, name: party?.partyName || '' } });
                                            }}
                                            placeholder="Assign Transporter"
                                            options={parties.filter((p: any) => p.partyType === 'Transporter' || p.partyType === 'Both').map((p: any) => ({ value: p._id, label: p.partyName }))}
                                        />
                                    </FormField>
                                    <FormField label="Vehicle Number"><Input placeholder="Enter vehicle number" value={formData.transporter.vehicleNumber} onChange={(e) => setFormData({ ...formData, transporter: { ...formData.transporter, vehicleNumber: e.target.value } })} /></FormField>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'execution' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-2">Vehicle Arrival (Step 1-2)</h3>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700">
                                        <FormField label="Arrival Time"><Input type="datetime-local" value={formData.execution.arrivalTime} onChange={(e) => setFormData({ ...formData, execution: { ...formData.execution, arrivalTime: e.target.value } })} /></FormField>
                                        <FormField label="Driver Contact"><Input placeholder="Phone Number" value={formData.transporter.driverPhone} onChange={(e) => setFormData({ ...formData, transporter: { ...formData.transporter, driverPhone: e.target.value } })} /></FormField>
                                        <FormField label="Vehicle Condition">
                                            <Select
                                                value={formData.transporter.vehicleCondition}
                                                onChange={(val) => setFormData({ ...formData, transporter: { ...formData.transporter, vehicleCondition: val } })}
                                                options={[
                                                    { value: 'Good', label: 'Good/Clean' },
                                                    { value: 'Rejected', label: 'Rejected' },
                                                ]}
                                            />
                                        </FormField>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-2">Loading Preparation (Step 3)</h3>
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex flex-col gap-3">
                                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase">Cartons verified in FG Store</p>
                                        <label className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/30 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                                            <input type="checkbox" className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" />
                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">All Cartons Staged at Loading Bay</span>
                                        </label>
                                        <FormField label="Loading Supervisor">
                                            <Select
                                                value={formData.execution.loadingSupervisor}
                                                onChange={(val) => setFormData({ ...formData, execution: { ...formData.execution, loadingSupervisor: val } })}
                                                placeholder="Select Supervisor"
                                                options={employees.map((emp: any) => ({ value: emp._id, label: emp.employeeName }))}
                                            />
                                        </FormField>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documentation' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-2">Step 4: Doc Generation</h3>
                                    <FormField label="Challan Number"><Input value={formData.documents.challanNumber} disabled /></FormField>
                                    <FormField label="E-Way Bill Number"><Input placeholder="12 Digit No." value={formData.documents.eWayBillNumber} onChange={(e) => setFormData({ ...formData, documents: { ...formData.documents, eWayBillNumber: e.target.value } })} /></FormField>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-2">Transporter LR</h3>
                                    <FormField label="LR / Bilty Number"><Input placeholder="LR000000" value={formData.documents.lrNumber} onChange={(e) => setFormData({ ...formData, documents: { ...formData.documents, lrNumber: e.target.value } })} /></FormField>
                                    <FormField label="LR Date"><Input type="date" value={formData.documents.lrDate} onChange={(e) => setFormData({ ...formData, documents: { ...formData.documents, lrDate: e.target.value } })} /></FormField>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'completion' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-6 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic">Step 7: Final System Update</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Verify all details before clicking "Complete Dispatch"</p>
                                    </div>
                                    <BadgeCheck className="h-12 w-12 text-emerald-400" />
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Vehicle Logs</p>
                                        <FormField label="Departure Odo"><Input className="bg-slate-800 border-slate-700 text-white font-black" type="number" value={formData.execution.odometerStart} onChange={(e) => setFormData({ ...formData, execution: { ...formData.execution, odometerStart: Number(e.target.value) } })} /></FormField>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Gate Intel</p>
                                        <FormField label="Gate Pass #"><Input className="bg-slate-800 border-slate-700 text-white font-black" value={formData.execution.gatePassNumber} onChange={(e) => setFormData({ ...formData, execution: { ...formData.execution, gatePassNumber: e.target.value } })} /></FormField>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Dispatch Timestamp</p>
                                        <Input type="datetime-local" className="bg-slate-800 border-slate-700 text-white h-10" value={formData.execution.departureTime} onChange={(e) => setFormData({ ...formData, execution: { ...formData.execution, departureTime: e.target.value } })} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="ghost" className="text-white hover:bg-white/10 uppercase text-[10px] font-black" onClick={() => setIsAddModalOpen(false)}>Back Revision</Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 h-12 font-black uppercase text-[12px] tracking-widest shadow-xl flex items-center gap-2">
                                        {isSubmitting ? 'Syncing...' : 'Complete Dispatch'} <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            {/* Lifecycle Update Modal (Steps 8-9 & 7.3 Delivery) */}
            <Modal
                title={`Lifecycle Tracking: ${selectedDispatch?.dispatchId}`}
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                className="max-w-4xl"
            >
                <div className="flex border-b dark:border-slate-700 mb-6 bg-slate-50/50 dark:bg-slate-800/30 p-1 rounded-t-lg">
                    {[
                        { id: 'transit', label: 'In Transit', icon: Truck },
                        { id: 'delivery', label: 'Delivery & POD', icon: PackageCheck },
                        { id: 'invoicing', label: 'Invoice & Payment', icon: Landmark }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setUpdateTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${updateTab === tab.id
                                ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 shadow-sm rounded-md'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon className={`h-4 w-4 ${updateTab === tab.id ? 'text-emerald-500' : ''}`} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-8 animate-in fade-in duration-300">
                    {updateTab === 'transit' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2 italic"><BadgeCheck className="h-4 w-4 text-emerald-500" /> Step 8: Customer Notification</h3>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">Broadcast dispatch data via Email/SMS to inform client of inbound stock.</p>
                                        <div className="flex gap-2">
                                            <Button onClick={() => simulateNotification('Email')} size="sm" variant="outline" className="flex-1 text-[10px] font-black uppercase gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"><Mail className="h-3 w-3" /> Send Email</Button>
                                            <Button onClick={() => simulateNotification('SMS')} size="sm" variant="outline" className="flex-1 text-[10px] font-black uppercase gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"><MessageSquare className="h-3 w-3" /> Send SMS</Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2 italic"><Gauge className="h-4 w-4 text-slate-400" /> Step 9: Tracking & Transit</h3>
                                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase">Transit Integrity Status</p>
                                            <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse">{selectedDispatch?.status}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Tracking Details</p>
                                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-200 dark:border-indigo-500/30 flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-slate-800 uppercase">Est. Delivery: {format(new Date(Date.now() + 86400000 * 2), 'dd MMM yyyy')}</span>
                                                <span className="text-[9px] text-slate-400">Driver Phone: {selectedDispatch?.transporter?.driverPhone || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] h-10 shadow-lg shadow-indigo-200" onClick={() => handleUpdateStatus(selectedDispatch._id, 'In Transit')}>Set to "In Transit"</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {updateTab === 'delivery' && (
                        <div className="space-y-6">
                            <div className="bg-emerald-600 rounded-2xl p-6 text-white flex items-center justify-between shadow-xl">
                                <div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tight">Step 7.3: Proof of Delivery (POD)</h3>
                                    <p className="text-[10px] font-bold text-emerald-100 uppercase mt-1">Capture final receipt confirmation from the customer.</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-full"><PackageCheck className="h-8 w-8 text-white" /></div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <Card className="p-4 border-slate-200 space-y-4">
                                    <p className="text-[10px] font-black uppercase text-slate-500 border-b pb-2 italic">1. Verification Check</p>
                                    <ul className="space-y-2">
                                        {['Carton Count Matches', 'Visual Condition Check', 'Seals Intact'].map(item => (
                                            <li key={item} className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded bg-emerald-50 flex items-center justify-center border border-emerald-200"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /></div>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>

                                <Card className="p-4 border-slate-200 space-y-4 col-span-2">
                                    <p className="text-[10px] font-black uppercase text-slate-500 border-b pb-2 italic">2. Collect POD (Proof of Delivery)</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Received By"><Input placeholder="Person Name" defaultValue={selectedDispatch?.pod?.receivedBy} /></FormField>
                                        <FormField label="Received Date"><Input type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} /></FormField>
                                        <div className="col-span-2 flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50 flex-1">
                                                <input type="checkbox" className="rounded" /> <span className="text-[9px] font-black uppercase">Shortages Noted</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50 flex-1">
                                                <input type="checkbox" className="rounded" /> <span className="text-[9px] font-black uppercase">Company Stamp Applied</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-emerald-400 transition-colors cursor-pointer group">
                                        <Upload className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Upload Scanned signed Challan / POD</span>
                                        <span className="text-[8px] text-slate-400">PDF, JPG or PNG (Max 5MB)</span>
                                    </div>
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs h-12 shadow-xl shadow-emerald-100" onClick={() => handleUpdateStatus(selectedDispatch._id, 'Delivered', { deliveryDate: new Date().toISOString() })}>Confirm Final Delivery</Button>
                                </Card>
                            </div>
                        </div>
                    )}

                    {updateTab === 'invoicing' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2 italic"><FileText className="h-4 w-4 text-indigo-500" /> Payment & Invoice Follow-up</h3>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Invoice Status</span>
                                            <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[9px] px-2 py-0.5 rounded-full font-black">SENT - PENDING PAYMENT</span>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2">
                                            <div className="flex justify-between text-[11px] font-bold"><span className="text-slate-500 uppercase">Payment Due</span> <span className="text-red-600 uppercase">15 Days Remaining</span></div>
                                            <div className="flex justify-between text-[11px] font-bold"><span className="text-slate-500 uppercase">Due Date</span> <span className="text-slate-700">{format(new Date(Date.now() + 86400000 * 15), 'dd MMM yyyy')}</span></div>
                                        </div>
                                        <Button variant="outline" className="text-[10px] font-black uppercase border-indigo-200 text-indigo-600">Send Payment Reminder</Button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2 italic"><AlertCircle className="h-4 w-4 text-amber-500" /> Exceptions & Issues</h3>
                                    <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-500/20 flex flex-col gap-3">
                                        <p className="text-[10px] font-black text-amber-700 uppercase">Incident Logging</p>
                                        <p className="text-[9px] text-amber-600 leading-tight">Log any discrepancies, damages, or shortages reported by customer during delivery for reconciliation.</p>
                                        <Button size="sm" variant="ghost" className="text-[9px] font-black uppercase text-amber-800 hover:bg-white/50 w-fit self-end">View Exception Log</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
