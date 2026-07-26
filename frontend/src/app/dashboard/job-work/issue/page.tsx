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
    Navigation,
    User,
    Phone,
    MoreHorizontal,
    ExternalLink,
    Boxes,
    FileText,
    MapPin,
    ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';

export default function MaterialIssuePage() {
    const { loading: authLoading } = useAuth();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [jwos, setJwos] = useState([]);
    const [locations, setLocations] = useState([]);

    const [formData, setFormData] = useState({
        issueNumber: `MI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        issueDate: new Date().toISOString().split('T')[0],
        jwoId: '',
        deliveryChallanNo: '',
        vehicleNo: '',
        driverName: '',
        driverPhone: '',
        items: [{
            materialId: '',
            description: '',
            batchNumber: '',
            quantity: 0,
            unit: 'Kgs',
            fromLocation: '',
            rollNumbers: [] as string[]
        }],
        status: 'Issued'
    });

    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchIssues = async () => {
        try {
            const res = await api.get('/job-work/issues');
            setIssues(res.data);
        } catch (error) {
            console.error('Error fetching issues:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataForForm = async () => {
        try {
            const [jwoRes, locRes] = await Promise.all([
                api.get('/job-work/orders'),
                api.get('/locations')
            ]);
            // Only show created JWOs that need material issue
            setJwos(jwoRes.data.filter((j: any) => j.status === 'Approved' || j.status === 'Issued'));
            setLocations(locRes.data);
        } catch (error) {
            console.error('Data Fetch Error:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchIssues();
        fetchDataForForm();
    }, [authLoading]);

    const handleSelectJWO = (jwoId: string) => {
        const jwo = jwos.find((j: any) => j._id === jwoId);
        if (jwo) {
            setFormData({
                ...formData,
                jwoId,
                items: (jwo as any).inputMaterials.map((m: any) => ({
                    materialId: m.materialId?._id || m.materialId,
                    description: m.materialId?.productName || 'Raw Material',
                    batchNumber: m.batchNumber || '',
                    quantity: m.quantity,
                    unit: m.unit,
                    fromLocation: '',
                    rollNumbers: []
                }))
            });
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleViewIssue = (issue: any) => {
        setSelectedIssue(issue);
        setIsViewModalOpen(true);
    };

    const handleEditIssue = (issue: any) => {
        setSelectedIssue(issue);
        setFormData({
            ...issue,
            jwoId: issue.jwoId?._id || issue.jwoId,
            issueDate: format(new Date(issue.issueDate), 'yyyy-MM-dd'),
            items: issue.items.map((it: any) => ({
                ...it,
                materialId: it.materialId?._id || it.materialId,
                fromLocation: it.fromLocation?._id || it.fromLocation
            }))
        });
        setIsEditModalOpen(true);
    };

    const handleDeleteIssue = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this issue?')) return;
        try {
            await api.delete(`/job-work/issues/${id}`);
            fetchIssues();
        } catch (error) {
            console.error('Delete Error:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditModalOpen && selectedIssue) {
                await api.put(`/job-work/issues/${selectedIssue._id}`, formData);
            } else {
                await api.post('/job-work/issues', formData);
            }
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            fetchIssues();
            // Reset form
            setFormData({
                issueNumber: `MI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                issueDate: new Date().toISOString().split('T')[0],
                jwoId: '',
                deliveryChallanNo: '',
                vehicleNo: '',
                driverName: '',
                driverPhone: '',
                items: [{
                    materialId: '',
                    description: '',
                    batchNumber: '',
                    quantity: 0,
                    unit: 'Kgs',
                    fromLocation: '',
                    rollNumbers: [] as string[]
                }],
                status: 'Issued'
            });
        } catch (error) {
            console.error('Submit Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredIssues = issues.filter((i: any) =>
        i.issueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.jwoId?.jwoNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.deliveryChallanNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 border-l-4 border-indigo-600 pl-4 uppercase">Stores Management</h1>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest pl-4">Material Issue to Job Worker (Section 2.5)</p>
                </div>
                <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" />
                    New Material Issue
                </Button>
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-sm overflow-hidden rounded-md">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 p-6">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search Issue or Challan..."
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
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Issue Details</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">JWO Ref</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Challan Info</TableHead>
                                <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Vehicle & Logistics</TableHead>
                                <TableHead className="py-4 text-right font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-slate-400 font-medium italic">Loading issues...</TableCell></TableRow>
                            ) : filteredIssues.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-slate-400 font-medium italic">No material issues found.</TableCell></TableRow>
                            ) : filteredIssues.map((issue: any) => (
                                <TableRow key={issue._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors border-b border-slate-50 dark:border-slate-800">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{issue.issueNumber}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{format(new Date(issue.issueDate), 'dd MMM yyyy')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-amber-600 uppercase text-xs">{issue.jwoId?.jwoNumber}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{issue.jwoId?.processType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-sm">DC: {issue.deliveryChallanNo}</span>
                                            <span className="text-[10px] text-slate-400">{issue.items?.length || 0} Items Dispatched</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1">
                                                <Navigation size={10} className="text-amber-500" /> {issue.vehicleNo || 'Self'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <User size={10} /> {issue.driverName || 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-md hover:bg-white hover:shadow-sm" onClick={() => handleViewIssue(issue)}>
                                                <ExternalLink className="h-5 w-5 text-amber-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-md hover:bg-white hover:shadow-sm" onClick={() => handleEditIssue(issue)}>
                                                <FileText className="h-5 w-5 text-indigo-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-md hover:bg-white hover:shadow-sm" onClick={() => handleDeleteIssue(issue._id)}>
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
                title={`Issue Details: ${selectedIssue?.issueNumber}`}
                className="max-w-4xl"
            >
                {selectedIssue && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-md border border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Date</p>
                                <p className="font-bold text-slate-900">{format(new Date(selectedIssue.issueDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">JWO Ref</p>
                                <p className="font-bold text-amber-600">{selectedIssue.jwoId?.jwoNumber}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Challan #</p>
                                <p className="font-bold text-slate-800 uppercase tracking-tight">{selectedIssue.deliveryChallanNo}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</p>
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 uppercase">
                                    {selectedIssue.status}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Dispatched Items</h3>
                            <div className="rounded-md border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                        <tr className="text-left text-slate-400 uppercase text-[10px] font-bold">
                                            <th className="px-6 py-3">Product</th>
                                            <th className="px-6 py-3">From Location</th>
                                            <th className="px-6 py-3 text-right">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedIssue.items?.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800">{item.materialId?.productName || item.description}</p>
                                                    <p className="text-[10px] font-black text-slate-400">BATCH: {item.batchNumber || 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                        <MapPin size={10} className="text-indigo-400" /> {item.fromLocation?.locationName || 'Main Store'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-amber-600">{item.quantity} {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900 rounded-md text-white">
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Logistics & Driver</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold opacity-40 uppercase">Vehicle</p>
                                    <p className="font-bold tracking-tight">{selectedIssue.vehicleNo}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold opacity-40 uppercase">Driver</p>
                                    <p className="font-bold">{selectedIssue.driverName}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold opacity-40 uppercase">Contact</p>
                                    <p className="font-bold">{selectedIssue.driverPhone}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" className="rounded-md font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                            <Button className="bg-amber-500 hover:bg-amber-600 rounded-md px-10 h-12 font-black uppercase tracking-widest text-white shadow-xl shadow-amber-500/20">
                                Print Challan
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
                title={isEditModalOpen ? `Edit Issue: ${selectedIssue?.issueNumber}` : "Material Issue for Job Work"}
                className="max-w-6xl font-sans"
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-md border border-slate-100 dark:border-slate-800">
                        <FormField label="Select Job Work Order (JWO)">
                            <select
                                required
                                className="w-full rounded-md border-none bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-black text-amber-600 dark:text-amber-400 shadow-sm"
                                value={formData.jwoId}
                                onChange={(e) => handleSelectJWO(e.target.value)}
                            >
                                <option value="">Select Created JWO</option>
                                {jwos.map((j: any) => (
                                    <option key={j._id} value={j._id}>{j.jwoNumber} - {j.jobWorkerId?.partyName} ({j.processType})</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Delivery Challan #">
                            <Input required placeholder="E.g. DC/2024/001" value={formData.deliveryChallanNo} onChange={(e) => setFormData({ ...formData, deliveryChallanNo: e.target.value })} className="bg-white dark:bg-slate-900 border-none rounded-md font-bold dark:text-white" />
                        </FormField>
                        <FormField label="Issue Date">
                            <Input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="bg-white dark:bg-slate-900 border-none rounded-md dark:text-white" />
                        </FormField>
                    </div>

                    {/* Items to Issue */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <Boxes className="h-4 w-4" /> Material Dispatch Details
                        </h3>
                        <div className="overflow-hidden rounded-md border border-slate-100 shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                                        <th className="text-left px-6 py-4">Item & Batch</th>
                                        <th className="text-left px-6 py-4 w-[20%]">Location / Bin</th>
                                        <th className="text-left px-6 py-4">Quantity</th>
                                        <th className="text-left px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-900">{item.description}</span>
                                                    <Input
                                                        placeholder="Enter Batch #"
                                                        value={item.batchNumber}
                                                        onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                                                        className="h-7 text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800 border-dashed"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <select
                                                        required
                                                        className="w-full rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 text-xs font-bold dark:text-white"
                                                        value={item.fromLocation}
                                                        onChange={(e) => handleItemChange(index, 'fromLocation', e.target.value)}
                                                    >
                                                        <option value="">Select Location</option>
                                                        {locations.map((l: any) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
                                                    </select>
                                                    <Input
                                                        placeholder="Roll Nos (e.g. R1, R2)"
                                                        value={item.rollNumbers?.join(', ')}
                                                        onChange={(e) => handleItemChange(index, 'rollNumbers', e.target.value.split(',').map(s => s.trim()))}
                                                        className="h-7 text-[10px] border-dashed"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-20 h-8 font-black text-indigo-600 px-2"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase">To Issue</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Logistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <Truck className="h-4 w-4" /> Transport & Vehicle
                            </h3>
                            <div className="p-6 rounded-md bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                                <FormField label="Vehicle Plate #">
                                    <Input placeholder="E.g. MH 12 AB 1234" value={formData.vehicleNo} onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })} className="bg-white dark:bg-slate-900 border-none dark:text-white" />
                                </FormField>
                                <FormField label="Vehicle Type">
                                    <Input placeholder="E.g. Pick-up Truck" className="bg-white dark:bg-slate-900 border-none dark:text-white" />
                                </FormField>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <User className="h-4 w-4" /> Driver Information
                            </h3>
                            <div className="p-6 rounded-md bg-amber-500 dark:bg-slate-800/80 text-white shadow-xl shadow-amber-500/20 dark:shadow-none grid grid-cols-2 gap-4 border border-transparent dark:border-slate-700">
                                <FormField label="Driver Name">
                                    <Input placeholder="Driver Name" value={formData.driverName} onChange={(e) => setFormData({ ...formData, driverName: e.target.value })} className="bg-white/10 dark:bg-slate-900/50 border-none text-white font-bold placeholder:text-white/40" />
                                </FormField>
                                <FormField label="Contact Number">
                                    <Input placeholder="E.g. 9876543210" value={formData.driverPhone} onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })} className="bg-white/10 dark:bg-slate-900/50 border-none text-white font-bold placeholder:text-white/40" />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-slate-800">
                        <Button type="button" variant="ghost" onClick={() => {
                            setIsAddModalOpen(false);
                            setIsEditModalOpen(false);
                        }} className="rounded-md px-8 font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 min-w-[240px] rounded-md h-14 font-black uppercase tracking-[0.15em] shadow-xl shadow-amber-600/30 dark:shadow-indigo-600/20 text-white active:scale-[0.98] transition-all">
                            {isSubmitting ? 'Processing...' : isEditModalOpen ? 'Save Changes' : 'Generate Challan'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
