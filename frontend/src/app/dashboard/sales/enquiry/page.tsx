'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Calendar, User, Activity,
    CheckCircle2, Clock, XCircle, MoreHorizontal, FileText,
    MessageSquare, Trash2, Eye, Pencil, FilePlus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function SalesEnquiryPage() {
    const { loading: authLoading } = useAuth();
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
    const [newFollowUp, setNewFollowUp] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'Pending',
        remarks: '',
        nextFollowUp: '',
        handledBy: ''
    });

    const [parties, setParties] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const generateEnquiryNumber = () => {
        const year = new Date().getFullYear();
        const nextYear = (year + 1).toString().slice(-2);
        return `ENQ/${year}-${nextYear}/${Math.floor(100 + Math.random() * 900)}`;
    };

    const [formData, setFormData] = useState({
        enquiryNumber: generateEnquiryNumber(),
        enquiryDate: new Date().toISOString().split('T')[0],
        customerId: '',
        customerReference: '',
        receivedThrough: 'Email',
        items: [{
            category: 'Garment',
            productId: '',
            productName: '',
            quantity: '' as any,
            unit: 'Pieces',
            specifications: {
                size: '',
                color: '',
                fabric: '',
                gsm: '' as any,
                print: '',
                year: ''
            },
            requiredDate: ''
        }],
        followUp: [{
            date: format(new Date(), 'yyyy-MM-dd'),
            status: 'Pending',
            remarks: '',
            nextFollowUp: '',
            handledBy: ''
        }],
        status: 'Open'
    });

    const fetchEnquiries = async () => {
        try {
            const res = await api.get('/sales-enquiries');
            setEnquiries(res.data);
        } catch (error) {
            console.error('Error fetching enquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const [employees, setEmployees] = useState<any[]>([]);

    const fetchMasters = async () => {
        try {
            const [pRes, prodRes, empRes] = await Promise.all([
                api.get('/parties'),
                api.get('/products'),
                api.get('/employees')
            ]);
            setParties(pRes.data.filter((p: any) => p.partyType === 'Customer' || p.partyType === 'Both'));
            setProducts(prodRes.data);
            setEmployees(empRes.data);
        } catch (error) {
            console.error('Error fetching masters:', error);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchEnquiries();
            fetchMasters();
        }
    }, [authLoading]);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                category: 'Garment',
                productId: '',
                productName: '',
                quantity: '' as any,
                unit: 'Pieces',
                specifications: { size: '', color: '', fabric: '', gsm: '' as any, print: '', year: '' },
                requiredDate: ''
            }]
        });
    };

    const handleRemoveItem = (idx: number) => {
        const updated = formData.items.filter((_, i) => i !== idx);
        setFormData({ ...formData, items: updated });
    };

    const handleAddEnquiry = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerId) {
            showToast('Please select a Customer before submitting.', 'warning');
            return;
        }
        
        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            if (!item.productId) {
                showToast(`Please select a Product for Item ${i + 1}.`, 'warning');
                return;
            }
            if (item.quantity === '' || Number(item.quantity) <= 0) {
                showToast(`Please enter a valid Quantity for Item ${i + 1}.`, 'warning');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // Clean up empty strings for Date and ObjectId fields to prevent Mongoose validation errors
            const submissionData = {
                ...formData,
                items: formData.items.map(item => {
                    const cleanedItem = { 
                        ...item,
                        quantity: Number(item.quantity) || 0,
                        specifications: {
                            ...item.specifications,
                            gsm: Number(item.specifications.gsm) || 0
                        }
                    };
                    if (cleanedItem.requiredDate === '') {
                        delete (cleanedItem as any).requiredDate;
                    }
                    return cleanedItem;
                }),
                followUp: formData.followUp.map(f => {
                    const cleanedFollowUp: any = { ...f };
                    if (cleanedFollowUp.handledBy === '') delete cleanedFollowUp.handledBy;
                    if (cleanedFollowUp.nextFollowUp === '') delete cleanedFollowUp.nextFollowUp;
                    return cleanedFollowUp;
                })
            };

            console.log('--- SUBMITTING ENQUIRY ---', submissionData);
            await api.post('/sales-enquiries', submissionData);
            await fetchEnquiries();
            setIsAddModalOpen(false);
            
            // Reset form
            setFormData({
                enquiryNumber: generateEnquiryNumber(),
                enquiryDate: new Date().toISOString().split('T')[0],
                customerId: '',
                customerReference: '',
                receivedThrough: 'Email',
                items: [{
                    category: 'Garment',
                    productId: '',
                    productName: '',
                    quantity: '' as any,
                    unit: 'Pieces',
                    specifications: { size: '', color: '', fabric: '', gsm: '' as any, print: '', year: '' },
                    requiredDate: ''
                }],
                followUp: [{
                    date: format(new Date(), 'yyyy-MM-dd'),
                    status: 'Pending',
                    remarks: '',
                    nextFollowUp: '',
                    handledBy: ''
                }],
                status: 'Open'
            });
            showToast('Sales enquiry created successfully', 'success');
        } catch (error: any) {
            console.error('Error adding enquiry:', error);
            const msg = error?.response?.data?.message || 'Failed to add enquiry';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditEnquiry = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerId) {
            showToast('Please select a Customer before submitting.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const submissionData = {
                ...formData,
                items: formData.items.map(item => {
                    const cleanedItem = { 
                        ...item,
                        quantity: Number(item.quantity) || 0,
                        specifications: {
                            ...item.specifications,
                            gsm: Number(item.specifications.gsm) || 0
                        }
                    };
                    if (cleanedItem.requiredDate === '') {
                        delete (cleanedItem as any).requiredDate;
                    }
                    return cleanedItem;
                })
            };

            await api.patch(`/sales-enquiries/${(selectedEnquiry as any)?._id}`, submissionData);
            await fetchEnquiries();
            setIsEditModalOpen(false);
            showToast('Sales enquiry updated successfully', 'success');
        } catch (error: any) {
            console.error('Error updating enquiry:', error);
            showToast(error?.response?.data?.message || 'Failed to update enquiry', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddFollowUp = async (e: React.FormEvent) => {
        e.preventDefault();

/*
        if (!newFollowUp.handledBy) {
            showToast('Please assign an Employee for this follow-up.', 'warning');
            return;
        }
*/

        if (!newFollowUp.remarks || newFollowUp.remarks.trim() === '') {
            showToast('Please enter follow-up remarks/notes.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const cleanedFollowUpItem: any = { ...newFollowUp };
            if (cleanedFollowUpItem.handledBy === '') delete cleanedFollowUpItem.handledBy;
            if (cleanedFollowUpItem.nextFollowUp === '') delete cleanedFollowUpItem.nextFollowUp;

            const updatedFollowUp = [...(selectedEnquiry.followUp || []), cleanedFollowUpItem];
            const updatedStatus = newFollowUp.status === 'Converted' ? 'Converted' :
                newFollowUp.status === 'Closed' ? 'Closed' : selectedEnquiry.status;

            await api.patch(`/sales-enquiries/${selectedEnquiry._id}`, {
                followUp: updatedFollowUp,
                status: updatedStatus
            });
            await fetchEnquiries();
            setIsFollowUpModalOpen(false);
            setNewFollowUp({
                date: format(new Date(), 'yyyy-MM-dd'),
                status: 'Pending',
                remarks: '',
                nextFollowUp: '',
                handledBy: ''
            });
            showToast('Follow-up updated successfully', 'success');
        } catch (error: any) {
            console.error('Error updating follow-up:', error);
            let msg = error?.response?.data?.message || 'Failed to update follow-up';
            if (msg.includes('validation failed') || msg.includes('Cast to ObjectId failed')) {
                msg = 'Please fill all required follow-up fields correctly.';
            }
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this enquiry?')) return;
        try {
            await api.delete(`/sales-enquiries/${id}`);
            fetchEnquiries();
            showToast('Enquiry deleted', 'info');
        } catch (error: any) {
            console.error('Error deleting enquiry:', error);
            const msg = error?.response?.data?.message || 'Failed to delete enquiry';
            showToast(msg, 'error');
        }
    };

    const filteredEnquiries = enquiries.filter(enq =>
        enq.enquiryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enq.customerId?.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Converted': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Closed': return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/sales">
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sales Enquiries</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Track incoming customer enquiries and interest</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase text-[11px] tracking-widest h-10 px-6">
                    <Plus className="h-4 w-4 mr-2" /> New Enquiry
                </Button>
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by enquiry number or customer name..."
                                className="pl-10 h-10 text-sm border-slate-200 dark:border-slate-700 rounded-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Enquiry Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Customer</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Items</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Source</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 font-medium text-slate-500">Loading enquiries...</TableCell></TableRow>
                            ) : filteredEnquiries.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10 font-medium text-slate-500">No enquiries found</TableCell></TableRow>
                            ) : (
                                filteredEnquiries.map((enq) => (
                                    <TableRow key={enq._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 font-medium">
                                        <TableCell className="w-[180px]">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{enq.enquiryNumber}</p>
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                                    <Calendar className="h-3 w-3" /> {format(new Date(enq.enquiryDate), 'dd MMM yyyy')}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                                    <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{enq.customerId?.partyName || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{enq.items?.length || 0} Items</span>
                                            {enq.items?.[0] && (
                                                <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">{enq.items[0].productName} ({enq.items[0].quantity})</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs text-slate-600 dark:text-slate-400">{enq.receivedThrough}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(enq.status)}`}>
                                                {enq.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                    title="View Details"
                                                    onClick={() => {
                                                        const doc = { ...enq };
                                                        doc.items = doc.items.map((it: any) => ({
                                                            ...it,
                                                            quantity: it.quantity === 0 ? '' : it.quantity,
                                                            specifications: {
                                                                ...it.specifications,
                                                                gsm: it.specifications.gsm === 0 ? '' : it.specifications.gsm
                                                            }
                                                        }));
                                                        setFormData(doc);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {enq.status === 'Open' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                        title="Edit Enquiry"
                                                        onClick={() => {
                                                            const doc = { ...enq };
                                                            doc.items = doc.items.map((it: any) => ({
                                                                ...it,
                                                                quantity: it.quantity === 0 ? '' : it.quantity,
                                                                specifications: {
                                                                    ...it.specifications,
                                                                    gsm: it.specifications.gsm === 0 ? '' : it.specifications.gsm
                                                                }
                                                            }));
                                                            setSelectedEnquiry(enq);
                                                            setFormData(doc);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                    title="Manage Follow-up"
                                                    onClick={() => {
                                                        setSelectedEnquiry(enq);
                                                        setIsFollowUpModalOpen(true);
                                                    }}
                                                >
                                                    <Activity className="h-4 w-4" />
                                                </Button>
                                                {enq.status === 'Open' && (
                                                    <Link href={`/dashboard/sales/quotation?enquiryId=${enq._id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                            title="Create Quotation"
                                                        >
                                                            <FilePlus className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50" 
                                                    title="Delete Enquiry"
                                                    onClick={() => handleDelete(enq._id)}
                                                >
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

            {/* Add Enquiry Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Sales Enquiry" className="max-w-5xl">
                <form onSubmit={handleAddEnquiry} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Enquiry Number">
                            <Input value={formData.enquiryNumber} readOnly className="bg-slate-50 font-bold uppercase tracking-wider" />
                        </FormField>
                        <FormField label="Enquiry Date">
                            <Input type="date" value={formData.enquiryDate} onChange={(e) => setFormData({ ...formData, enquiryDate: e.target.value })} />
                        </FormField>
                        <FormField label="Customer">
                            <Select
                                value={formData.customerId}
                                onChange={(val) => setFormData({ ...formData, customerId: val })}
                                options={parties.map(p => ({ value: p._id, label: p.partyName }))}
                                placeholder="Select Customer"
                            />
                        </FormField>
                        <FormField label="Customer Reference (PO/Ref)">
                            <Input
                                placeholder="Ref #123"
                                value={formData.customerReference}
                                onChange={(e) => setFormData({ ...formData, customerReference: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Received Through">
                            <Select
                                value={formData.receivedThrough}
                                onChange={(val) => setFormData({ ...formData, receivedThrough: val })}
                                options={[
                                    { value: 'Email', label: 'Email' },
                                    { value: 'Phone', label: 'Phone' },
                                    { value: 'Website', label: 'Website' },
                                    { value: 'In-person', label: 'In-person' },
                                    { value: 'Reference', label: 'Reference' },
                                    { value: 'Walk-in', label: 'Walk-in' }
                                ]}
                            />
                        </FormField>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Items Enquired</h3>
                            <Button type="button" onClick={handleAddItem} variant="outline" size="sm" className="h-7 text-[10px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                <Plus className="h-3 w-3 mr-1" /> Add Item
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-md bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <FormField label="Category">
                                            <Select
                                                value={item.category || ''}
                                                onChange={(val) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].category = val;
                                                    updated[idx].productId = '';
                                                    updated[idx].productName = '';
                                                    setFormData({ ...formData, items: updated });
                                                }}
                                                options={Array.from(new Set(products.map(p => p.productCategory))).filter(Boolean).map(c => ({ value: c as string, label: c as string }))}
                                                placeholder="Select Category"
                                            />
                                        </FormField>
                                        <FormField label="Product">
                                            <Select
                                                value={item.productId}
                                                onChange={(val) => {
                                                    const updated = [...formData.items];
                                                    const prod = products.find(p => p._id === val);
                                                    updated[idx].productId = val;
                                                    updated[idx].productName = prod?.productName || '';
                                                    if (!updated[idx].category && prod?.productCategory) {
                                                        updated[idx].category = prod.productCategory;
                                                    }
                                                    setFormData({ ...formData, items: updated });
                                                }}
                                                options={products.filter(p => !item.category || p.productCategory === item.category).map(p => ({ value: p._id, label: p.productName }))}
                                                placeholder="Select Product"
                                            />
                                        </FormField>
                                    </div>
                                    <FormField label="Quantity">
                                        <Input
                                            type="number"
                                            value={item.quantity || ''}
                                            onChange={(e) => {
                                                const updated = [...formData.items];
                                                updated[idx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                setFormData({ ...formData, items: updated });
                                            }}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Unit">
                                        <Input
                                            value={item.unit}
                                            onChange={(e) => {
                                                const updated = [...formData.items];
                                                updated[idx].unit = e.target.value;
                                                setFormData({ ...formData, items: updated });
                                            }}
                                        />
                                    </FormField>
                                    <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                                        <Input placeholder="Color (Red)" className="text-xs" value={item.specifications.color} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.color = e.target.value;
                                            setFormData({ ...formData, items: updated });
                                        }} />
                                        <Input placeholder="GSM" type="number" className="text-xs" value={item.specifications.gsm || ''} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.gsm = e.target.value === '' ? '' : Number(e.target.value);
                                            setFormData({ ...formData, items: updated });
                                        }} />
                                        <select className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:focus:ring-offset-slate-900" value={item.specifications.print || ''} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.print = e.target.value;
                                            setFormData({ ...formData, items: updated });
                                        }}>
                                            <option value="" disabled>Print / No Print</option>
                                            <option value="Print">Print</option>
                                            <option value="No Print">No Print</option>
                                        </select>
                                        <Input placeholder="Year" className="text-xs" value={item.specifications.year || ''} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.year = e.target.value;
                                            setFormData({ ...formData, items: updated });
                                        }} />
                                        <Input placeholder="Size (XL)" className="text-xs" value={item.specifications.size} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.size = e.target.value;
                                            setFormData({ ...formData, items: updated });
                                        }} />
                                        <div className="md:col-span-2">
                                            <FormField label="Required Date">
                                                <Input type="date" className="h-8 text-xs" value={item.requiredDate} onChange={(e) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].requiredDate = e.target.value;
                                                    setFormData({ ...formData, items: updated });
                                                }} />
                                            </FormField>
                                        </div>
                                    </div>

                                    {formData.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(idx)}
                                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 shadow-sm hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-100 dark:border-indigo-800">
                            <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400">Total Enquired Quantity</span>
                            <span className="text-sm font-black text-indigo-900 dark:text-white">
                                {formData.items.reduce((acc, item) => acc + (item.quantity || 0), 0)} {formData.items[0]?.unit || 'Units'}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Initial Follow-up</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Next Follow-up Date">
                                <Input type="date" value={formData.followUp[0].nextFollowUp} onChange={(e) => {
                                    const updated = [...formData.followUp];
                                    updated[0].nextFollowUp = e.target.value;
                                    setFormData({ ...formData, followUp: updated });
                                }} />
                            </FormField>
                            {/* 
                            <FormField label="Assign To (Employee)">
                                <Select
                                    value={formData.followUp[0].handledBy}
                                    onChange={(val) => {
                                        const updated = [...formData.followUp];
                                        updated[0].handledBy = val;
                                        setFormData({ ...formData, followUp: updated });
                                    }}
                                    options={employees.map(e => ({ value: e._id, label: e.name }))}
                                    placeholder="Select Employee"
                                />
                            </FormField>
                            */}
                            <div className="col-span-2">
                                <FormField label="Follow-up Remarks">
                                    <textarea
                                        className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold min-h-[80px]"
                                        placeholder="Enter initial requirements or notes..."
                                        value={formData.followUp[0].remarks}
                                        onChange={(e) => {
                                            const updated = [...formData.followUp];
                                            updated[0].remarks = e.target.value;
                                            setFormData({ ...formData, followUp: updated });
                                        }}
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)} className="text-[11px] font-black uppercase tracking-widest h-11 px-8">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-widest h-11 px-8 min-w-[140px]">
                            {isSubmitting ? 'Saving...' : 'Create Enquiry'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Manage Follow-up Modal */}
            <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title={`Manage Follow-up: ${selectedEnquiry?.enquiryNumber}`} className="max-w-5xl">
                {selectedEnquiry && (
                    <div className="space-y-6">
                        {/* History */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">History</h3>
                            <div className="max-h-[200px] overflow-y-auto space-y-3 pr-2">
                                {selectedEnquiry.followUp?.map((fu: any, idx: number) => (
                                    <div key={idx} className="p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                                {format(new Date(fu.date), 'dd MMM yyyy')}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${fu.status === 'Converted' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {fu.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{fu.remarks || 'No remarks provided'}</p>
                                        {fu.nextFollowUp && (
                                            <p className="text-[10px] text-slate-500 mt-2 font-bold italic">
                                                Next Contact: {format(new Date(fu.nextFollowUp), 'dd MMM yyyy')}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* New Follow-up Form */}
                        <form onSubmit={handleAddFollowUp} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Add New Follow-up</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Update Date">
                                    <Input type="date" value={newFollowUp.date} onChange={(e) => setNewFollowUp({ ...newFollowUp, date: e.target.value })} />
                                </FormField>
                                <FormField label="Status">
                                    <Select
                                        value={newFollowUp.status}
                                        onChange={(val) => setNewFollowUp({ ...newFollowUp, status: val })}
                                        options={[
                                            { value: 'Pending', label: 'Pending' },
                                            { value: 'Interested', label: 'Interested' },
                                            { value: 'Not Interested', label: 'Not Interested' },
                                            { value: 'Converted', label: 'Converted to Quotation' },
                                            { value: 'Closed', label: 'Closed' }
                                        ]}
                                    />
                                </FormField>
                                <FormField label="Next Contact Date">
                                    <Input type="date" value={newFollowUp.nextFollowUp} onChange={(e) => setNewFollowUp({ ...newFollowUp, nextFollowUp: e.target.value })} />
                                </FormField>
                                {/* 
                                <FormField label="Assign To">
                                    <Select
                                        value={newFollowUp.handledBy}
                                        onChange={(val) => setNewFollowUp({ ...newFollowUp, handledBy: val })}
                                        options={employees.map(e => ({ value: e._id, label: e.name }))}
                                        placeholder="Select Employee"
                                    />
                                </FormField>
                                */}
                                <div className="col-span-2">
                                    <FormField label="Notes / Requirements">
                                        <textarea
                                            className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold min-h-[80px]"
                                            value={newFollowUp.remarks}
                                            onChange={(e) => setNewFollowUp({ ...newFollowUp, remarks: e.target.value })}
                                            required
                                        />
                                    </FormField>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" type="button" onClick={() => setIsFollowUpModalOpen(false)} className="text-[10px] font-black uppercase h-9">Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase h-9 px-6">
                                    {isSubmitting ? 'Saving...' : 'Save Update'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
            {/* Edit Enquiry Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Sales Enquiry" className="max-w-5xl">
                <form onSubmit={handleEditEnquiry} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Enquiry Number">
                            <Input value={formData.enquiryNumber} readOnly className="bg-slate-50 font-bold uppercase tracking-wider" />
                        </FormField>
                        <FormField label="Enquiry Date">
                            <Input type="date" value={formData.enquiryDate} onChange={(e) => setFormData({ ...formData, enquiryDate: e.target.value })} />
                        </FormField>
                        <FormField label="Customer">
                            <Select
                                value={(formData.customerId as any)?._id || formData.customerId}
                                onChange={(val) => setFormData({ ...formData, customerId: val })}
                                options={parties.map(p => ({ value: p._id, label: p.partyName }))}
                                placeholder="Select Customer"
                            />
                        </FormField>
                        <FormField label="Customer Reference (PO/Ref)">
                            <Input
                                placeholder="Ref #123"
                                value={formData.customerReference}
                                onChange={(e) => setFormData({ ...formData, customerReference: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Received Through">
                            <Select
                                value={formData.receivedThrough}
                                onChange={(val) => setFormData({ ...formData, receivedThrough: val })}
                                options={[
                                    { value: 'Email', label: 'Email' },
                                    { value: 'Phone', label: 'Phone' },
                                    { value: 'Website', label: 'Website' },
                                    { value: 'In-person', label: 'In-person' },
                                    { value: 'Reference', label: 'Reference' },
                                    { value: 'Walk-in', label: 'Walk-in' }
                                ]}
                            />
                        </FormField>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Items Enquired</h3>
                            <Button type="button" onClick={handleAddItem} variant="outline" size="sm" className="h-7 text-[10px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                <Plus className="h-3 w-3 mr-1" /> Add Item
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {formData.items.map((item: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-md bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 relative">
                                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <FormField label="Category">
                                            <Select
                                                value={item.category || ''}
                                                onChange={(val) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].category = val;
                                                    updated[idx].productId = '';
                                                    updated[idx].productName = '';
                                                    setFormData({ ...formData, items: updated });
                                                }}
                                                options={Array.from(new Set(products.map(p => p.productCategory))).filter(Boolean).map(c => ({ value: c as string, label: c as string }))}
                                                placeholder="Select Category"
                                            />
                                        </FormField>
                                        <FormField label="Product">
                                            <Select
                                                value={item.productId?._id || item.productId}
                                                onChange={(val) => {
                                                    const updated = [...formData.items];
                                                    const prod = products.find(p => p._id === val);
                                                    updated[idx].productId = val;
                                                    updated[idx].productName = prod?.productName || '';
                                                    if (!updated[idx].category && prod?.productCategory) {
                                                        updated[idx].category = prod.productCategory;
                                                    }
                                                    setFormData({ ...formData, items: updated });
                                                }}
                                                options={products.filter(p => !item.category || p.productCategory === item.category).map(p => ({ value: p._id, label: p.productName }))}
                                                placeholder="Select Product"
                                            />
                                        </FormField>
                                    </div>
                                    <FormField label="Quantity">
                                        <Input
                                            type="number"
                                            value={item.quantity || ''}
                                            onChange={(e) => {
                                                const updated = [...formData.items];
                                                updated[idx].quantity = e.target.value === '' ? '' : Number(e.target.value);
                                                setFormData({ ...formData, items: updated });
                                            }}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Unit">
                                        <Input
                                            value={item.unit}
                                            onChange={(e) => {
                                                const updated = [...formData.items];
                                                updated[idx].unit = e.target.value;
                                                setFormData({ ...formData, items: updated });
                                            }}
                                        />
                                    </FormField>
                                    <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                                        <Input placeholder="Color (Red)" className="text-xs" value={item.specifications.color} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.color = e.target.value;
                                            setFormData({ ...formData, items: updated });
                                        }} />
                                        <Input placeholder="GSM" type="number" className="text-xs" value={item.specifications.gsm || ''} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.gsm = e.target.value === '' ? '' : Number(e.target.value);
                                            setFormData({ ...formData, items: updated });
                                        }} />
                                        <select className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:focus:ring-offset-slate-900" value={item.specifications.print || ''} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.print = e.target.value;
                                            setFormData({ ...formData, items: updated });
                                        }}>
                                            <option value="" disabled>Print / No Print</option>
                                            <option value="Print">Print</option>
                                            <option value="No Print">No Print</option>
                                        </select>
                                        <Input placeholder="Year" className="text-xs" value={item.specifications.year || ''} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.year = e.target.value;
                                            setFormData({ ...formData, items: updated });
                                        }} />
                                        <Input placeholder="Size (XL)" className="text-xs" value={item.specifications.size} onChange={(e) => {
                                            const updated = [...formData.items];
                                            updated[idx].specifications.size = e.target.value;
                                            setFormData({ ...formData, items: updated });
                                        }} />
                                        <div className="md:col-span-2">
                                            <FormField label="Required Date">
                                                <Input type="date" className="h-8 text-xs" value={item.requiredDate ? new Date(item.requiredDate).toISOString().split('T')[0] : ''} onChange={(e) => {
                                                    const updated = [...formData.items];
                                                    updated[idx].requiredDate = e.target.value;
                                                    setFormData({ ...formData, items: updated });
                                                }} />
                                            </FormField>
                                        </div>
                                    </div>

                                    {formData.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(idx)}
                                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 shadow-sm hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)} className="text-[11px] font-black uppercase tracking-widest h-11 px-8">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-widest h-11 px-8 min-w-[140px]">
                            {isSubmitting ? 'Updating...' : 'Update Enquiry'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Enquiry Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="View Sales Enquiry" className="max-w-5xl">
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Enquiry Number">
                            <Input value={formData.enquiryNumber} readOnly className="bg-slate-50 font-bold uppercase tracking-wider" />
                        </FormField>
                        <FormField label="Enquiry Date">
                            <Input value={formData.enquiryDate ? format(new Date(formData.enquiryDate), 'dd MMM yyyy') : 'N/A'} readOnly className="bg-slate-50 font-bold" />
                        </FormField>
                        <FormField label="Customer">
                            <Input value={(formData.customerId as any)?.partyName || 'N/A'} readOnly className="bg-slate-50 font-bold" />
                        </FormField>
                        <FormField label="Customer Reference">
                            <Input value={formData.customerReference || 'N/A'} readOnly className="bg-slate-50 font-bold" />
                        </FormField>
                        <FormField label="Received Through">
                            <Input value={formData.receivedThrough || 'N/A'} readOnly className="bg-slate-50 font-bold" />
                        </FormField>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Items Enquired</h3>
                        <div className="space-y-4">
                            {formData.items.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-md bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400">Product</p>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{item.productName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400">Category</p>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{item.category || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400">Quantity</p>
                                            <p className="text-xs font-black text-indigo-600">{item.quantity || 0} {item.unit}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400">Required Date</p>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                {item.requiredDate ? format(new Date(item.requiredDate), 'dd MMM yyyy') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400">Color</p>
                                            <p className="text-[10px] font-bold">{item.specifications.color || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400">GSM</p>
                                            <p className="text-[10px] font-bold">{item.specifications.gsm || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400">Print</p>
                                            <p className="text-[10px] font-bold">{item.specifications.print || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400">Year</p>
                                            <p className="text-[10px] font-bold">{item.specifications.year || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-400">Size</p>
                                            <p className="text-[10px] font-bold">{item.specifications.size || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="outline" type="button" onClick={() => setIsViewModalOpen(false)} className="text-[11px] font-black uppercase tracking-widest h-11 px-8">Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
