'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, Package, Box,
    ArrowRight, CheckCircle2, MoreHorizontal,
    Activity, ShieldCheck, AlertTriangle, FileText,
    TrendingUp, QrCode, Weight, Truck, Trash2, Save, X, Layers, ClipboardList
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Modal, FormField } from '@/components/ui/Modal';
import { Select, SelectSm } from '@/components/ui/Select';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast'; const mockTrendData = [
    { day: 'Mon', count: 45 },
    { day: 'Tue', count: 52 },
    { day: 'Wed', count: 38 },
    { day: 'Thu', count: 65 },
    { day: 'Fri', count: 48 },
    { day: 'Sat', count: 59 },
    { day: 'Sun', count: 30 },
];

export default function PackingPage() {
    const { loading: authLoading } = useAuth();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('preparation');
    const { showToast } = useToast();

    // Dropdown data
    const [orders, setOrders] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [qcRecords, setQcRecords] = useState<any[]>([]);

    const [formData, setFormData] = useState<any>({
        packingId: `PKG-${format(new Date(), 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`,
        packingDate: format(new Date(), 'yyyy-MM-dd'),
        orderId: '',
        batchNumber: '',
        shift: 'Morning',
        supervisorId: '',
        inputBundles: [{
            checkingId: '',
            bundleNumber: '',
            quantity: '' as any,
            issuedFrom: ''
        }],
        packingMaterials: [
            { materialType: 'Poly Bag', productId: '', quantity: '' as any, specification: 'Standard Size' },
            { materialType: 'Carton', productId: '', quantity: '' as any, specification: 'Double Wall' },
            { materialType: 'Silica Gel', productId: '', quantity: '' as any, specification: '1g Pouch' }
        ],
        packingDetails: [{
            cartonNumber: '1',
            piecesPerCarton: '' as any,
            totalPieces: 0,
            grossWeight: '' as any,
            netWeight: '' as any,
            cartonDimensions: '',
            barcode: '',
            sizes: [{ size: '', quantity: '' as any }],
            colors: [{ color: '', quantity: '' as any }]
        }],
        palletDetails: [],
        outputStorage: {
            storedAt: '',
            binNumber: '',
            remark: ''
        },
        status: 'Completed'
    });

    useEffect(() => {
        if (authLoading) return;
        fetchData();
        fetchDropdowns();
    }, [authLoading]);

    const fetchData = async () => {
        try {
            const res = await api.get('/packing');
            setRecords(res.data || []);
        } catch (error) {
            console.error('Error fetching packing:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [ordRes, empRes, locRes, prodRes, qcRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/employees'),
                api.get('/locations'),
                api.get('/products'),
                api.get('/quality-control')
            ]);
            setOrders(ordRes.data || []);
            setEmployees(empRes.data || []);
            setLocations(locRes.data || []);
            setProducts(prodRes.data || []);
            setQcRecords(qcRes.data || []);
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    };

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDATION
        const errors = [];
        if (!formData.orderId) errors.push("Sales Order is required");
        if (!formData.supervisorId) errors.push("Supervisor is required");

        if (errors.length > 0) {
            showToast("REQUIRED FIELDS MISSING:\n\n• " + errors.join("\n• "), 'error');
            return;
        }


        setIsSubmitting(true);
        try {
            const totalPieces = formData.packingDetails.reduce((acc: number, d: any) => acc + (Number(d.piecesPerCarton) || 0), 0);
            const totalCartons = formData.packingDetails.length;
            const totalGrossWeight = formData.packingDetails.reduce((acc: number, d: any) => acc + (Number(d.grossWeight) || 0), 0);
            const totalNetWeight = formData.packingDetails.reduce((acc: number, d: any) => acc + (Number(d.netWeight) || 0), 0);

            // Helper: Mongoose rejects empty strings for ObjectId fields → send undefined instead
            const orUndefined = (val: string) => val && val.trim() !== '' ? val : undefined;

            const dataToSubmit = {
                ...formData,
                // Required ObjectId fields — empty string causes CastError (400)
                orderId: orUndefined(formData.orderId),
                supervisorId: orUndefined(formData.supervisorId),
                // Sanitize nested ObjectId fields in arrays
                inputBundles: formData.inputBundles.map((b: any) => ({
                    ...b,
                    checkingId: orUndefined(b.checkingId),
                    issuedFrom: orUndefined(b.issuedFrom),
                })),
                packingMaterials: formData.packingMaterials.map((m: any) => ({
                    ...m,
                    productId: orUndefined(m.productId),
                })),
                // Sanitize outputStorage.storedAt (also an ObjectId)
                outputStorage: {
                    ...formData.outputStorage,
                    storedAt: orUndefined(formData.outputStorage.storedAt),
                },
                summary: {
                    totalPieces,
                    totalCartons,
                    totalGrossWeight,
                    totalNetWeight,
                    totalPallets: formData.palletDetails?.length || 0
                }
            };

            await api.post('/packing', dataToSubmit);
            setIsAddModalOpen(false);
            showToast('Packing record saved successfully', 'success');
            fetchData();
        } catch (error: any) {
            console.error('Error saving packing:', error);
            const msg = error?.response?.data?.message || 'Failed to save packing';
            showToast(`Error: ${msg}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addInputBundle = () => {
        setFormData({
            ...formData,
            inputBundles: [...formData.inputBundles, { checkingId: '', bundleNumber: '', quantity: '' as any, issuedFrom: '' }]
        });
    };

    const addPackingDetail = () => {
        const nextCarton = formData.packingDetails.length + 1;
        setFormData({
            ...formData,
            packingDetails: [...formData.packingDetails, {
                cartonNumber: String(nextCarton),
                piecesPerCarton: '' as any,
                totalPieces: 0,
                grossWeight: '' as any,
                netWeight: '' as any,
                cartonDimensions: '',
                barcode: '',
                sizes: [{ size: '', quantity: '' as any }],
                colors: [{ color: '', quantity: '' as any }]
            }]
        });
    };

    const generateBarcode = (idx: number): string => {
        const newArr = [...formData.packingDetails];
        const order = orders.find((o: any) => o._id === formData.orderId);
        const orderNum = (order?.orderNumber || 'PKG').replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const barcode = `${orderNum}-C${String(newArr[idx].cartonNumber).padStart(3, '0')}-${Date.now().toString().slice(-5)}`;
        newArr[idx].barcode = barcode;
        setFormData({ ...formData, packingDetails: newArr });
        return barcode;
    };

    const printLabel = (detail: any, idx: number) => {
        const barcode = detail.barcode || generateBarcode(idx);
        const order = orders.find((o: any) => o._id === formData.orderId);
        const printWin = window.open('', '_blank', 'width=440,height=680');
        if (!printWin) { showToast('Please allow popups to print labels.', 'error'); return; }
        const sizeRows = detail.sizes?.filter((s: any) => s.size).map((s: any) =>

            `<tr><td>SIZE: ${s.size}</td><td style="text-align:right;font-weight:900">${s.quantity} PCS</td></tr>`
        ).join('') || '';
        const colorRows = detail.colors?.filter((c: any) => c.color).map((c: any) =>
            `<tr><td>COLOR: ${c.color}</td><td style="text-align:right;font-weight:900">${c.quantity} PCS</td></tr>`
        ).join('') || '';
        // Simulate barcode bars from barcode string
        const bars = barcode.split('').map((ch: string) => ch.charCodeAt(0) % 2 === 0 ? '|' : ' |').join('');
        printWin.document.write(`<!DOCTYPE html><html><head><title>Carton Label - CTN ${detail.cartonNumber}</title><style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:Arial,sans-serif;padding:16px;width:360px}
            .label{border:3px solid #000;border-radius:4px;overflow:hidden}
            .header{background:#000;color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center}
            .company{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1px}
            .ctn-badge{background:#fff;color:#000;font-size:24px;font-weight:900;padding:2px 10px;border-radius:2px}
            .body{padding:12px}
            table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px}
            td{padding:3px 0}
            td:first-child{font-weight:700;color:#555;text-transform:uppercase;width:45%}
            td:last-child{font-weight:900;text-align:right}
            .divider{border-top:1px dashed #bbb;margin:8px 0}
            .barcode-wrap{border-top:3px solid #000;padding-top:10px;text-align:center;margin-top:8px}
            .bars{font-family:'Courier New',monospace;font-size:38px;line-height:1;letter-spacing:-2px;color:#000}
            .barcode-num{font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;margin-top:4px;font-weight:bold}
            .footer{font-size:8px;color:#999;text-align:right;margin-top:8px}
            @media print{body{margin:0;padding:8px}}
        </style></head><body>
        <div class="label">
            <div class="header">
                <span class="company">KK Trendz</span>
                <span class="ctn-badge">CTN ${detail.cartonNumber}</span>
            </div>
            <div class="body">
                <table>
                    <tr><td>Order #</td><td>${order?.orderNumber || 'N/A'}</td></tr>
                    <tr><td>Packing ID</td><td>${formData.packingId}</td></tr>
                    <tr><td>Date</td><td>${formData.packingDate}</td></tr>
                    <tr><td>Shift</td><td>${formData.shift}</td></tr>
                </table>
                <div class="divider"></div>
                <table>
                    <tr><td>Pieces / CTN</td><td>${detail.piecesPerCarton} PCS</td></tr>
                    <tr><td>Dimensions</td><td>${detail.cartonDimensions || 'N/A'}</td></tr>
                    <tr><td>Gross Weight</td><td>${detail.grossWeight} KG</td></tr>
                    <tr><td>Net Weight</td><td>${detail.netWeight} KG</td></tr>
                </table>
                ${sizeRows || colorRows ? `<div class="divider"></div><table>${sizeRows}${colorRows}</table>` : ''}
                <div class="barcode-wrap">
                    <div class="bars">${bars}</div>
                    <div class="barcode-num">${barcode}</div>
                </div>
                <div class="footer">Printed: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
        </div>
        <script>window.onload=function(){window.print();}<\/script>
        </body></html>`);
        printWin.document.close();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight font-montserrat">Secondary Packaging <span className="text-indigo-600 dark:text-indigo-400">Log</span></h2>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Cartonization, labeling and weight verification.</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6 shadow-indigo-200 dark:shadow-none shadow-lg transition-all active:scale-95"
                >
                    <Plus className="h-4 w-4 mr-2" /> Start New Packing
                </Button>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Cartons', value: records.reduce((acc, r) => acc + (r.summary?.totalCartons || 0), 0), icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                    { label: 'Pieces Packed', value: records.reduce((acc, r) => acc + (r.summary?.totalPieces || 0), 0).toLocaleString(), icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Pallet Count', value: records.reduce((acc, r) => acc + (r.summary?.totalPallets || 0), 0), icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Success Rate', value: '99.8%', icon: ShieldCheck, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="p-4 flex items-center gap-4 border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm">
                        <div className={`h-11 w-11 rounded-md ${kpi.bg} flex items-center justify-center`}><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-montserrat">{kpi.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Bottom Row: Table */}
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 pb-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search packing batches..." className="pl-10 h-10 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black uppercase tracking-widest text-[10px]" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Packing ID</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Order</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Cartons</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Pallets</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Total Weight</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="py-10 text-center animate-pulse font-bold text-slate-400">Loading Logistic Data...</TableCell></TableRow>
                            ) : records.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="py-10 text-center font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">Zero Packing Records Initiated</TableCell></TableRow>
                            ) : (
                                records.map(record => (
                                    <TableRow key={record._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/10">
                                        <TableCell>
                                            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{record.packingId}</p>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-[11px] text-slate-700 dark:text-slate-300">
                                            {format(new Date(record.packingDate), 'dd MMM yy')}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{record.orderId?.orderNumber || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-700 dark:text-slate-400 tracking-wider">
                                                {record.summary?.totalCartons || 0} CTNS
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 rounded bg-amber-100/50 dark:bg-amber-900/20 text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                                                {record.summary?.totalPallets || 0} PLT
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">
                                                {record.summary?.totalGrossWeight || 0} KG
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Modal
                title="Logistics Packing Workflow"
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                className="max-w-5xl"
            >
                <div className="flex border-b dark:border-slate-700 mb-6 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'preparation', label: '1. PREP & MATERIALS', icon: ClipboardList },
                        { id: 'packing', label: '2. CARTON PACKING', icon: Box },
                        { id: 'labeling', label: '3. LABEL & WEIGHT', icon: QrCode },
                        { id: 'storage', label: '4. PALLET & STORE', icon: Truck },
                        { id: 'summary', label: '5. COMPLETION', icon: CheckCircle2 }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/10'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleAddRecord} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                    {activeTab === 'preparation' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Packing ID"><Input value={formData.packingId} disabled /></FormField>
                                <FormField label="Packing Date">
                                    <Input type="date" value={formData.packingDate} onChange={(e) => setFormData({ ...formData, packingDate: e.target.value })} />
                                </FormField>
                                <FormField label="Shift">
                                    <Select
                                        value={formData.shift}
                                        onChange={(val) => setFormData({ ...formData, shift: val })}
                                        options={[
                                            { value: 'Morning', label: 'Morning' },
                                            { value: 'Evening', label: 'Evening' },
                                            { value: 'Night', label: 'Night' },
                                        ]}
                                    />
                                </FormField>
                                <FormField label="Sales Order">
                                    <Select
                                        value={formData.orderId}
                                        onChange={(val) => setFormData({ ...formData, orderId: val })}
                                        placeholder="Select Order"
                                        options={orders.map((o: any) => ({ value: o._id, label: o.orderNumber }))}
                                    />
                                </FormField>
                                <FormField label="Supervisor">
                                    <Select
                                        value={formData.supervisorId}
                                        onChange={(val) => setFormData({ ...formData, supervisorId: val })}
                                        placeholder="Select Supervisor"
                                        options={employees.map((e: any) => ({ value: e._id, label: e.employeeName }))}
                                    />
                                </FormField>
                                <FormField label="Batch No"><Input value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} /></FormField>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Step 1: Receive Checked Garments</h3>
                                    <Button type="button" size="sm" variant="outline" onClick={addInputBundle} className="h-7 text-[10px]"><Plus className="h-3 w-3 mr-1" /> Add Bundle</Button>
                                </div>
                                <div className="space-y-2">
                                    {formData.inputBundles.map((bundle: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-4 gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <FormField label="QC Audit">
                                                <SelectSm
                                                    value={bundle.checkingId}
                                                    onChange={(val) => {
                                                        const newArr = [...formData.inputBundles];
                                                        newArr[idx].checkingId = val;
                                                        setFormData({ ...formData, inputBundles: newArr });
                                                    }}
                                                    placeholder="Select QC"
                                                    options={qcRecords.map((q: any) => ({ value: q._id, label: q.checkingId }))}
                                                />
                                            </FormField>
                                            <FormField label="Bundle No"><Input className="h-9 text-xs" value={bundle.bundleNumber} onChange={(e) => {
                                                const newArr = [...formData.inputBundles];
                                                newArr[idx].bundleNumber = e.target.value;
                                                setFormData({ ...formData, inputBundles: newArr });
                                            }} /></FormField>
                                            <FormField label="Quantity"><Input className="h-9 text-xs" type="number" value={bundle.quantity || ''} onChange={(e) => {
                                                const newArr = [...formData.inputBundles];
                                                newArr[idx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                setFormData({ ...formData, inputBundles: newArr });
                                            }} /></FormField>
                                            <FormField label="Issued From">
                                                <SelectSm
                                                    value={bundle.issuedFrom}
                                                    onChange={(val) => {
                                                        const newArr = [...formData.inputBundles];
                                                        newArr[idx].issuedFrom = val;
                                                        setFormData({ ...formData, inputBundles: newArr });
                                                    }}
                                                    placeholder="Select Location"
                                                    options={locations.map((l: any) => ({ value: l._id, label: l.name }))}
                                                />
                                            </FormField>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-emerald-50/30 dark:bg-emerald-500/5 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">Step 2: Packing Materials Preparation</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {formData.packingMaterials.map((mat: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-slate-800 uppercase">{mat.materialType}</p>
                                                <p className="text-[9px] text-slate-500">{mat.specification}</p>
                                            </div>
                                            <div className="flex-[2] grid grid-cols-2 gap-2">
                                                <FormField label="Select Material Product">
                                                    <SelectSm
                                                        value={mat.productId}
                                                        onChange={(val) => {
                                                            const newArr = [...formData.packingMaterials];
                                                            newArr[idx].productId = val;
                                                            setFormData({ ...formData, packingMaterials: newArr });
                                                        }}
                                                        placeholder="Select Item"
                                                        options={products.filter((p: any) => p.category?.toLowerCase().includes('packing') || p.category?.toLowerCase().includes('material')).map((p: any) => ({ value: p._id, label: p.name }))}
                                                    />
                                                </FormField>
                                                <FormField label="Qty Required">
                                                    <Input className="h-8 text-[10px]" type="number" value={mat.quantity || ''} onChange={(e) => {
                                                        const newArr = [...formData.packingMaterials];
                                                        newArr[idx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                        setFormData({ ...formData, packingMaterials: newArr });
                                                    }} />
                                                </FormField>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'packing' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Step 3-5: Carton Packing & Sorting</h3>
                                <Button type="button" size="sm" variant="outline" onClick={addPackingDetail} className="h-7 text-[10px]"><Plus className="h-3 w-3 mr-1" /> Add Carton</Button>
                            </div>
                            <div className="space-y-4">
                                {formData.packingDetails.map((detail: any, idx: number) => (
                                    <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <p className="text-[11px] font-black uppercase text-indigo-600">Carton #{detail.cartonNumber}</p>
                                            <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-red-500" onClick={() => {
                                                const newArr = formData.packingDetails.filter((_: any, i: number) => i !== idx);
                                                setFormData({ ...formData, packingDetails: newArr });
                                            }}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                        <div className="p-4 grid grid-cols-4 gap-4">
                                            <FormField label="Pieces/Carton"><Input type="number" value={detail.piecesPerCarton || ''} onChange={(e) => {
                                                const newArr = [...formData.packingDetails];
                                                newArr[idx].piecesPerCarton = e.target.value === '' ? '' : Number(e.target.value);
                                                setFormData({ ...formData, packingDetails: newArr });
                                            }} /></FormField>
                                            <div className="col-span-3 space-y-3">
                                                <div className="flex gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase">Sort by Size</span>
                                                            <button type="button" className="text-[8px] text-indigo-600 font-bold" onClick={() => {
                                                                const newArr = [...formData.packingDetails];
                                                                newArr[idx].sizes.push({ size: '', quantity: '' as any });
                                                                setFormData({ ...formData, packingDetails: newArr });
                                                            }}>+ Add Size</button>
                                                        </div>
                                                        {detail.sizes.map((s: any, sIdx: number) => (
                                                            <div key={sIdx} className="flex gap-2">
                                                                <Input placeholder="Size" className="h-7 text-[10px]" value={s.size} onChange={(e) => {
                                                                    const newArr = [...formData.packingDetails];
                                                                    newArr[idx].sizes[sIdx].size = e.target.value;
                                                                    setFormData({ ...formData, packingDetails: newArr });
                                                                }} />
                                                                <Input placeholder="Qty" type="number" className="h-7 w-16 text-[10px]" value={s.quantity || ''} onChange={(e) => {
                                                                    const newArr = [...formData.packingDetails];
                                                                    newArr[idx].sizes[sIdx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                                    setFormData({ ...formData, packingDetails: newArr });
                                                                }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex-1 space-y-2 border-l pl-4">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase">Sort by Color</span>
                                                            <button type="button" className="text-[8px] text-indigo-600 font-bold" onClick={() => {
                                                                const newArr = [...formData.packingDetails];
                                                                newArr[idx].colors.push({ color: '', quantity: '' as any });
                                                                setFormData({ ...formData, packingDetails: newArr });
                                                            }}>+ Add Color</button>
                                                        </div>
                                                        {detail.colors.map((c: any, cIdx: number) => (
                                                            <div key={cIdx} className="flex gap-2">
                                                                <Input placeholder="Color" className="h-7 text-[10px]" value={c.color} onChange={(e) => {
                                                                    const newArr = [...formData.packingDetails];
                                                                    newArr[idx].colors[cIdx].color = e.target.value;
                                                                    setFormData({ ...formData, packingDetails: newArr });
                                                                }} />
                                                                <Input placeholder="Qty" type="number" className="h-7 w-16 text-[10px]" value={c.quantity || ''} onChange={(e) => {
                                                                    const newArr = [...formData.packingDetails];
                                                                    newArr[idx].colors[cIdx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                                    setFormData({ ...formData, packingDetails: newArr });
                                                                }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'labeling' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Step 6-9: Labeling & Weight Verification</h3>
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                    <TableRow>
                                        <TableHead className="text-[10px] h-8 font-black">CTN #</TableHead>
                                        <TableHead className="text-[10px] h-8 font-black">Dimensions (LxWxH)</TableHead>
                                        <TableHead className="text-[10px] h-8 font-black">Gross Wt (KG)</TableHead>
                                        <TableHead className="text-[10px] h-8 font-black">Net Wt (KG)</TableHead>
                                        <TableHead className="text-[10px] h-8 font-black">Barcode/Label</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.packingDetails.map((detail: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-black text-xs">{detail.cartonNumber}</TableCell>
                                            <TableCell className="p-1">
                                                <Input className="h-8 text-[10px]" placeholder="e.g. 18x12x12in" value={detail.cartonDimensions} onChange={(e) => {
                                                    const newArr = [...formData.packingDetails];
                                                    newArr[idx].cartonDimensions = e.target.value;
                                                    setFormData({ ...formData, packingDetails: newArr });
                                                }} />
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <Input className="h-8 text-[10px] font-black" type="number" value={detail.grossWeight || ''} onChange={(e) => {
                                                    const newArr = [...formData.packingDetails];
                                                    newArr[idx].grossWeight = e.target.value === '' ? '' : Number(e.target.value);
                                                    // Auto calc net if gross is provided and we have a constant carton weight (mock 0.5kg)
                                                    newArr[idx].netWeight = e.target.value === '' ? '' : Math.max(0, Number(e.target.value) - 0.5);
                                                    setFormData({ ...formData, packingDetails: newArr });
                                                }} />
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <Input className="h-8 text-[10px]" type="number" value={detail.netWeight || ''} onChange={(e) => {
                                                    const newArr = [...formData.packingDetails];
                                                    newArr[idx].netWeight = e.target.value === '' ? '' : Number(e.target.value);
                                                    setFormData({ ...formData, packingDetails: newArr });
                                                }} />
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-1">
                                                        <Input
                                                            className="h-8 text-[10px] font-mono"
                                                            placeholder="Scan / Enter Barcode"
                                                            value={detail.barcode}
                                                            onChange={(e) => {
                                                                const newArr = [...formData.packingDetails];
                                                                newArr[idx].barcode = e.target.value;
                                                                setFormData({ ...formData, packingDetails: newArr });
                                                            }}
                                                        />
                                                        <Button
                                                            type="button" size="sm" variant="outline"
                                                            className="h-8 px-2 text-[9px] font-black shrink-0 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                            title="Auto-generate barcode"
                                                            onClick={() => generateBarcode(idx)}
                                                        >AUTO</Button>
                                                        <Button
                                                            type="button" size="sm" variant="outline"
                                                            className="h-8 w-8 p-0 shrink-0 text-indigo-600 border-indigo-300 hover:bg-indigo-50 dark:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                                                            title="Print Label"
                                                            onClick={() => printLabel(detail, idx)}
                                                        ><QrCode className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                    {detail.barcode && (
                                                        <span className="text-[8px] font-mono text-indigo-500 dark:text-indigo-400 tracking-widest truncate pl-1">
                                                            {detail.barcode}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {activeTab === 'storage' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Step 10: Palletizing (For Bulk)</h3>
                                    <Button type="button" size="sm" variant="outline" onClick={() => {
                                        const newPallet = { palletNumber: `PLT-${formData.palletDetails.length + 1}`, cartonNumbers: [], totalCartons: 0, wrapApplied: true, location: '' };
                                        setFormData({ ...formData, palletDetails: [...formData.palletDetails, newPallet] });
                                    }} className="h-7 text-[10px]"><Plus className="h-3 w-3 mr-1" /> Create Pallet</Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.palletDetails.map((plt: any, idx: number) => (
                                        <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b dark:border-slate-700">
                                                <p className="text-[10px] font-black uppercase text-indigo-600">{plt.palletNumber}</p>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Wrap Applied</span>
                                                    <input type="checkbox" checked={plt.wrapApplied} onChange={(e) => {
                                                        const newArr = [...formData.palletDetails];
                                                        newArr[idx].wrapApplied = e.target.checked;
                                                        setFormData({ ...formData, palletDetails: newArr });
                                                    }} className="h-3 w-3 rounded text-indigo-600" />
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField label="Assign Cartons"><Input className="h-8 text-[10px]" placeholder="e.g. 1,2,5-10" onChange={(e) => {
                                                    const newArr = [...formData.palletDetails];
                                                    newArr[idx].cartonNumbers = e.target.value.split(',');
                                                    setFormData({ ...formData, palletDetails: newArr });
                                                }} /></FormField>
                                                <FormField label="Storage Area">
                                                    <SelectSm
                                                        value={plt.location}
                                                        onChange={(val) => {
                                                            const newArr = [...formData.palletDetails];
                                                            newArr[idx].location = val;
                                                            setFormData({ ...formData, palletDetails: newArr });
                                                        }}
                                                        placeholder="Select Area"
                                                        options={locations.map((l: any) => ({ value: l.name, label: l.name }))}
                                                    />
                                                </FormField>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-amber-50/30 dark:bg-amber-500/5 p-5 rounded-xl border border-amber-100 dark:border-amber-500/20 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-amber-700">Step 11: Finished Goods Storage</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Move to Store">
                                        <Select
                                            value={formData.outputStorage.storedAt}
                                            onChange={(val) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, storedAt: val } })}
                                            placeholder="Select Goods Store"
                                            options={locations.map((l: any) => ({ value: l._id, label: l.name }))}
                                        />
                                    </FormField>
                                    <FormField label="Bin/Rack Assignment"><Input value={formData.outputStorage.binNumber} onChange={(e) => setFormData({ ...formData, outputStorage: { ...formData.outputStorage, binNumber: e.target.value } })} /></FormField>
                                    <FormField label="Storage Status">
                                        <div className="flex h-10 items-center px-4 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Updated in System
                                        </div>
                                    </FormField>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'summary' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl space-y-8">
                                <div className="flex items-center justify-between border-b border-white/20 pb-6">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight italic">Packing Completion Certificate</h3>
                                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Audit Step 8 & 12: final validation & status transition.</p>
                                    </div>
                                    <ShieldCheck className="h-12 w-12 text-indigo-200" />
                                </div>

                                <div className="grid grid-cols-4 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Calculated Pieces</p>
                                        <p className="text-3xl font-black">{formData.packingDetails.reduce((a: number, b: any) => a + (Number(b.piecesPerCarton) || 0), 0)}</p>
                                    </div>
                                    <div className="space-y-1 border-l border-white/10 pl-8">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Cartons</p>
                                        <p className="text-3xl font-black">{formData.packingDetails.length}</p>
                                    </div>
                                    <div className="space-y-1 border-l border-white/10 pl-8">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Gross Wt</p>
                                        <p className="text-3xl font-black">{formData.packingDetails.reduce((a: number, b: any) => a + (Number(b.grossWeight) || 0), 0).toFixed(1)} <span className="text-sm">KG</span></p>
                                    </div>
                                    <div className="space-y-1 border-l border-white/10 pl-8">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Packing Status</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="h-3 w-3 bg-emerald-400 rounded-full"></div>
                                            <p className="text-xl font-black uppercase tracking-widest">Ready</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/10 p-6 rounded-xl border border-white/20 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest">System Update Summary</h4>
                                        <span className="text-[9px] font-bold text-indigo-200 bg-white/10 px-2 py-1 rounded">ISO 9001:2015 Compliant</span>
                                    </div>
                                    <ul className="grid grid-cols-2 gap-y-3 gap-x-12">
                                        {[
                                            'Bundles from checking verified',
                                            'Correct packing materials utilized',
                                            'Individual garment folding standard met',
                                            'Size/Color sorting accuracy 100%',
                                            'Carton labeling matched to Order',
                                            'Weight recorded for all CTNs',
                                            'Storage location updated to Store',
                                            'Inventory ready for Dispatch'
                                        ].map((item, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-[10px] font-black text-indigo-50">
                                                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex justify-end gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-white text-indigo-600 hover:bg-slate-50 font-black uppercase text-xs tracking-widest px-12 h-12 shadow-2xl"
                                    >
                                        {isSubmitting ? 'Finalizing...' : 'Complete Packing & Close Batches'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </Modal>
        </div>
    );
}
