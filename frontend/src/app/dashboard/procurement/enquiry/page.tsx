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
    User,
    Clock,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    ExternalLink,
    Send
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function PurchaseEnquiryPage() {
    const { loading: authLoading } = useAuth();
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    // Features states
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (activeDropdown && !(e.target as Element).closest('.dropdown-container')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeDropdown]);

    // For Form Data
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [formData, setFormData] = useState({
        enquiryNumber: `ENQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        enquiryDate: new Date().toISOString().split('T')[0],
        enquiryType: 'Yarn',
        requiredByDate: '',
        priority: 'Normal',
        items: [{
            productId: '',
            productName: '',
            quantity: 0,
            unit: 'Kgs',
            requiredDate: '',
            specifications: {
                brand: '',
                quality: '',
                other: ''
            }
        }],
        suppliers: [],
        supplierNotes: {} as Record<string, string>,
        status: 'Open'
    });

    const fetchEnquiries = async () => {
        try {
            const res = await api.get('/purchase-enquiries');
            setEnquiries(res.data);
        } catch (error) {
            console.error('Error fetching enquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataForForm = async () => {
        try {
            const [prodRes, partyRes] = await Promise.all([
                api.get('/products'),
                api.get('/parties')
            ]);
            setProducts(prodRes.data);
            // Filter parties that are suppliers
            setSuppliers(partyRes.data.filter((p: any) => p.partyType === 'Supplier' || p.category === 'Supplier'));
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchEnquiries();
        fetchDataForForm();
    }, [authLoading]);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                productId: '',
                productName: '',
                quantity: 0,
                unit: 'Kgs',
                requiredDate: '',
                specifications: {
                    brand: '',
                    quality: '',
                    other: ''
                }
            }]
        });
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        if (field === 'productId') {
            const product = products.find((p: any) => p._id === value);
            newItems[index] = {
                ...newItems[index],
                productId: value,
                productName: product ? (product as any).productName : '',
                unit: product ? (product as any).inventory.unitOfMeasure : 'Kgs'
            };
        } else if (field.startsWith('specifications.')) {
            const specField = field.split('.')[1];
            newItems[index] = {
                ...newItems[index],
                specifications: {
                    ...newItems[index].specifications,
                    [specField]: value
                }
            };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setFormData({ ...formData, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/purchase-enquiries', formData);
            setIsAddModalOpen(false);
            fetchEnquiries();
            // Reset form
            setFormData({
                enquiryNumber: `ENQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                enquiryDate: new Date().toISOString().split('T')[0],
                enquiryType: 'Yarn',
                requiredByDate: '',
                priority: 'Normal',
                items: [{
                    productId: '',
                    productName: '',
                    quantity: 0,
                    unit: 'Kgs',
                    requiredDate: '',
                    specifications: { brand: '', quality: '', other: '' }
                }],
                suppliers: [],
                supplierNotes: {},
                status: 'Open'
            });
        } catch (error: any) {
            console.error('Error creating enquiry:', error);
            const errorMsg = error.response?.data?.message || error.message;
            showToast(errorMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendEnquiry = async (id: string) => {
        try {
            await api.post(`/purchase-enquiries/${id}/send`);
            showToast('Email/SMS sent successfully to suppliers', 'success');
            fetchEnquiries();
        } catch (error: any) {
            console.error('Error sending enquiry:', error);
            const msg = error.response?.data?.message || error.message;
            showToast(msg, 'error');
        }
    };

    const handleViewEnquiry = (enquiry: any) => {
        setSelectedEnquiry(enquiry);
        setIsViewModalOpen(true);
        setActiveDropdown(null);
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await api.put(`/purchase-enquiries/${id}`, { status });
            showToast(`Enquiry marked as ${status}`, 'success');
            fetchEnquiries();
            setActiveDropdown(null);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    const handleDeleteEnquiry = async (id: string) => {
        if (!window.confirm('Are you sure you want to completely delete this enquiry? This action cannot be undone.')) return;
        try {
            await api.delete(`/purchase-enquiries/${id}`);
            showToast('Enquiry deleted permanently', 'success');
            fetchEnquiries();
            setActiveDropdown(null);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete enquiry', 'error');
        }
    };

    const filteredEnquiries = enquiries.filter((enq: any) =>
        enq.enquiryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enq.enquiryType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" />
                    New Enquiry
                </Button>
            </div>

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Total Enquiries</p>
                            <p className="text-xl font-bold">{enquiries.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Open</p>
                            <p className="text-xl font-bold">{enquiries.filter((e: any) => e.status === 'Open').length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Closed</p>
                            <p className="text-xl font-bold">{enquiries.filter((e: any) => e.status === 'Closed').length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                            <XCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Cancelled</p>
                            <p className="text-xl font-bold">{enquiries.filter((e: any) => e.status === 'Cancelled').length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Table */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by enquiry number..."
                            className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 border-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableHead className="font-semibold">Enquiry Info</TableHead>
                                <TableHead className="font-semibold">Type & Priority</TableHead>
                                <TableHead className="font-semibold">Requirement Date</TableHead>
                                <TableHead className="font-semibold">Items Count</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                            <p>Loading enquiries...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredEnquiries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                        No enquiries found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEnquiries.map((enq: any) => (
                                    <TableRow key={enq._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white uppercase">{enq.enquiryNumber}</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(enq.enquiryDate), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium">{enq.enquiryType}</span>
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit ${enq.priority === 'Emergency' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                    enq.priority === 'High' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {enq.priority}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(enq.requiredByDate), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                                                {enq.items?.length || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${enq.status === 'Open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                enq.status === 'Closed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    enq.status === 'Sent' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                {enq.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/dashboard/procurement/enquiry/${enq._id}/compare`} passHref>
                                                    <Button variant="ghost" size="sm" className="h-8 p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 flex items-center gap-1" title="Compare Quotes">
                                                        <ClipboardList className="h-4 w-4" />
                                                        <span className="text-xs font-semibold">Compare</span>
                                                    </Button>
                                                </Link>
                                                {enq.status === 'Open' && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" title="Send to Suppliers" onClick={() => handleSendEnquiry(enq._id)}>
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Enquiry Details" onClick={() => handleViewEnquiry(enq)}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                
                                                <div className="relative dropdown-container">
                                                    <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${activeDropdown === enq._id ? 'bg-slate-100 dark:bg-slate-800' : ''}`} onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === enq._id ? null : enq._id);
                                                    }}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>

                                                    {activeDropdown === enq._id && (
                                                        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
                                                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                                Options
                                                            </div>
                                                            <div className="p-1">
                                                                <button 
                                                                    onClick={() => handleViewEnquiry(enq)}
                                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-sm font-medium transition-colors"
                                                                >
                                                                    View Details
                                                                </button>
                                                                {enq.status !== 'Cancelled' && enq.status !== 'Closed' && (
                                                                    <button 
                                                                        onClick={() => handleUpdateStatus(enq._id, 'Cancelled')}
                                                                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-sm font-medium transition-colors"
                                                                    >
                                                                        Discard / Cancel
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    onClick={() => handleDeleteEnquiry(enq._id)}
                                                                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-sm font-medium transition-colors mt-1 border-t border-slate-100 dark:border-slate-700 pt-2"
                                                                >
                                                                    Permanently Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Create New Purchase Enquiry"
                className="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="Enquiry Number">
                            <Input
                                disabled
                                value={formData.enquiryNumber}
                            />
                        </FormField>
                        <FormField label="Enquiry Type">
                            <select
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                                value={formData.enquiryType}
                                onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value as any })}
                            >
                                <option value="Yarn">Yarn</option>
                                <option value="Fabric">Fabric</option>
                                <option value="Accessories">Accessories</option>
                                <option value="JobWork">Job Work</option>
                            </select>
                        </FormField>
                        <FormField label="Priority">
                            <select
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                            >
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Enquiry Date">
                            <Input
                                type="date"
                                required
                                value={formData.enquiryDate}
                                onChange={(e) => setFormData({ ...formData, enquiryDate: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Required By Date">
                            <Input
                                type="date"
                                required
                                value={formData.requiredByDate}
                                onChange={(e) => setFormData({ ...formData, requiredByDate: e.target.value })}
                            />
                        </FormField>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Requirement Details</h3>
                            <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="text-indigo-600">
                                <Plus className="mr-1 h-4 w-4" /> Add Item
                            </Button>
                        </div>

                        {formData.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md relative group">
                                <div className="md:col-span-4">
                                    <FormField label="Product">
                                        <select
                                            required
                                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                                            value={item.productId}
                                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                        >
                                            <option value="">Select Product</option>
                                            {products.map((p: any) => (
                                                <option key={p._id} value={p._id}>{p.productName} ({p.productCode})</option>
                                            ))}
                                        </select>
                                    </FormField>
                                </div>
                                <div className="md:col-span-2">
                                    <FormField label="Qty">
                                        <Input
                                            type="number"
                                            required
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                        />
                                    </FormField>
                                </div>
                                <div className="md:col-span-2">
                                    <FormField label="Unit">
                                        <Input
                                            disabled
                                            value={item.unit}
                                        />
                                    </FormField>
                                </div>
                                <div className="md:col-span-3">
                                    <FormField label="Need By">
                                        <Input
                                            type="date"
                                            required
                                            value={item.requiredDate}
                                            onChange={(e) => handleItemChange(index, 'requiredDate', e.target.value)}
                                        />
                                    </FormField>
                                </div>
                                <div className="md:col-span-11 bg-white dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <FormField label="Brand">
                                        <Input
                                            placeholder="Ex: Vardhman"
                                            value={item.specifications?.brand || ''}
                                            onChange={(e) => handleItemChange(index, 'specifications.brand', e.target.value)}
                                        />
                                    </FormField>
                                    <FormField label="Quality">
                                        <Input
                                            placeholder="Ex: First Grade"
                                            value={item.specifications?.quality || ''}
                                            onChange={(e) => handleItemChange(index, 'specifications.quality', e.target.value)}
                                        />
                                    </FormField>
                                    <FormField label="Other Specs">
                                        <Input
                                            placeholder="Ex: Combed"
                                            value={item.specifications?.other || ''}
                                            onChange={(e) => handleItemChange(index, 'specifications.other', e.target.value)}
                                        />
                                    </FormField>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Suppliers Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Choose Suppliers & Specific Notes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suppliers.map((s: any) => (
                                <div key={s._id} className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.suppliers.includes(s._id as never)}
                                            onChange={(e) => {
                                                const newSuppliers = e.target.checked
                                                    ? [...formData.suppliers, s._id]
                                                    : formData.suppliers.filter(id => id !== s._id);

                                                const newNotes = { ...formData.supplierNotes };
                                                if (!e.target.checked) {
                                                    delete newNotes[s._id];
                                                }
                                                setFormData({ ...formData, suppliers: newSuppliers as any, supplierNotes: newNotes });
                                            }}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                        <span className="font-medium text-slate-800 dark:text-slate-200">{s.partyName}</span>
                                    </label>
                                    {formData.suppliers.includes(s._id as never) && (
                                        <div className="pl-6">
                                            <Input
                                                placeholder={`Specific notes for ${s.partyName}...`}
                                                className="h-8 text-sm bg-white dark:bg-slate-950"
                                                value={formData.supplierNotes[s._id] || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    supplierNotes: { ...formData.supplierNotes, [s._id]: e.target.value }
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
                            {isSubmitting ? 'Creating...' : 'Create Enquiry'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Enquiry Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Purchase Enquiry Details: ${selectedEnquiry?.enquiryNumber}`}
                className="max-w-4xl"
            >
                {selectedEnquiry && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Enquiry Date</p>
                                <p className="font-semibold text-slate-900 dark:text-white mt-1">{format(new Date(selectedEnquiry.enquiryDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Required By</p>
                                <p className="font-semibold text-slate-900 dark:text-white mt-1">{format(new Date(selectedEnquiry.requiredByDate), 'dd MMM yyyy')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Type / Priority</p>
                                <div className="flex gap-2 items-center mt-1">
                                    <span className="font-semibold">{selectedEnquiry.enquiryType}</span>
                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded w-fit ${selectedEnquiry.priority === 'Emergency' ? 'bg-rose-100 text-rose-700' : selectedEnquiry.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                                        {selectedEnquiry.priority}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Status</p>
                                <span className={`inline-flex mt-1 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${selectedEnquiry.status === 'Open' ? 'bg-blue-100 text-blue-700' : selectedEnquiry.status === 'Sent' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {selectedEnquiry.status}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-indigo-500" /> Requirement Items
                            </h3>
                            <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900">
                                        <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <th className="px-4 py-3">Product Description</th>
                                            <th className="px-4 py-3 text-center">Required Qty</th>
                                            <th className="px-4 py-3 text-center">Need By</th>
                                            <th className="px-4 py-3">Specifications</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
                                        {selectedEnquiry.items.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-900 dark:text-white">{item.productName || item.productId?.productName}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.productId?._id || item.productId}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-base">{item.quantity}</span>
                                                    <span className="text-xs text-slate-500 ml-1 font-medium">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-xs font-medium">
                                                    {item.requiredDate ? format(new Date(item.requiredDate), 'dd MMM yyyy') : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.specifications && (
                                                        <div className="flex flex-col gap-1 text-[10px]">
                                                            {item.specifications.brand && <span className="text-slate-600 dark:text-slate-400"><b className="text-slate-400 uppercase">Brand:</b> {item.specifications.brand}</span>}
                                                            {item.specifications.quality && <span className="text-slate-600 dark:text-slate-400"><b className="text-slate-400 uppercase">Quality:</b> {item.specifications.quality}</span>}
                                                            {item.specifications.other && <span className="text-slate-600 dark:text-slate-400"><b className="text-slate-400 uppercase">Other:</b> {item.specifications.other}</span>}
                                                            {!item.specifications.brand && !item.specifications.quality && !item.specifications.other && <span className="italic text-slate-400">Standard</span>}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <User className="h-4 w-4 text-emerald-500" /> Target Suppliers
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedEnquiry.suppliers && selectedEnquiry.suppliers.length > 0 ? selectedEnquiry.suppliers.map((sup: any) => (
                                    <div key={sup._id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                                        <p className="font-bold tracking-tight">{sup.partyName}</p>
                                        <div className="bg-white dark:bg-slate-950 p-2 text-xs italic text-slate-500 rounded border border-slate-100 dark:border-slate-800">
                                            {selectedEnquiry.supplierNotes && selectedEnquiry.supplierNotes[sup._id] ? (
                                                <span className="text-slate-700 dark:text-slate-300 font-medium">Note: {selectedEnquiry.supplierNotes[sup._id]}</span>
                                            ) : (
                                                <span>No specific notes.</span>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-md border border-dashed border-slate-200">No specific suppliers selected for this enquiry (Open Market).</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            {selectedEnquiry.status === 'Open' && (
                                <Button 
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                    onClick={() => {
                                        handleSendEnquiry(selectedEnquiry._id);
                                        setIsViewModalOpen(false);
                                    }}
                                >
                                    <Send className="h-4 w-4 mr-2" /> Send to Suppliers
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
