'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Calendar, User,
    Clock, CheckCircle2, MoreHorizontal, Activity, Trash2, Scissors, Zap,
    ChevronRight, X, Eye, RefreshCw
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

import { Modal, FormField } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

const STATUS_FLOW: Record<string, string> = {
    'Draft': 'Approved',
    'Approved': 'InProgress',
    'InProgress': 'Completed',
    'Completed': 'Completed',
};

const STATUS_LABELS: Record<string, string> = {
    'Draft': 'Approve Plan',
    'Approved': 'Start Production',
    'InProgress': 'Mark Complete',
    'Completed': 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
    'Draft': 'bg-slate-100 text-slate-700',
    'Approved': 'bg-blue-100 text-blue-700',
    'InProgress': 'bg-violet-100 text-violet-700',
    'Completed': 'bg-emerald-100 text-emerald-700',
};

export default function ProductionPlanningPage() {
    const { loading: authLoading } = useAuth();
    const [plans, setPlans] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [viewPlan, setViewPlan] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { showToast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        planNumber: '',
        planningFor: format(new Date(), 'yyyy-MM-dd'),
        shift: 'Morning',
        productionSchedule: [
            {
                orderId: '',
                productId: '',
                plannedQuantity: 0,
                processes: [
                    {
                        processName: 'Cutting',
                        plannedQuantity: 0,
                        machineId: '',
                        operatorId: '',
                        startTime: format(new Date(), "yyyy-MM-dd'T'09:00"),
                        endTime: format(new Date(), "yyyy-MM-dd'T'18:00"),
                        status: 'Planned'
                    },
                    {
                        processName: 'Stitching',
                        plannedQuantity: 0,
                        plannedQuantityPerDay: 0,
                        lineId: '',
                        operatorId: '',
                        startTime: format(new Date(), "yyyy-MM-dd'T'09:00"),
                        endTime: format(new Date(), "yyyy-MM-dd'T'18:00"),
                        status: 'Planned'
                    }
                ]
            }
        ],
        status: 'Draft'
    });

    const fetchPlans = async () => {
        try {
            const res = await api.get('/production/plans');
            setPlans(res.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [ordRes, prodRes, empRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/products'),
                api.get('/employees')
            ]);
            setOrders(ordRes.data);
            setProducts(prodRes.data);
            setEmployees(empRes.data);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchPlans();
        fetchDropdownData();
    }, [authLoading]);

    const resetForm = () => {
        setFormData({
            planNumber: '',
            planningFor: format(new Date(), 'yyyy-MM-dd'),
            shift: 'Morning',
            productionSchedule: [
                {
                    orderId: '',
                    productId: '',
                    plannedQuantity: 0,
                    processes: [
                        { processName: 'Cutting', plannedQuantity: 0, machineId: '', operatorId: '', startTime: format(new Date(), "yyyy-MM-dd'T'09:00"), endTime: format(new Date(), "yyyy-MM-dd'T'18:00"), status: 'Planned' },
                        { processName: 'Stitching', plannedQuantity: 0, plannedQuantityPerDay: 0, lineId: '', operatorId: '', startTime: format(new Date(), "yyyy-MM-dd'T'09:00"), endTime: format(new Date(), "yyyy-MM-dd'T'18:00"), status: 'Planned' }
                    ]
                }
            ],
            status: 'Draft'
        });
    };

    const handleAddOrder = () => {
        setFormData({
            ...formData,
            productionSchedule: [
                ...formData.productionSchedule,
                {
                    orderId: '',
                    productId: '',
                    plannedQuantity: 0,
                    processes: [
                        { processName: 'Cutting', plannedQuantity: 0, machineId: '', operatorId: '', startTime: format(new Date(), "yyyy-MM-dd'T'09:00"), endTime: format(new Date(), "yyyy-MM-dd'T'18:00"), status: 'Planned' },
                        { processName: 'Stitching', plannedQuantity: 0, plannedQuantityPerDay: 0, lineId: '', operatorId: '', startTime: format(new Date(), "yyyy-MM-dd'T'09:00"), endTime: format(new Date(), "yyyy-MM-dd'T'18:00"), status: 'Planned' }
                    ]
                }
            ]
        });
    };

    const handleRemoveOrder = (index: number) => {
        const newSchedule = [...formData.productionSchedule];
        newSchedule.splice(index, 1);
        setFormData({ ...formData, productionSchedule: newSchedule });
    };

    const handleAddPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.planNumber.trim()) {
            showToast('Plan number is required', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/production/plans', formData);
            setIsAddModalOpen(false);
            resetForm();
            showToast('Production plan created successfully', 'success');
            fetchPlans();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to create plan', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdvanceStatus = async (plan: any) => {
        const nextStatus = STATUS_FLOW[plan.status];
        if (!nextStatus || nextStatus === plan.status) return;
        setActionLoading(plan._id);
        try {
            await api.put(`/production/plans/${plan._id}`, { status: nextStatus });
            showToast(`Plan status updated to ${nextStatus}`, 'success');
            fetchPlans();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (plan: any) => {
        if (!confirm(`Delete plan ${plan.planNumber}? This cannot be undone.`)) return;
        setActionLoading(plan._id);
        try {
            await api.delete(`/production/plans/${plan._id}`);
            showToast('Plan deleted', 'success');
            fetchPlans();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete plan', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // Filtered plans
    const filtered = plans.filter(p =>
        !search ||
        p.planNumber?.toLowerCase().includes(search.toLowerCase()) ||
        p.shift?.toLowerCase().includes(search.toLowerCase()) ||
        p.status?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/production">
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Production Plans</h1>
                        <p className="text-sm text-slate-500 font-medium">Master schedules and resource allocation across shifts</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6 shadow-none"
                >
                    <Plus className="h-4 w-4 mr-2" /> Create New Plan
                </Button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Plans', value: plans.length, icon: Calendar, bg: 'bg-blue-50', icon_color: 'text-blue-600' },
                    { label: 'Draft', value: plans.filter(p => p.status === 'Draft').length, icon: Clock, bg: 'bg-slate-50', icon_color: 'text-slate-600' },
                    { label: 'In Progress', value: plans.filter(p => p.status === 'InProgress').length, icon: Activity, bg: 'bg-violet-50', icon_color: 'text-violet-600' },
                    { label: 'Completed', value: plans.filter(p => p.status === 'Completed').length, icon: CheckCircle2, bg: 'bg-emerald-50', icon_color: 'text-emerald-600' },
                ].map((stat) => (
                    <Card key={stat.label} className="p-4 flex items-center gap-4 border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className={`h-10 w-10 min-w-[40px] rounded-md ${stat.bg} dark:bg-opacity-20 flex items-center justify-center`}>
                            <stat.icon className={`h-5 w-5 ${stat.icon_color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by plan number, shift, or status..."
                            className="pl-10 h-10 text-sm border-slate-200"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Plan #</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Planned For</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Shift</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Total Qty</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 font-medium text-center">Loading plans...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 font-medium text-center">
                                    {search ? `No plans matching "${search}"` : 'No production plans found'}
                                </TableCell></TableRow>
                            ) : (
                                filtered.map(p => (
                                    <TableRow key={p._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/30 transition-colors">
                                        <TableCell>
                                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{p.planNumber}</p>
                                        </TableCell>
                                        <TableCell className="text-left font-bold text-[11px] text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                {format(new Date(p.planningFor), 'dd MMM yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-black uppercase text-slate-600 tracking-wider">
                                                {p.shift}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-xs text-slate-800 dark:text-white">
                                            {p.productionSchedule?.reduce((acc: number, item: any) => acc + item.plannedQuantity, 0).toLocaleString()} Pcs
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'} shadow-sm`}>
                                                {p.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View */}
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => setViewPlan(p)}
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {/* Advance Status */}
                                                {p.status !== 'Completed' && (
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => handleAdvanceStatus(p)}
                                                        disabled={actionLoading === p._id}
                                                        className="h-8 px-2 text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-50 rounded-md tracking-widest"
                                                        title={STATUS_LABELS[p.status]}
                                                    >
                                                        {actionLoading === p._id ? (
                                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <><ChevronRight className="h-3 w-3 mr-0.5" />{STATUS_LABELS[p.status]}</>
                                                        )}
                                                    </Button>
                                                )}
                                                {/* Delete (only Draft) */}
                                                {p.status === 'Draft' && (
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => handleDelete(p)}
                                                        disabled={actionLoading === p._id}
                                                        className="h-8 w-8 p-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                                                        title="Delete Plan"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ── View Detail Modal ── */}
            {viewPlan && (
                <Modal isOpen={!!viewPlan} onClose={() => setViewPlan(null)} title={`Plan Details — ${viewPlan.planNumber}`} maxWidth="3xl">
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planned For</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white mt-1">{format(new Date(viewPlan.planningFor), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white mt-1">{viewPlan.shift}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${STATUS_COLORS[viewPlan.status]}`}>{viewPlan.status}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Production Schedule</p>
                            <div className="space-y-3">
                                {viewPlan.productionSchedule?.map((item: any, i: number) => (
                                    <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-xs font-black text-indigo-600">{item.orderId?.orderNumber || 'Order N/A'}</p>
                                                <p className="text-[10px] text-slate-500 font-bold">{item.productId?.productName || 'Product N/A'}</p>
                                            </div>
                                            <span className="text-sm font-black text-slate-800 dark:text-white">{item.plannedQuantity?.toLocaleString()} Pcs</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {item.processes?.map((proc: any, j: number) => (
                                                <div key={j} className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{proc.processName}</p>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{proc.plannedQuantity?.toLocaleString()} Pcs</p>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${proc.status === 'Completed' ? 'text-emerald-600' : proc.status === 'In Progress' ? 'text-amber-600' : 'text-slate-400'}`}>
                                                        {proc.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            <Button variant="outline" onClick={() => setViewPlan(null)}>Close</Button>
                            {viewPlan.status !== 'Completed' && (
                                <Button
                                    onClick={() => { handleAdvanceStatus(viewPlan); setViewPlan(null); }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest"
                                >
                                    <ChevronRight className="h-4 w-4 mr-1" />
                                    {STATUS_LABELS[viewPlan.status]}
                                </Button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Add Plan Modal ── */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Production Plan">
                <form onSubmit={handleAddPlan} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Plan Number *">
                            <Input
                                required
                                placeholder="e.g. PLAN2025001"
                                value={formData.planNumber}
                                onChange={(e) => setFormData({ ...formData, planNumber: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Planned For">
                            <Input
                                type="date"
                                required
                                value={formData.planningFor}
                                onChange={(e) => setFormData({ ...formData, planningFor: e.target.value })}
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Shift">
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                value={formData.shift}
                                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                            >
                                <option value="Morning">Morning</option>
                                <option value="Evening">Evening</option>
                                <option value="Night">Night</option>
                            </select>
                        </FormField>
                        <FormField label="Initial Status">
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Draft">Draft</option>
                                <option value="Approved">Approved</option>
                            </select>
                        </FormField>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-2">
                            <p className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">Production Schedule</p>
                            <Button type="button" size="sm" variant="outline" onClick={handleAddOrder} className="h-7 text-[10px] font-bold uppercase"><Plus className="h-3 w-3 mr-1" /> Add Order</Button>
                        </div>

                        {formData.productionSchedule.map((item, index) => (
                            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-md space-y-4 relative">
                                {formData.productionSchedule.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOrder(index)}
                                        className="absolute right-2 top-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Sales Order">
                                        <select
                                            required
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                            value={item.orderId}
                                            onChange={(e) => {
                                                const selectedOrder = orders.find(o => o._id === e.target.value);
                                                const newSchedule = [...formData.productionSchedule];
                                                newSchedule[index].orderId = e.target.value;
                                                
                                                // Auto-fill product and quantity if order has items
                                                if (selectedOrder && selectedOrder.items && selectedOrder.items.length > 0) {
                                                    const firstItem = selectedOrder.items[0];
                                                    // Note: Depending on population, productId might be an ID string or an object with _id
                                                    const prodId = typeof firstItem.productId === 'object' ? firstItem.productId._id : firstItem.productId;
                                                    newSchedule[index].productId = prodId;
                                                    newSchedule[index].plannedQuantity = firstItem.orderQuantity;
                                                    // Sync quantities to processes
                                                    newSchedule[index].processes[0].plannedQuantity = firstItem.orderQuantity;
                                                    newSchedule[index].processes[1].plannedQuantity = firstItem.orderQuantity;
                                                }
                                                
                                                setFormData({ ...formData, productionSchedule: newSchedule });
                                            }}
                                        >
                                            <option value="">Select Order</option>
                                            {orders.map(o => <option key={o._id} value={o._id}>{o.orderNumber}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Product">
                                        <select
                                            required
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                            value={item.productId}
                                            onChange={(e) => {
                                                const newSchedule = [...formData.productionSchedule];
                                                newSchedule[index].productId = e.target.value;
                                                
                                                // Update quantity if the product belongs to the order
                                                const selectedOrder = orders.find(o => o._id === newSchedule[index].orderId);
                                                if (selectedOrder) {
                                                    const item = selectedOrder.items.find((it: any) => (typeof it.productId === 'object' ? it.productId._id : it.productId) === e.target.value);
                                                    if (item) {
                                                        newSchedule[index].plannedQuantity = item.orderQuantity;
                                                        newSchedule[index].processes[0].plannedQuantity = item.orderQuantity;
                                                        newSchedule[index].processes[1].plannedQuantity = item.orderQuantity;
                                                    }
                                                }
                                                
                                                setFormData({ ...formData, productionSchedule: newSchedule });
                                            }}
                                        >
                                            <option value="">Select Product</option>
                                            {(() => {
                                                const selectedOrder = orders.find(o => o._id === item.orderId);
                                                if (selectedOrder && selectedOrder.items) {
                                                    return selectedOrder.items.map((it: any) => (
                                                        <option key={typeof it.productId === 'object' ? it.productId._id : it.productId} value={typeof it.productId === 'object' ? it.productId._id : it.productId}>
                                                            {it.productName}
                                                        </option>
                                                    ));
                                                }
                                                return products.map(p => <option key={p._id} value={p._id}>{p.productName}</option>);
                                            })()}
                                        </select>
                                    </FormField>
                                </div>
                                <FormField label="Total Planned Quantity">
                                    <Input
                                        type="number"
                                        required
                                        value={item.plannedQuantity}
                                        onChange={(e) => {
                                            const newSchedule = [...formData.productionSchedule];
                                            const val = Number(e.target.value);
                                            newSchedule[index].plannedQuantity = val;
                                            newSchedule[index].processes[0].plannedQuantity = val;
                                            newSchedule[index].processes[1].plannedQuantity = val;
                                            setFormData({ ...formData, productionSchedule: newSchedule });
                                        }}
                                    />
                                </FormField>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    {/* Cutting Plan */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-indigo-600">
                                            <Scissors className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Cutting Process</span>
                                        </div>
                                        <FormField label="Table / Machine">
                                            <Input
                                                placeholder="Table #1"
                                                value={item.processes[0].machineId}
                                                onChange={(e) => {
                                                    const newSchedule = [...formData.productionSchedule];
                                                    newSchedule[index].processes[0].machineId = e.target.value;
                                                    setFormData({ ...formData, productionSchedule: newSchedule });
                                                }}
                                            />
                                        </FormField>
                                        <FormField label="Operator">
                                            <select
                                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                                value={item.processes[0].operatorId}
                                                onChange={(e) => {
                                                    const newSchedule = [...formData.productionSchedule];
                                                    newSchedule[index].processes[0].operatorId = e.target.value;
                                                    setFormData({ ...formData, productionSchedule: newSchedule });
                                                }}
                                            >
                                                <option value="">Select Operator</option>
                                                {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName}</option>)}
                                            </select>
                                        </FormField>
                                    </div>

                                    {/* Stitching Plan */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-violet-600">
                                            <Zap className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Stitching Process</span>
                                        </div>
                                        <FormField label="Production Line">
                                            <Input
                                                placeholder="Line A"
                                                value={item.processes[1].lineId}
                                                onChange={(e) => {
                                                    const newSchedule = [...formData.productionSchedule];
                                                    newSchedule[index].processes[1].lineId = e.target.value;
                                                    setFormData({ ...formData, productionSchedule: newSchedule });
                                                }}
                                            />
                                        </FormField>
                                        <FormField label="Supervisor">
                                            <select
                                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                                value={item.processes[1].operatorId}
                                                onChange={(e) => {
                                                    const newSchedule = [...formData.productionSchedule];
                                                    newSchedule[index].processes[1].operatorId = e.target.value;
                                                    setFormData({ ...formData, productionSchedule: newSchedule });
                                                }}
                                            >
                                                <option value="">Select Supervisor</option>
                                                {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName}</option>)}
                                            </select>
                                        </FormField>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-none tracking-widest uppercase text-[11px] h-11 px-8"
                        >
                            {isSubmitting ? 'Creating Plan...' : 'Create Plan'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
