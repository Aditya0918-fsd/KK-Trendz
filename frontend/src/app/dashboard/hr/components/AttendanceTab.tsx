'use client';

import React from 'react';
import { 
    Search, 
    Plus, 
    UserPlus, 
    History, 
    Eye, 
    Upload,
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    Filter as FilterIcon
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
    Table, 
    TableHeader, 
    TableBody, 
    TableHead, 
    TableRow, 
    TableCell 
} from '@/components/ui/Table';

interface AttendanceTabProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    setIsAttendanceModalOpen: (open: boolean) => void;
    showFilterBar: boolean;
    setShowFilterBar: (show: boolean) => void;
    filterDepartment: string;
    setFilterDepartment: (dept: string) => void;
    departments: any[];
    filterSubDept: string;
    setFilterSubDept: (subDept: string) => void;
    subDepartments: any[];
    filterLocation: string;
    setFilterLocation: (loc: string) => void;
    locations: any[];
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    filterCategory: string;
    setFilterCategory: (category: string) => void;
    filteredEmployees: any[];
    employees: any[];
    payrollData: any[];
    dataLoading: boolean;
    paginatedEmployees: any[];
    formatMinutes: (mins: number) => string;
    setPaymentEmp: (emp: any) => void;
    setIsPaymentModalOpen: (open: boolean) => void;
    setLedgerEmp: (emp: any) => void;
    fetchEmployeeLedger: (empId: string) => void;
    openEmployeeDetail: (emp: any) => void;
    statsTotalLate: number;
    statsTotalExtra: number;
    rowsPerPage: number;
    setRowsPerPage: (rows: number) => void;
    viewMode: 'monthly' | 'weekly';
    setViewMode: (mode: 'monthly' | 'weekly') => void;
    weekStart: string;
    setWeekStart: (date: string) => void;
    weekEnd: string;
    setWeekEnd: (date: string) => void;
    currentPage: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    totalPages: number;
    jumpInput: string;
    setJumpInput: (input: string) => void;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({
    searchQuery,
    setSearchQuery,
    setIsAttendanceModalOpen,
    showFilterBar,
    setShowFilterBar,
    filterDepartment,
    setFilterDepartment,
    departments,
    filterSubDept,
    setFilterSubDept,
    subDepartments,
    filterLocation,
    setFilterLocation,
    locations,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filteredEmployees,
    employees,
    payrollData,
    dataLoading,
    paginatedEmployees,
    formatMinutes,
    setPaymentEmp,
    setIsPaymentModalOpen,
    setLedgerEmp,
    fetchEmployeeLedger,
    openEmployeeDetail,
    statsTotalLate,
    statsTotalExtra,
    rowsPerPage,
    setRowsPerPage,
    viewMode,
    setViewMode,
    weekStart,
    setWeekStart,
    weekEnd,
    setWeekEnd,
    currentPage,
    setCurrentPage,
    totalPages,
    jumpInput,
    setJumpInput
}) => {
    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                        placeholder="Search employees..." 
                        className="pl-9 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold placeholder:text-slate-400" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        className="h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Privileged">Privileged</option>
                        <option value="Production">Production</option>
                        <option value="Daily">Daily</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Button variant="outline" onClick={() => setShowFilterBar(!showFilterBar)} className={`h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest gap-2 ${showFilterBar ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : ''}`}>
                        <FilterIcon size={14} className={showFilterBar ? 'fill-indigo-600/20' : ''} />
                        Filter
                    </Button>
                    <Button onClick={() => setIsAttendanceModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-indigo-100/20">
                        <Plus size={15} className="mr-2" /> Add Attendance
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            {showFilterBar && (
                <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-900/50 p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Department</p>
                            <select 
                                className="h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs font-bold" 
                                value={filterDepartment} 
                                onChange={(e) => setFilterDepartment(e.target.value)}
                            >
                                <option value="All">All Departments</option>
                                {departments.map((dept: any) => <option key={dept} value={dept}>{dept}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Sub Department</p>
                            <select 
                                className="h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs font-bold" 
                                value={filterSubDept} 
                                onChange={(e) => setFilterSubDept(e.target.value)}
                            >
                                <option value="All">All Sub Depts</option>
                                {subDepartments.map((sd: any) => <option key={sd} value={sd}>{sd}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Location</p>
                            <select 
                                className="h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs font-bold" 
                                value={filterLocation} 
                                onChange={(e) => setFilterLocation(e.target.value)}
                            >
                                <option value="All">All Locations</option>
                                {locations.map((loc: any) => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Status</p>
                            <select 
                                className="h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs font-bold" 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Present">Has Attendance</option>
                                <option value="Absent">Fully Absent</option>
                            </select>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { 
                                setFilterDepartment('All'); 
                                setFilterSubDept('All');
                                setFilterLocation('All');
                                setFilterStatus('All'); 
                                setFilterCategory('All'); 
                                setSearchQuery(''); 
                            }} 
                            className="h-10 text-[10px] font-black uppercase text-slate-400"
                        >
                            Reset
                        </Button>
                    </div>
                </Card>
            )}

            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                                Employee Attendance Registry
                                <span className="text-xs font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-[5px] border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm">
                                    {filteredEmployees.length} / {employees.length} Employees
                                </span>
                            </CardTitle>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                {viewMode === 'weekly' ? (
                                    <span className="text-indigo-600 font-black">
                                        Weekly View: {format(new Date(weekStart), 'dd MMM yyyy')} &rarr; {format(new Date(weekEnd), 'dd MMM yyyy')}
                                    </span>
                                ) : 'Monthly synchronization & payroll mapping'}
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Monthly/Weekly Selector */}
                            <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('monthly')}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setViewMode('weekly')}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${viewMode === 'weekly' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Weekly
                                </button>
                            </div>

                            {/* Weekly Date Range Inputs */}
                            {viewMode === 'weekly' && (
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black uppercase text-slate-400 ml-1 mb-0.5">From</span>
                                        <input
                                            type="date"
                                            className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={weekStart}
                                            onChange={(e) => setWeekStart(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black uppercase text-slate-400 ml-1 mb-0.5">To</span>
                                        <input
                                            type="date"
                                            className="h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={weekEnd}
                                            onChange={(e) => setWeekEnd(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <Link href="/dashboard/masters/employee">
                                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest gap-2 transition-all">
                                    <UserPlus size={14} /> Add New Employee
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30 dark:bg-slate-800/20">
                            <TableRow className="border-none">
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] px-8 h-14 text-slate-400">Employee Profile</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] h-14 text-center text-slate-400">Days</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] h-14 text-center text-slate-400">Present</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] h-14 text-center text-slate-400">Total Late</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] h-14 text-center text-slate-400">Total Extra</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] h-14 text-center text-slate-400">Net</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] h-14 text-center text-slate-400">Absent</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] h-14 text-center text-slate-400">Net Salary</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] h-14 text-center text-slate-400">Sync Status</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-[0.15em] text-right px-8 h-14 text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dataLoading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                            <p className="text-[10px] font-black uppercase text-slate-400">Connecting to biometric cloud...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedEmployees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-48 text-center text-slate-300">
                                        <p className="text-[11px] font-black uppercase">No records matching your filters</p>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedEmployees.map(emp => {
                                const payroll = payrollData.find(p => (p.employee?._id || p.employee) === emp._id);
                                return (
                                    <TableRow key={emp._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b-slate-100/50 dark:border-b-slate-800/50">
                                        <TableCell className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-3 duration-500 shadow-sm">{emp.employeeName.charAt(0)}</div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{emp.employeeName}</div>
                                                        {emp.employment?.privilegeType === 'Privileged' && (
                                                            <span className="text-[7px] font-black bg-gradient-to-r from-amber-500 to-orange-600 text-white px-2 py-0.5 rounded-full uppercase tracking-[0.1em] shadow-[0_2px_10px_-3px_rgba(245,158,11,0.5)] border border-amber-400/50">Privileged</span>
                                                        )}
                                                        {emp.employment?.category === 'Contract' && (
                                                            <span className="text-[7px] font-black bg-orange-600 text-white px-1.5 py-0.5 rounded uppercase tracking-[0.1em] shadow-sm">Production</span>
                                                        )}
                                                        {emp.employment?.category === 'Salary' && (
                                                            <span className="text-[7px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-[0.1em] shadow-sm">Monthly</span>
                                                        )}
                                                        {emp.employment?.category === 'Temporary' && (
                                                            <span className="text-[7px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase tracking-[0.1em] shadow-sm">Daily</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase font-mono tracking-tighter">{emp.employeeCode}</span>
                                                        <span className="text-[8px] text-slate-300">•</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{emp.employment?.department} / {emp.employment?.subDepartment}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-black text-slate-600 dark:text-slate-400 tabular-nums text-xs">{payroll?.totalDays || '--'}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex h-7 px-3 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black tabular-nums">{payroll?.presentDays || '0'}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-[11px] font-black text-rose-500 tabular-nums">{formatMinutes(payroll?.totalLateMinutes || 0)}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-[11px] font-black text-indigo-500 dark:text-indigo-300 tabular-nums">{formatMinutes(payroll?.totalExtraMinutes || 0)}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {(() => {
                                                const net = (payroll?.totalExtraMinutes || 0) - (payroll?.totalLateMinutes || 0);
                                                return (
                                                    <span className={`text-[11px] font-black tabular-nums ${net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {net > 0 ? '+' : (net < 0 ? '-' : '')}{formatMinutes(Math.abs(net))}
                                                    </span>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex h-7 px-3 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[11px] font-black tabular-nums">{payroll?.absentDays || '0'}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight tabular-nums">₹{payroll?.salaryDetails?.netSalary?.toLocaleString() || '0'}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${payroll?.updatedAt ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${payroll?.updatedAt ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                                        {payroll?.updatedAt ? 'Synced' : 'Pending'}
                                                    </span>
                                                </div>
                                                {payroll?.updatedAt && (
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {format(new Date(payroll.updatedAt), 'MMM dd, HH:mm')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex items-center justify-end gap-2 transition-all">
                                                <button
                                                    onClick={() => { setPaymentEmp(emp); setIsPaymentModalOpen(true); }}
                                                    className="h-8 px-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center justify-center text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95"
                                                >
                                                    Pay
                                                </button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all" title="Employee Ledger" onClick={() => { setLedgerEmp(emp); fetchEmployeeLedger(emp._id); }}>
                                                    <History size={14} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 transition-all" title="View Extended Profile" onClick={() => openEmployeeDetail(emp)}>
                                                    <Eye size={14} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 transition-all" title="Force Manual Sync" onClick={() => setIsAttendanceModalOpen(true)}>
                                                    <Upload size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {paginatedEmployees.length > 0 && (
                                <TableRow className="bg-slate-50/50 dark:bg-slate-900 font-black border-t-2 border-slate-200 dark:border-slate-800">
                                    <TableCell className="px-8 py-5">
                                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Monthly Grand Totals</div>
                                    </TableCell>
                                    <TableCell className="text-center">--</TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex h-7 px-3 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black tabular-nums">
                                            {payrollData.reduce((s, p) => s + (p.presentDays || 0), 0)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 tabular-nums">-{formatMinutes(statsTotalLate)}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">+{formatMinutes(statsTotalExtra)}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center justify-center gap-0.5">
                                            {(() => {
                                                const net = statsTotalExtra - statsTotalLate;
                                                return (
                                                    <span className={`text-[11px] font-black tabular-nums ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                        {net > 0 ? '+' : (net < 0 ? '-' : '')}{formatMinutes(Math.abs(net))}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex h-7 px-3 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[11px] font-black tabular-nums">
                                            {payrollData.reduce((s, p) => s + (p.absentDays || 0), 0)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="text-[14px] font-black text-slate-800 dark:text-white tabular-nums tracking-tight border-b-2 border-indigo-500 pb-0.5">
                                            ₹{(payrollData.reduce((s, p) => s + (p.salaryDetails?.netSalary || 0), 0) || 0).toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination Controls */}
                <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-slate-400">Rows per page</span>
                            <select
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900 dark:text-white font-black">{Math.min((currentPage - 1) * rowsPerPage + 1, filteredEmployees.length)}</span> - <span className="text-slate-900 dark:text-white font-black">{Math.min(currentPage * rowsPerPage, filteredEmployees.length)}</span> of <span className="text-indigo-600 font-black">{filteredEmployees.length}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Jump to logic */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-slate-400">Jump to</span>
                            <div className="flex gap-1 items-center">
                                <input
                                    type="text"
                                    placeholder="Pg #"
                                    className="w-12 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 text-[10px] font-black text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    value={jumpInput}
                                    onChange={(e) => setJumpInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const page = parseInt(jumpInput);
                                            if (!isNaN(page) && page > 0 && page <= totalPages) {
                                                setCurrentPage(page);
                                                setJumpInput("");
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronsLeft size={14} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft size={14} />
                            </Button>

                            <div className="flex items-center gap-1 mx-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "primary" : "ghost"}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`h-8 w-8 p-0 text-[10px] font-black border border-transparent ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400'}`}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight size={14} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronsRight size={14} />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AttendanceTab;
