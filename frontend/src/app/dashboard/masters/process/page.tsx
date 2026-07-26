'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Edit2, Trash2, Clock, IndianRupee } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

const initialFormState = () => ({
    processName: '',
    processCode: '',
    processType: 'InHouse',
    department: 'Production',
    sequenceNumber: 1,
    standardTime: 0,
    costPerUnit: 0,
    status: 'Active'
});

export default function ProcessMasterPage() {
    const { loading: authLoading } = useAuth();
    const [processes, setProcesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProcess, setEditingProcess] = useState<any>(null);
    const [formData, setFormData] = useState<any>(initialFormState());
    const { showToast } = useToast();

    const fetchProcesses = async () => {
        try {
            const res = await api.get('/processes');
            setProcesses(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching processes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingProcess) {
                await api.put(`/processes/${editingProcess._id}`, formData);
            } else {
                await api.post('/processes', formData);
            }
            closeModal();
            showToast(editingProcess ? 'Process updated successfully' : 'Process created successfully', 'success');
            fetchProcesses();
        } catch (error: any) {
            console.error('Error saving process:', error);
            showToast(error.response?.data?.message || 'Failed to save process', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (process: any) => {
        setEditingProcess(process);
        setFormData({
            processName: process.processName || '',
            processCode: process.processCode || '',
            processType: process.processType || 'InHouse',
            department: process.department || 'Production',
            sequenceNumber: process.sequenceNumber || 1,
            standardTime: process.standardTime || 0,
            costPerUnit: process.costPerUnit || 0,
            status: process.status || 'Active'
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteProcess = async (process: any) => {
        // We'll use window.confirm since it's a simple boolean prompt, 
        // but if there's a custom confirmation modal we could use it.
        if (!window.confirm(`Are you sure you want to delete "${process.processName}"?`)) return;
        try {
            await api.delete(`/processes/${process._id}`);
            showToast('Process deleted successfully', 'success');
            fetchProcesses();
        } catch (error: any) {
            console.error('Error deleting process:', error);
            showToast(error.response?.data?.message || 'Failed to delete process', 'error');
        }
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setEditingProcess(null);
        setFormData(initialFormState());
    };

    useEffect(() => {
        if (authLoading) return;
        fetchProcesses();
    }, [authLoading]);

    const filteredProcesses = processes.filter((p: any) =>
        p.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.processCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest" onClick={() => { setEditingProcess(null); setFormData(initialFormState()); setIsAddModalOpen(true); }}>
                    <Plus className="mr-2 h-5 w-5" />
                    New Process
                </Button>
            </div>

            {/* Search */}
            <Card className="bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by name, code, or department..."
                            className="pl-10 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Process Details</TableHead>
                                <TableHead>Type & Dept</TableHead>
                                <TableHead>Standard Time</TableHead>
                                <TableHead>Standard Cost</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                            Loading workflow stages...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredProcesses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                        No processes found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProcesses.map((process: any) => (
                                    <TableRow key={process._id} className="group">
                                        <TableCell>
                                            <div className="flex gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                                                    <span className="text-sm font-bold">#{process.sequenceNumber}</span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{process.processName}</div>
                                                    <div className="text-xs text-slate-500 font-mono italic">{process.processCode}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-900/40 dark:text-indigo-400">
                                                    {process.processType}
                                                </span>
                                                <div className="text-xs text-slate-500">{process.department}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                                <Clock className="mr-1.5 h-4 w-4 text-slate-400" />
                                                {process.standardTime} mins
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm font-semibold text-slate-900 dark:text-white">
                                                <IndianRupee className="mr-1 h-3 w-3" />
                                                {process.costPerUnit} / unit
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${process.status === 'Active'
                                                ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/40 dark:text-green-400'
                                                : 'bg-red-50 text-red-600 ring-red-600/20'
                                                }`}>
                                                {process.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600" onClick={() => handleEditClick(process)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteProcess(process)}>
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

            {/* Add/Edit Process Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={closeModal}
                title={editingProcess ? 'Edit Process' : 'Add New Process'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Process Name">
                            <Input
                                required
                                placeholder="e.g. Printing"
                                value={formData.processName}
                                onChange={(e) => setFormData({ ...formData, processName: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Process Code">
                            <Input
                                required
                                placeholder="e.g. PROC001"
                                value={formData.processCode}
                                onChange={(e) => setFormData({ ...formData, processCode: e.target.value })}
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Process Type">
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
                                value={formData.processType}
                                onChange={(e) => setFormData({ ...formData, processType: e.target.value })}
                            >
                                <option value="InHouse">InHouse</option>
                                <option value="Outsourced">Outsourced</option>
                                <option value="Job Work">Job Work</option>
                            </select>
                        </FormField>
                        <FormField label="Department">
                            <Input
                                placeholder="e.g. Production"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <FormField label="Sequence #">
                            <Input
                                type="number"
                                value={formData.sequenceNumber}
                                onChange={(e) => setFormData({ ...formData, sequenceNumber: Number(e.target.value) })}
                            />
                        </FormField>
                        <FormField label="Std Time (min)">
                            <Input
                                type="number"
                                value={formData.standardTime}
                                onChange={(e) => setFormData({ ...formData, standardTime: Number(e.target.value) })}
                            />
                        </FormField>
                        <FormField label="Cost / Unit">
                            <Input
                                type="number"
                                value={formData.costPerUnit}
                                onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                            />
                        </FormField>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : editingProcess ? 'Update Process' : 'Save Process'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
