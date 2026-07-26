'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus,
    Search,
    CheckCircle2,
    ArrowLeft,
    Calendar,
    Package,
    Navigation,
    User,
    ClipboardCheck,
    MoreHorizontal,
    ExternalLink,
    Boxes,
    FileText,
    MapPin,
    ArrowRight,
    Scissors,
    ShieldCheck,
    IndianRupee,
    AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

export default function JobWorkReceiptPage() {
    const { loading: authLoading } = useAuth();
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [jwos, setJwos] = useState([]);
    const [locations, setLocations] = useState([]);
    const [products, setProducts] = useState([]);

    const [formData, setFormData] = useState({
        receiptNumber: `JR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        receiptDate: new Date().toISOString().split('T')[0],
        jwoId: '',
        jobWorkerId: '',
        jobChallanNo: '',
        jobChallanDate: new Date().toISOString().split('T')[0],
        vehicleNumber: '',
        inputMaterialReturn: {
            quantity: 0,
            unit: 'Kgs',
            reason: ''
        },
        outputMaterials: [{
            materialId: '',
            description: '',
            processType: '',
            batchNumber: '',
            manufacturingDate: new Date().toISOString().split('T')[0],
            receivedQuantity: 0,
            unit: 'Kgs',
            acceptedQuantity: 0,
            rejectedQuantity: 0,
            quarantineQuantity: 0,
            storageLocation: '',
            rollDetails: [] as any[] // Dynamically populated
        }],
        wastage: {
            inputQuantity: 0, // Total issued from JWO
            outputQuantity: 0, // Total received
            quantity: 0,
            unit: 'Kgs',
            percentage: 0,
            reason: 'Process Loss'
        },
        jobCharges: {
            rateType: 'Per Kg',
            rate: 0,
            quantity: 0,
            amount: 0,
            gst: 0,
            total: 0
        },
        status: 'Completed'
    });

    const [issuedMaterialsSummary, setIssuedMaterialsSummary] = useState<any[]>([]);

    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchReceipts = async () => {
        try {
            const res = await api.get('/job-work/receipts');
            setReceipts(res.data);
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataForForm = async () => {
        try {
            const [jwoRes, locRes, prodRes] = await Promise.all([
                api.get('/job-work/orders'),
                api.get('/locations'),
                api.get('/products')
            ]);
            // Show JWOs that are in process or already received (for editing)
            setJwos(jwoRes.data.filter((j: any) => j.status === 'Issued' || j.status === 'In-Process' || j.status === 'Received'));
            setLocations(locRes.data);
            setProducts(prodRes.data);
        } catch (error) {
            console.error('Data Fetch Error:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchReceipts();
        fetchDataForForm();
    }, [authLoading]);

    const handleSelectJWO = (jwoId: string) => {
        const jwo = jwos.find((j: any) => j._id === jwoId);
        if (jwo) {
            // Calculate total input quantity issued
            const totalInput = (jwo as any).inputMaterials?.reduce((acc: number, m: any) => acc + (m.quantity || 0), 0) || 0;
            setIssuedMaterialsSummary((jwo as any).inputMaterials || []);

            setFormData({
                ...formData,
                jwoId,
                jobWorkerId: (jwo as any).jobWorkerId?._id || (jwo as any).jobWorkerId,
                wastage: {
                    ...formData.wastage,
                    inputQuantity: totalInput
                },
                jobCharges: {
                    ...formData.jobCharges,
                    rate: (jwo as any).charges.rate
                },
                outputMaterials: [{
                    ...formData.outputMaterials[0],
                    processType: (jwo as any).processType,
                    receivedQuantity: (jwo as any).expectedOutput.quantity,
                    acceptedQuantity: (jwo as any).expectedOutput.quantity,
                    materialId: (jwo as any).expectedOutput.materialId?._id || (jwo as any).expectedOutput.materialId,
                    description: (jwo as any).expectedOutput.materialId?.productName || 'Processed Material',
                    unit: (jwo as any).expectedOutput.unit || 'Kgs'
                }]
            });
        }
    };

    const handleAddRoll = (outerIndex: number) => {
        const newOutputs = [...formData.outputMaterials];
        const isKnitting = newOutputs[outerIndex].processType === 'Knitting';
        const isDyeing = newOutputs[outerIndex].processType === 'Dyeing' || newOutputs[outerIndex].processType === 'Compact';

        newOutputs[outerIndex].rollDetails.push({
            rollNumber: `R-${newOutputs[outerIndex].rollDetails.length + 1}`,
            weight: 0,
            length: 0,
            gsm: isKnitting ? 0 : undefined,
            width: isKnitting ? 0 : undefined,
            shadeMatch: isDyeing ? 'Match' : undefined,
            fastness: isDyeing ? 'Match' : undefined,
            status: 'Accepted'
        });
        setFormData({ ...formData, outputMaterials: newOutputs });
    };

    const handleRollChange = (outerIndex: number, rollIndex: number, field: string, value: any) => {
        const newOutputs = [...formData.outputMaterials];
        newOutputs[outerIndex].rollDetails[rollIndex] = {
            ...newOutputs[outerIndex].rollDetails[rollIndex],
            [field]: value
        };

        // Recalculate totals for this output
        const rolls = newOutputs[outerIndex].rollDetails;
        const totalReceived = rolls.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
        const totalAccepted = rolls.filter(r => r.status === 'Accepted').reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
        const totalRejected = rolls.filter(r => r.status === 'Rejected').reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
        const totalQuarantine = rolls.filter(r => r.status === 'Quarantine').reduce((acc, r) => acc + (Number(r.weight) || 0), 0);

        newOutputs[outerIndex].receivedQuantity = totalReceived;
        newOutputs[outerIndex].acceptedQuantity = totalAccepted;
        newOutputs[outerIndex].rejectedQuantity = totalRejected;
        newOutputs[outerIndex].quarantineQuantity = totalQuarantine;

        setFormData({
            ...formData,
            outputMaterials: newOutputs,
            wastage: {
                ...formData.wastage,
                outputQuantity: totalReceived,
                quantity: formData.wastage.inputQuantity - totalReceived,
                percentage: formData.wastage.inputQuantity > 0 ? ((formData.wastage.inputQuantity - totalReceived) / formData.wastage.inputQuantity) * 100 : 0
            }
        });
    };

    const handleOutputChange = (index: number, field: string, value: any) => {
        const newOutputs = [...formData.outputMaterials];
        if (field === 'materialId') {
            const prod = products.find((p: any) => p._id === value);
            newOutputs[index] = { ...newOutputs[index], materialId: value, description: prod ? (prod as any).productName : '' };
        } else {
            newOutputs[index] = { ...newOutputs[index], [field]: value };
        }
        setFormData({ ...formData, outputMaterials: newOutputs });
    };

    const handleViewReceipt = (receipt: any) => {
        setSelectedReceipt(receipt);
        setIsViewModalOpen(true);
    };

    const handleEditReceipt = (receipt: any) => {
        setSelectedReceipt(receipt);
        setFormData({
            ...receipt,
            jwoId: receipt.jwoId?._id || receipt.jwoId,
            jobWorkerId: receipt.jobWorkerId?._id || receipt.jobWorkerId,
            receiptDate: format(new Date(receipt.receiptDate), 'yyyy-MM-dd'),
            jobChallanDate: format(new Date(receipt.jobChallanDate), 'yyyy-MM-dd'),
            outputMaterials: receipt.outputMaterials.map((om: any) => ({
                ...om,
                materialId: om.materialId?._id || om.materialId,
                storageLocation: om.storageLocation?._id || om.storageLocation
            }))
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteReceipt = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this receipt?')) return;
        try {
            await api.delete(`/job-work/receipts/${id}`);
            fetchReceipts();
        } catch (error) {
            console.error('Delete Error:', error);
        }
    };

    const calculateJobCharges = () => {
        const qty = formData.outputMaterials.reduce((acc, curr) => acc + (Number(curr.acceptedQuantity) || 0), 0);
        const rate = Number(formData.jobCharges.rate) || 0;
        const amount = qty * rate;
        const gst = amount * 0.18; // Default 18% GST for services
        const total = amount + gst;

        const safeAmount = isNaN(amount) ? 0 : amount;
        const safeGst = isNaN(gst) ? 0 : gst;
        const safeTotal = isNaN(total) ? 0 : total;

        if (formData.jobCharges.amount !== safeAmount || formData.jobCharges.total !== safeTotal) {
            setFormData(prev => ({
                ...prev,
                jobCharges: {
                    ...prev.jobCharges,
                    quantity: isNaN(qty) ? 0 : qty,
                    amount: safeAmount,
                    gst: safeGst,
                    total: safeTotal
                }
            }));
        }
    };

    useEffect(() => {
        calculateJobCharges();
    }, [formData.outputMaterials, formData.jobCharges.rate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditModalOpen && selectedReceipt) {
                await api.put(`/job-work/receipts/${selectedReceipt._id}`, formData);
            } else {
                await api.post('/job-work/receipts', formData);
            }
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            fetchReceipts();
            // Reset form
            setFormData({
                receiptNumber: `JR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                receiptDate: new Date().toISOString().split('T')[0],
                jwoId: '',
                jobWorkerId: '',
                jobChallanNo: '',
                jobChallanDate: new Date().toISOString().split('T')[0],
                vehicleNumber: '',
                inputMaterialReturn: {
                    quantity: 0,
                    unit: 'Kgs',
                    reason: ''
                },
                outputMaterials: [{
                    materialId: '',
                    description: '',
                    processType: '',
                    batchNumber: '',
                    manufacturingDate: new Date().toISOString().split('T')[0],
                    receivedQuantity: 0,
                    unit: 'Kgs',
                    acceptedQuantity: 0,
                    rejectedQuantity: 0,
                    quarantineQuantity: 0,
                    storageLocation: '',
                    rollDetails: []
                }],
                wastage: {
                    inputQuantity: 0,
                    outputQuantity: 0,
                    quantity: 0,
                    unit: 'Kgs',
                    percentage: 0,
                    reason: 'Process Loss'
                },
                jobCharges: {
                    rateType: 'Per Kg',
                    rate: 0,
                    quantity: 0,
                    amount: 0,
                    gst: 0,
                    total: 0
                },
                status: 'Completed'
            });
        } catch (error) {
            console.error('Submit Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredReceipts = receipts.filter((r: any) =>
        r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.jobWorkerId?.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.jobChallanNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" />
                    New Work Receipt
                </Button>
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-sm overflow-hidden rounded-md">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 p-6">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search Receipt or Worker..."
                            className="pl-10 h-12 bg-slate-50 dark:bg-slate-800/50 border-none rounded-md dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 dark:bg-slate-800/30 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 border-none transition-none">
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Receipt Details</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Job Worker</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">JW Challan</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Received Qty</TableHead>
                                <TableHead className="py-4 text-right font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-slate-400 font-medium italic">Loading receipts...</TableCell></TableRow>
                            ) : filteredReceipts.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-slate-400 font-medium italic">No receipts found.</TableCell></TableRow>
                            ) : filteredReceipts.map((receipt: any) => (
                                <TableRow key={receipt._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors border-b border-slate-50 dark:border-slate-800">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{receipt.receiptNumber}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{format(new Date(receipt.receiptDate), 'dd MMM yyyy')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-700">{receipt.jobWorkerId?.partyName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-600 text-xs">#{receipt.jobChallanNo}</span>
                                            <span className="text-[10px] text-slate-400">JWO: {receipt.jwoId?.jwoNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-emerald-600">{receipt.outputMaterials[0]?.acceptedQuantity} {receipt.outputMaterials[0]?.unit}</span>
                                            <span className="text-[10px] text-slate-400">Wastage: {receipt.wastage?.quantity} {receipt.wastage?.unit}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-md hover:bg-white hover:shadow-sm" onClick={() => handleViewReceipt(receipt)}>
                                                <ExternalLink className="h-5 w-5 text-emerald-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-md hover:bg-white hover:shadow-sm" onClick={() => handleEditReceipt(receipt)}>
                                                <FileText className="h-5 w-5 text-indigo-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-md hover:bg-white hover:shadow-sm" onClick={() => handleDeleteReceipt(receipt._id)}>
                                                <ArrowRight className="h-5 w-5 text-rose-600" />
                                            </Button>
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
                title={`Receipt Overview: ${selectedReceipt?.receiptNumber}`}
                className="max-w-4xl"
            >
                {selectedReceipt && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-md border border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Worker</p>
                                <p className="font-bold text-slate-900">{selectedReceipt.jobWorkerId?.partyName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Worker DC #</p>
                                <p className="font-bold text-emerald-600">#{selectedReceipt.jobChallanNo}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Inward Date</p>
                                <p className="font-bold text-slate-800">{format(new Date(selectedReceipt.receiptDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</p>
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 uppercase">
                                    {selectedReceipt.status}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <Scissors size={16} className="text-emerald-600" /> Processed Outcome
                            </h3>
                            <div className="rounded-md border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                        <tr className="text-left text-slate-400 uppercase text-[10px] font-bold">
                                            <th className="px-6 py-3">Product</th>
                                            <th className="px-6 py-3">QC Status</th>
                                            <th className="px-6 py-3 text-right">Received</th>
                                            <th className="px-6 py-3 text-right">Accepted</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedReceipt.outputMaterials?.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800">{item.materialId?.productName || item.description}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Loc: {item.storageLocation?.locationName || 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                        <ShieldCheck size={12} /> Quality Verified
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-500">{item.receivedQuantity} {item.unit}</td>
                                                <td className="px-6 py-4 text-right font-black text-emerald-700">{item.acceptedQuantity} {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-md border border-slate-100 dark:border-slate-800">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Wastage & Loss Report</h3>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-2xl font-black text-rose-600">{selectedReceipt.wastage?.quantity} {selectedReceipt.wastage?.unit}</p>
                                        <p className="text-xs font-bold text-slate-500 mt-1">{selectedReceipt.wastage?.reason || 'Process Loss'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Loss %</p>
                                        <p className="font-black text-slate-700">{selectedReceipt.wastage?.percentage || 0}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-emerald-600 rounded-md text-white shadow-xl shadow-emerald-600/20">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-4 text-center">Final Settlement</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold opacity-75">
                                        <span>Subtotal</span>
                                        <span>₹{selectedReceipt.jobCharges?.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold opacity-75">
                                        <span>GST (18%)</span>
                                        <span>₹{selectedReceipt.jobCharges?.gst.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-black pt-2 border-t border-white/10 mt-2">
                                        <span>Total Due</span>
                                        <span>₹{selectedReceipt.jobCharges?.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button className="rounded-md px-10 h-12 font-black uppercase tracking-widest bg-slate-900 text-white shadow-xl" onClick={() => setIsViewModalOpen(false)}>
                                Close Receipt
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
                title={isEditModalOpen ? `Edit Receipt: ${selectedReceipt?.receiptNumber}` : "Process Job Work Receipt"}
                className="max-w-6xl font-sans"
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Reference Section */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-md border border-slate-100 dark:border-slate-800">
                        <FormField label="JWO Reference">
                            <select
                                required
                                className="w-full rounded-md border-none bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-black text-emerald-600 dark:text-emerald-400 shadow-sm"
                                value={formData.jwoId}
                                onChange={(e) => handleSelectJWO(e.target.value)}
                            >
                                <option value="">Select Issued JWO</option>
                                {jwos.map((j: any) => (
                                    <option key={j._id} value={j._id}>{j.jwoNumber} - {j.jobWorkerId?.partyName}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Worker Challan #">
                            <Input required value={formData.jobChallanNo} onChange={(e) => setFormData({ ...formData, jobChallanNo: e.target.value })} className="bg-white dark:bg-slate-900 border-none rounded-md font-bold dark:text-white" />
                        </FormField>
                        <FormField label="Worker Challan Date">
                            <Input type="date" value={formData.jobChallanDate} onChange={(e) => setFormData({ ...formData, jobChallanDate: e.target.value })} className="bg-white dark:bg-slate-900 border-none rounded-md dark:text-white" />
                        </FormField>
                        <FormField label="Receipt Date">
                            <Input type="date" value={formData.receiptDate} onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })} className="bg-white dark:bg-slate-900 border-none rounded-md dark:text-white" />
                        </FormField>
                        <FormField label="Worker Vehicle #">
                            <Input placeholder="E.g. PB 08 AB 1234" value={formData.vehicleNumber} onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })} className="bg-white dark:bg-slate-900 border-none rounded-md font-bold dark:text-white" />
                        </FormField>
                    </div>

                    {/* What was issued (Step 2.5 summary) */}
                    {issuedMaterialsSummary.length > 0 && (
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-md">
                            <h3 className="text-[10px] font-black uppercase text-indigo-600 mb-2 flex items-center gap-2">
                                <Package size={14} /> Originally Issued for this JWO (Input Summary)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {issuedMaterialsSummary.map((m: any, i: number) => (
                                    <div key={i} className="bg-white p-2 rounded border border-indigo-50">
                                        <p className="text-[10px] font-bold text-slate-400">{m.materialId?.productName || 'Material'}</p>
                                        <p className="font-black text-indigo-700">{m.quantity} {m.unit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Output Items */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4" /> Received Materials & Quality Check
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-slate-900/50 p-6 rounded-md border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="space-y-4">
                                <FormField label="Processed Product">
                                    <select
                                        required
                                        className="w-full rounded-md border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold dark:text-white"
                                        value={formData.outputMaterials[0].materialId}
                                        onChange={(e) => handleOutputChange(0, 'materialId', e.target.value)}
                                    >
                                        <option value="">Select Outcome Product</option>
                                        {products.map((p: any) => <option key={p._id} value={p._id}>{p.productName}</option>)}
                                    </select>
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Batch Number">
                                        <Input placeholder="E.g. JWB-2024-X" value={formData.outputMaterials[0].batchNumber} onChange={(e) => handleOutputChange(0, 'batchNumber', e.target.value)} className="border-slate-100 dark:border-slate-800 dark:bg-slate-900 rounded-md font-mono text-xs dark:text-white" />
                                    </FormField>
                                    <FormField label="Storage Location">
                                        <select
                                            required
                                            className="w-full rounded-md border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold dark:text-white"
                                            value={formData.outputMaterials[0].storageLocation}
                                            onChange={(e) => handleOutputChange(0, 'storageLocation', e.target.value)}
                                        >
                                            <option value="">Select Store</option>
                                            {locations.map((l: any) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
                                        </select>
                                    </FormField>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-md">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Received</label>
                                    <Input type="number" value={formData.outputMaterials[0].receivedQuantity || 0} onChange={(e) => handleOutputChange(0, 'receivedQuantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="bg-white dark:bg-slate-800 border-none font-black text-emerald-700 dark:text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">Accepted</label>
                                    <Input type="number" value={formData.outputMaterials[0].acceptedQuantity || 0} onChange={(e) => handleOutputChange(0, 'acceptedQuantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="bg-white dark:bg-slate-900 border-none font-black text-indigo-700 dark:text-indigo-400" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-600 block">Rejected</label>
                                    <Input type="number" value={formData.outputMaterials[0].rejectedQuantity || 0} onChange={(e) => handleOutputChange(0, 'rejectedQuantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="bg-white dark:bg-slate-900 border-none font-black text-rose-700 dark:text-rose-400" />
                                </div>
                             </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Roll-wise Receipt & Quality Entry</h4>
                                <Button type="button" variant="ghost" onClick={() => handleAddRoll(0)} className="h-8 text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 rounded-md">
                                    <Plus size={14} className="mr-1" /> Add Roll
                                </Button>
                            </div>
                            <div className="overflow-x-auto rounded-md border border-slate-100 bg-slate-50/10">
                                <table className="w-full text-[10px]">
                                    <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-400 uppercase">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Roll No</th>
                                            <th className="px-3 py-2 text-center">Wt (Kg)</th>
                                            <th className="px-3 py-2 text-center">Len (M)</th>
                                            {formData.outputMaterials[0].processType === 'Knitting' ? (
                                                <>
                                                    <th className="px-3 py-2 text-center">GSM</th>
                                                    <th className="px-3 py-2 text-center">Width</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-3 py-2 text-center">Shade Match</th>
                                                    <th className="px-3 py-2 text-center">Fastness</th>
                                                </>
                                            )}
                                            <th className="px-3 py-2 text-center">Grade</th>
                                            <th className="px-3 py-2 text-center">QC Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                                        {(formData.outputMaterials[0]?.rollDetails || []).map((roll: any, rIdx: number) => (
                                            <tr key={rIdx}>
                                                <td className="px-2 py-1"><Input value={roll.rollNumber} onChange={(e) => handleRollChange(0, rIdx, 'rollNumber', e.target.value)} className="h-7 w-20 text-[10px] uppercase font-mono" /></td>
                                                <td className="px-2 py-1"><Input type="number" value={roll.weight || ''} onChange={(e) => handleRollChange(0, rIdx, 'weight', parseFloat(e.target.value))} className="h-7 w-16 text-center font-bold" /></td>
                                                <td className="px-2 py-1"><Input type="number" value={roll.length || ''} onChange={(e) => handleRollChange(0, rIdx, 'length', parseFloat(e.target.value))} className="h-7 w-16 text-center" /></td>
                                                {formData.outputMaterials[0].processType === 'Knitting' ? (
                                                    <>
                                                        <td className="px-2 py-1"><Input type="number" value={roll.gsm || ''} onChange={(e) => handleRollChange(0, rIdx, 'gsm', parseFloat(e.target.value))} className="h-7 w-14 text-center" /></td>
                                                        <td className="px-2 py-1"><Input type="number" value={roll.width || ''} onChange={(e) => handleRollChange(0, rIdx, 'width', parseFloat(e.target.value))} className="h-7 w-14 text-center" /></td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-2 py-1 text-center">
                                                            <select value={roll.shadeMatch || 'Pass'} onChange={(e) => handleRollChange(0, rIdx, 'shadeMatch', e.target.value)} className="h-7 w-full text-[10px] border-none bg-transparent">
                                                                <option value="Pass">Pass</option>
                                                                <option value="Fail">Fail</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-2 py-1 text-center">
                                                            <select value={roll.fastness || 'Pass'} onChange={(e) => handleRollChange(0, rIdx, 'fastness', e.target.value)} className="h-7 w-full text-[10px] border-none bg-transparent">
                                                                <option value="Pass">Pass</option>
                                                                <option value="Fail">Fail</option>
                                                            </select>
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-2 py-1 text-center">
                                                    <select value={roll.quality || 'A'} onChange={(e) => handleRollChange(0, rIdx, 'quality', e.target.value)} className="h-7 w-full text-[10px] border-none bg-transparent font-bold">
                                                        <option value="A">Grade A</option>
                                                        <option value="B">Grade B</option>
                                                        <option value="C">Grade C</option>
                                                    </select>
                                                </td>
                                                <td className="px-2 py-1 text-center">
                                                    <select value={roll.status} onChange={(e) => handleRollChange(0, rIdx, 'status', e.target.value)} className={`h-7 w-full text-[10px] font-black border-none bg-transparent ${roll.status === 'Accepted' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        <option value="Accepted">Accepted</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Charges & Wastage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Wastage Analysis
                            </h3>
                            <div className="p-6 rounded-md bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                                <FormField label="Actual Processed (Output)">
                                    <Input disabled value={formData.wastage.outputQuantity + ' ' + (formData.outputMaterials[0]?.unit || 'Kgs')} className="bg-slate-100 border-none font-black text-slate-500" />
                                </FormField>
                                <FormField label="Total Wastage (In-Out)">
                                    <Input disabled value={(formData.wastage.inputQuantity - formData.wastage.outputQuantity).toFixed(2) + ' Kgs'} className="bg-slate-100 border-none font-black text-rose-600" />
                                </FormField>
                                <FormField label="Wastage % (against Input)">
                                    <Input disabled value={formData.wastage.percentage.toFixed(2) + '%'} className="bg-indigo-50 border-none font-black text-indigo-600" />
                                </FormField>
                                <div className="col-span-2">
                                    <FormField label="Reason / Remarks">
                                        <Input placeholder="E.g. Process trimming loss" value={formData.wastage.reason} onChange={(e) => setFormData({ ...formData, wastage: { ...formData.wastage, reason: e.target.value } })} className="bg-white dark:bg-slate-900 border-none dark:text-white" />
                                    </FormField>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <IndianRupee className="h-4 w-4" /> Job Charges Calculation
                            </h3>
                            <div className="p-8 rounded-md bg-emerald-600 text-white shadow-xl shadow-emerald-600/20">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm font-bold border-b border-white/10 pb-4">
                                        <span className="opacity-70">Processing Rate</span>
                                        <span>₹{formData.jobCharges.rate} / KG</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="opacity-70">Taxable Amount</span>
                                        <span>₹{formData.jobCharges.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="opacity-70">GST (18%)</span>
                                        <span>₹{formData.jobCharges.gst.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-2xl font-black pt-4 border-t border-white/20">
                                        <span>NET TOTAL</span>
                                        <span>₹{formData.jobCharges.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                        <Button type="button" variant="ghost" onClick={() => {
                            setIsAddModalOpen(false);
                            setIsEditModalOpen(false);
                        }} className="rounded-md px-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                            Discard
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 min-w-[240px] rounded-md h-14 font-black uppercase tracking-[0.15em] shadow-xl shadow-emerald-600/30 text-white active:scale-[0.98] transition-all">
                            {isSubmitting ? 'Processing...' : isEditModalOpen ? 'Save Changes' : 'Complete Receipt'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
