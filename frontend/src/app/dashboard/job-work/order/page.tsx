'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus,
    Search,
    ClipboardList,
    ArrowLeft,
    Calendar,
    Scissors,
    Clock,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    ExternalLink,
    Wrench,
    ArrowRight,
    Package
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function JobWorkOrderPage() {
    const { loading: authLoading } = useAuth();
    const [jwos, setJwos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    // Form Data
    const [workers, setWorkers] = useState([]);
    const [products, setProducts] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);

    const [formData, setFormData] = useState({
        jwoNumber: `JWO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        jwoDate: new Date().toISOString().split('T')[0],
        jobWorkerId: '',
        processType: 'Knitting',
        sourceType: 'Direct',
        sourceId: '',
        inputMaterials: [{
            materialId: '',
            batchNumber: '',
            quantity: 0,
            unit: 'Kgs'
        }],
        processInstructions: {
            knitting: {
                construction: '',
                gsm: 180,
                width: 72,
                machineGauge: '',
                quality: 'A Grade'
            },
            dyeing: {
                color: '',
                shadeCode: '',
                dyeType: 'Reactive',
                fastness: 'Good',
                recipe: ''
            },
            compact: {
                processes: 'Compacting',
                temperature: 'Low',
                overfeed: '0%'
            }
        },
        expectedOutput: {
            materialId: '',
            quantity: 0,
            unit: 'Kgs',
            wastagePercentage: 0,
            deliveryDate: ''
        },
        charges: {
            rateType: 'Per Kg',
            rate: 0,
            quantity: 0,
            amount: 0,
            gst: 0,
            total: 0
        },
        status: 'Created'
    });

    const [selectedJwo, setSelectedJwo] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchJwos = async () => {
        try {
            const res = await api.get('/job-work/orders');
            setJwos(res.data);
        } catch (error) {
            console.error('Error fetching JWOs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataForForm = async () => {
        try {
            const [workerRes, prodRes, soRes] = await Promise.all([
                api.get('/parties'),
                api.get('/products'),
                api.get('/sales-orders')
            ]);
            setWorkers(workerRes.data.filter((p: any) => p.partyType === 'Job Worker' || p.category === 'Job Worker'));
            setProducts(prodRes.data);
            setSalesOrders(soRes.data?.filter((so: any) => so.status !== 'Closed') || []);
        } catch (error) {
            console.error('Data Fetch Error:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchJwos();
        fetchDataForForm();
    }, [authLoading]);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            inputMaterials: [...formData.inputMaterials, { materialId: '', batchNumber: '', quantity: 0, unit: 'Kgs' }]
        });
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.inputMaterials];
        // Safely parse numbers if field is quantity
        const safeValue = field === 'quantity' ? (value === '' ? 0 : parseFloat(value) || 0) : value;
        newItems[index] = { ...newItems[index], [field]: safeValue };
        setFormData({ ...formData, inputMaterials: newItems });
    };
    const totalInputQty = formData.inputMaterials.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    // Auto-calculate Output Quantity based on Input Qty and Wastage %
    useEffect(() => {
        const wastage = Number(formData.expectedOutput.wastagePercentage) || 0;
        const calculatedOutputQty = totalInputQty * (1 - (wastage / 100));
        
        // Only update if it's different and if it's not a manual override (optional logic, but let's keep it simple for now)
        if (formData.expectedOutput.quantity !== calculatedOutputQty) {
            setFormData(prev => ({
                ...prev,
                expectedOutput: {
                    ...prev.expectedOutput,
                    quantity: Number(calculatedOutputQty.toFixed(2))
                }
            }));
        }
    }, [totalInputQty, formData.expectedOutput.wastagePercentage]);

    useEffect(() => {
        const rate = Number(formData.charges.rate) || 0;
        const qty = Number(formData.expectedOutput.quantity) || 0;
        const amount = rate * qty;
        const gstPercent = Number(formData.charges.gst) || 0;
        const gstAmount = (amount * gstPercent) / 100;
        const total = amount + gstAmount;

        const safeAmount = isNaN(amount) ? 0 : amount;
        const safeTotal = isNaN(total) ? 0 : total;

        if (formData.charges.amount !== safeAmount || formData.charges.total !== safeTotal || formData.charges.quantity !== qty) {
            setFormData(prev => ({
                ...prev,
                charges: {
                    ...prev.charges,
                    amount: safeAmount,
                    total: safeTotal,
                    quantity: qty
                }
            }));
        }
    }, [formData.charges.rate, formData.expectedOutput.quantity, formData.charges.gst]);

    const handleViewJwo = (jwo: any) => {
        setSelectedJwo(jwo);
        setIsViewModalOpen(true);
    };

    const handleApproveJwo = async (id: string) => {
        try {
            await api.patch(`/job-work/orders/${id}`, { status: 'Approved' });
            showToast('Order approved successfully', 'success');
            fetchJwos();
        } catch (error: any) {
            console.error('Approval Error:', error);
            showToast(error.response?.data?.message || 'Failed to approve order', 'error');
        }
    };

    const handleEditJwo = (jwo: any) => {
        setSelectedJwo(jwo);
        setFormData({
            ...jwo,
            jobWorkerId: jwo.jobWorkerId?._id || jwo.jobWorkerId,
            jwoDate: format(new Date(jwo.jwoDate), 'yyyy-MM-dd'),
            expectedOutput: {
                ...jwo.expectedOutput,
                deliveryDate: format(new Date(jwo.expectedOutput.deliveryDate), 'yyyy-MM-dd')
            },
            inputMaterials: jwo.inputMaterials.map((m: any) => ({
                ...m,
                materialId: m.materialId?._id || m.materialId
            }))
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteJwo = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await api.delete(`/job-work/orders/${id}`);
            showToast('Order deleted successfully', 'success');
            fetchJwos();
        } catch (error: any) {
            console.error('Delete Error:', error);
            showToast(error.response?.data?.message || 'Failed to delete order', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const sanitizedData = {
            ...formData,
            inputMaterials: formData.inputMaterials.filter(m => m.materialId !== ''),
            sourceId: formData.sourceId === '' ? undefined : formData.sourceId,
            expectedOutput: {
                ...formData.expectedOutput,
                deliveryDate: formData.expectedOutput.deliveryDate === '' ? undefined : formData.expectedOutput.deliveryDate
            }
        };

        if (sanitizedData.inputMaterials.length === 0) {
            showToast('Please select at least one input material', 'error');
            setIsSubmitting(false);
            return;
        }

        if (!sanitizedData.expectedOutput.quantity || sanitizedData.expectedOutput.quantity <= 0) {
            showToast('Please enter a valid expected output quantity', 'error');
            setIsSubmitting(false);
            return;
        }

        if (!sanitizedData.expectedOutput.deliveryDate) {
            showToast('Please select an expected delivery date', 'error');
            setIsSubmitting(false);
            return;
        }


        try {
            if (isEditModalOpen && selectedJwo) {
                await api.put(`/job-work/orders/${selectedJwo._id}`, sanitizedData);
            } else {
                await api.post('/job-work/orders', sanitizedData);
            }
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            fetchJwos();
            // Reset form
            setFormData({
                jwoNumber: `JWO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                jwoDate: new Date().toISOString().split('T')[0],
                jobWorkerId: '',
                processType: 'Knitting',
                sourceType: 'Direct',
                sourceId: '',
                inputMaterials: [{
                    materialId: '',
                    batchNumber: '',
                    quantity: 0,
                    unit: 'Kgs'
                }],
                processInstructions: {
                    knitting: {
                        construction: '',
                        gsm: 180,
                        width: 72,
                        machineGauge: '',
                        quality: 'A Grade'
                    },
                    dyeing: {
                        color: '',
                        shadeCode: '',
                        dyeType: 'Reactive',
                        fastness: 'Good',
                        recipe: ''
                    },
                    compact: {
                        processes: 'Compacting',
                        temperature: 'Low',
                        overfeed: '0%'
                    }
                },
                expectedOutput: {
                    materialId: '',
                    quantity: 0,
                    unit: 'Kgs',
                    wastagePercentage: 0,
                    deliveryDate: ''
                },
                charges: {
                    rateType: 'Per Kg',
                    rate: 0,
                    quantity: 0,
                    amount: 0,
                    gst: 0,
                    total: 0
                },
                status: 'Created'
            });
            showToast(isEditModalOpen ? 'Job order updated successfully' : 'Job order created successfully', 'success');
        } catch (error: any) {
            console.error('Submit Error:', error);
            let msg = error.response?.data?.message || 'Failed to save job order';
            if (msg.includes('validation failed')) {
                msg = 'Missing required information or invalid data in the form. Please check all fields.';
            }
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredJwos = jwos.filter((j: any) =>
        j.jwoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.jobWorkerId?.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" />
                    New Job Order
                </Button>
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-sm overflow-hidden rounded-md">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 p-6">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search JWO or Worker..."
                            className="pl-10 h-12 bg-slate-50 dark:bg-slate-800/50 border-none rounded-md dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 dark:bg-slate-800/30 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 border-none">
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Order Details</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Job Worker</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Process</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Expected Output</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                                <TableHead className="py-4 text-right font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-400 font-medium italic">Loading orders...</TableCell></TableRow>
                            ) : filteredJwos.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-48 text-center text-slate-400 font-medium italic">No job work orders found.</TableCell></TableRow>
                            ) : filteredJwos.map((jwo: any) => (
                                <TableRow key={jwo._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors border-b border-slate-50 dark:border-slate-800">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{jwo.jwoNumber}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{format(new Date(jwo.jwoDate), 'dd MMM yyyy')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-700">{jwo.jobWorkerId?.partyName}</TableCell>
                                    <TableCell>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${jwo.processType === 'Knitting' ? 'bg-blue-100 text-blue-700' :
                                            jwo.processType === 'Dyeing' ? 'bg-rose-100 text-rose-700' :
                                                jwo.processType === 'Compact' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {jwo.processType}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{jwo.expectedOutput.quantity} {jwo.expectedOutput.unit}</span>
                                            <span className="text-[10px] text-slate-400">ETA: {format(new Date(jwo.expectedOutput.deliveryDate), 'dd/MM/yy')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tight ${jwo.status === 'Received' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            jwo.status === 'Approved' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                jwo.status === 'Issued' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                    jwo.status === 'In-Process' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                                                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                            }`}>
                                            {jwo.status === 'In-Process' && <Clock className="h-3 w-3 animate-pulse" />}
                                            {jwo.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-md hover:bg-white hover:shadow-sm" onClick={() => handleViewJwo(jwo)}>
                                                <ExternalLink className="h-5 w-5 text-indigo-600" />
                                            </Button>
                                            {jwo.status === 'Created' && (
                                                <Button variant="ghost" size="sm" className="h-10 px-3 rounded-md hover:bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-wider" onClick={() => handleApproveJwo(jwo._id)}>
                                                    Approve
                                                </Button>
                                            )}
                                            {(jwo.status === 'Created' || jwo.status === 'Approved') && (
                                                <>
                                                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-md hover:bg-white hover:shadow-sm" onClick={() => handleEditJwo(jwo)}>
                                                        <Wrench className="h-5 w-5 text-amber-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-md hover:bg-white hover:shadow-sm" onClick={() => handleDeleteJwo(jwo._id)}>
                                                        <XCircle className="h-5 w-5 text-rose-600" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`JWO: ${selectedJwo?.jwoNumber}`}
                className="max-w-6xl"
            >
                {selectedJwo && (
                    <div className="space-y-8">
                        {/* Header Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-md border border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Job Worker</p>
                                <p className="font-bold text-slate-900">{selectedJwo.jobWorkerId?.partyName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Process</p>
                                <p className="font-bold text-indigo-600 uppercase">{selectedJwo.processType}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Order Date</p>
                                <p className="font-bold text-slate-800">{format(new Date(selectedJwo.jwoDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</p>
                                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 uppercase">
                                    {selectedJwo.status}
                                </span>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Package size={16} className="text-indigo-600" /> Input Materials
                            </h3>
                            <div className="rounded-md border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                        <tr className="text-left text-slate-400 uppercase text-[10px] font-bold">
                                            <th className="px-6 py-3">Material</th>
                                            <th className="px-6 py-3">Batch</th>
                                            <th className="px-6 py-3 text-right">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedJwo.inputMaterials?.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4 font-bold text-slate-800">{item.materialId?.productName || item.description || 'Raw Material'}</td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.batchNumber || 'N/A'}</td>
                                                <td className="px-6 py-4 text-right font-black text-indigo-600">{item.quantity} {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Process Instructions & Output */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Process Parameters</h3>
                                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-md border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-y-4">
                                    {selectedJwo.processType === 'Knitting' ? (
                                        <>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Construction</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedJwo.processInstructions?.knitting?.construction}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Req. GSM</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedJwo.processInstructions?.knitting?.gsm}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Width</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedJwo.processInstructions?.knitting?.width}"</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Stitch Length</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedJwo.processInstructions?.knitting?.machineGauge || 'N/A'}</p>
                                            </div>
                                        </>
                                    ) : selectedJwo.processType === 'Dyeing' ? (
                                        <>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Color</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedJwo.processInstructions?.dyeing?.color}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Shade Code</p>
                                                <p className="text-sm font-bold text-slate-800 font-mono text-indigo-600">{selectedJwo.processInstructions?.dyeing?.shadeCode}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Fastness</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedJwo.processInstructions?.dyeing?.fastness}</p>
                                            </div>
                                        </>
                                    ) : selectedJwo.processType === 'Compact' ? (
                                        <>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Selected Processes</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedJwo.processInstructions?.compact?.processes}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Temperature</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedJwo.processInstructions?.compact?.temperature}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Overfeed</p>
                                                <p className="text-sm font-bold text-slate-800">{selectedJwo.processInstructions?.compact?.overfeed}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Instructions</p>
                                                <p className="text-sm font-bold text-slate-800">Standard Process Instructions Apply</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Expected Results</h3>
                                <div className="p-6 bg-indigo-600 rounded-md text-white shadow-xl shadow-indigo-600/20 space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold opacity-75 uppercase">Target Product</span>
                                        <span className="text-sm font-black text-indigo-100">{selectedJwo.expectedOutput?.materialId?.productName || 'General Output'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold opacity-75 uppercase">Target Quantity</span>
                                        <span className="text-xl font-black">{selectedJwo.expectedOutput?.quantity} {selectedJwo.expectedOutput?.unit}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold opacity-75 uppercase text-indigo-200">Process Wastage (Exp.)</span>
                                        <span className="font-bold">{selectedJwo.expectedOutput?.wastagePercentage}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold opacity-75 uppercase text-indigo-200">Processing Rate</span>
                                        <span className="font-bold">₹{selectedJwo.charges?.rate} / {selectedJwo.charges?.rateType || 'KG'}</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                                        <span className="opacity-75">Estimated Delivery</span>
                                        <span className="font-bold uppercase tracking-tight">{format(new Date(selectedJwo.expectedOutput?.deliveryDate), 'dd MMM yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button className="rounded-md px-10 h-12 font-black uppercase tracking-widest bg-slate-900 text-white" onClick={() => setIsViewModalOpen(false)}>
                                Close Overview
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                }}
                title={isEditModalOpen ? `Edit JWO: ${selectedJwo?.jwoNumber}` : "Initialize Job Work Order"}
                className="max-w-7xl font-sans"
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-md border border-slate-100 dark:border-slate-800">
                        <FormField label="Order #">
                            <Input disabled value={formData.jwoNumber} className="bg-white dark:bg-slate-900 border-none font-black text-indigo-600 dark:text-indigo-400" />
                        </FormField>
                        <FormField label="Order Date">
                            <Input type="date" value={formData.jwoDate} onChange={(e) => setFormData({ ...formData, jwoDate: e.target.value })} className="bg-white dark:bg-slate-900 border-none dark:text-white" />
                        </FormField>
                        <FormField label="Job Worker" className="md:col-span-2">
                            <select
                                required
                                className="w-full rounded-md border-none bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold shadow-sm dark:text-white"
                                value={formData.jobWorkerId}
                                onChange={(e) => setFormData({ ...formData, jobWorkerId: e.target.value })}
                            >
                                <option value="">Select Worker</option>
                                {workers.map((w: any) => <option key={w._id} value={w._id}>{w.partyName}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Process Type">
                            <select
                                className="w-full rounded-md border-none bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shadow-sm"
                                value={formData.processType}
                                onChange={(e) => setFormData({ ...formData, processType: e.target.value as any })}
                            >
                                <option value="Knitting">Knitting</option>
                                <option value="Dyeing">Dyeing</option>
                                <option value="Printing">Printing</option>
                                <option value="Embroidery">Embroidery</option>
                                <option value="Compact">Compact</option>
                            </select>
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-md border border-slate-100 dark:border-slate-800">
                        <FormField label="Order Source (Matching)">
                            <select
                                className="w-full rounded-md border-none bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold shadow-sm dark:text-white"
                                value={formData.sourceType}
                                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value as any, sourceId: '' })}
                            >
                                <option value="Direct">Direct Production</option>
                                <option value="Sales Order">Against Sales Order</option>
                            </select>
                        </FormField>
                        {formData.sourceType === 'Sales Order' && (
                            <FormField label="Select Sales Order" className="md:col-span-2">
                                <select
                                    required
                                    className="w-full rounded-md border-none bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold shadow-sm dark:text-white"
                                    value={formData.sourceId}
                                    onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                                >
                                    <option value="">Choose SO Reference</option>
                                    {salesOrders.map((so: any) => (
                                        <option key={so._id} value={so._id}>{so.orderNumber} - {so.customerId?.partyName}</option>
                                    ))}
                                </select>
                            </FormField>
                        )}
                    </div>

                    {/* Input Materials */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <Package className="h-4 w-4" /> Raw Materials to be Sent
                        </h3>
                        <div className="overflow-hidden rounded-md border border-slate-100 dark:border-slate-800 shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                                        <th className="text-left px-6 py-4">Material</th>
                                        <th className="text-left px-6 py-4">Batch #</th>
                                        <th className="text-left px-6 py-4">Quantity</th>
                                        <th className="text-right px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                    {formData.inputMaterials.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4">
                                                <select
                                                    className="w-full rounded-md border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold dark:text-white"
                                                    value={item.materialId}
                                                    onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map((p: any) => <option key={p._id} value={p._id}>{p.productName}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Input placeholder="Batch" value={item.batchNumber} onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)} className="h-9 text-xs border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="h-9 w-24 text-xs border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                                                    <span className="text-[10px] font-black uppercase text-slate-400">KGS</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, inputMaterials: formData.inputMaterials.filter((_, i) => i !== index) })} className="text-rose-500 h-8 w-8 p-0" disabled={formData.inputMaterials.length === 1}>
                                                    <XCircle size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 flex justify-between items-center px-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Input Quantity</span>
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{totalInputQty.toLocaleString()} KGS</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-3 flex justify-center border-t border-slate-50 dark:border-slate-800">
                                <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">
                                    <Plus size={14} className="mr-1" /> Add Another Material
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Process Instructions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <Wrench className="h-4 w-4" /> Technical Parameters
                            </h3>
                            <div className="p-6 rounded-md bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                                {formData.processType === 'Knitting' ? (
                                    <>
                                        <FormField label="Construction">
                                            <Input placeholder="e.g. Single Jersey" className="bg-white dark:bg-slate-900 border-none shadow-sm dark:text-white" value={formData.processInstructions.knitting!.construction} onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, knitting: { ...formData.processInstructions.knitting!, construction: e.target.value } } })} />
                                        </FormField>
                                        <FormField label="Req. GSM">
                                            <Input type="number" className="bg-white dark:bg-slate-900 border-none shadow-sm dark:text-white" value={formData.processInstructions.knitting!.gsm} onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, knitting: { ...formData.processInstructions.knitting!, gsm: parseInt(e.target.value) } } })} />
                                        </FormField>
                                        <FormField label="Width (Inches)">
                                            <Input type="number" className="bg-white dark:bg-slate-900 border-none shadow-sm dark:text-white" value={formData.processInstructions.knitting!.width} onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, knitting: { ...formData.processInstructions.knitting!, width: parseInt(e.target.value) } } })} />
                                        </FormField>
                                        <FormField label="Stitch Length">
                                            <Input placeholder="e.g. 2.80 mm" className="bg-white dark:bg-slate-900 border-none shadow-sm dark:text-white" value={formData.processInstructions.knitting!.machineGauge} onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, knitting: { ...formData.processInstructions.knitting!, machineGauge: e.target.value } } })} />
                                        </FormField>
                                    </>
                                ) : formData.processType === 'Dyeing' ? (
                                    <>
                                        <FormField label="Color / Shade">
                                            <Input placeholder="e.g. Navy Blue" className="bg-white dark:bg-slate-900 border-none shadow-sm dark:text-white" value={formData.processInstructions.dyeing!.color} onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, dyeing: { ...formData.processInstructions.dyeing!, color: e.target.value } } })} />
                                        </FormField>
                                        <FormField label="Shade Code">
                                            <Input placeholder="e.g. SH-402" className="bg-white dark:bg-slate-900 border-none shadow-sm dark:text-white font-mono" value={formData.processInstructions.dyeing!.shadeCode} onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, dyeing: { ...formData.processInstructions.dyeing!, shadeCode: e.target.value } } })} />
                                        </FormField>
                                        <FormField label="Req. Fastness">
                                            <select
                                                className="w-full rounded-md border-none bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold shadow-sm dark:text-white font-sans"
                                                value={formData.processInstructions.dyeing!.fastness}
                                                onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, dyeing: { ...formData.processInstructions.dyeing!, fastness: e.target.value } } })}
                                            >
                                                <option value="Standard">Standard (4.0)</option>
                                                <option value="Good">Good (4.5)</option>
                                                <option value="Excellent">Excellent (5.0)</option>
                                                <option value="Azo Free">Azo Free</option>
                                            </select>
                                        </FormField>
                                    </>
                                ) : formData.processType === 'Compact' ? (
                                    <>
                                        <FormField label="Processes">
                                            <Input placeholder="e.g. Compacting, Sueding" className="bg-white border-none shadow-sm" value={formData.processInstructions.compact!.processes} onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, compact: { ...formData.processInstructions.compact!, processes: e.target.value } } })} />
                                        </FormField>
                                        <FormField label="Temperature">
                                            <Input placeholder="e.g. 120 C" className="bg-white border-none shadow-sm" value={formData.processInstructions.compact!.temperature} onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, compact: { ...formData.processInstructions.compact!, temperature: e.target.value } } })} />
                                        </FormField>
                                        <FormField label="Overfeed %">
                                            <Input placeholder="e.g. 5%" className="bg-white border-none shadow-sm" value={formData.processInstructions.compact!.overfeed} onChange={(e) => setFormData({ ...formData, processInstructions: { ...formData.processInstructions, compact: { ...formData.processInstructions.compact!, overfeed: e.target.value } } })} />
                                        </FormField>
                                    </>
                                ) : (
                                    <div className="col-span-2 text-center py-4 bg-white rounded-md">
                                        <p className="text-xs text-slate-400 font-bold italic">Standard process instructions will be used.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" /> Expected Output
                            </h3>
                            <div className="p-6 rounded-md bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 space-y-4">
                                <FormField label="Output Product" labelClassName="text-indigo-100 mb-1">
                                    <select
                                        required
                                        className="w-full bg-white/20 border-none rounded-md px-3 py-2 text-xs font-black text-white focus:outline-none focus:bg-white/30 transition-all font-sans"
                                        value={formData.expectedOutput.materialId}
                                        onChange={(e) => setFormData({ ...formData, expectedOutput: { ...formData.expectedOutput, materialId: e.target.value } })}
                                    >
                                        <option value="" className="text-slate-900">Select Produced Item</option>
                                        {products.map((p: any) => <option key={p._id} value={p._id} className="text-slate-900">{p.productName}</option>)}
                                    </select>
                                </FormField>

                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Output Qty" labelClassName="text-indigo-100">
                                        <Input type="number" className="bg-white/20 border-none text-white font-black placeholder:text-indigo-300" placeholder="0" value={formData.expectedOutput.quantity || 0} onChange={(e) => setFormData({ ...formData, expectedOutput: { ...formData.expectedOutput, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 } })} />
                                    </FormField>
                                    <FormField label="Exp. Wastage %" labelClassName="text-indigo-100">
                                        <Input type="number" className="bg-white/20 border-none text-white font-black placeholder:text-indigo-300" placeholder="0%" value={formData.expectedOutput.wastagePercentage || 0} onChange={(e) => setFormData({ ...formData, expectedOutput: { ...formData.expectedOutput, wastagePercentage: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 } })} />
                                    </FormField>
                                    <FormField label="Delivery Date" labelClassName="text-indigo-100">
                                        <Input type="date" className="bg-white/20 border-none text-white font-black text-[10px]" value={formData.expectedOutput.deliveryDate} onChange={(e) => setFormData({ ...formData, expectedOutput: { ...formData.expectedOutput, deliveryDate: e.target.value } })} />
                                    </FormField>
                                </div>
                                <div className="pt-2 border-t border-white/20 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Rate Type</span>
                                            <select
                                                className="w-full bg-white/10 border-none rounded-md px-3 py-2 text-xs font-black text-white focus:outline-none focus:bg-white/20 transition-all"
                                                value={formData.charges.rateType}
                                                onChange={(e) => setFormData({ ...formData, charges: { ...formData.charges, rateType: e.target.value } })}
                                            >
                                                <option value="Per Kg" className="text-slate-900 font-sans">Per Kg</option>
                                                <option value="Per Meter" className="text-slate-900 font-sans">Per Meter</option>
                                                <option value="Per Piece" className="text-slate-900 font-sans">Per Piece</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Process Rate (₹)</span>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-200">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="w-full bg-white/10 border-none rounded-md pl-7 pr-3 py-2 text-xs font-black text-white focus:outline-none focus:bg-white/20 transition-all placeholder:text-indigo-300"
                                                    value={formData.charges.rate || 0}
                                                    onChange={(e) => setFormData({ ...formData, charges: { ...formData.charges, rate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/10 rounded-md p-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">GST Percentage (%)</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="bg-transparent border-none w-12 text-right font-black focus:outline-none text-white placeholder:text-indigo-300"
                                                value={formData.charges.gst || 0}
                                                onChange={(e) => setFormData({ ...formData, charges: { ...formData.charges, gst: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 } })}
                                            />
                                            <span className="text-[10px] font-black text-indigo-200">%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center px-2 pt-2 border-t border-white/20 group">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-amber-300 transition-colors">Total Job Work Amount</span>
                                        <span className="text-xl font-black text-white group-hover:text-amber-300 transition-colors drop-shadow-lg">₹{formData.charges.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-slate-800">
                        <Button type="button" variant="ghost" onClick={() => {
                            setIsAddModalOpen(false);
                            setIsEditModalOpen(false);
                        }} className="rounded-md px-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                            Discard
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 min-w-[240px] rounded-md h-14 font-black uppercase tracking-[0.15em] shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all text-white">
                            {isSubmitting ? 'Processing...' : isEditModalOpen ? 'Save Changes' : 'Issue Order Request'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
