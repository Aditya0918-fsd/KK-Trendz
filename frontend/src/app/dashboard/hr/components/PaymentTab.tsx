'use client';

import React from 'react';
import { 
    Search, 
    IndianRupee, 
    BadgeCheck, 
    AlertTriangle, 
    Banknote, 
    CheckCircle2, 
    ReceiptText, 
    History,
    Filter as FilterIcon
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PaymentTabProps {
    employees: any[];
    payrollData: any[];
    salaryPayments: any[];
    paymentLoading: boolean;
    paymentSearch: string;
    setPaymentSearch: (search: string) => void;
    month: number;
    year: number;
    filterCategory: string;
    setFilterCategory: (category: string) => void;
    setPaymentEmp: (emp: any) => void;
    setIsPaymentModalOpen: (open: boolean) => void;
    setReceiptViewPayment: (payment: any) => void;
    setIsReceiptModalOpen: (open: boolean) => void;
    setLedgerEmp: (emp: any) => void;
    fetchEmployeeLedger: (empId: string) => void;
    employeeBalances?: Record<string, number>;
    filterDepartment: string;
    setFilterDepartment: (dept: string) => void;
    departments: any[];
    filterSubDept: string;
    setFilterSubDept: (subDept: string) => void;
    subDepartments: any[];
    filterLocation: string;
    setFilterLocation: (loc: string) => void;
    locations: any[];
}

const PaymentTab: React.FC<PaymentTabProps> = ({
    employees,
    payrollData,
    salaryPayments,
    paymentLoading,
    paymentSearch,
    setPaymentSearch,
    month,
    year,
    filterCategory,
    setFilterCategory,
    setPaymentEmp,
    setIsPaymentModalOpen,
    setReceiptViewPayment,
    setIsReceiptModalOpen,
    setLedgerEmp,
    fetchEmployeeLedger,
    employeeBalances,
    filterDepartment,
    setFilterDepartment,
    departments,
    filterSubDept,
    setFilterSubDept,
    subDepartments,
    filterLocation,
    setFilterLocation,
    locations
}) => {
    const [statusFilter, setStatusFilter] = React.useState('All');
    const [showFilters, setShowFilters] = React.useState(false);

    // Per-employee payment summary helpers
    const getEmpPayrollData = (empId: string) =>
        payrollData.find(p => (p.employee?._id || p.employee) === empId);

    const getEmpPayments = (empId: string) =>
        salaryPayments.filter(p => (p.employee?._id || p.employee) === empId);

    const getEmpNetSalary = (empId: string) =>
        getEmpPayrollData(empId)?.salaryDetails?.netSalary ?? 0;

    const getEmpTotalSalaryPaid = (empId: string) =>
        getEmpPayments(empId)
            .filter((p: any) => p.paymentType === 'Salary')
            .reduce((s: number, p: any) => s + p.amount, 0);

    const getEmpTotalAdvances = (empId: string) => {
        const netBalance = employeeBalances?.[empId] || 0;
        return Math.max(0, -netBalance);
    };

    const getEmpOutstandingDue = (empId: string) => {
        const netBalance = employeeBalances?.[empId] || 0;
        return Math.max(0, netBalance);
    };

    const filteredPaymentEmps = employees.filter(emp => {
        const matchesSearch = emp.employeeName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
            emp.employeeCode.toLowerCase().includes(paymentSearch.toLowerCase());
        
        const matchesDept = filterDepartment === 'All' || emp.employment?.department === filterDepartment;
        const matchesSubDept = filterSubDept === 'All' || emp.employment?.subDepartment === filterSubDept;
        const matchesLocation = filterLocation === 'All' || emp.employment?.location === filterLocation;

        let matchesCategory = true;
        if (filterCategory !== 'All') {
            if (filterCategory === 'Monthly') matchesCategory = emp.employment?.category === 'Salary';
            else if (filterCategory === 'Privileged') matchesCategory = emp.employment?.privilegeType === 'Privileged';
            else if (filterCategory === 'Production') matchesCategory = emp.employment?.category === 'Contract';
            else if (filterCategory === 'Daily') matchesCategory = emp.employment?.category === 'Temporary';
        }

        let matchesStatus = true;
        if (statusFilter !== 'All') {
            const netSalary = getEmpNetSalary(emp._id);
            const paid = getEmpTotalSalaryPaid(emp._id);
            const due = getEmpOutstandingDue(emp._id);
            const fullyPaid = due === 0 && netSalary > 0;
            const hasPayroll = netSalary > 0;
            
            let status = '';
            if (!hasPayroll) status = 'Pending Calc';
            else if (fullyPaid) status = 'Paid';
            else if (paid > 0) status = 'Partial';
            else status = 'Unpaid';
            
            matchesStatus = status === statusFilter;
        }

        return matchesSearch && matchesCategory && matchesStatus && matchesDept && matchesSubDept && matchesLocation;
    });

    // Grand totals for summary cards
    const grandNetPayroll = payrollData.reduce((s, p) => s + (p.salaryDetails?.netSalary ?? 0), 0);
    const grandTotalPaid = employees.reduce((s, e) => s + getEmpTotalSalaryPaid(e._id), 0);
    const grandOutstanding = employees.reduce((s, e) => s + getEmpOutstandingDue(e._id), 0);
    const grandAdvances = employees.reduce((s, e) => s + getEmpTotalAdvances(e._id), 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Net Payroll (Month)', value: `₹${grandNetPayroll.toLocaleString()}`, icon: IndianRupee, color: 'indigo', sub: 'Total computed salary' },
                    { label: 'Total Paid', value: `₹${grandTotalPaid.toLocaleString()}`, icon: BadgeCheck, color: 'emerald', sub: 'Salary disbursed' },
                    { label: 'Outstanding Due', value: `₹${grandOutstanding.toLocaleString()}`, icon: AlertTriangle, color: 'rose', sub: 'Remaining unpaid' },
                    { label: 'Total Advances', value: `₹${grandAdvances.toLocaleString()}`, icon: Banknote, color: 'amber', sub: 'Advance payments given' },
                ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-3">
                            <div className={`inline-flex p-3 rounded-xl bg-${card.color}-50 dark:bg-${card.color}-900/20 text-${card.color}-600 w-fit`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">{card.value}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{card.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Employee Payment List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 space-y-4">
                    {/* Row 1: Title & Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Employee Payment Registry</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">{new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year} — Salary & Advance Tracker</p>
                            </div>
                            <span className="text-xs font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-[5px] border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm whitespace-nowrap">
                                {filteredPaymentEmps.length} / {employees.length} Employees
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    placeholder="Search by name or code..."
                                    className="pl-9 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 pr-4 w-64"
                                    value={paymentSearch}
                                    onChange={e => setPaymentSearch(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={() => setShowFilters(!showFilters)} 
                                className={`h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest gap-2 ${showFilters ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                            >
                                <FilterIcon size={14} className={showFilters ? 'fill-indigo-600/20' : ''} />
                                Filter
                            </Button>
                        </div>
                    </div>

                    {/* Row 2: Four Specialty Filters (Toggleable) */}
                    {showFilters && (
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                            <select 
                                className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-w-[140px]"
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                            >
                                <option value="All">All Departments</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select 
                                className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-w-[140px]"
                                value={filterSubDept}
                                onChange={(e) => setFilterSubDept(e.target.value)}
                            >
                                <option value="All">All Sub Depts</option>
                                {subDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select 
                                className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-w-[140px]"
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                            >
                                <option value="All">All Locations</option>
                                {locations.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select 
                                className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-w-[140px]"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Paid">Paid</option>
                                <option value="Partial">Partial</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Pending Calc">Pending Calc</option>
                            </select>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-10 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 ml-auto"
                                onClick={() => {
                                    setFilterDepartment('All');
                                    setFilterSubDept('All');
                                    setFilterLocation('All');
                                    setStatusFilter('All');
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                                {['Employee', 'Net Salary', 'Paid (Month)', 'Advances', 'Outstanding Due', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 h-12 px-6 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paymentLoading ? (
                                <tr><td colSpan={7} className="text-center py-16">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-7 w-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-[10px] font-black uppercase text-slate-400">Loading payments...</p>
                                    </div>
                                </td></tr>
                            ) : filteredPaymentEmps.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-[11px] font-black uppercase">No employees found</td></tr>
                            ) : filteredPaymentEmps.map(emp => {
                                const netSalary = getEmpNetSalary(emp._id);
                                const paid = getEmpTotalSalaryPaid(emp._id);
                                const advances = getEmpTotalAdvances(emp._id);
                                const due = getEmpOutstandingDue(emp._id);
                                const empPayments = getEmpPayments(emp._id);
                                const fullyPaid = due === 0 && netSalary > 0;
                                const hasPayroll = netSalary > 0;

                                return (
                                    <tr key={emp._id} className="group border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        {/* Employee */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-sm">
                                                    {emp.employeeName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{emp.employeeName}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[9px] font-bold text-indigo-500 font-mono tracking-tighter">{emp.employeeCode}</span>
                                                        <span className="text-[8px] text-slate-300">•</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{emp.employment?.department} / {emp.employment?.subDepartment}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Net Salary */}
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                                                {hasPayroll ? `₹${netSalary.toLocaleString()}` : <span className="text-slate-400">Not calculated</span>}
                                            </span>
                                        </td>
                                        {/* Paid */}
                                        <td className="px-6 py-5">
                                            <span className={`text-xs font-black tabular-nums ${paid > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                ₹{paid.toLocaleString()}
                                            </span>
                                        </td>
                                        {/* Advances */}
                                        <td className="px-6 py-5">
                                            <span className={`text-xs font-black tabular-nums ${advances > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                ₹{advances.toLocaleString()}
                                            </span>
                                        </td>
                                        {/* Due */}
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-black tabular-nums px-3 py-1 rounded-xl ${!hasPayroll ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' :
                                                    fullyPaid ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                                                        'bg-rose-50 dark:bg-rose-900/20 text-rose-600'
                                                }`}>
                                                {fullyPaid ? <CheckCircle2 size={12} /> : hasPayroll ? <AlertTriangle size={12} /> : null}
                                                ₹{due.toLocaleString()}
                                            </span>
                                        </td>
                                        {/* Status */}
                                        <td className="px-6 py-5">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${!hasPayroll ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' :
                                                    fullyPaid ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                                                        paid > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                                                            'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
                                                }`}>
                                                {!hasPayroll ? 'Pending Calc' : fullyPaid ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'}
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 transition-all">
                                                <button
                                                    onClick={() => { setPaymentEmp(emp); setIsPaymentModalOpen(true); }}
                                                    className="h-9 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95"
                                                >
                                                    Pay
                                                </button>
                                                {empPayments.length > 0 && (
                                                    <button
                                                        title="View Latest Receipt"
                                                        onClick={() => {
                                                            setReceiptViewPayment(empPayments[0]);
                                                            setIsReceiptModalOpen(true);
                                                        }}
                                                        className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center"
                                                    >
                                                        <ReceiptText size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    title="Employee Ledger"
                                                    onClick={() => { setLedgerEmp(emp); fetchEmployeeLedger(emp._id); }}
                                                    className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all flex items-center justify-center"
                                                >
                                                    <History size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentTab;
