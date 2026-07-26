'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Download,
    FileSpreadsheet,
    Upload,
    UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function AttendanceCalculationPage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [employees, setEmployees] = useState<any[]>([]);
    const [payrollData, setPayrollData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, payrollRes] = await Promise.all([
                api.get('/employees'),
                api.get(`/payroll?month=${month}&year=${year}`)
            ]);
            setEmployees(empRes.data);
            setPayrollData(payrollRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;

        setProcessing(true);
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('month', selectedMonth.toString());
        formData.append('year', selectedYear.toString());
        formData.append('shiftStartTime', '09:30');

        try {
            await api.post('/payroll/process-attendance', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsModalOpen(false);
            setUploadFile(null);
            fetchData();
        } catch (error) {
            console.error('Error uploading attendance:', error);
            alert('Error processing attendance file. Please ensure the file format is correct.');
        } finally {
            setProcessing(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight italic">
                            Attendance <span className="text-indigo-600">Calculation</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Monthly attendance summary & payroll logic
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
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
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-100"
                        >
                            <Plus size={16} className="mr-2" /> Add Attendance
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Search employees..."
                            className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest">
                        <Filter size={16} className="mr-2 text-indigo-600" /> Filter
                    </Button>
                    <Button variant="outline" className="h-11 rounded-xl border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest">
                        <Download size={16} className="mr-2 text-indigo-600" /> Export
                    </Button>
                </div>

                {/* Main Table */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                                Employee Attendance Sync – {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}
                            </CardTitle>
                            <Link href="/dashboard/masters/employee">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-900 dark:hover:bg-indigo-900/20 font-black uppercase text-[10px] tracking-widest gap-2"
                                >
                                    <UserPlus size={14} />
                                    Add Employee
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/30 dark:bg-slate-800/20">
                                <TableRow className="border-none">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">Employee</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Total Days</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Present</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Half Day</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Absent</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Net Payable</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-center">Last Sync</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6 h-12">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                                <p className="text-[10px] font-black uppercase text-slate-400">Fetching attendance registry...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64 text-center">
                                            <p className="text-[11px] font-black uppercase text-slate-400">No employees found matching search</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEmployees.map((emp) => {
                                        const payroll = payrollData.find(p => p.employee?._id === emp._id);
                                        return (
                                            <TableRow key={emp._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b-slate-100 dark:border-b-slate-800/50">
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            {emp.employeeName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{emp.employeeName}</div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-tighter">{emp.employeeCode}</span>
                                                                <span className="text-[8px] text-slate-300">•</span>
                                                                <span className="text-[9px] font-black text-indigo-500/70 uppercase tracking-widest">{emp.employment?.department} / {emp.employment?.subDepartment}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-xs font-black">{payroll?.totalDays || '--'}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-xs font-black text-emerald-600">{payroll?.presentDays || '--'}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-xs font-black text-amber-600">{payroll?.halfDays || '--'}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-xs font-black text-rose-600">{payroll?.absentDays || '--'}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-sm font-black text-indigo-600 italic">₹{payroll?.salaryDetails?.netSalary?.toLocaleString() || '0'}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {payroll?.updatedAt ? format(new Date(payroll.updatedAt), 'dd MMM, HH:mm') : 'Never'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setIsModalOpen(true)}
                                                    >
                                                        <Upload size={14} className="text-slate-400" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Add Attendance Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Employee Attendance">
                    <form onSubmit={handleFileUpload} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Month</label>
                                    <select
                                        className="w-full h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Year</label>
                                    <select
                                        className="w-full h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    >
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-400 transition-all">
                                <input
                                    type="file"
                                    id="employee-excel-upload"
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    required
                                />
                                <label htmlFor="employee-excel-upload" className="w-full cursor-pointer">
                                    <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
                                    </div>
                                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                                        {uploadFile ? uploadFile.name : 'Select Attendance Excel'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supports .xlsx, .xls files</p>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-8">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={!uploadFile || processing}
                                className="bg-indigo-600 hover:bg-indigo-700 h-11 px-10 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-indigo-200"
                            >
                                {processing ? 'Processing...' : 'Upload & Calculate'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
