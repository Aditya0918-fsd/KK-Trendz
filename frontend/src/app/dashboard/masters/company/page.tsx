'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Edit2, Trash2, ArrowLeft, Building2, Globe, Mail, Phone, MapPin, Briefcase, Building, Landmark, Receipt, FileText, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

export default function CompanyMasterPage() {
    const { loading: authLoading } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCompany, setEditingCompany] = useState<any>(null);

    const [activeTab, setActiveTab] = useState('profile');
    const { showToast } = useToast();

    // Form State
    const initialFormState = {
        companyName: '',
        companyCode: '',
        companyType: 'Private Limited',
        unitType: 'Manufacturing',
        registrationDetails: {
            gstin: '',
            pan: '',
            cin: '',
            iec: '',
            tan: '',
            msme: ''
        },
        contact: {
            email: '',
            phone1: '',
            phone2: '',
            website: ''
        },
        address: {
            registeredOffice: {
                address1: '',
                city: '',
                state: '',
                pincode: '',
                country: ''
            },
            factoryAddress: {
                address1: '',
                city: '',
                state: '',
                pincode: ''
            }
        },
        bankDetails: [],
        financialSettings: {
            financialYear: '2024-25',
            booksBeginningDate: '',
            currency: 'INR',
            decimalPrecision: 2
        },
        status: 'Active'
    };

    const [formData, setFormData] = useState<any>(initialFormState);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/companies');
            setCompanies(res.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCompany) {
                await api.put(`/companies/${editingCompany._id}`, formData);
            } else {
                await api.post('/companies', formData);
            }
            setIsAddModalOpen(false);
            setEditingCompany(null);
            showToast(editingCompany ? 'Company updated successfully' : 'Company added successfully', 'success');
            fetchCompanies();
            setFormData(initialFormState);
        } catch (error: any) {
            console.error('Error saving company:', error);
            showToast(error.response?.data?.message || 'Failed to save company', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (company: any) => {
        setEditingCompany(company);
        setFormData({
            companyName: company.companyName || '',
            companyCode: company.companyCode || '',
            companyType: company.companyType || 'Private Limited',
            unitType: company.unitType || 'Manufacturing',
            registrationDetails: {
                gstin: company.registrationDetails?.gstin || '',
                pan: company.registrationDetails?.pan || '',
                cin: company.registrationDetails?.cin || '',
                iec: company.registrationDetails?.iec || '',
                tan: company.registrationDetails?.tan || '',
                msme: company.registrationDetails?.msme || ''
            },
            contact: {
                email: company.contact?.email || '',
                phone1: company.contact?.phone1 || '',
                phone2: company.contact?.phone2 || '',
                website: company.contact?.website || ''
            },
            address: {
                registeredOffice: {
                    address1: company.address?.registeredOffice?.address1 || '',
                    city: company.address?.registeredOffice?.city || '',
                    state: company.address?.registeredOffice?.state || '',
                    pincode: company.address?.registeredOffice?.pincode || '',
                    country: company.address?.registeredOffice?.country || ''
                },
                factoryAddress: {
                    address1: company.address?.factoryAddress?.address1 || '',
                    city: company.address?.factoryAddress?.city || '',
                    state: company.address?.factoryAddress?.state || '',
                    pincode: company.address?.factoryAddress?.pincode || ''
                }
            },
            bankDetails: company.bankDetails || [],
            financialSettings: {
                financialYear: company.financialSettings?.financialYear || '2024-25',
                booksBeginningDate: company.financialSettings?.booksBeginningDate || '',
                currency: company.financialSettings?.currency || 'INR',
                decimalPrecision: company.financialSettings?.decimalPrecision || 2
            },
            logo: company.logo || '',
            status: company.status || 'Active'
        });
        setActiveTab('profile');
        setIsAddModalOpen(true);
    };

    const handleDeleteCompany = async (company: any) => {
        if (!window.confirm(`Are you sure you want to delete "${company.companyName}"?`)) return;
        try {
            await api.delete(`/companies/${company._id}`);
            showToast('Company deleted successfully', 'success');
            fetchCompanies();
        } catch (error: any) {
            console.error('Error deleting company:', error);
            showToast(error.response?.data?.message || 'Failed to delete company', 'error');
        }
    };


    useEffect(() => {
        if (authLoading) return;
        fetchCompanies();
    }, [authLoading]);

    const filteredCompanies = companies.filter((c: any) =>
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.registrationDetails?.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 rounded-md px-10 h-12 font-bold uppercase tracking-widest" onClick={() => { setEditingCompany(null); setFormData(initialFormState); setActiveTab('profile'); setIsAddModalOpen(true); }}>
                    <Plus className="mr-2 h-5 w-5" />
                    New Company
                </Button>
            </div>

            {/* Search */}
            <Card className="bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by name, code, or GSTIN..."
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
                                <TableHead>Company Details</TableHead>
                                <TableHead>Registrations</TableHead>
                                <TableHead>Contact Info</TableHead>
                                <TableHead>Location</TableHead>
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
                                            Loading company records...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredCompanies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                        No companies found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCompanies.map((company: any) => (
                                    <TableRow key={company._id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
                                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{company.companyName}</div>
                                                    <div className="text-xs text-slate-500 font-mono italic">{company.companyCode}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="text-xs font-semibold uppercase text-slate-400">GST: {company.registrationDetails?.gstin || 'N/A'}</div>
                                                <div className="text-xs font-semibold uppercase text-slate-400">PAN: {company.registrationDetails?.pan || 'N/A'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                                                    <Mail className="mr-1.5 h-3 w-3" />
                                                    {company.contact?.email}
                                                </div>
                                                <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                                                    <Phone className="mr-1.5 h-3 w-3" />
                                                    {company.contact?.phone1}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                            {[
                                                company.address?.registeredOffice?.address1,
                                                company.address?.registeredOffice?.city,
                                                company.address?.registeredOffice?.state
                                            ].filter(Boolean).join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${company.status === 'Active'
                                                ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/40 dark:text-green-400'
                                                : 'bg-red-50 text-red-600 ring-red-600/20'
                                                }`}>
                                                {company.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600" onClick={() => handleEditClick(company)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteCompany(company)}>
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

            {/* Add Company Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setEditingCompany(null); setFormData(initialFormState); setActiveTab('profile'); }}
                title={editingCompany ? 'Edit Company' : 'Add New Company'}
            >
                {/* Tab Navigation */}
                <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
                    {[
                        { id: 'profile', label: 'Profile', icon: Building2 },
                        { id: 'registrations', label: 'Registrations', icon: FileText },
                        { id: 'addresses', label: 'Addresses', icon: MapPin },
                        { id: 'contact', label: 'Contact', icon: Phone },
                        { id: 'bank', label: 'Bank', icon: Landmark },
                        { id: 'financial', label: 'Financial', icon: Receipt },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleAddCompany} className="space-y-4">

                    {/* --- TAB 1: Profile --- */}
                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Company Legal Name *">
                                    <Input required placeholder="e.g. KK Trendz Pvt. Ltd." value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                                </FormField>
                                <FormField label="Company Code *">
                                    <Input required placeholder="e.g. KKT001" value={formData.companyCode} onChange={e => setFormData({ ...formData, companyCode: e.target.value })} />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Company Type">
                                    <select className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" value={formData.companyType} onChange={e => setFormData({ ...formData, companyType: e.target.value })}>
                                        <option>Private Limited</option>
                                        <option>Partnership</option>
                                        <option>Proprietorship</option>
                                        <option>LLP</option>
                                        <option>Public Limited</option>
                                    </select>
                                </FormField>
                                <FormField label="Unit Type">
                                    <select className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" value={formData.unitType} onChange={e => setFormData({ ...formData, unitType: e.target.value })}>
                                        <option>Manufacturing</option>
                                        <option>Trading</option>
                                        <option>Service</option>
                                    </select>
                                </FormField>
                            </div>
                            <FormField label="Company Logo URL (for invoices)">
                                <Input placeholder="https://example.com/logo.png" value={formData.logo || ''} onChange={e => setFormData({ ...formData, logo: e.target.value })} />
                            </FormField>
                        </div>
                    )}

                    {/* --- TAB 2: Registrations --- */}
                    {activeTab === 'registrations' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="GSTIN (15-char)">
                                    <Input placeholder="29ABCDE1234F1Z5" maxLength={15} value={formData.registrationDetails.gstin} onChange={e => setFormData({ ...formData, registrationDetails: { ...formData.registrationDetails, gstin: e.target.value } })} />
                                </FormField>
                                <FormField label="PAN">
                                    <Input placeholder="ABCDE1234F" maxLength={10} value={formData.registrationDetails.pan} onChange={e => setFormData({ ...formData, registrationDetails: { ...formData.registrationDetails, pan: e.target.value } })} />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="CIN">
                                    <Input placeholder="U74999MH2000PTC123456" value={formData.registrationDetails.cin} onChange={e => setFormData({ ...formData, registrationDetails: { ...formData.registrationDetails, cin: e.target.value } })} />
                                </FormField>
                                <FormField label="IEC (Import/Export Code)">
                                    <Input placeholder="AAAA0000AA" value={formData.registrationDetails.iec} onChange={e => setFormData({ ...formData, registrationDetails: { ...formData.registrationDetails, iec: e.target.value } })} />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="TAN">
                                    <Input placeholder="PDES03028F" value={formData.registrationDetails.tan} onChange={e => setFormData({ ...formData, registrationDetails: { ...formData.registrationDetails, tan: e.target.value } })} />
                                </FormField>
                                <FormField label="MSME / Udyam Reg. No.">
                                    <Input placeholder="UDYAM-MH-00-0012345" value={formData.registrationDetails.msme} onChange={e => setFormData({ ...formData, registrationDetails: { ...formData.registrationDetails, msme: e.target.value } })} />
                                </FormField>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 3: Addresses --- */}
                    {activeTab === 'addresses' && (
                        <div className="space-y-5">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2"><Building className="h-3.5 w-3.5" /> Registered Office Address</h4>
                                <div className="space-y-3">
                                    <FormField label="Address Line 1">
                                        <Input placeholder="Street / Area" value={formData.address.registeredOffice.address1} onChange={e => setFormData({ ...formData, address: { ...formData.address, registeredOffice: { ...formData.address.registeredOffice, address1: e.target.value } } })} />
                                    </FormField>
                                    <div className="grid grid-cols-3 gap-3">
                                        <FormField label="City"><Input placeholder="Mumbai" value={formData.address.registeredOffice.city} onChange={e => setFormData({ ...formData, address: { ...formData.address, registeredOffice: { ...formData.address.registeredOffice, city: e.target.value } } })} /></FormField>
                                        <FormField label="State"><Input placeholder="Maharashtra" value={formData.address.registeredOffice.state} onChange={e => setFormData({ ...formData, address: { ...formData.address, registeredOffice: { ...formData.address.registeredOffice, state: e.target.value } } })} /></FormField>
                                        <FormField label="Pincode"><Input placeholder="400001" value={formData.address.registeredOffice.pincode} onChange={e => setFormData({ ...formData, address: { ...formData.address, registeredOffice: { ...formData.address.registeredOffice, pincode: e.target.value } } })} /></FormField>
                                    </div>
                                    <FormField label="Country"><Input placeholder="India" value={formData.address.registeredOffice.country} onChange={e => setFormData({ ...formData, address: { ...formData.address, registeredOffice: { ...formData.address.registeredOffice, country: e.target.value } } })} /></FormField>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Factory / Plant Address</h4>
                                <div className="space-y-3">
                                    <FormField label="Address Line 1"><Input placeholder="Factory Address" value={formData.address.factoryAddress.address1} onChange={e => setFormData({ ...formData, address: { ...formData.address, factoryAddress: { ...formData.address.factoryAddress, address1: e.target.value } } })} /></FormField>
                                    <div className="grid grid-cols-3 gap-3">
                                        <FormField label="City"><Input placeholder="Surat" value={formData.address.factoryAddress.city} onChange={e => setFormData({ ...formData, address: { ...formData.address, factoryAddress: { ...formData.address.factoryAddress, city: e.target.value } } })} /></FormField>
                                        <FormField label="State"><Input placeholder="Gujarat" value={formData.address.factoryAddress.state} onChange={e => setFormData({ ...formData, address: { ...formData.address, factoryAddress: { ...formData.address.factoryAddress, state: e.target.value } } })} /></FormField>
                                        <FormField label="Pincode"><Input placeholder="395001" value={formData.address.factoryAddress.pincode} onChange={e => setFormData({ ...formData, address: { ...formData.address, factoryAddress: { ...formData.address.factoryAddress, pincode: e.target.value } } })} /></FormField>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 4: Contact --- */}
                    {activeTab === 'contact' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Primary Phone (with STD)">
                                    <Input placeholder="+91 22 12345678" value={formData.contact.phone1} onChange={e => setFormData({ ...formData, contact: { ...formData.contact, phone1: e.target.value } })} />
                                </FormField>
                                <FormField label="Secondary / Alternate Phone">
                                    <Input placeholder="+91 98765 43210" value={formData.contact.phone2} onChange={e => setFormData({ ...formData, contact: { ...formData.contact, phone2: e.target.value } })} />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Email (for invoices)">
                                    <Input type="email" placeholder="info@kktraders.com" value={formData.contact.email} onChange={e => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })} />
                                </FormField>
                                <FormField label="Website URL">
                                    <Input placeholder="https://www.kktraders.com" value={formData.contact.website} onChange={e => setFormData({ ...formData, contact: { ...formData.contact, website: e.target.value } })} />
                                </FormField>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 5: Bank Accounts --- */}
                    {activeTab === 'bank' && (
                        <div className="space-y-4">
                            {formData.bankDetails.map((bank: any, idx: number) => (
                                <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Bank Account #{idx + 1}</h4>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                                                <input type="checkbox" checked={bank.isDefault} onChange={e => {
                                                    const updated = formData.bankDetails.map((b: any, i: number) => ({ ...b, isDefault: i === idx ? e.target.checked : false }));
                                                    setFormData({ ...formData, bankDetails: updated });
                                                }} className="rounded" />
                                                Default Account
                                            </label>
                                            <button type="button" onClick={() => setFormData({ ...formData, bankDetails: formData.bankDetails.filter((_: any, i: number) => i !== idx) })} className="text-rose-500 text-xs font-bold uppercase hover:text-rose-700">Remove</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField label="Beneficiary Name"><Input placeholder="As per bank records" value={bank.beneficiaryName} onChange={e => { const u = [...formData.bankDetails]; u[idx].beneficiaryName = e.target.value; setFormData({ ...formData, bankDetails: u }); }} /></FormField>
                                        <FormField label="Bank Name & Branch"><Input placeholder="SBI, Main Branch" value={bank.bankName} onChange={e => { const u = [...formData.bankDetails]; u[idx].bankName = e.target.value; setFormData({ ...formData, bankDetails: u }); }} /></FormField>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField label="Account Number"><Input placeholder="000011223344" value={bank.accountNumber} onChange={e => { const u = [...formData.bankDetails]; u[idx].accountNumber = e.target.value; setFormData({ ...formData, bankDetails: u }); }} /></FormField>
                                        <FormField label="IFSC Code"><Input placeholder="SBIN0000123" value={bank.ifscCode} onChange={e => { const u = [...formData.bankDetails]; u[idx].ifscCode = e.target.value; setFormData({ ...formData, bankDetails: u }); }} /></FormField>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField label="SWIFT Code (International)"><Input placeholder="SBININBB" value={bank.swiftCode} onChange={e => { const u = [...formData.bankDetails]; u[idx].swiftCode = e.target.value; setFormData({ ...formData, bankDetails: u }); }} /></FormField>
                                        <FormField label="UPI ID"><Input placeholder="kktraders@sbi" value={bank.upiId} onChange={e => { const u = [...formData.bankDetails]; u[idx].upiId = e.target.value; setFormData({ ...formData, bankDetails: u }); }} /></FormField>
                                    </div>
                                    <FormField label="Account Type">
                                        <select className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white" value={bank.accountType} onChange={e => { const u = [...formData.bankDetails]; u[idx].accountType = e.target.value; setFormData({ ...formData, bankDetails: u }); }}>
                                            <option>Current</option>
                                            <option>Savings</option>
                                            <option>OD/CC</option>
                                        </select>
                                    </FormField>
                                </div>
                            ))}
                            <Button type="button" variant="ghost" className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-indigo-400 hover:text-indigo-500 font-bold uppercase text-xs tracking-widest" onClick={() => setFormData({ ...formData, bankDetails: [...formData.bankDetails, { beneficiaryName: '', bankName: '', accountNumber: '', ifscCode: '', swiftCode: '', upiId: '', branchName: '', accountType: 'Current', isDefault: formData.bankDetails.length === 0 }] })}>
                                <Plus className="mr-2 h-4 w-4" /> Add Bank Account
                            </Button>
                        </div>
                    )}

                    {/* --- TAB 6: Financial Settings --- */}
                    {activeTab === 'financial' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Financial Year">
                                    <select className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white" value={formData.financialSettings.financialYear} onChange={e => setFormData({ ...formData, financialSettings: { ...formData.financialSettings, financialYear: e.target.value } })}>
                                        <option>2023-24</option>
                                        <option>2024-25</option>
                                        <option>2025-26</option>
                                    </select>
                                </FormField>
                                <FormField label="Books Beginning Date">
                                    <Input type="date" value={formData.financialSettings.booksBeginningDate} onChange={e => setFormData({ ...formData, financialSettings: { ...formData.financialSettings, booksBeginningDate: e.target.value } })} />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Base Currency">
                                    <select className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white" value={formData.financialSettings.currency} onChange={e => setFormData({ ...formData, financialSettings: { ...formData.financialSettings, currency: e.target.value } })}>
                                        <option value="INR">INR – Indian Rupee</option>
                                        <option value="USD">USD – US Dollar</option>
                                        <option value="EUR">EUR – Euro</option>
                                        <option value="GBP">GBP – British Pound</option>
                                    </select>
                                </FormField>
                                <FormField label="Decimal Precision">
                                    <select className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white" value={formData.financialSettings.decimalPrecision} onChange={e => setFormData({ ...formData, financialSettings: { ...formData.financialSettings, decimalPrecision: Number(e.target.value) } })}>
                                        <option value={0}>0 decimal places</option>
                                        <option value={2}>2 decimal places (standard)</option>
                                        <option value={3}>3 decimal places</option>
                                    </select>
                                </FormField>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
                                <strong>Note:</strong> Financial Year is April to March as per standard practice (e.g., Apr 2024 – Mar 2025).
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-2">
                            {['profile', 'registrations', 'addresses', 'contact', 'bank', 'financial'].indexOf(activeTab) > 0 && (
                                <Button type="button" variant="ghost" onClick={() => { const tabs = ['profile', 'registrations', 'addresses', 'contact', 'bank', 'financial']; setActiveTab(tabs[tabs.indexOf(activeTab) - 1]); }}>← Prev</Button>
                            )}
                            {activeTab !== 'financial' && (
                                <Button type="button" variant="ghost" onClick={() => { const tabs = ['profile', 'registrations', 'addresses', 'contact', 'bank', 'financial']; setActiveTab(tabs[tabs.indexOf(activeTab) + 1]); }}>Next →</Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => { setIsAddModalOpen(false); setEditingCompany(null); setFormData(initialFormState); }}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">
                                {isSubmitting ? 'Saving...' : editingCompany ? 'Update Company' : 'Save Company'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}


