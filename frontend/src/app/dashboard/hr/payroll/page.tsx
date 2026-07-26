'use client';

import { useState, useEffect } from 'react';
import {
    Upload, FileSpreadsheet, ChevronRight, Download,
    CreditCard, Users, Clock, AlertCircle, CheckCircle2,
    Calendar, Calculator, Filter, Landmark, MoreHorizontal
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function PayrollPage() {
    const { loading: authLoading } = useAuth();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [shiftStart, setShiftStart] = useState('09:30');
    const [processing, setProcessing] = useState(false);

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/payroll?month=${month}&year=${year}`);
            setPayrolls(res.data);
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchPayrolls();
    }, [authLoading, month, year]);

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;

        setProcessing(true);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('month', month.toString());
        formData.append('year', year.toString());
        formData.append('shiftStartTime', shiftStart);

        try {
            await api.post('/payroll/process-attendance', formData);
            setIsUploadModalOpen(false);
            setUploadFile(null);
            fetchPayrolls();
        } catch (error) {
            console.error('Error processing attendance:', error);
            alert('Error processing biometric file. Ensure headers match.');
        } finally {
            setProcessing(false);
        }
    };

    const totalPayout = payrolls.reduce((acc, curr) => acc + (curr.salaryDetails?.netSalary || 0), 0);

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight italic">Payroll <span className="text-indigo-600">Command</span></h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Salary computation & biometric synchronization</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1 shadow-sm">
                            <select
                                className="bg-transparent text-[11px] font-black uppercase px-3 py-1.5 focus:outline-none"
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select
                                className="bg-transparent text-[11px] font-black uppercase px-3 py-1.5 focus:outline-none"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <Button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-100 dark:shadow-none"
                        >
                            <Upload size={16} className="mr-2" /> Sync Biometric
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Employees', value: payrolls.length, icon: Users, color: 'indigo' },
                        { label: 'Total Net Payout', value: `₹${totalPayout.toLocaleString()}`, icon: CreditCard, color: 'emerald' },
                        { label: 'Avg Attendance', value: '94.2%', icon: Clock, color: 'amber' },
                        { label: 'Pending Approvals', value: payrolls.filter(p => p.status === 'Draft').length, icon: AlertCircle, color: 'rose' },
                    ].map((s, i) => (
                        <Card key={i} className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white italic">{s.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600`}>
                                        <s.icon size={20} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Payroll Table */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500">Payroll List – {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}</CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase"><Filter size={14} className="mr-2" /> Filter</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/30 dark:bg-slate-800/20">
                                <TableRow className="border-none">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">Employee</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Month (D/P/H/A)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center border-x border-slate-100 dark:border-slate-800">Gross Salary</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Net Payable</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6 h-12">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                                <p className="text-[10px] font-black uppercase text-slate-400">Loading Payroll Engine...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : payrolls.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                                <Calculator size={48} className="text-slate-300" />
                                                <p className="text-[11px] font-black uppercase text-slate-400">No payroll records found for this period</p>
                                                <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(true)} className="rounded-xl font-bold">Sync Attendance Now</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payrolls.map((p) => (
                                        <TableRow key={p._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b-slate-100 dark:border-b-slate-800/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        {p.employee?.employeeName?.charAt(0)}
                                                    </div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{p.employee?.employeeName}</div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-tighter">{p.employee?.employeeCode}</span>
                                                                <span className="text-[8px] text-slate-300">•</span>
                                                                <span className="text-[9px] font-black text-indigo-500/70 uppercase tracking-widest">{p.employee?.employment?.department} / {p.employee?.employment?.subDepartment}</span>
                                                            </div>
                                                        </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="text-center">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Days</p>
                                                        <p className="text-xs font-black">{p.totalDays}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[9px] font-black text-emerald-500 uppercase">Pres</p>
                                                        <p className="text-xs font-black">{p.presentDays}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[9px] font-black text-amber-500 uppercase">Half</p>
                                                        <p className="text-xs font-black">{p.halfDays}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[9px] font-black text-rose-500 uppercase">Abs</p>
                                                        <p className="text-xs font-black">{p.absentDays}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center border-x border-slate-50 dark:border-slate-800/50">
                                                <p className="text-xs font-black text-slate-600 dark:text-slate-300 italic">₹{p.salaryDetails?.baseGross?.toLocaleString()}</p>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <p className="text-sm font-black text-indigo-600 italic">₹{p.salaryDetails?.netSalary?.toLocaleString()}</p>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                                                        p.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-9 px-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 border-none">
                                                        <Landmark size={14} className="text-slate-400 mr-2" /> Pay
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

                {/* Upload Modal */}
                <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Biometric Sync Engine">
                    <form onSubmit={handleFileUpload} className="space-y-6 pt-4">
                        <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-400 transition-all">
                            <input
                                type="file"
                                id="excel-upload"
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            />
                            <label htmlFor="excel-upload" className="w-full cursor-pointer">
                                <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
                                </div>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                                    {uploadFile ? uploadFile.name : 'Select Attendance Excel'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supports .xlsx, .xls files form Biometric tool</p>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Shift Start Time</p>
                                <Input
                                    type="time"
                                    value={shiftStart}
                                    onChange={(e) => setShiftStart(e.target.value)}
                                    className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                                />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <Clock className="h-5 w-5 text-amber-500" />
                                <p className="text-[9px] font-bold text-amber-700 leading-tight">Rules: Late entry by {'>'}30 mins will automatically count as half-day deduct.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-8">Dismiss</Button>
                            <Button
                                type="submit"
                                disabled={!uploadFile || processing}
                                className="bg-indigo-600 hover:bg-indigo-700 h-11 px-10 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none"
                            >
                                {processing ? 'Processing Cluster...' : 'Execute Calculation'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
