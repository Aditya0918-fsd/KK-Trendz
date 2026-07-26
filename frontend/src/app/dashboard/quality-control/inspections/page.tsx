'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Calendar, User,
    CheckCircle2, MoreHorizontal, Activity, Layers,
    ShieldCheck, AlertTriangle, FileText, Settings,
    Trash2, Save, X, ChevronRight, ChevronDown, Download
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { Modal, FormField } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function QualityControlInspectionsPage() {
    const { loading: authLoading } = useAuth();
    const [qualityChecks, setQualityChecks] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [finishingJobs, setFinishingJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('header');
    const { showToast } = useToast();

    // Mock data for new charts
    const velocityData = [
        { day: 'Mon', checked: 1200, passed: 1150 },
        { day: 'Tue', checked: 1500, passed: 1420 },
        { day: 'Wed', checked: 1100, passed: 1080 },
        { day: 'Thu', checked: 1800, passed: 1710 },
        { day: 'Fri', checked: 1400, passed: 1350 },
        { day: 'Sat', checked: 900, passed: 880 },
    ];

    const heatmapData = [
        { name: 'Stitching', rate: 2.1 },
        { name: 'Buttoning', rate: 0.5 },
        { name: 'Measurements', rate: 3.4 },
        { name: 'Stains', rate: 1.2 },
        { name: 'Packaging', rate: 0.2 },
    ];

    // Form State
    const [formData, setFormData] = useState<any>({
        checkingId: `CHK-${format(new Date(), 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`,
        checkingDate: format(new Date(), 'yyyy-MM-dd'),
        orderId: '',
        batchNumber: '',
        shift: 'Morning',
        checkerId: '',
        supervisorId: '',
        inputBundles: [{
            finishingId: '',
            bundleNumber: '',
            quantity: 0,
            issuedFrom: ''
        }],
        checkingDetails: [{
            bundleNumber: '',
            size: '',
            color: '',
            quantity: 0,
            checked: [{
                pieceNumber: '',
                defects: []
            }],
            passed: 0,
            rejected: 0,
            rework: 0
        }],
        qualityParameters: [
            { parameter: 'Visual Check', standard: 'No stains/holes/shading', method: 'Light inspection', result: 'Pass', defects: 0 },
            {
                parameter: 'Measurement Check',
                standard: 'As per size chart',
                method: 'Measuring tape',
                result: 'Pass',
                measurements: [
                    { point: 'Chest (1" below armhole)', standard: '', tolerance: '+/- 1/2"', actual: '', result: 'Pass' },
                    { point: 'Length (HPS to bottom)', standard: '', tolerance: '+/- 1/2"', actual: '', result: 'Pass' },
                    { point: 'Shoulder (Seam to seam)', standard: '', tolerance: '+/- 1/4"', actual: '', result: 'Pass' },
                    { point: 'Sleeve Length', standard: '', tolerance: '+/- 1/4"', actual: '', result: 'Pass' },
                    { point: 'Sleeve Opening', standard: '', tolerance: '+/- 1/8"', actual: '', result: 'Pass' },
                    { point: 'Bottom Hem', standard: '', tolerance: '+/- 1/2"', actual: '', result: 'Pass' },
                ]
            },
            { parameter: 'Stitching Check', standard: 'Even density, no skipped stitches', method: 'Seam pull test', result: 'Pass', defects: 0 },
            { parameter: 'Button Check', standard: 'Securely attached & aligned', method: 'Manual pull', result: 'Pass', defects: 0 },
            { parameter: 'Label Check', standard: 'Correct content & position', method: 'Visual', result: 'Pass', defects: 0 },
            { parameter: 'Color Consistency', standard: 'Uniform shade', method: 'Visual under light', result: 'Pass', defects: 0 }
        ],
        summary: {
            totalChecked: 0,
            totalPassed: 0,
            totalRejected: 0,
            totalRework: 0,
            acceptanceRate: 0,
            rejectionRate: 0,
            aqlLevel: '1.5'
        },
        rejectionAnalysis: [],
        gradeWiseOutput: {
            'A Grade': 0,
            'B Grade': 0,
            'Rejected': 0
        },
        outputBundles: [],
        rejectedItems: {
            quantity: 0,
            storedAt: '',
            binNumber: '',
            remarks: ''
        },
        outputStorage: {
            storedAt: '',
            binNumber: '',
            storedBy: '',
            storedDate: format(new Date(), 'yyyy-MM-dd')
        },
        qualityCertificate: {
            issuedBy: '',
            issuedDate: format(new Date(), 'yyyy-MM-dd'),
            certificateNumber: `QC-${format(new Date(), 'yyyyMMdd')}-${Math.floor(100 + Math.random() * 899)}`,
            validUntil: format(new Date().setFullYear(new Date().getFullYear() + 1), 'yyyy-MM-dd')
        },
        status: 'Completed'
    });

    const fetchQualityChecks = async () => {
        try {
            const res = await api.get('/quality-control');
            let data = res.data;

            if (!data || data.length === 0) {
                // High-quality mock data for testing
                data = [
                    {
                        _id: 'mock-1',
                        checkingId: 'CHK-20240226-8921',
                        checkingDate: new Date().toISOString(),
                        orderId: { orderNumber: 'SO-2024-001' },
                        summary: { totalChecked: 500, totalPassed: 485, rejectionRate: 3.0 },
                        status: 'Completed'
                    },
                    {
                        _id: 'mock-2',
                        checkingId: 'CHK-20240225-4432',
                        checkingDate: new Date(Date.now() - 86400000).toISOString(),
                        orderId: { orderNumber: 'SO-2024-002' },
                        summary: { totalChecked: 350, totalPassed: 342, rejectionRate: 2.28 },
                        status: 'Completed'
                    },
                    {
                        _id: 'mock-3',
                        checkingId: 'CHK-20240224-1109',
                        checkingDate: new Date(Date.now() - 172800000).toISOString(),
                        orderId: { orderNumber: 'SO-2024-003' },
                        summary: { totalChecked: 620, totalPassed: 615, rejectionRate: 0.8 },
                        status: 'Completed'
                    },
                    {
                        _id: 'mock-4',
                        checkingId: 'CHK-20240223-7761',
                        checkingDate: new Date(Date.now() - 259200000).toISOString(),
                        orderId: { orderNumber: 'SO-2024-001' },
                        summary: { totalChecked: 450, totalPassed: 430, rejectionRate: 4.44 },
                        status: 'Completed'
                    }
                ];
            }

            setQualityChecks(data);
        } catch (error) {
            console.error('Error fetching QC records:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [ordRes, empRes, locRes, finRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/employees'),
                api.get('/locations'),
                api.get('/production/finishing')
            ]);

            setOrders(ordRes.data?.length > 0 ? ordRes.data : [
                { _id: 'o-1', orderNumber: 'SO-2024-001' },
                { _id: 'o-2', orderNumber: 'SO-2024-002' },
                { _id: 'o-3', orderNumber: 'SO-2024-003' }
            ]);

            setEmployees(empRes.data?.length > 0 ? empRes.data : [
                { _id: 'e-1', employeeName: 'Mohit Kumar' },
                { _id: 'e-2', employeeName: 'Sarah Jenkins' },
                { _id: 'e-3', employeeName: 'Arjun Das' }
            ]);

            setLocations(locRes.data?.length > 0 ? locRes.data : [
                { _id: 'l-1', name: 'Raw Material Store' },
                { _id: 'l-2', name: 'Inspection Bay B' },
                { _id: 'l-3', name: 'Finished Goods Bay' }
            ]);

            setFinishingJobs(finRes.data?.length > 0 ? finRes.data : [
                { _id: 'f-1', batchNumber: 'FIN-B01' },
                { _id: 'f-2', batchNumber: 'FIN-B02' }
            ]);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            // Fallbacks on error as well for testing
            setOrders([{ _id: 'o-1', orderNumber: 'SO-2024-001' }]);
            setEmployees([{ _id: 'e-1', employeeName: 'Mohit Kumar' }]);
            setLocations([{ _id: 'l-1', name: 'Raw Material Store' }]);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchQualityChecks();
        fetchDropdownData();
    }, [authLoading]);

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Calculate summary before sending
            const totalChecked = formData.checkingDetails.reduce((acc: number, item: any) => acc + item.quantity, 0);
            const totalPassed = formData.checkingDetails.reduce((acc: number, item: any) => acc + item.passed, 0);
            const totalRejected = formData.checkingDetails.reduce((acc: number, item: any) => acc + item.rejected, 0);
            const totalRework = formData.checkingDetails.reduce((acc: number, item: any) => acc + item.rework, 0);

            const summary = {
                totalChecked,
                totalPassed,
                totalRejected,
                totalRework,
                acceptanceRate: totalChecked > 0 ? (totalPassed / totalChecked) * 100 : 0,
                rejectionRate: totalChecked > 0 ? (totalRejected / totalChecked) * 100 : 0,
                aqlLevel: formData.summary.aqlLevel
            };

            const dataToSubmit = { ...formData, summary };

            await api.post('/quality-control', dataToSubmit);
            setIsAddModalOpen(false);
            showToast('Quality Control record added successfully!', 'success');
            fetchQualityChecks();
        } catch (error: any) {
            console.error('Error adding QC record:', error);
            const msg = error?.response?.data?.message || 'Failed to add Quality Control record';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addInputBundle = () => {
        setFormData({
            ...formData,
            inputBundles: [...formData.inputBundles, { finishingId: '', bundleNumber: '', quantity: 0, issuedFrom: '' }]
        });
    };

    const addCheckDetail = () => {
        setFormData({
            ...formData,
            checkingDetails: [...formData.checkingDetails, { bundleNumber: '', size: '', color: '', quantity: 0, checked: [], passed: 0, rejected: 0, rework: 0 }]
        });
    };

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Inspection Lifecycle</h2>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Audit execution, certification logs, and process velocity.</p>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6 shadow-indigo-200 dark:shadow-none shadow-lg transition-all active:scale-95"
                >
                    <Plus className="h-4 w-4 mr-2" /> New QC Audit
                </Button>
            </div>

            {/* Premium Analytics Layer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="md:col-span-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-indigo-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Inspection Velocity (PCs)</span>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div><span className="text-[8px] font-bold text-slate-400">Total Checked</span></div>
                            <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div><span className="text-[8px] font-bold text-slate-400">Passed High</span></div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[220px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={velocityData}>
                                <defs>
                                    <linearGradient id="colorChecked" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                <ChartTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} itemStyle={{ fontSize: '10px', color: '#fff' }} />
                                <Area type="monotone" dataKey="checked" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorChecked)" />
                                <Area type="monotone" dataKey="passed" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader className="pb-2 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3 text-rose-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Rejection Pareto (%)</span>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[220px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={heatmapData} layout="vertical" margin={{ left: 10 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} width={80} />
                                <ChartTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '4px', padding: '4px 8px' }} />
                                <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={14}>
                                    {heatmapData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.rate > 3 ? '#ef4444' : entry.rate > 1.5 ? '#f59e0b' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Sub-KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Audits', value: qualityChecks.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                    { label: 'Accepted Items', value: qualityChecks.reduce((acc, q) => acc + (q.summary?.totalPassed || 0), 0).toLocaleString(), icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'Avg Rejection', value: `${(qualityChecks.reduce((acc, q) => acc + (q.summary?.rejectionRate || 0), 0) / (qualityChecks.length || 1)).toFixed(2)}%`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                    { label: 'A-Grade Yield', value: '98.2%', icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="p-4 flex items-center gap-4 border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <div className={`h-11 w-11 rounded-md ${kpi.bg} flex items-center justify-center`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{kpi.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-center">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="relative flex-1 text-left">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search inspection records..." className="pl-10 h-10 text-sm border-slate-200" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center py-4">Checking ID</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Sales Order</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Checked</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Passed</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Rejection %</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="py-10 text-slate-500 font-medium">Loading entries...</TableCell></TableRow>
                            ) : qualityChecks.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="py-10 text-slate-500 font-medium">No quality control records found</TableCell></TableRow>
                            ) : (
                                qualityChecks.map(q => (
                                    <TableRow key={q._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/10 font-montserrat tracking-tight">
                                        <TableCell>
                                            <p className="text-xs font-black text-violet-600 uppercase tracking-widest">{q.checkingId}</p>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-[11px] text-slate-700 dark:text-slate-300">
                                            {format(new Date(q.checkingDate), 'dd MMM yy')}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{q.orderId?.orderNumber || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded bg-slate-100 text-[10px] font-black uppercase text-slate-700 tracking-wider">
                                                {q.summary?.totalChecked || 0} PCS
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded bg-emerald-100/50 text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                                                {q.summary?.totalPassed || 0} OK
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs font-black ${(q.summary?.rejectionRate || 0) > 2 ? 'text-rose-600' : 'text-emerald-600'} tracking-tighter uppercase`}>
                                                {q.summary?.rejectionRate?.toFixed(2) || 0}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-slate-400 hover:bg-violet-50"><MoreHorizontal className="h-4 w-4" /></Button>
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
                title="New Final QC Entry"
                className="max-w-5xl"
            >
                <div className="flex border-b mb-6 overflow-x-auto no-scrollbar">
                    {['header', 'input', 'checking', 'parameters', 'summary'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleAddRecord} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
                    {activeTab === 'header' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Checking ID">
                                    <Input disabled value={formData.checkingId} />
                                </FormField>
                                <FormField label="Checking Date">
                                    <Input type="date" value={formData.checkingDate} onChange={(e) => setFormData({ ...formData, checkingDate: e.target.value })} />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Sales Order">
                                    <select
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:bg-slate-950 dark:border-slate-800"
                                        value={formData.orderId}
                                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                                    >
                                        <option value="">Select Order</option>
                                        {orders.map(o => <option key={o._id} value={o._id}>{o.orderNumber}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Shift">
                                    <select
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:bg-slate-950 dark:border-slate-800"
                                        value={formData.shift}
                                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                    >
                                        <option value="Morning">Morning</option>
                                        <option value="Evening">Evening</option>
                                        <option value="Night">Night</option>
                                    </select>
                                </FormField>
                                <FormField label="Batch Number">
                                    <Input placeholder="Batch ID" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Checker Name">
                                    <select
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:bg-slate-950 dark:border-slate-800"
                                        value={formData.checkerId}
                                        onChange={(e) => setFormData({ ...formData, checkerId: e.target.value })}
                                    >
                                        <option value="">Select Checker</option>
                                        {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Supervisor">
                                    <select
                                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:bg-slate-950 dark:border-slate-800"
                                        value={formData.supervisorId}
                                        onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                                    >
                                        <option value="">Select Supervisor</option>
                                        {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName}</option>)}
                                    </select>
                                </FormField>
                            </div>
                        </div>
                    )}

                    {activeTab === 'input' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Input Bundles from Finishing</h3>
                                <Button type="button" size="sm" onClick={addInputBundle} variant="outline" className="h-7 text-[10px]"><Plus className="h-3 w-3 mr-1" /> Add Bundle</Button>
                            </div>
                            <div className="space-y-4">
                                {formData.inputBundles.map((bundle: any, index: number) => (
                                    <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900 border rounded-md">
                                        <FormField label="Finishing Job">
                                            <select
                                                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] dark:bg-slate-950 dark:border-slate-800"
                                                value={bundle.finishingId}
                                                onChange={(e) => {
                                                    const newBundles = [...formData.inputBundles];
                                                    newBundles[index].finishingId = e.target.value;
                                                    setFormData({ ...formData, inputBundles: newBundles });
                                                }}
                                            >
                                                <option value="">Select Finishing</option>
                                                {finishingJobs.map(f => <option key={f._id} value={f._id}>{f.batchNumber}</option>)}
                                            </select>
                                        </FormField>
                                        <FormField label="Bundle No">
                                            <Input className="h-9 text-xs" value={bundle.bundleNumber} onChange={(e) => {
                                                const newBundles = [...formData.inputBundles];
                                                newBundles[index].bundleNumber = e.target.value;
                                                setFormData({ ...formData, inputBundles: newBundles });
                                            }} />
                                        </FormField>
                                        <FormField label="Quantity">
                                            <Input className="h-9 text-xs" type="number" value={bundle.quantity} onChange={(e) => {
                                                const newBundles = [...formData.inputBundles];
                                                newBundles[index].quantity = Number(e.target.value);
                                                setFormData({ ...formData, inputBundles: newBundles });
                                            }} />
                                        </FormField>
                                        <FormField label="From Location">
                                            <select
                                                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] dark:bg-slate-950 dark:border-slate-800"
                                                value={bundle.issuedFrom}
                                                onChange={(e) => {
                                                    const newBundles = [...formData.inputBundles];
                                                    newBundles[index].issuedFrom = e.target.value;
                                                    setFormData({ ...formData, inputBundles: newBundles });
                                                }}
                                            >
                                                <option value="">Select Location</option>
                                                {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                            </select>
                                        </FormField>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'checking' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Detailed Piece Checking</h3>
                                <Button type="button" size="sm" onClick={addCheckDetail} variant="outline" className="h-7 text-[10px]"><Plus className="h-3 w-3 mr-1" /> Add Row</Button>
                            </div>
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b">
                                        <TableRow>
                                            <TableHead className="text-[10px] font-black p-2">Bundle</TableHead>
                                            <TableHead className="text-[10px] font-black p-2">Size/Color</TableHead>
                                            <TableHead className="text-[10px] font-black p-2">Qty</TableHead>
                                            <TableHead className="text-[10px] font-black p-2">Passed</TableHead>
                                            <TableHead className="text-[10px] font-black p-2 text-rose-600">Rej</TableHead>
                                            <TableHead className="text-[10px] font-black p-2 text-amber-600">Rewk</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formData.checkingDetails.map((detail: any, index: number) => (
                                            <TableRow key={index} className="border-b dark:border-slate-800">
                                                <TableCell className="p-1"><Input className="h-8 text-[10px] font-bold" value={detail.bundleNumber} onChange={(e) => {
                                                    const newDetails = [...formData.checkingDetails];
                                                    newDetails[index].bundleNumber = e.target.value;
                                                    setFormData({ ...formData, checkingDetails: newDetails });
                                                }} /></TableCell>
                                                <TableCell className="p-1">
                                                    <div className="flex gap-1">
                                                        <Input className="h-8 text-[10px]" placeholder="Size" value={detail.size} onChange={(e) => {
                                                            const newDetails = [...formData.checkingDetails];
                                                            newDetails[index].size = e.target.value;
                                                            setFormData({ ...formData, checkingDetails: newDetails });
                                                        }} />
                                                        <Input className="h-8 text-[10px]" placeholder="Color" value={detail.color} onChange={(e) => {
                                                            const newDetails = [...formData.checkingDetails];
                                                            newDetails[index].color = e.target.value;
                                                            setFormData({ ...formData, checkingDetails: newDetails });
                                                        }} />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-1"><Input type="number" className="h-8 text-[10px]" value={detail.quantity} onChange={(e) => {
                                                    const newDetails = [...formData.checkingDetails];
                                                    newDetails[index].quantity = Number(e.target.value);
                                                    setFormData({ ...formData, checkingDetails: newDetails });
                                                }} /></TableCell>
                                                <TableCell className="p-1"><Input type="number" className="h-8 text-[10px] text-emerald-600 font-bold" value={detail.passed} onChange={(e) => {
                                                    const newDetails = [...formData.checkingDetails];
                                                    newDetails[index].passed = Number(e.target.value);
                                                    setFormData({ ...formData, checkingDetails: newDetails });
                                                }} /></TableCell>
                                                <TableCell className="p-1"><Input type="number" className="h-8 text-[10px] text-rose-600 font-bold" value={detail.rejected} onChange={(e) => {
                                                    const newDetails = [...formData.checkingDetails];
                                                    newDetails[index].rejected = Number(e.target.value);
                                                    setFormData({ ...formData, checkingDetails: newDetails });
                                                }} /></TableCell>
                                                <TableCell className="p-1"><Input type="number" className="h-8 text-[10px] text-amber-600 font-bold" value={detail.rework} onChange={(e) => {
                                                    const newDetails = [...formData.checkingDetails];
                                                    newDetails[index].rework = Number(e.target.value);
                                                    setFormData({ ...formData, checkingDetails: newDetails });
                                                }} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'parameters' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Technical Quality Parameters</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {formData.qualityParameters.map((param: any, index: number) => (
                                    <div key={index} className="space-y-3">
                                        <div className="flex items-center justify-between p-3 border rounded-md dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                            <div>
                                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">{param.parameter}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{param.standard} • {param.method}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {!param.measurements && (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase mb-1 text-right">Defects</span>
                                                        <Input type="number" className="h-7 w-16 text-[10px] text-right" value={param.defects} onChange={(e) => {
                                                            const newParams = [...formData.qualityParameters];
                                                            newParams[index].defects = Number(e.target.value);
                                                            setFormData({ ...formData, qualityParameters: newParams });
                                                        }} />
                                                    </div>
                                                )}
                                                <select
                                                    className={`h-8 rounded-md border border-slate-200 px-2 text-[11px] font-black uppercase tracking-tighter ${param.result === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}
                                                    value={param.result}
                                                    onChange={(e) => {
                                                        const newParams = [...formData.qualityParameters];
                                                        newParams[index].result = e.target.value;
                                                        setFormData({ ...formData, qualityParameters: newParams });
                                                    }}
                                                >
                                                    <option value="Pass">Pass</option>
                                                    <option value="Fail">Fail</option>
                                                </select>
                                            </div>
                                        </div>

                                        {param.measurements && (
                                            <div className="ml-6 border-l-2 border-indigo-100 pl-4 space-y-2">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50">
                                                            <TableHead className="text-[9px] font-black h-8">Measurement Point</TableHead>
                                                            <TableHead className="text-[9px] font-black h-8">Spec</TableHead>
                                                            <TableHead className="text-[9px] font-black h-8">Tolerance</TableHead>
                                                            <TableHead className="text-[9px] font-black h-8">Actual</TableHead>
                                                            <TableHead className="text-[9px] font-black h-8 text-right">Result</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {param.measurements.map((m: any, mIdx: number) => (
                                                            <TableRow key={mIdx} className="h-8 border-b dark:border-slate-800">
                                                                <TableCell className="text-[10px] font-bold py-1">{m.point}</TableCell>
                                                                <TableCell className="py-1">
                                                                    <Input className="h-6 w-16 text-[10px]" value={m.standard} onChange={(e) => {
                                                                        const newParams = [...formData.qualityParameters];
                                                                        newParams[index].measurements[mIdx].standard = e.target.value;
                                                                        setFormData({ ...formData, qualityParameters: newParams });
                                                                    }} />
                                                                </TableCell>
                                                                <TableCell className="text-[10px] py-1 text-slate-400">{m.tolerance}</TableCell>
                                                                <TableCell className="py-1">
                                                                    <Input className="h-6 w-16 text-[10px] font-black" value={m.actual} onChange={(e) => {
                                                                        const newParams = [...formData.qualityParameters];
                                                                        newParams[index].measurements[mIdx].actual = e.target.value;
                                                                        setFormData({ ...formData, qualityParameters: newParams });
                                                                    }} />
                                                                </TableCell>
                                                                <TableCell className="py-1 text-right">
                                                                    <select
                                                                        className={`text-[9px] font-black ${m.result === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}
                                                                        value={m.result}
                                                                        onChange={(e) => {
                                                                            const newParams = [...formData.qualityParameters];
                                                                            newParams[index].measurements[mIdx].result = e.target.value;
                                                                            setFormData({ ...formData, qualityParameters: newParams });
                                                                        }}
                                                                    >
                                                                        <option value="Pass">P</option>
                                                                        <option value="Fail">F</option>
                                                                    </select>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'summary' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-2">Final Grading</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField label="A Grade Yield">
                                            <Input type="number" className="text-xs" value={formData.gradeWiseOutput['A Grade']} onChange={(e) => setFormData({ ...formData, gradeWiseOutput: { ...formData.gradeWiseOutput, 'A Grade': Number(e.target.value) } })} />
                                        </FormField>
                                        <FormField label="B Grade">
                                            <Input type="number" className="text-xs" value={formData.gradeWiseOutput['B Grade']} onChange={(e) => setFormData({ ...formData, gradeWiseOutput: { ...formData.gradeWiseOutput, 'B Grade': Number(e.target.value) } })} />
                                        </FormField>
                                        <FormField label="AQL Level">
                                            <select
                                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:bg-slate-950 dark:border-slate-800"
                                                value={formData.summary.aqlLevel}
                                                onChange={(e) => setFormData({ ...formData, summary: { ...formData.summary, aqlLevel: e.target.value } })}
                                            >
                                                <option value="1.0">1.0</option>
                                                <option value="1.5">1.5</option>
                                                <option value="2.5">2.5</option>
                                                <option value="4.0">4.0</option>
                                            </select>
                                        </FormField>
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-2 pt-2">Storage Allocation</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Target Location">
                                            <select
                                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:bg-slate-950 dark:border-slate-800"
                                                value={formData.outputStorage.storedAt}
                                                onChange={(e) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, storedAt: e.target.value } })}
                                            >
                                                <option value="">Select Location</option>
                                                {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                            </select>
                                        </FormField>
                                        <FormField label="Bin/Rack No">
                                            <Input value={formData.outputStorage.binNumber} onChange={(e) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, binNumber: e.target.value } })} />
                                        </FormField>
                                    </div>
                                </div>
                                <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">QC Certification</h3>
                                    </div>
                                    <FormField label="Certificate No">
                                        <Input disabled value={formData.qualityCertificate.certificateNumber} />
                                    </FormField>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Issued Date">
                                            <Input type="date" value={formData.qualityCertificate.issuedDate} onChange={(e) => setFormData({ ...formData, qualityCertificate: { ...formData.qualityCertificate, issuedDate: e.target.value } })} />
                                        </FormField>
                                        <FormField label="Valid Until">
                                            <Input type="date" value={formData.qualityCertificate.validUntil} onChange={(e) => setFormData({ ...formData, qualityCertificate: { ...formData.qualityCertificate, validUntil: e.target.value } })} />
                                        </FormField>
                                    </div>
                                    <FormField label="Authorized By">
                                        <select
                                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:bg-slate-950 dark:border-slate-800"
                                            value={formData.qualityCertificate.issuedBy}
                                            onChange={(e) => setFormData({ ...formData, qualityCertificate: { ...formData.qualityCertificate, issuedBy: e.target.value } })}
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName}</option>)}
                                        </select>
                                    </FormField>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Rejection Analysis</h3>
                                    <Button type="button" size="sm" variant="outline" className="h-6 text-[9px]" onClick={() => setFormData({ ...formData, rejectionAnalysis: [...formData.rejectionAnalysis, { defectType: '', quantity: 0, percentage: 0, cause: '', action: '', location: '' }] })}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Analysis
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {formData.rejectionAnalysis.map((item: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-6 gap-2 p-2 bg-slate-50 dark:bg-slate-900 border rounded-md items-end">
                                            <Input placeholder="Defect Type" className="h-8 text-[10px]" value={item.defectType} onChange={(e) => {
                                                const newAnalysis = [...formData.rejectionAnalysis];
                                                newAnalysis[idx].defectType = e.target.value;
                                                setFormData({ ...formData, rejectionAnalysis: newAnalysis });
                                            }} />
                                            <Input placeholder="Location" className="h-8 text-[10px]" value={item.location} onChange={(e) => {
                                                const newAnalysis = [...formData.rejectionAnalysis];
                                                newAnalysis[idx].location = e.target.value;
                                                setFormData({ ...formData, rejectionAnalysis: newAnalysis });
                                            }} />
                                            <Input type="number" placeholder="Qty" className="h-8 text-[10px]" value={item.quantity} onChange={(e) => {
                                                const newAnalysis = [...formData.rejectionAnalysis];
                                                newAnalysis[idx].quantity = Number(e.target.value);
                                                setFormData({ ...formData, rejectionAnalysis: newAnalysis });
                                            }} />
                                            <Input placeholder="Cause" className="h-8 text-[10px]" value={item.cause} onChange={(e) => {
                                                const newAnalysis = [...formData.rejectionAnalysis];
                                                newAnalysis[idx].cause = e.target.value;
                                                setFormData({ ...formData, rejectionAnalysis: newAnalysis });
                                            }} />
                                            <Input placeholder="Action" className="h-8 text-[10px]" value={item.action} onChange={(e) => {
                                                const newAnalysis = [...formData.rejectionAnalysis];
                                                newAnalysis[idx].action = e.target.value;
                                                setFormData({ ...formData, rejectionAnalysis: newAnalysis });
                                            }} />
                                            <Button type="button" variant="outline" className="h-8 w-8 p-0" title="Take Photo">
                                                <Download className="h-3 w-3 rotate-180" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2 pt-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Output Bundles (Passed)</h3>
                                    <Button type="button" size="sm" variant="outline" className="h-6 text-[9px]" onClick={() => setFormData({ ...formData, outputBundles: [...formData.outputBundles, { bundleNumber: '', size: '', color: '', quantity: 0, grade: 'A' }] })}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Bundle
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {formData.outputBundles.map((bundle: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-5 gap-2 p-2 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 rounded-md">
                                            <Input placeholder="Bundle No" className="h-8 text-[10px]" value={bundle.bundleNumber} onChange={(e) => {
                                                const newBundles = [...formData.outputBundles];
                                                newBundles[idx].bundleNumber = e.target.value;
                                                setFormData({ ...formData, outputBundles: newBundles });
                                            }} />
                                            <Input placeholder="Size" className="h-8 text-[10px]" value={bundle.size} onChange={(e) => {
                                                const newBundles = [...formData.outputBundles];
                                                newBundles[idx].size = e.target.value;
                                                setFormData({ ...formData, outputBundles: newBundles });
                                            }} />
                                            <Input placeholder="Color" className="h-8 text-[10px]" value={bundle.color} onChange={(e) => {
                                                const newBundles = [...formData.outputBundles];
                                                newBundles[idx].color = e.target.value;
                                                setFormData({ ...formData, outputBundles: newBundles });
                                            }} />
                                            <Input type="number" placeholder="Qty" className="h-8 text-[10px]" value={bundle.quantity} onChange={(e) => {
                                                const newBundles = [...formData.outputBundles];
                                                newBundles[idx].quantity = Number(e.target.value);
                                                setFormData({ ...formData, outputBundles: newBundles });
                                            }} />
                                            <select
                                                className="h-8 rounded-md border border-slate-200 px-2 text-[10px] bg-white dark:bg-slate-950"
                                                value={bundle.grade}
                                                onChange={(e) => {
                                                    const newBundles = [...formData.outputBundles];
                                                    newBundles[idx].grade = e.target.value;
                                                    setFormData({ ...formData, outputBundles: newBundles });
                                                }}
                                            >
                                                <option value="A">A Grade</option>
                                                <option value="B">B Grade</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-8 border-t dark:border-slate-800">
                        <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                            Step {activeTab === 'header' ? '1' : activeTab === 'input' ? '2' : activeTab === 'checking' ? '3' : activeTab === 'parameters' ? '4' : '5'} of 5
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            {activeTab !== 'summary' ? (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        const tabs = ['header', 'input', 'checking', 'parameters', 'summary'];
                                        const currentIndex = tabs.indexOf(activeTab);
                                        setActiveTab(tabs[currentIndex + 1]);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6"
                                >
                                    Next Section <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-8 shadow-none"
                                >
                                    {isSubmitting ? 'Certifying...' : 'Finalize & Certify'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
}
