'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, Edit2, Trash2, User, Phone, Mail, Briefcase,
    GraduationCap, IndianRupee, FileText, CalendarDays, CheckCircle2, X, Shield, MapPin
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

// ─── Initial Form State ───
const initialFormState = () => ({
    employeeCode: '',
    employeeName: '',
    personalDetails: {
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        maritalStatus: '',
        nationality: 'Indian'
    },
    contact: {
        permanentAddress: { address1: '', city: '', district: '', state: '', pincode: '' },
        currentAddress: { address1: '', city: '', pincode: '' },
        phone1: '',
        phone2: '',
        email: '',
        officialEmail: '',
        emergencyContact: { name: '', relation: '', phone: '' }
    },
    employment: {
        department: 'Production',
        subDepartment: '',
        designation: '',
        grade: '',
        joiningDate: new Date().toISOString().split('T')[0],
        confirmationDate: '',
        employmentType: 'Permanent',
        category: 'Salary',
        privilegeType: 'Non-Privileged',
        workingShift: 'General',
        inTime: '09:30',
        outTime: '19:00',
        reportingTo: '',
        location: '',
        skills: [] as string[],
        experience: 0
    },
    compensation: {
        salaryStructure: '',
        basic: 0,
        hra: 0,
        conveyance: 0,
        medical: 0,
        specialAllowance: 0,
        grossSalary: 0,
        dailyRate: 0,
        pfNumber: '',
        esiNumber: '',
        uanNumber: '',
        bankDetails: { bankName: '', accountNumber: '', ifscCode: '', branchName: '' }
    },
    certifications: [] as any[],
    documents: [] as any[],
    attendance: {
        leaveBalance: { casualLeave: 12, sickLeave: 6, earnedLeave: 15 }
    },
    status: 'Active'
});

// ─── Sub‐department options ───
const SUB_DEPARTMENTS: Record<string, string[]> = {
    Production: ['Knitting', 'Dyeing', 'Cutting', 'Stitching', 'Printing'],
    Stores: ['Raw Material', 'Finished Goods', 'Packing'],
    Quality: ['Inspection', 'Testing', 'Compliance'],
    Sales: ['Domestic', 'Export', 'Marketing'],
    Accounts: ['Finance', 'Payroll', 'Taxation'],
    Administration: ['HR', 'IT', 'Security', 'Housekeeping']
};

// ─── Tab definitions ───
const TABS = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'skills', label: 'Skills & Exp', icon: GraduationCap },
    { id: 'salary', label: 'Salary', icon: IndianRupee },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    { id: 'activation', label: 'Activation', icon: CheckCircle2 }
];

export default function EmployeeMasterPage() {
    const { loading: authLoading } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [allEmployees, setAllEmployees] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [catFilter, setCatFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [locFilter, setLocFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);
    const [formData, setFormData] = useState<any>(initialFormState());
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('personal');
    const [skillInput, setSkillInput] = useState('');

    // ─── API ───
    const fetchEmployees = async () => {
        try {
            const [empRes, compRes] = await Promise.all([
                api.get('/employees'),
                api.get('/companies')
            ]);
            setEmployees(empRes.data);
            setAllEmployees(empRes.data);
            setCompanies(compRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Calculate gross salary
            const comp = formData.compensation;
            const gross = (comp.basic || 0) + (comp.hra || 0) + (comp.conveyance || 0) + (comp.medical || 0) + (comp.specialAllowance || 0);
            const payload = {
                ...formData,
                personalDetails: {
                    ...formData.personalDetails,
                    dateOfBirth: formData.personalDetails.dateOfBirth || undefined
                },
                compensation: { ...comp, grossSalary: gross },
                employment: {
                    ...formData.employment,
                    reportingTo: formData.employment.reportingTo || undefined,
                    joiningDate: formData.employment.joiningDate || undefined,
                    confirmationDate: formData.employment.confirmationDate || undefined
                },
                certifications: formData.certifications.map((c: any) => ({
                    ...c,
                    date: c.date || undefined,
                    validTill: c.validTill || undefined
                }))
            };

            if (editingEmployee) {
                await api.put(`/employees/${editingEmployee._id}`, payload);
            } else {
                await api.post('/employees', payload);
            }
            closeModal();
            fetchEmployees();
            showToast(`Employee ${editingEmployee ? 'updated' : 'created'} successfully`, 'success');
        } catch (error: any) {
            console.error('Error saving employee:', error);
            const msg = error?.response?.data?.message || 'Failed to save employee';
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (emp: any) => {
        setEditingEmployee(emp);
        const init = initialFormState();
        setFormData({
            employeeCode: emp.employeeCode || '',
            employeeName: emp.employeeName || '',
            personalDetails: {
                dateOfBirth: emp.personalDetails?.dateOfBirth ? new Date(emp.personalDetails.dateOfBirth).toISOString().split('T')[0] : '',
                gender: emp.personalDetails?.gender || '',
                bloodGroup: emp.personalDetails?.bloodGroup || '',
                maritalStatus: emp.personalDetails?.maritalStatus || '',
                nationality: emp.personalDetails?.nationality || 'Indian'
            },
            contact: {
                permanentAddress: {
                    address1: emp.contact?.permanentAddress?.address1 || '',
                    city: emp.contact?.permanentAddress?.city || '',
                    district: emp.contact?.permanentAddress?.district || '',
                    state: emp.contact?.permanentAddress?.state || '',
                    pincode: emp.contact?.permanentAddress?.pincode || ''
                },
                currentAddress: {
                    address1: emp.contact?.currentAddress?.address1 || '',
                    city: emp.contact?.currentAddress?.city || '',
                    pincode: emp.contact?.currentAddress?.pincode || ''
                },
                phone1: emp.contact?.phone1 || '',
                phone2: emp.contact?.phone2 || '',
                email: emp.contact?.email || '',
                officialEmail: emp.contact?.officialEmail || '',
                emergencyContact: {
                    name: emp.contact?.emergencyContact?.name || '',
                    relation: emp.contact?.emergencyContact?.relation || '',
                    phone: emp.contact?.emergencyContact?.phone || ''
                }
            },
            employment: {
                department: emp.employment?.department || 'Production',
                subDepartment: emp.employment?.subDepartment || '',
                designation: emp.employment?.designation || '',
                grade: emp.employment?.grade || '',
                joiningDate: emp.employment?.joiningDate ? new Date(emp.employment.joiningDate).toISOString().split('T')[0] : '',
                confirmationDate: emp.employment?.confirmationDate ? new Date(emp.employment.confirmationDate).toISOString().split('T')[0] : '',
                employmentType: emp.employment?.employmentType || 'Permanent',
                category: emp.employment?.category || 'Salary',
                privilegeType: emp.employment?.privilegeType || 'Non-Privileged',
                workingShift: emp.employment?.workingShift || 'General',
                inTime: emp.employment?.inTime || '',
                outTime: emp.employment?.outTime || '',
                reportingTo: emp.employment?.reportingTo?._id || emp.employment?.reportingTo || '',
                location: emp.employment?.location || '',
                skills: emp.employment?.skills || [],
                experience: emp.employment?.experience || 0
            },
            compensation: {
                salaryStructure: emp.compensation?.salaryStructure || '',
                basic: emp.compensation?.basic || 0,
                hra: emp.compensation?.hra || 0,
                conveyance: emp.compensation?.conveyance || 0,
                medical: emp.compensation?.medical || 0,
                specialAllowance: emp.compensation?.specialAllowance || 0,
                grossSalary: emp.compensation?.grossSalary || 0,
                dailyRate: emp.compensation?.dailyRate || 0,
                pfNumber: emp.compensation?.pfNumber || '',
                esiNumber: emp.compensation?.esiNumber || '',
                uanNumber: emp.compensation?.uanNumber || '',
                bankDetails: {
                    bankName: emp.compensation?.bankDetails?.bankName || '',
                    accountNumber: emp.compensation?.bankDetails?.accountNumber || '',
                    ifscCode: emp.compensation?.bankDetails?.ifscCode || '',
                    branchName: emp.compensation?.bankDetails?.branchName || ''
                }
            },
            certifications: emp.certifications || [],
            documents: emp.documents || [],
            attendance: {
                leaveBalance: {
                    casualLeave: emp.attendance?.leaveBalance?.casualLeave ?? 12,
                    sickLeave: emp.attendance?.leaveBalance?.sickLeave ?? 6,
                    earnedLeave: emp.attendance?.leaveBalance?.earnedLeave ?? 15
                }
            },
            status: emp.status || 'Active'
        });
        setActiveTab('personal');
        setIsModalOpen(true);
    };

    const handleDeleteEmployee = async (emp: any) => {
        if (!confirm(`Are you sure you want to delete "${emp.employeeName}"?`)) return;
        try {
            await api.delete(`/employees/${emp._id}`);
            fetchEmployees();
            showToast('Employee deleted successfully', 'info');
        } catch (error: any) {
            console.error('Error deleting employee:', error);
            const msg = error?.response?.data?.message || 'Failed to delete employee';
            showToast(msg, 'error');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
        setFormData(initialFormState());
        setActiveTab('personal');
        setSkillInput('');
    };

    const openAddModal = () => {
        setEditingEmployee(null);
        setFormData(initialFormState());
        setActiveTab('personal');
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (authLoading) return;
        fetchEmployees();
    }, [authLoading]);

    // ─── Helpers ───
    const setPersonal = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, personalDetails: { ...prev.personalDetails, [field]: value } }));
    const setContact = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
    const setPermAddr = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, contact: { ...prev.contact, permanentAddress: { ...prev.contact.permanentAddress, [field]: value } } }));
    const setCurrAddr = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, contact: { ...prev.contact, currentAddress: { ...prev.contact.currentAddress, [field]: value } } }));
    const setEmergency = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, contact: { ...prev.contact, emergencyContact: { ...prev.contact.emergencyContact, [field]: value } } }));
    const setEmp = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, employment: { ...prev.employment, [field]: value } }));
    const setComp = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, compensation: { ...prev.compensation, [field]: value } }));
    const setBank = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, compensation: { ...prev.compensation, bankDetails: { ...prev.compensation.bankDetails, [field]: value } } }));
    const setLeave = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, attendance: { ...prev.attendance, leaveBalance: { ...prev.attendance.leaveBalance, [field]: value } } }));

    const addSkill = () => {
        if (skillInput.trim()) {
            setEmp('skills', [...formData.employment.skills, skillInput.trim()]);
            setSkillInput('');
        }
    };
    const removeSkill = (idx: number) => {
        setEmp('skills', formData.employment.skills.filter((_: any, i: number) => i !== idx));
    };

    // Auto-calculate gross salary
    const grossSalary = (formData.compensation.basic || 0) + (formData.compensation.hra || 0) + (formData.compensation.conveyance || 0) + (formData.compensation.medical || 0) + (formData.compensation.specialAllowance || 0);

    // ─── Filtering ───
    const filteredEmployees = employees.filter((e: any) => {
        const matchSearch =
            e.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.employment?.designation?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDept = deptFilter === 'All' || e.employment?.department === deptFilter;
        const matchStatus = statusFilter === 'All' || e.status === statusFilter;
        const matchCat = catFilter === 'All' || e.employment?.category === catFilter;
        const matchLoc = locFilter === 'All' || e.employment?.location === locFilter;
        return matchSearch && matchDept && matchStatus && matchCat && matchLoc;
    });

    const selectClass = "w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none";

    return (
        <div className="space-y-6">

            {/* ─── Table Card ─── */}
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 p-8">
                    <div className="space-y-8">
                        {/* Row 1: Search & Action */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="relative flex-1 w-full max-w-2xl">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search by name, code, or designation..."
                                    className="pl-12 h-12 w-full bg-slate-50 dark:bg-slate-800/40 border-none rounded-2xl font-bold placeholder:text-slate-400 placeholder:font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Total Employees</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none mt-1">
                                        {filteredEmployees.length} <span className="text-xs text-slate-400 font-semibold tracking-wide">/ {employees.length}</span>
                                    </p>
                                </div>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-10 rounded-2xl font-black uppercase tracking-[0.1em] text-[11px] shadow-lg shadow-indigo-500/20 transition-all hover:translate-y-[-1px] active:translate-y-[0px] shrink-0" onClick={openAddModal}>
                                    <Plus className="mr-2 h-4 w-4" /> Onboard Employee
                                </Button>
                            </div>
                        </div>

                        {/* Row 2: Status & Office Location */}
                        <div className="flex flex-col xl:flex-row xl:items-center gap-8">
                            <div className="flex flex-col space-y-3 shrink-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                                     <CheckCircle2 size={12} className="text-indigo-400" /> Employee Status
                                </p>
                                <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    {[
                                        { id: 'All', label: 'All Status' },
                                        { id: 'Active', label: 'Active', icon: '●', color: 'text-emerald-500' },
                                        { id: 'Inactive', label: 'Inactive', icon: '●', color: 'text-slate-300' }
                                    ].map(s => (
                                        <button key={s.id} onClick={() => setStatusFilter(s.id)}
                                            className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${statusFilter === s.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                            {s.icon && <span className={s.color}>{s.icon}</span>}
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex-1 flex flex-col space-y-3 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                                    <MapPin size={12} className="text-indigo-400" /> Office Location
                                </p>
                                <div className="flex overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-slate-800/20 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    <button onClick={() => setLocFilter('All')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${locFilter === 'All' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                        All Branches
                                    </button>
                                    {companies.filter((c: any) => c.status === 'Active').map((c: any) => {
                                        const addressParts = [c.address?.registeredOffice?.address1, c.address?.registeredOffice?.city].filter(Boolean).join(', ');
                                        const locationString = `${c.companyName}${addressParts ? ` - ${addressParts}` : ''}`;
                                        const shortName = c.address?.registeredOffice?.address1 ? `${c.companyName} - ${c.address.registeredOffice.address1}` : c.companyName;
                                        return (
                                            <button key={c._id} onClick={() => setLocFilter(locationString)} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${locFilter === locationString ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                                {shortName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Detailed Filters */}
                        <div className="flex flex-col md:flex-row md:items-center gap-8 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                            <div className="flex-1 space-y-3 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                                        <Briefcase size={12} className="text-indigo-400" /> Department Units
                                    </p>
                                    {(deptFilter !== 'All' || catFilter !== 'All' || locFilter !== 'All' || statusFilter !== 'All' || searchTerm !== '') && (
                                        <button onClick={() => { setDeptFilter('All'); setCatFilter('All'); setLocFilter('All'); setStatusFilter('All'); setSearchTerm(''); }}
                                            className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 px-2">
                                            <X size={12} /> Clear Filters
                                        </button>
                                    )}
                                </div>
                                <div className="flex bg-slate-50/50 dark:bg-slate-800/20 p-1.5 rounded-2xl overflow-x-auto no-scrollbar border border-slate-100 dark:border-slate-800/50">
                                    {['All', 'Production', 'Stores', 'Quality', 'Sales', 'Accounts', 'Administration'].map(d => (
                                        <button key={d} onClick={() => setDeptFilter(d)}
                                            className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${deptFilter === d ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="md:w-72 space-y-3 shrink-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
                                    <GraduationCap size={12} className="text-indigo-400" /> Payroll Category
                                </p>
                                <div className="flex bg-slate-50/50 dark:bg-slate-800/20 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                    {[
                                        { id: 'All', label: 'All' },
                                        { id: 'Salary', label: 'Monthly' },
                                        { id: 'Temporary', label: 'Daily' },
                                        { id: 'Contract', label: 'Price' }
                                    ].map(c => (
                                        <button key={c.id} onClick={() => setCatFilter(c.id)}
                                            className={`flex-1 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${catFilter === c.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                            <TableRow className="border-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">Employee</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Dept / Designation</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Contact</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Category / Shift</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Joining</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Base Salary</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6 h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading employees...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-48 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                            <User size={40} className="text-slate-300 mb-2" />
                                            <p className="font-bold text-sm text-slate-400">No employees found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEmployees.map((emp: any) => (
                                    <TableRow key={emp._id} className="group border-b last:border-0 border-b-slate-50 dark:border-b-slate-800/50">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs ring-4 ring-white dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-slate-800">
                                                    {emp.employeeName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 dark:text-white tracking-tight">{emp.employeeName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono italic uppercase">{emp.employeeCode}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{emp.employment?.designation || '—'}</span>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="inline-flex items-center w-fit rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 ring-1 ring-indigo-700/10 dark:bg-indigo-900/40 dark:text-indigo-400">
                                                        {emp.employment?.department}
                                                        {emp.employment?.subDepartment ? ` / ${emp.employment.subDepartment}` : ''}
                                                    </span>
                                                    {emp.employment?.location && (
                                                        <span className="inline-flex items-center w-fit rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 ring-1 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-400 truncate max-w-[200px]" title={emp.employment.location}>
                                                            {emp.employment.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {emp.contact?.phone1 && (
                                                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                                                        <Phone className="mr-1.5 h-3 w-3" />{emp.contact.phone1}
                                                    </div>
                                                )}
                                                {emp.contact?.email && (
                                                    <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                                                        <Mail className="mr-1.5 h-3 w-3" />{emp.contact.email}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{emp.employment?.category || 'Salary'}</span>
                                                    {emp.employment?.category === 'Salary' && emp.employment?.privilegeType === 'Privileged' && (
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                                                            Privileged
                                                        </span>
                                                    )}
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                                        emp.employment?.category === 'Contract' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' : 
                                                        emp.employment?.category === 'Temporary' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' : 
                                                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'
                                                    }`}>
                                                        {emp.employment?.category === 'Contract' ? 'PRODUCTION' : emp.employment?.category === 'Temporary' ? 'DAILY' : 'MONTHLY'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400">
                                                    {emp.employment?.inTime && emp.employment?.outTime 
                                                        ? `${emp.employment.inTime}-${emp.employment.outTime} Shift` 
                                                        : emp.employment?.workingShift
                                                            ? `${emp.employment.workingShift} Shift`
                                                            : 'Flexible Hours'
                                                    }
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                                            {emp.employment?.joiningDate ? new Date(emp.employment.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </TableCell>
                                        <TableCell className="text-sm font-black tabular-nums">
                                            {emp.employment?.category === 'Contract' ? (
                                                <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">AS PER WORK</span>
                                            ) : (
                                                emp.employment?.category === 'Temporary' ? (
                                                    <span className="text-slate-900 dark:text-white">₹{emp.compensation?.dailyRate?.toLocaleString() || '0'} <span className="text-[8px] text-slate-400 uppercase">/ Day</span></span>
                                                ) : (
                                                    <span className="text-slate-900 dark:text-white">₹{emp.compensation?.basic?.toLocaleString('en-IN') || '0'}</span>
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-600/20'}`}>
                                                {emp.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600" onClick={() => handleEditClick(emp)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteEmployee(emp)}>
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

            {/* ═══════════════════════════════════════════════════════
                 ADD / EDIT EMPLOYEE MODAL
            ═══════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingEmployee ? `Edit: ${editingEmployee.employeeName}` : 'Onboard New Employee'}
            >
                {/* Tab Navigation */}
                <div className="flex gap-0.5 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">

                        {/* ─── TAB 1: Personal Information ─── */}
                        {activeTab === 'personal' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Personal Information</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Employee Code *">
                                        <Input required placeholder="e.g. EMP-001 (auto-generated)" className="font-mono uppercase" value={formData.employeeCode} onChange={e => setFormData({ ...formData, employeeCode: e.target.value })} />
                                    </FormField>
                                    <FormField label="Full Name (as per documents) *">
                                        <Input required placeholder="e.g. Rajesh Kumar" value={formData.employeeName} onChange={e => setFormData({ ...formData, employeeName: e.target.value })} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Date of Birth">
                                        <Input
                                            type="date"
                                            min="1950-01-01"
                                            max={new Date().toISOString().split('T')[0]}
                                            value={formData.personalDetails.dateOfBirth}
                                            onChange={e => setPersonal('dateOfBirth', e.target.value)}
                                        />
                                    </FormField>
                                    <FormField label="Gender">
                                        <Select
                                            value={formData.personalDetails.gender}
                                            onChange={val => setPersonal('gender', val)}
                                            options={['Male', 'Female', 'Other'].map(g => ({ value: g, label: g }))}
                                            placeholder="Select Gender"
                                        />
                                    </FormField>
                                    <FormField label="Blood Group">
                                        <Select
                                            value={formData.personalDetails.bloodGroup}
                                            onChange={val => setPersonal('bloodGroup', val)}
                                            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => ({ value: b, label: b }))}
                                            placeholder="Select Blood Group"
                                        />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Marital Status">
                                        <Select
                                            value={formData.personalDetails.maritalStatus}
                                            onChange={val => setPersonal('maritalStatus', val)}
                                            options={['Single', 'Married', 'Divorced', 'Widowed'].map(m => ({ value: m, label: m }))}
                                            placeholder="Select Marital Status"
                                        />
                                    </FormField>
                                    <FormField label="Nationality">
                                        <Input value={formData.personalDetails.nationality} onChange={e => setPersonal('nationality', e.target.value)} />
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 2: Contact Details ─── */}
                        {activeTab === 'contact' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Permanent Address</p>
                                <FormField label="Address">
                                    <Input placeholder="House No, Street, Area" value={formData.contact.permanentAddress.address1} onChange={e => setPermAddr('address1', e.target.value)} />
                                </FormField>
                                <div className="grid grid-cols-4 gap-4">
                                    <FormField label="City"><Input value={formData.contact.permanentAddress.city} onChange={e => setPermAddr('city', e.target.value)} /></FormField>
                                    <FormField label="District"><Input value={formData.contact.permanentAddress.district} onChange={e => setPermAddr('district', e.target.value)} /></FormField>
                                    <FormField label="State"><Input value={formData.contact.permanentAddress.state} onChange={e => setPermAddr('state', e.target.value)} /></FormField>
                                    <FormField label="PIN Code"><Input placeholder="6 digits" value={formData.contact.permanentAddress.pincode} onChange={e => setPermAddr('pincode', e.target.value)} /></FormField>
                                </div>

                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 pt-2">Current / Residential Address</p>
                                <FormField label="Address">
                                    <Input placeholder="House No, Street, Area" value={formData.contact.currentAddress.address1} onChange={e => setCurrAddr('address1', e.target.value)} />
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="City"><Input value={formData.contact.currentAddress.city} onChange={e => setCurrAddr('city', e.target.value)} /></FormField>
                                    <FormField label="PIN Code"><Input value={formData.contact.currentAddress.pincode} onChange={e => setCurrAddr('pincode', e.target.value)} /></FormField>
                                </div>

                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 pt-2">Phone & Email</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Personal Phone *"><Input placeholder="9876543210" value={formData.contact.phone1} onChange={e => setContact('phone1', e.target.value)} /></FormField>
                                    <FormField label="Official Phone"><Input placeholder="Optional" value={formData.contact.phone2} onChange={e => setContact('phone2', e.target.value)} /></FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Personal Email"><Input type="email" placeholder="personal@email.com" value={formData.contact.email} onChange={e => setContact('email', e.target.value)} /></FormField>
                                    <FormField label="Official Email"><Input type="email" placeholder="name@kktraders.com" value={formData.contact.officialEmail} onChange={e => setContact('officialEmail', e.target.value)} /></FormField>
                                </div>

                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 pt-2">Emergency Contact</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Name"><Input placeholder="Emergency contact name" value={formData.contact.emergencyContact.name} onChange={e => setEmergency('name', e.target.value)} /></FormField>
                                    <FormField label="Relation"><Input placeholder="e.g. Father, Spouse" value={formData.contact.emergencyContact.relation} onChange={e => setEmergency('relation', e.target.value)} /></FormField>
                                    <FormField label="Phone"><Input placeholder="9876543210" value={formData.contact.emergencyContact.phone} onChange={e => setEmergency('phone', e.target.value)} /></FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 3: Employment Details ─── */}
                        {activeTab === 'employment' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Employment Details</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Category *">
                                        <Select
                                            value={formData.employment.category || 'Salary'}
                                            onChange={val => setEmp('category', val)}
                                            options={[
                                                { value: 'Salary', label: 'Salary (Fixed Monthly)' },
                                                { value: 'Contract', label: 'Contract (Production Price)' },
                                                { value: 'Temporary', label: 'Temporary (Daily Rate)' }
                                            ]}
                                        />
                                    </FormField>
                                    {(formData.employment.category === 'Salary' || formData.employment.category === 'Temporary') && (
                                        <FormField label="Privilege Level *">
                                            <Select
                                                value={formData.employment.privilegeType}
                                                onChange={val => setEmp('privilegeType', val)}
                                                options={[
                                                    { value: 'Privileged', label: 'Privileged' },
                                                    { value: 'Non-Privileged', label: 'Non-Privileged' }
                                                ]}
                                                placeholder="Select Privilege Level"
                                            />
                                        </FormField>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Department *">
                                        <Select
                                            value={formData.employment.department}
                                            onChange={val => { setEmp('department', val); setEmp('subDepartment', ''); }}
                                            options={Object.keys(SUB_DEPARTMENTS).map(d => ({ value: d, label: d }))}
                                        />
                                    </FormField>
                                    <FormField label="Sub-Department">
                                        <Select
                                            value={formData.employment.subDepartment}
                                            onChange={val => setEmp('subDepartment', val)}
                                            options={(SUB_DEPARTMENTS[formData.employment.department] || []).map(s => ({ value: s, label: s }))}
                                            placeholder="Select Sub-Department"
                                        />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Designation *">
                                        <Select
                                            value={formData.employment.designation}
                                            onChange={val => setEmp('designation', val)}
                                            options={['Operator', 'Supervisor', 'Manager', 'Executive', 'Senior Executive', 'Head'].map(d => ({ value: d, label: d }))}
                                            placeholder="Select Designation"
                                        />
                                    </FormField>
                                    <FormField label="Grade / Level (1-10)">
                                        <Select
                                            value={formData.employment.grade}
                                            onChange={val => setEmp('grade', val)}
                                            options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => ({ value: `Grade ${g}`, label: `Grade ${g}` }))}
                                            placeholder="Select Grade"
                                        />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Date of Joining *">
                                        <Input type="date" value={formData.employment.joiningDate} onChange={e => setEmp('joiningDate', e.target.value)} />
                                    </FormField>
                                    <FormField label="Date of Confirmation">
                                        <Input type="date" value={formData.employment.confirmationDate} onChange={e => setEmp('confirmationDate', e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Work Shift">
                                        <Select
                                            value={formData.employment.workingShift}
                                            onChange={val => setEmp('workingShift', val)}
                                            options={['General', 'Morning', 'Evening', 'Night'].map(s => ({ value: s, label: s }))}
                                        />
                                    </FormField>
                                    <FormField label="Company Location / Unit">
                                        <Select
                                            value={formData.employment.location}
                                            onChange={val => {
                                                setEmp('location', val);
                                                if (!editingEmployee && val) {
                                                    const locParts = val.split(' - ');
                                                    const compName = locParts[0] || '';
                                                    const addr = locParts[1] || '';
                                                    
                                                    const compCode = compName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toLowerCase() || 'co';
                                                    const addrCode = addr.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toLowerCase() || 'loc';
                                                    
                                                    const suffix = Math.floor(100 + Math.random() * 900);
                                                    setFormData((prev: any) => ({
                                                        ...prev,
                                                        employeeCode: `emp/${addrCode}/${compCode}_${suffix}`
                                                    }));
                                                }
                                            }}
                                            options={companies.filter((c: any) => c.status === 'Active').map((c: any) => {
                                                const addressParts = [
                                                    c.address?.registeredOffice?.address1,
                                                    c.address?.registeredOffice?.city
                                                ].filter(Boolean).join(', ');
                                                const locationString = `${c.companyName}${addressParts ? ` - ${addressParts}` : ''}`;
                                                return {
                                                    value: locationString,
                                                    label: locationString
                                                };
                                            })}
                                            placeholder="Select Company"
                                        />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label={formData.employment.category === 'Non-Salary' ? 'In Time' : 'In Time *'}>
                                        <Input type="time" required={formData.employment.category !== 'Non-Salary'} value={formData.employment.inTime} onChange={e => setEmp('inTime', e.target.value)} />
                                    </FormField>
                                    <FormField label={formData.employment.category === 'Non-Salary' ? 'Out Time' : 'Out Time *'}>
                                        <Input type="time" required={formData.employment.category !== 'Non-Salary'} value={formData.employment.outTime} onChange={e => setEmp('outTime', e.target.value)} />
                                    </FormField>
                                    <FormField label="Reporting Manager">
                                        <Select
                                            value={formData.employment.reportingTo}
                                            onChange={val => setEmp('reportingTo', val)}
                                            options={allEmployees.filter((e: any) => e._id !== editingEmployee?._id).map((e: any) => ({
                                                value: e._id,
                                                label: `${e.employeeName} (${e.employeeCode})`
                                            }))}
                                            placeholder="Select Manager"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 4: Skills & Experience ─── */}
                        {activeTab === 'skills' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Skills & Experience</p>
                                <FormField label="Total Years of Experience">
                                    <Input type="number" placeholder="e.g. 5" value={formData.employment.experience} onChange={e => setEmp('experience', Number(e.target.value))} />
                                </FormField>

                                <FormField label="Skills (with proficiency)">
                                    <div className="flex gap-2">
                                        <Input placeholder="e.g. Knitting - Advanced" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                                        <Button type="button" variant="ghost" onClick={addSkill} className="shrink-0 border border-slate-200 dark:border-slate-700">Add</Button>
                                    </div>
                                    {formData.employment.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.employment.skills.map((skill: string, idx: number) => (
                                                <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-medium">
                                                    {skill}
                                                    <button type="button" onClick={() => removeSkill(idx)} className="text-indigo-400 hover:text-indigo-600"><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </FormField>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">Certifications</p>
                                    {formData.certifications.map((cert: any, idx: number) => (
                                        <div key={idx} className="p-3 mb-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black uppercase text-indigo-600">Cert #{idx + 1}</span>
                                                <button type="button" onClick={() => setFormData({ ...formData, certifications: formData.certifications.filter((_: any, i: number) => i !== idx) })} className="text-rose-500"><X size={14} /></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField label="Certification Name">
                                                    <Input value={cert.name} onChange={e => { const u = [...formData.certifications]; u[idx].name = e.target.value; setFormData({ ...formData, certifications: u }); }} />
                                                </FormField>
                                                <FormField label="Issued By">
                                                    <Input value={cert.issuedBy} onChange={e => { const u = [...formData.certifications]; u[idx].issuedBy = e.target.value; setFormData({ ...formData, certifications: u }); }} />
                                                </FormField>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField label="Issue Date">
                                                    <Input type="date" value={cert.date ? new Date(cert.date).toISOString().split('T')[0] : ''} onChange={e => { const u = [...formData.certifications]; u[idx].date = e.target.value; setFormData({ ...formData, certifications: u }); }} />
                                                </FormField>
                                                <FormField label="Valid Till">
                                                    <Input type="date" value={cert.validTill ? new Date(cert.validTill).toISOString().split('T')[0] : ''} onChange={e => { const u = [...formData.certifications]; u[idx].validTill = e.target.value; setFormData({ ...formData, certifications: u }); }} />
                                                </FormField>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="ghost" className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 font-bold uppercase text-xs tracking-widest" onClick={() => setFormData({ ...formData, certifications: [...formData.certifications, { name: '', issuedBy: '', date: '', validTill: '' }] })}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Certification
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 5: Salary & Compensation ─── */}
                        {activeTab === 'salary' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Salary & Compensation</p>
                                
                                { (formData.employment.category === 'Temporary' || formData.employment.category === 'Contract') ? (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-6 rounded-2xl space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 ${formData.employment.category === 'Contract' ? 'bg-orange-600' : 'bg-amber-600'} rounded-lg text-white`}>
                                                {formData.employment.category === 'Contract' ? <Shield size={18} /> : <CalendarDays size={18} />}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black ${formData.employment.category === 'Contract' ? 'text-orange-700 dark:text-orange-400' : 'text-amber-700 dark:text-amber-400'} uppercase tracking-widest`}>
                                                    {formData.employment.category === 'Contract' ? 'Production Price Model' : formData.employment.privilegeType === 'Privileged' ? 'Privileged (Fixed Daily)' : 'Day-Wise Payment Mode'}
                                                </p>
                                                <p className={`text-[10px] ${formData.employment.category === 'Contract' ? 'text-orange-600/70' : 'text-amber-600/70'} font-bold uppercase`}>
                                                    {formData.employment.privilegeType === 'Privileged' && formData.employment.category === 'Temporary' ? 'Guaranteed Full-Month Pay' : 'Monthly salary structure is NOT applicable'}
                                                </p>
                                            </div>
                                        </div>
                                        {formData.employment.category === 'Temporary' ? (
                                            <div className="space-y-4">
                                                <FormField label="Day Wise Money (Daily Rate ₹) *">
                                                    <Input 
                                                        type="number" 
                                                        placeholder="e.g. 500" 
                                                        className="h-14 text-lg font-black text-amber-700 bg-white"
                                                        value={formData.compensation.dailyRate} 
                                                        onChange={e => setComp('dailyRate', Number(e.target.value))} 
                                                    />
                                                </FormField>
                                                {formData.employment.privilegeType === 'Privileged' && (
                                                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 rounded-lg">
                                                        <Shield className="h-4 w-4 text-blue-500" />
                                                        <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium font-black italic">
                                                            NOTE: Since this is a PRIVILEGED temporary role, the employee will be paid for ALL days in the month regardless of presence.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-white/50 rounded-xl border border-orange-100">
                                                <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium leading-relaxed">
                                                    This employee is on <strong>Production (Contract) Basis</strong>. Their remuneration is calculated based on daily work entries (piece-rate) processed by the production manager. No automatic salary will be generated here.
                                                </p>
                                            </div>
                                        )}
                                        {formData.employment.category === 'Temporary' && (
                                            <div className="p-4 bg-white/50 rounded-xl border border-amber-100">
                                                <p className="text-[10px] font-black text-amber-600 uppercase">Estimated Monthly (30 Days)</p>
                                                <p className="text-xl font-black text-slate-800">₹{(formData.compensation.dailyRate * 30).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <FormField label="Salary Structure">
                                            <Input placeholder="e.g. Standard Monthly" value={formData.compensation.salaryStructure} onChange={e => setComp('salaryStructure', e.target.value)} />
                                        </FormField>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField label="Basic Pay (₹)">
                                                <Input type="number" value={formData.compensation.basic} onChange={e => setComp('basic', Number(e.target.value))} />
                                            </FormField>
                                            <FormField label="HRA (₹)">
                                                <Input type="number" value={formData.compensation.hra} onChange={e => setComp('hra', Number(e.target.value))} />
                                            </FormField>
                                            <FormField label="Conveyance (₹)">
                                                <Input type="number" value={formData.compensation.conveyance} onChange={e => setComp('conveyance', Number(e.target.value))} />
                                            </FormField>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField label="Medical (₹)">
                                                <Input type="number" value={formData.compensation.medical} onChange={e => setComp('medical', Number(e.target.value))} />
                                            </FormField>
                                            <FormField label="Special Allowance (₹)">
                                                <Input type="number" value={formData.compensation.specialAllowance} onChange={e => setComp('specialAllowance', Number(e.target.value))} />
                                            </FormField>
                                            <FormField label={formData.employment.privilegeType === 'Privileged' ? "Gross Monthly Salary (₹)" : "Expected Monthly (Estimate) (₹)"}>
                                                <div className="flex h-10 items-center px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-black text-indigo-600">
                                                    ₹{grossSalary.toLocaleString('en-IN')}
                                                </div>
                                            </FormField>
                                        </div>
                                    </>
                                )}

                                {formData.employment.privilegeType === 'Non-Privileged' && (
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="h-4 w-4 text-orange-500" />
                                            <p className="text-xs font-black uppercase tracking-widest text-orange-600">Work-Based Pay Notice</p>
                                        </div>
                                        <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium">
                                            This employee is <strong>contractual Employee</strong>. Their actual payout will be calculated based on daily production/work entries (piece-rate) rather than a fixed basic pay.
                                        </p>
                                    </div>
                                )}

                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 pt-2">Statutory Details</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="PF Account (UAN)">
                                        <Input placeholder="e.g. 100123456789" value={formData.compensation.uanNumber} onChange={e => setComp('uanNumber', e.target.value)} />
                                    </FormField>
                                    <FormField label="PF Number">
                                        <Input placeholder="e.g. TN/CHN/12345" value={formData.compensation.pfNumber} onChange={e => setComp('pfNumber', e.target.value)} />
                                    </FormField>
                                    <FormField label="ESI Number">
                                        <Input placeholder="e.g. 1234567890" value={formData.compensation.esiNumber} onChange={e => setComp('esiNumber', e.target.value)} />
                                    </FormField>
                                </div>

                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 pt-2">Bank Details (Salary Transfer)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Bank Name"><Input placeholder="e.g. State Bank of India" value={formData.compensation.bankDetails.bankName} onChange={e => setBank('bankName', e.target.value)} /></FormField>
                                    <FormField label="Account Number"><Input placeholder="e.g. 123456789012" value={formData.compensation.bankDetails.accountNumber} onChange={e => setBank('accountNumber', e.target.value)} /></FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="IFSC Code"><Input placeholder="e.g. SBIN0001234" value={formData.compensation.bankDetails.ifscCode} onChange={e => setBank('ifscCode', e.target.value)} /></FormField>
                                    <FormField label="Branch Name"><Input placeholder="e.g. Tiruppur Main Branch" value={formData.compensation.bankDetails.branchName} onChange={e => setBank('branchName', e.target.value)} /></FormField>
                                </div>
                            </div>
                        )}


                        {/* ─── TAB 6: Documents ─── */}
                        {activeTab === 'documents' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Documents Upload</p>
                                <p className="text-xs text-slate-500">Upload document numbers for identity verification. File uploads can be done after saving.</p>
                                {formData.documents.map((doc: any, idx: number) => (
                                    <div key={idx} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase text-indigo-600">Document #{idx + 1}</span>
                                            <button type="button" onClick={() => setFormData({ ...formData, documents: formData.documents.filter((_: any, i: number) => i !== idx) })} className="text-rose-500"><X size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Document Type">
                                                <Select
                                                    value={doc.documentType}
                                                    onChange={val => { const u = [...formData.documents]; u[idx].documentType = val; setFormData({ ...formData, documents: u }); }}
                                                    options={['Aadhar Card', 'PAN Card', 'Educational Certificate', 'Experience Certificate', 'Passport Photo', 'Address Proof'].map(d => ({ value: d, label: d }))}
                                                    placeholder="Select Type"
                                                />
                                            </FormField>
                                            <FormField label="Document Number">
                                                <Input placeholder="e.g. XXXX-XXXX-XXXX" value={doc.documentNumber} onChange={e => { const u = [...formData.documents]; u[idx].documentNumber = e.target.value; setFormData({ ...formData, documents: u }); }} />
                                            </FormField>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="ghost" className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 font-bold uppercase text-xs tracking-widest" onClick={() => setFormData({ ...formData, documents: [...formData.documents, { documentType: '', documentNumber: '', fileUrl: '' }] })}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Document
                                </Button>
                            </div>
                        )}

                        {/* ─── TAB 7: Leave & Attendance Settings ─── */}
                        {activeTab === 'leave' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Leave & Attendance Settings</p>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
                                    <strong>Note:</strong> Set opening leave balances for this employee. These will be used to track leave attendance through the year.
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Casual Leave (Opening)">
                                        <Input type="number" value={formData.attendance.leaveBalance.casualLeave} onChange={e => setLeave('casualLeave', Number(e.target.value))} />
                                    </FormField>
                                    <FormField label="Sick Leave (Opening)">
                                        <Input type="number" value={formData.attendance.leaveBalance.sickLeave} onChange={e => setLeave('sickLeave', Number(e.target.value))} />
                                    </FormField>
                                    <FormField label="Earned / Privilege Leave (Opening)">
                                        <Input type="number" value={formData.attendance.leaveBalance.earnedLeave} onChange={e => setLeave('earnedLeave', Number(e.target.value))} />
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 8: Activation ─── */}
                        {activeTab === 'activation' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Activation</p>
                                <FormField label="Employee Status">
                                    <Select
                                        value={formData.status}
                                        onChange={val => setFormData({ ...formData, status: val })}
                                        options={['Active', 'Inactive', 'On Leave', 'Terminated'].map(s => ({ value: s, label: s }))}
                                    />
                                </FormField>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
                                    <strong>Note:</strong> Verify all details before setting status to &quot;Active&quot;. Once active, the employee will be ready for login and work assignment.
                                </div>
                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Personal details verified
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Contact information filled
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Employment details assigned
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Salary & bank details configured
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Documents uploaded
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Footer ─── */}
                    <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-2">
                            {TABS.findIndex(t => t.id === activeTab) > 0 && (
                                <Button type="button" variant="ghost" onClick={() => { const idx = TABS.findIndex(t => t.id === activeTab); setActiveTab(TABS[idx - 1].id); }}>← Prev</Button>
                            )}
                            {TABS.findIndex(t => t.id === activeTab) < TABS.length - 1 && (
                                <Button type="button" variant="ghost" onClick={() => { const idx = TABS.findIndex(t => t.id === activeTab); setActiveTab(TABS[idx + 1].id); }}>Next →</Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">
                                {isSubmitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Confirm Onboarding'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
