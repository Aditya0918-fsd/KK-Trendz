'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, FileWarning, CheckCircle2, XCircle, Clock, Package, Archive, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function PurchaseRequisitionsPage() {
    const { loading: authLoading } = useAuth();
    const [requisitions, setRequisitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // View Modal State
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const { showToast } = useToast();

    // ─── API Setup ───
    const fetchRequisitions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/purchase-requisitions');
            setRequisitions(res.data);
        } catch (error) {
            console.error('Error fetching Requisitions:', error);
            showToast('Failed to load Purchase Requisitions', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchRequisitions();
    }, [authLoading]);

    // ─── Actions ───
    const handleStatusUpdate = async (reqId: string, newStatus: string) => {
        if (!confirm(`Are you sure you want to mark this requisition as ${newStatus}?`)) return;
        setIsSubmitting(true);
        try {
            await api.put(`/purchase-requisitions/${reqId}`, { status: newStatus });
            showToast(`Requisition marked as ${newStatus}`, 'success');
            if (isViewModalOpen) setIsViewModalOpen(false);
            fetchRequisitions();
        } catch (error: any) {
            console.error('Error updating status:', error);
            showToast(error?.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoReorderCheck = async () => {
        setIsSubmitting(true);
        try {
            const res = await api.post('/purchase-requisitions/auto-reorder');
            showToast(res.data.message || 'Auto-reorder check completed', 'success');
            fetchRequisitions();
        } catch (error: any) {
            console.error('Error running auto-reorder:', error);
            showToast(error?.response?.data?.message || 'Failed to run auto-reorder check', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openViewModal = (req: any) => {
        setSelectedReq(req);
        setIsViewModalOpen(true);
    };

    // ─── Helpers ───
    const filteredRequisitions = requisitions.filter((r: any) => {
        return r.requisitionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
               r.referenceSalesOrderId?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Pending Approval': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
            case 'Approved': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
            case 'Rejected': return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
            case 'PO_Created': return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20';
            default: return 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending Approval': return <Clock className="h-3 w-3 mr-1" />;
            case 'Approved': return <CheckCircle2 className="h-3 w-3 mr-1" />;
            case 'Rejected': return <XCircle className="h-3 w-3 mr-1" />;
            case 'PO_Created': return <Package className="h-3 w-3 mr-1" />;
            default: return null;
        }
    };

    // Derived counts
    const pendingCount = requisitions.filter(r => r.status === 'Pending Approval').length;

    return (
        <div className="space-y-6">
            
            {/* Quick KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total PRs</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{requisitions.length}</p>
                    </div>
                    <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <FileWarning className="h-4 w-4 text-slate-400" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pending Action</p>
                        <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
                    </div>
                    <div className="h-10 w-10 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search PR Number or Linked Sales Order..."
                                className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button 
                            className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]" 
                            onClick={handleAutoReorderCheck}
                            disabled={isSubmitting}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} /> Run Auto-Reorder
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                            <TableRow className="border-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">PR Details</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">System Origin</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Items</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Target Delivery</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6 h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Requisitions...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRequisitions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                            <FileWarning size={40} className="text-slate-300 mb-2" />
                                            <p className="font-bold text-sm text-slate-400">No Purchase Requisitions found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequisitions.map((req: any) => (
                                    <TableRow key={req._id} className="group border-b last:border-0 border-b-slate-50 dark:border-b-slate-800/50">
                                        <TableCell className="px-6 py-4">
                                            <div className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">
                                                {req.requisitionNumber}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                {new Date(req.requisitionDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                                                    {req.generatedBy}
                                                </span>
                                                {req.referenceSalesOrderId && (
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        SO: {req.referenceSalesOrderId?.orderNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50">
                                                <Archive className="h-3 w-3 text-slate-400" /> {req.items?.length || 0} Materials Needed
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                                {new Date(req.requiredDeliveryDate).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${getStatusStyles(req.status)}`}>
                                                {getStatusIcon(req.status)} {req.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold" onClick={() => openViewModal(req)}>
                                                Review Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════
                 VIEW & ACTION MODAL
            ═══════════════════════════════════════════════════════ */}
            {selectedReq && (
                <Modal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    title={`Review Requisition: ${selectedReq.requisitionNumber}`}
                    maxWidth="4xl"
                >
                    <div className="space-y-6">
                        {/* Header Context */}
                        <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Generated By</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedReq.generatedBy.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Linked SO</p>
                                <p className="text-sm font-bold text-indigo-600">{selectedReq.referenceSalesOrderId?.orderNumber || 'None'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${getStatusStyles(selectedReq.status)}`}>
                                    {selectedReq.status}
                                </span>
                            </div>
                        </div>

                        {/* Shortage Items */}
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">Detected Material Shortages</h3>
                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                        <TableRow className="border-none">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Material</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Required</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right text-indigo-600">Available</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right text-red-600">Net Shortage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedReq.items?.map((item: any, idx: number) => (
                                            <TableRow key={idx} className="border-t border-slate-100 dark:border-slate-800/50">
                                                <TableCell>
                                                    <span className="font-bold text-slate-800 dark:text-white text-xs">{item.materialId?.productName || item.materialName}</span>
                                                    <span className="block text-[10px] font-mono text-slate-400">{item.materialId?.productCode}</span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs">{item.requiredQuantity.toFixed(2)} {item.unit}</TableCell>
                                                <TableCell className="text-right font-mono text-xs text-indigo-600">{item.availableStock.toFixed(2)} {item.unit}</TableCell>
                                                <TableCell className="text-right font-mono font-bold text-xs text-red-600 bg-red-50/50 dark:bg-red-900/10">
                                                    {item.shortageQuantity.toFixed(2)} {item.unit}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Actions block only if Pending */}
                        {selectedReq.status === 'Pending Approval' && (
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    disabled={isSubmitting}
                                    onClick={() => handleStatusUpdate(selectedReq._id, 'Rejected')} 
                                    className="h-11 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-black uppercase tracking-widest"
                                >
                                    <XCircle className="h-4 w-4 mr-2" /> Reject Requisition
                                </Button>
                                <Button 
                                    type="button" 
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]"
                                    onClick={() => handleStatusUpdate(selectedReq._id, 'Approved')} 
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve for Procurement
                                </Button>
                            </div>
                        )}
                        {/* Status notification if already acted on */}
                        {selectedReq.status !== 'Pending Approval' && (
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-500">
                                    Action already taken on this requisition.
                                </p>
                                <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)} className="h-9 px-6 rounded-lg text-xs font-bold">
                                    Close Window
                                </Button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
