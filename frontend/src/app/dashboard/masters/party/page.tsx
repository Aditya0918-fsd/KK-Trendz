'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, Edit2, Trash2, UserCircle2,
    CreditCard, ChevronLeft, ChevronRight,
    Users, Truck, Briefcase, Landmark, ShieldCheck, Phone, Settings, CheckCircle2, X
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const ITEMS_PER_PAGE = 8;

const emptyContact = () => ({ name: '', designation: '', department: '', phone1: '', phone2: '', email: '', whatsapp: '', isPrimary: false });
const emptyBank = () => ({ beneficiaryName: '', bankName: '', accountNumber: '', ifscCode: '', swiftCode: '', branchName: '', isDefault: false });
const emptyJobWork = () => ({ processType: '', machineTypes: '', capacityPerDay: 0, ratePerUnit: 0, qualityStandards: '' });
const emptyProduct = () => ({ productCategory: '', brandNames: '', leadTime: 0, minimumOrder: 0 });

const initialFormState = () => ({
    partyName: '',
    partyCode: `PTY-${Math.floor(1000 + Math.random() * 9000)}`,
    partyType: 'Customer',
    partyGroup: '',
    legalName: '',
    tradeName: '',
    establishedYear: '',
    financial: {
        creditLimit: 0,
        creditDays: 30,
        paymentTerms: 'Payment on Delivery',
        openingBalance: 0,
        tdsApplicable: false,
        tdsSection: ''
    },
    addresses: [{
        address1: '', city: '', state: '', pincode: '', country: 'India',
        addressType: 'Billing', gstin: '', landmark: '', isDefault: true
    }],
    contacts: [{ ...emptyContact(), isPrimary: true }],
    taxDetails: { pan: '', tan: '', cin: '', iec: '', aadhar: '', gstRegistered: true, gstType: 'Regular' },
    bankAccounts: [{ ...emptyBank(), isDefault: true }],
    jobWorkCapabilities: [] as any[],
    suppliedProducts: [] as any[],
    documents: [] as any[],
    status: 'Pending Verification'
});

export default function PartyMasterPage() {
    const { loading: authLoading } = useAuth();
    const [parties, setParties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const { showToast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState<any>(initialFormState());
    const [editingParty, setEditingParty] = useState<any>(null);

    // ─── API Calls ───
    const fetchParties = async () => {
        try {
            const res = await api.get('/parties');
            setParties(res.data);
        } catch (error) {
            console.error('Error fetching parties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingParty) {
                await api.put(`/parties/${editingParty._id}`, formData);
            } else {
                await api.post('/parties', formData);
            }
            closeModal();
            fetchParties();
            showToast(`Party ${editingParty ? 'updated' : 'created'} successfully`, 'success');
        } catch (error: any) {
            console.error('Error saving party:', error);
            const msg = error?.response?.data?.message || 'Failed to save party';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAddModal = () => {
        setFormData(initialFormState());
        setEditingParty(null);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const openEditModal = (party: any) => {
        setFormData({
            partyName: party.partyName || '',
            partyCode: party.partyCode || '',
            partyType: party.partyType || 'Customer',
            partyGroup: party.partyGroup || '',
            legalName: party.legalName || '',
            tradeName: party.tradeName || '',
            establishedYear: party.establishedYear || '',
            financial: {
                creditLimit: party.financial?.creditLimit || 0,
                creditDays: party.financial?.creditDays || 30,
                paymentTerms: party.financial?.paymentTerms || 'Payment on Delivery',
                openingBalance: party.financial?.openingBalance || 0,
                tdsApplicable: party.financial?.tdsApplicable || false,
                tdsSection: party.financial?.tdsSection || ''
            },
            addresses: party.addresses?.length > 0
                ? party.addresses.map((a: any) => ({
                    address1: a.address1 || '', city: a.city || '', state: a.state || '',
                    pincode: a.pincode || '', country: a.country || 'India',
                    addressType: a.addressType || 'Billing', gstin: a.gstin || '',
                    landmark: a.landmark || '', isDefault: a.isDefault ?? false
                }))
                : [{ address1: '', city: '', state: '', pincode: '', country: 'India', addressType: 'Billing', gstin: '', landmark: '', isDefault: true }],
            contacts: party.contacts?.length > 0
                ? party.contacts.map((c: any) => ({ ...emptyContact(), ...c, name: c.name || '', designation: c.designation || '', department: c.department || '', phone1: c.phone1 || '', phone2: c.phone2 || '', email: c.email || '', whatsapp: c.whatsapp || '' }))
                : [{ ...emptyContact(), isPrimary: true }],
            taxDetails: {
                pan: party.taxDetails?.pan || '',
                tan: party.taxDetails?.tan || '',
                cin: party.taxDetails?.cin || '',
                iec: party.taxDetails?.iec || '',
                aadhar: party.taxDetails?.aadhar || '',
                gstRegistered: party.taxDetails?.gstRegistered ?? true,
                gstType: party.taxDetails?.gstType || 'Regular'
            },
            bankAccounts: party.bankAccounts?.length > 0
                ? party.bankAccounts.map((b: any) => ({ ...emptyBank(), ...b, beneficiaryName: b.beneficiaryName || '', bankName: b.bankName || '', accountNumber: b.accountNumber || '', ifscCode: b.ifscCode || '', swiftCode: b.swiftCode || '', branchName: b.branchName || '' }))
                : [{ ...emptyBank(), isDefault: true }],
            jobWorkCapabilities: (party.jobWorkCapabilities || []).map((j: any) => ({ ...emptyJobWork(), ...j, processType: j.processType || '', machineTypes: j.machineTypes || '', qualityStandards: j.qualityStandards || '' })),
            suppliedProducts: (party.suppliedProducts || []).map((p: any) => ({ ...emptyProduct(), ...p, productCategory: p.productCategory || '', brandNames: p.brandNames || '' })),
            documents: party.documents || [],
            status: party.status || 'Active'
        });
        setEditingParty(party);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingParty(null);
        setFormData(initialFormState());
        setActiveTab('general');
    };

    const handleDeleteParty = async (party: any) => {
        if (!confirm(`Are you sure you want to delete "${party.partyName}"?`)) return;
        try {
            await api.delete(`/parties/${party._id}`);
            fetchParties();
            showToast('Party deleted successfully', 'info');
        } catch (error: any) {
            console.error('Error deleting party:', error);
            const msg = error?.response?.data?.message || 'Failed to delete party';
            showToast(msg, 'error');
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchParties();
    }, [authLoading]);

    // ─── Computed values ───
    const stats = useMemo(() => {
        const counts = {
            Total: parties.length,
            Customer: parties.filter((p) => p.partyType === 'Customer').length,
            Supplier: parties.filter((p) => p.partyType === 'Supplier').length,
            'Job Worker': parties.filter((p) => p.partyType === 'Job Worker').length,
        };
        const chartData = [
            { name: 'Customers', value: counts.Customer },
            { name: 'Suppliers', value: counts.Supplier },
            { name: 'Job Workers', value: counts['Job Worker'] },
        ].filter(d => d.value > 0);
        return { counts, chartData };
    }, [parties]);

    const filteredParties = useMemo(() => {
        return parties.filter((p) => {
            const matchesSearch =
                p.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.partyCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.taxDetails?.pan?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'All' || p.partyType === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [parties, searchTerm, typeFilter]);

    const totalPages = Math.ceil(filteredParties.length / ITEMS_PER_PAGE);
    const paginatedParties = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredParties.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredParties, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, typeFilter]);

    // ─── Dynamic tabs based on party type ───
    const TABS = [
        { id: 'general', label: 'Basic Info', icon: UserCircle2 },
        { id: 'contacts', label: 'Contacts', icon: Phone },
        { id: 'financial', label: 'Financial', icon: CreditCard },
        { id: 'tax', label: 'Tax & Docs', icon: ShieldCheck },
        { id: 'bank', label: 'Bank', icon: Landmark },
        ...(formData.partyType === 'Job Worker' ? [{ id: 'jobwork', label: 'Job Work', icon: Settings }] : []),
        ...(formData.partyType === 'Supplier' ? [{ id: 'supplier', label: 'Supplier Info', icon: Truck }] : []),
        { id: 'approval', label: 'Approval', icon: CheckCircle2 },
    ];

    // ─── Array updater helpers ───
    const updateAddr = (idx: number, field: string, val: any) => {
        const nd = [...formData.addresses];
        nd[idx] = { ...nd[idx], [field]: val };
        setFormData({ ...formData, addresses: nd });
    };
    const updateContact = (idx: number, field: string, val: any) => {
        const nd = [...formData.contacts];
        nd[idx] = { ...nd[idx], [field]: val };
        setFormData({ ...formData, contacts: nd });
    };
    const updateBank = (idx: number, field: string, val: any) => {
        const nd = [...formData.bankAccounts];
        nd[idx] = { ...nd[idx], [field]: val };
        setFormData({ ...formData, bankAccounts: nd });
    };
    const updateJobWork = (idx: number, field: string, val: any) => {
        const nd = [...formData.jobWorkCapabilities];
        nd[idx] = { ...nd[idx], [field]: val };
        setFormData({ ...formData, jobWorkCapabilities: nd });
    };
    const updateProduct = (idx: number, field: string, val: any) => {
        const nd = [...formData.suppliedProducts];
        nd[idx] = { ...nd[idx], [field]: val };
        setFormData({ ...formData, suppliedProducts: nd });
    };

    return (
        <div className="space-y-6">

            {/* ─── Stats Row ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Customers', value: stats.counts.Customer, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                        { label: 'Total Suppliers', value: stats.counts.Supplier, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Job Workers', value: stats.counts['Job Worker'], icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    ].map((s, i) => (
                        <Card key={i} className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{s.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}><s.icon size={20} /></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="border-none shadow-sm h-full">
                    <CardContent className="p-4 h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.chartData} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                                    {stats.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Table ─── */}
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search by Name, Code or PAN..."
                                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl">
                                {['All', 'Customer', 'Supplier', 'Job Worker'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTypeFilter(t)}
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${typeFilter === t ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]"
                            onClick={openAddModal}
                        >
                            <Plus className="mr-2 h-4 w-4" /> New Party
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                            <TableRow className="border-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">Party Details</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Type & Group</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Tax Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Financial</TableHead>
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
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading records...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedParties.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                            <Search size={40} className="text-slate-300 mb-2" />
                                            <p className="font-bold text-sm tracking-tight text-slate-400">No parties found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedParties.map((party) => (
                                    <TableRow key={party._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b last:border-0 border-b-slate-50 dark:border-b-slate-800/50">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors shadow-sm">
                                                    <UserCircle2 className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-1">{party.partyName}</div>
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono italic">{party.partyCode}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`inline-flex items-center w-fit rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${party.partyType === 'Customer' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-700/10' : party.partyType === 'Supplier' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-700/10'}`}>
                                                    {party.partyType}
                                                </span>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{party.partyGroup || 'Unassigned'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {party.taxDetails?.pan && <div className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">PAN: {party.taxDetails.pan}</div>}
                                                {party.addresses?.[0]?.gstin && <div className="text-[10px] font-black text-emerald-600 uppercase">GST: {party.addresses[0].gstin}</div>}
                                                {!party.taxDetails?.pan && !party.addresses?.[0]?.gstin && <span className="text-[10px] italic text-slate-400">No Tax Info</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    <CreditCard className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                                    ₹{(party.financial?.creditLimit || 0).toLocaleString()}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase italic">{party.financial?.paymentTerms}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${party.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400' : party.status === 'Pending Verification' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-600/20'}`}>
                                                {party.status || 'Active'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(party)}
                                                    className="h-8 w-8 p-0 text-slate-600"
                                                >
                                                    <Edit2 size={15} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteParty(party)}
                                                    className="h-8 w-8 p-0 text-red-500"
                                                >
                                                    <Trash2 size={15} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-6 border-t border-slate-50 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Showing <span className="text-slate-900 dark:text-white">{paginatedParties.length}</span> of{' '}
                                <span className="text-slate-900 dark:text-white">{filteredParties.length}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="h-9 px-4 rounded-xl border-slate-200 text-[10px] font-black uppercase"
                                >
                                    <ChevronLeft size={16} className="mr-2" /> Previous
                                </Button>
                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`h-9 w-9 rounded-xl text-[11px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="h-9 px-4 rounded-xl border-slate-200 text-[10px] font-black uppercase"
                                >
                                    Next <ChevronRight size={16} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── Add / Edit Modal ─── */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingParty ? `Edit Party: ${editingParty.partyName}` : 'Register New Party'}
            >
                {/* Tab Navigation */}
                <div className="flex gap-0.5 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <tab.icon size={12} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="h-[440px] overflow-y-auto pr-1 space-y-4">

                        {/* ─── Basic Info ─── */}
                        {activeTab === 'general' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Trade / Brand Name *">
                                        <Input required placeholder="e.g. Ravi Textiles" value={formData.partyName} onChange={e => setFormData({ ...formData, partyName: e.target.value })} />
                                    </FormField>
                                    <FormField label="Party Code *">
                                        <Input required className="font-mono uppercase" value={formData.partyCode} onChange={e => setFormData({ ...formData, partyCode: e.target.value })} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Legal Name">
                                        <Input placeholder="Full legal entity name" value={formData.legalName} onChange={e => setFormData({ ...formData, legalName: e.target.value })} />
                                    </FormField>
                                    <FormField label="Party Type *">
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none"
                                            value={formData.partyType}
                                            onChange={e => setFormData({ ...formData, partyType: e.target.value })}
                                        >
                                            <option value="Customer">Customer</option>
                                            <option value="Supplier">Supplier</option>
                                            <option value="Job Worker">Job Worker</option>
                                            <option value="Transporter">Transporter</option>
                                        </select>
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Party Group">
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none"
                                            value={formData.partyGroup}
                                            onChange={e => setFormData({ ...formData, partyGroup: e.target.value })}
                                        >
                                            <option value="">Select Group</option>
                                            <option>Exporter</option>
                                            <option>Wholesaler</option>
                                            <option>Retailer</option>
                                            <option>Manufacturer</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Establishment Year">
                                        <Input type="number" placeholder="e.g. 2010" value={formData.establishedYear} onChange={e => setFormData({ ...formData, establishedYear: e.target.value })} />
                                    </FormField>
                                </div>
                                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">Billing Address</p>
                                    <FormField label="Address Line 1">
                                        <Input placeholder="Street, Building" value={formData.addresses[0].address1} onChange={e => updateAddr(0, 'address1', e.target.value)} />
                                    </FormField>
                                    <div className="grid grid-cols-3 gap-3 mt-3">
                                        <FormField label="City">
                                            <Input placeholder="Mumbai" value={formData.addresses[0].city} onChange={e => updateAddr(0, 'city', e.target.value)} />
                                        </FormField>
                                        <FormField label="State">
                                            <Input placeholder="Maharashtra" value={formData.addresses[0].state} onChange={e => updateAddr(0, 'state', e.target.value)} />
                                        </FormField>
                                        <FormField label="Pincode">
                                            <Input placeholder="400001" value={formData.addresses[0].pincode} onChange={e => updateAddr(0, 'pincode', e.target.value)} />
                                        </FormField>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <FormField label="GSTIN (State-specific)">
                                            <Input placeholder="27AAAAA0000A1Z5" value={formData.addresses[0].gstin} onChange={e => updateAddr(0, 'gstin', e.target.value)} />
                                        </FormField>
                                        <FormField label="Landmark">
                                            <Input placeholder="Near railway station" value={formData.addresses[0].landmark} onChange={e => updateAddr(0, 'landmark', e.target.value)} />
                                        </FormField>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Contacts ─── */}
                        {activeTab === 'contacts' && (
                            <div className="space-y-4">
                                {formData.contacts.map((c: any, idx: number) => (
                                    <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Contact #{idx + 1}</p>
                                            <div className="flex items-center gap-3">
                                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={c.isPrimary}
                                                        onChange={e => {
                                                            const nd = formData.contacts.map((x: any, i: number) => ({ ...x, isPrimary: i === idx ? e.target.checked : false }));
                                                            setFormData({ ...formData, contacts: nd });
                                                        }}
                                                        className="rounded"
                                                    />
                                                    Primary Contact
                                                </label>
                                                {idx > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, contacts: formData.contacts.filter((_: any, i: number) => i !== idx) })}
                                                        className="text-rose-500 text-xs font-bold"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Full Name"><Input placeholder="Contact Person Name" value={c.name} onChange={e => updateContact(idx, 'name', e.target.value)} /></FormField>
                                            <FormField label="Designation"><Input placeholder="Manager, Director" value={c.designation} onChange={e => updateContact(idx, 'designation', e.target.value)} /></FormField>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Department"><Input placeholder="Sales, Accounts" value={c.department} onChange={e => updateContact(idx, 'department', e.target.value)} /></FormField>
                                            <FormField label="Mobile"><Input placeholder="+91 98765 43210" value={c.phone1} onChange={e => updateContact(idx, 'phone1', e.target.value)} /></FormField>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Landline"><Input placeholder="022-12345678" value={c.phone2} onChange={e => updateContact(idx, 'phone2', e.target.value)} /></FormField>
                                            <FormField label="WhatsApp"><Input placeholder="+91 98765 43210" value={c.whatsapp} onChange={e => updateContact(idx, 'whatsapp', e.target.value)} /></FormField>
                                        </div>
                                        <FormField label="Email"><Input type="email" placeholder="contact@party.com" value={c.email} onChange={e => updateContact(idx, 'email', e.target.value)} /></FormField>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-indigo-400 hover:text-indigo-500 font-bold uppercase text-xs tracking-widest"
                                    onClick={() => setFormData({ ...formData, contacts: [...formData.contacts, emptyContact()] })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Contact Person
                                </Button>
                            </div>
                        )}

                        {/* ─── Financial ─── */}
                        {activeTab === 'financial' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Credit Limit (₹)">
                                        <Input type="number" value={formData.financial.creditLimit} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, creditLimit: Number(e.target.value) } })} />
                                    </FormField>
                                    <FormField label="Credit Days">
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none"
                                            value={formData.financial.creditDays}
                                            onChange={e => setFormData({ ...formData, financial: { ...formData.financial, creditDays: Number(e.target.value) } })}
                                        >
                                            {[0, 15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
                                        </select>
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Payment Terms">
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none"
                                            value={formData.financial.paymentTerms}
                                            onChange={e => setFormData({ ...formData, financial: { ...formData.financial, paymentTerms: e.target.value } })}
                                        >
                                            <option>Payment on Delivery</option>
                                            <option>Net 30</option>
                                            <option>Advance</option>
                                            <option>LC (Letter of Credit)</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Opening Balance (₹)">
                                        <Input type="number" value={formData.financial.openingBalance} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, openingBalance: Number(e.target.value) } })} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="TDS Applicable">
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none"
                                            value={formData.financial.tdsApplicable ? 'Yes' : 'No'}
                                            onChange={e => setFormData({ ...formData, financial: { ...formData.financial, tdsApplicable: e.target.value === 'Yes' } })}
                                        >
                                            <option>No</option>
                                            <option>Yes</option>
                                        </select>
                                    </FormField>
                                    {formData.financial.tdsApplicable && (
                                        <FormField label="TDS Section">
                                            <Input placeholder="e.g. 194C, 194H" value={formData.financial.tdsSection} onChange={e => setFormData({ ...formData, financial: { ...formData.financial, tdsSection: e.target.value } })} />
                                        </FormField>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── Tax & Documents ─── */}
                        {activeTab === 'tax' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="GST Registration Status">
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none"
                                            value={formData.taxDetails.gstType}
                                            onChange={e => setFormData({ ...formData, taxDetails: { ...formData.taxDetails, gstType: e.target.value } })}
                                        >
                                            <option>Regular</option>
                                            <option>Composition</option>
                                            <option>Unregistered</option>
                                            <option>SEZ</option>
                                        </select>
                                    </FormField>
                                    <FormField label="PAN">
                                        <Input placeholder="ABCDE1234F" maxLength={10} value={formData.taxDetails.pan} onChange={e => setFormData({ ...formData, taxDetails: { ...formData.taxDetails, pan: e.target.value } })} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="TAN">
                                        <Input placeholder="ABCD12345E" value={formData.taxDetails.tan} onChange={e => setFormData({ ...formData, taxDetails: { ...formData.taxDetails, tan: e.target.value } })} />
                                    </FormField>
                                    <FormField label="CIN (Companies)">
                                        <Input placeholder="U74999MH2000PTC123456" value={formData.taxDetails.cin} onChange={e => setFormData({ ...formData, taxDetails: { ...formData.taxDetails, cin: e.target.value } })} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="IEC (Export Customers)">
                                        <Input placeholder="AAAA0000AA" value={formData.taxDetails.iec} onChange={e => setFormData({ ...formData, taxDetails: { ...formData.taxDetails, iec: e.target.value } })} />
                                    </FormField>
                                    <FormField label="Aadhaar (Individuals)">
                                        <Input placeholder="0000 0000 0000" value={formData.taxDetails.aadhar} onChange={e => setFormData({ ...formData, taxDetails: { ...formData.taxDetails, aadhar: e.target.value } })} />
                                    </FormField>
                                </div>
                                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">Document References</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['GST Certificate', 'PAN Card', 'MSME Certificate', 'Cancelled Cheque', 'Address Proof'].map(docType => {
                                            const existing = formData.documents.find((d: any) => d.documentType === docType);
                                            return (
                                                <FormField key={docType} label={docType}>
                                                    <Input
                                                        placeholder="URL or file reference"
                                                        value={existing?.fileUrl || ''}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const docs = formData.documents.filter((d: any) => d.documentType !== docType);
                                                            if (val) docs.push({ documentType: docType, fileUrl: val });
                                                            setFormData({ ...formData, documents: docs });
                                                        }}
                                                    />
                                                </FormField>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Bank Accounts ─── */}
                        {activeTab === 'bank' && (
                            <div className="space-y-4">
                                {formData.bankAccounts.map((bank: any, idx: number) => (
                                    <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Bank Account #{idx + 1}</p>
                                            <div className="flex items-center gap-3">
                                                <label className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={bank.isDefault}
                                                        onChange={e => {
                                                            const nd = formData.bankAccounts.map((b: any, i: number) => ({ ...b, isDefault: i === idx ? e.target.checked : false }));
                                                            setFormData({ ...formData, bankAccounts: nd });
                                                        }}
                                                        className="rounded"
                                                    />
                                                    Default
                                                </label>
                                                {idx > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, bankAccounts: formData.bankAccounts.filter((_: any, i: number) => i !== idx) })}
                                                        className="text-rose-500 text-xs font-bold"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Beneficiary Name"><Input value={bank.beneficiaryName} onChange={e => updateBank(idx, 'beneficiaryName', e.target.value)} /></FormField>
                                            <FormField label="Bank Name & Branch"><Input value={bank.bankName} onChange={e => updateBank(idx, 'bankName', e.target.value)} /></FormField>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Account Number"><Input className="font-mono" value={bank.accountNumber} onChange={e => updateBank(idx, 'accountNumber', e.target.value)} /></FormField>
                                            <FormField label="IFSC Code"><Input className="font-mono uppercase" value={bank.ifscCode} onChange={e => updateBank(idx, 'ifscCode', e.target.value)} /></FormField>
                                        </div>
                                        <FormField label="SWIFT Code (International)">
                                            <Input placeholder="SBININBB" value={bank.swiftCode} onChange={e => updateBank(idx, 'swiftCode', e.target.value)} />
                                        </FormField>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-indigo-400 hover:text-indigo-500 font-bold uppercase text-xs tracking-widest"
                                    onClick={() => setFormData({ ...formData, bankAccounts: [...formData.bankAccounts, emptyBank()] })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Bank Account
                                </Button>
                            </div>
                        )}

                        {/* ─── Job Work (Job Worker only) ─── */}
                        {activeTab === 'jobwork' && (
                            <div className="space-y-4">
                                {formData.jobWorkCapabilities.map((jw: any, idx: number) => (
                                    <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Service #{idx + 1}</p>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, jobWorkCapabilities: formData.jobWorkCapabilities.filter((_: any, i: number) => i !== idx) })}
                                                className="text-rose-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Process Type">
                                                <select
                                                    className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none"
                                                    value={jw.processType}
                                                    onChange={e => updateJobWork(idx, 'processType', e.target.value)}
                                                >
                                                    <option value="">Select Process</option>
                                                    <option>Knitting</option>
                                                    <option>Dyeing</option>
                                                    <option>Printing</option>
                                                    <option>Embroidery</option>
                                                    <option>Stitching</option>
                                                    <option>Cutting</option>
                                                </select>
                                            </FormField>
                                            <FormField label="Machine Types">
                                                <Input placeholder="Brother, Juki" value={jw.machineTypes} onChange={e => updateJobWork(idx, 'machineTypes', e.target.value)} />
                                            </FormField>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Capacity / Day (units)">
                                                <Input type="number" value={jw.capacityPerDay} onChange={e => updateJobWork(idx, 'capacityPerDay', Number(e.target.value))} />
                                            </FormField>
                                            <FormField label="Rate Per Unit (₹)">
                                                <Input type="number" value={jw.ratePerUnit} onChange={e => updateJobWork(idx, 'ratePerUnit', Number(e.target.value))} />
                                            </FormField>
                                        </div>
                                        <FormField label="Quality Certifications">
                                            <Input placeholder="ISO 9001, GOTS" value={jw.qualityStandards} onChange={e => updateJobWork(idx, 'qualityStandards', e.target.value)} />
                                        </FormField>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-indigo-400 hover:text-indigo-500 font-bold uppercase text-xs tracking-widest"
                                    onClick={() => setFormData({ ...formData, jobWorkCapabilities: [...formData.jobWorkCapabilities, emptyJobWork()] })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Job Work Service
                                </Button>
                            </div>
                        )}

                        {/* ─── Supplier Info (Supplier only) ─── */}
                        {activeTab === 'supplier' && (
                            <div className="space-y-4">
                                {formData.suppliedProducts.map((sp: any, idx: number) => (
                                    <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Product Category #{idx + 1}</p>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, suppliedProducts: formData.suppliedProducts.filter((_: any, i: number) => i !== idx) })}
                                                className="text-rose-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Category">
                                                <select
                                                    className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none"
                                                    value={sp.productCategory}
                                                    onChange={e => updateProduct(idx, 'productCategory', e.target.value)}
                                                >
                                                    <option value="">Select Category</option>
                                                    <option>Yarn</option>
                                                    <option>Fabric</option>
                                                    <option>Accessories</option>
                                                    <option>Dye & Chemical</option>
                                                </select>
                                            </FormField>
                                            <FormField label="Brand Names">
                                                <Input placeholder="Vardhman, Raymond" value={sp.brandNames} onChange={e => updateProduct(idx, 'brandNames', e.target.value)} />
                                            </FormField>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Minimum Order Qty">
                                                <Input type="number" value={sp.minimumOrder} onChange={e => updateProduct(idx, 'minimumOrder', Number(e.target.value))} />
                                            </FormField>
                                            <FormField label="Lead Time (days)">
                                                <Input type="number" value={sp.leadTime} onChange={e => updateProduct(idx, 'leadTime', Number(e.target.value))} />
                                            </FormField>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-indigo-400 hover:text-indigo-500 font-bold uppercase text-xs tracking-widest"
                                    onClick={() => setFormData({ ...formData, suppliedProducts: [...formData.suppliedProducts, emptyProduct()] })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Product Category
                                </Button>
                            </div>
                        )}

                        {/* ─── Approval ─── */}
                        {activeTab === 'approval' && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                                    <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-1">Approval Workflow</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Select the party's current approval status.</p>
                                </div>
                                <FormField label="Party Status">
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Pending Verification">Pending Verification</option>
                                        <option value="Active">Active (Approved)</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Blacklisted">Blacklisted</option>
                                    </select>
                                </FormField>
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    {[
                                        { status: 'Pending Verification', color: 'border-amber-400 bg-amber-50 text-amber-700', label: '⏳ Pending' },
                                        { status: 'Active', color: 'border-emerald-400 bg-emerald-50 text-emerald-700', label: '✅ Active' },
                                        { status: 'Inactive', color: 'border-slate-400 bg-slate-50 text-slate-700', label: '⏸ Inactive' },
                                    ].map(s => (
                                        <button
                                            key={s.status}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: s.status })}
                                            className={`p-3 rounded-lg border-2 text-[10px] font-black uppercase tracking-wider text-center transition-all ${formData.status === s.status ? s.color : 'border-slate-200 text-slate-400'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
                                    <strong>Note:</strong> Only &quot;Active&quot; parties can be used in transactions.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Footer / Nav ─── */}
                    <div className="flex justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-2">
                            {TABS.findIndex(t => t.id === activeTab) > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        const idx = TABS.findIndex(t => t.id === activeTab);
                                        setActiveTab(TABS[idx - 1].id);
                                    }}
                                >
                                    ← Prev
                                </Button>
                            )}
                            {activeTab !== TABS[TABS.length - 1].id && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        const idx = TABS.findIndex(t => t.id === activeTab);
                                        setActiveTab(TABS[idx + 1].id);
                                    }}
                                >
                                    Next →
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">
                                {isSubmitting ? 'Saving...' : editingParty ? 'Update Party' : 'Register Party'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
