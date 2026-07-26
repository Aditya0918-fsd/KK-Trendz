'use client';

import React from 'react';
import { 
    History, 
    FileDown, 
    CheckCircle2, 
    Clock, 
    TrendingUp, 
    AlertCircle, 
    Calculator,
    Star
} from 'lucide-react';
import { format, isSunday, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { 
    Table, 
    TableHeader, 
    TableBody, 
    TableRow, 
    TableHead, 
    TableCell 
} from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Employee, PayrollResult, AttendanceRecord, PayrollSettings } from '../../types';
import { getStatusBadge, getStatusIcon, getMonthName } from '../../utils';

interface EmployeeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    payroll: PayrollResult | null;
    attendance: AttendanceRecord[];
    month: number;
    year: number;
    calendarDays: Date[];
    payrollSettings: PayrollSettings;
    onViewLedger: (empId: string) => void;
    onExportPDF: () => void;
    loading?: boolean;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
    isOpen,
    onClose,
    employee,
    payroll,
    attendance,
    month,
    year,
    calendarDays,
    payrollSettings,
    onViewLedger,
    onExportPDF,
    loading
}) => {
    if (!employee) return null;

    // Calculate detailed breakdown of all 31 days' yield as shown in table
    const chronologicalBreakdown = payroll ? calendarDays.reduce((acc, date) => {
        const log = attendance.find(d => isSameDay(new Date(d.date), date));
        const isSun = isSunday(date);
        const holidayMatch = (payrollSettings.holidays || []).find((h: any) => isSameDay(new Date(h.date), date));
        const isHol = !!holidayMatch;
        const isOffDay = isSun || isHol;
        const isSalary = employee.employment?.category === 'Salary';
        const isPrivileged = employee.employment?.privilegeType === 'Privileged';
        const dailyRate = payroll.calculationLog?.dailyRate || 0;
        const minuteRate = payroll.calculationLog?.minuteRate || 0;

        let base = 0;
        let bonus = 0;
        let ot = 0;
        let late = 0;

        // Pro-rated daily base (for both Salary/Privileged and normal employees)
        if (log?.status === 'Present' || log?.status === 'Late' || log?.status === 'Half Day' || log?.inTime) {
            base = dailyRate;
        }

        if (isOffDay && log?.inTime) bonus = dailyRate;
        if (log?.extraMinutes) ot = log.extraMinutes * minuteRate;
        if (log?.lateMinutes) late = log.lateMinutes * minuteRate;
        
        const dayYield = Math.max(0, base + bonus + ot - late);
        
        return {
            total: acc.total + dayYield,
            base: acc.base + base,
            bonus: acc.bonus + bonus,
            ot: acc.ot + ot,
            late: acc.late + late
        };
    }, { total: 0, base: 0, bonus: 0, ot: 0, late: 0 }) : { total: 0, base: 0, bonus: 0, ot: 0, late: 0 };

    const sumProducedYield = chronologicalBreakdown.total;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Employee Record: ${employee.employeeName}`}
            maxWidth="5xl"
        >
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <div className="h-12 w-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Hydrating Record...</p>
                </div>
            ) : (
                <>
            <div className="flex justify-end gap-3 mb-4">
                <Button 
                    onClick={() => onViewLedger(employee._id)}
                    className="bg-slate-100 hover:bg-slate-900 text-slate-500 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-white dark:hover:text-slate-900 h-9 px-5 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 transition-all"
                >
                    <History size={14} /> View Ledger
                </Button>
                <Button 
                    onClick={onExportPDF}
                    className="bg-indigo-600 hover:bg-indigo-700 h-9 px-5 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
                >
                    <FileDown size={14} /> Export PDF
                </Button>
            </div>

            {/* Printable area - Preview in Modal */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                {/* Employee Info Header */}
                <div className="flex items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-200 dark:shadow-none">
                        {employee.employeeName.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{employee.employeeName}</h2>
                            {employee.employment?.privilegeType === 'Privileged' ? (
                                <span className="text-[9px] font-black bg-indigo-500 text-white px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/20">Privileged</span>
                            ) : (
                                <span className="text-[9px] font-black bg-slate-500 text-white px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-slate-500/20">Non-Privileged</span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase font-mono mt-1 tracking-tighter">{employee.employeeCode}</p>
                        <div className="flex flex-wrap gap-4 mt-3">
                            {employee.employment?.designation && <span className="text-[10px] font-black uppercase px-3 py-1.5 bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/10">{employee.employment.designation}</span>}
                            {employee.employment?.department && (
                                <span className="text-[10px] font-black uppercase px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                                    {employee.employment.department} / <span className="text-slate-400">{employee.employment.subDepartment}</span>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Fiscal Period</p>
                        <p className="text-sm font-black text-slate-800 dark:text-white italic">{getMonthName(month)} {year}</p>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Present Days', value: payroll?.presentDays ?? '0', icon: CheckCircle2, color: 'emerald', sub: 'Active' },
                        { label: 'Late Minutes', value: payroll?.totalLateMinutes ? `${payroll.totalLateMinutes}m` : '0m', icon: Clock, color: 'amber', sub: 'Delay' },
                        { label: 'Overtime', value: payroll?.totalExtraMinutes ? `${payroll.totalExtraMinutes}m` : '0m', icon: TrendingUp, color: 'indigo', sub: 'Bonus' },
                        { label: 'Absent', value: payroll?.absentDays ?? '0', icon: AlertCircle, color: 'rose', sub: 'Unpaid' },
                    ].map(m => (
                        <div key={m.label} className="group relative p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                            <div className={`h-10 w-10 mb-4 rounded-2xl flex items-center justify-center text-${m.color}-500 group-hover:scale-110 transition-transform bg-${m.color}-50 dark:bg-${m.color}-900/20`}>
                                <m.icon size={20} />
                            </div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{m.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-800 dark:text-white tabular-nums">{m.value}</span>
                                <span className={`text-[9px] font-bold text-${m.color}-500 uppercase tracking-tighter`}>{m.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Economic Breakdown */}
                {payroll && (
                    <div className="relative overflow-hidden p-8 rounded-[2rem] bg-slate-900 text-white shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-3">
                                        Economic Distribution
                                        <div className="h-px bg-slate-800 flex-1" />
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
                                        <div className="flex justify-between items-center group">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-300 transition-colors">Base Package</span>
                                                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter italic">Official Gross</span>
                                            </div>
                                            <span className="text-sm font-black tabular-nums">₹{payroll.salaryDetails?.baseGross?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-400 transition-colors">Pro-rated Earnings</span>
                                                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter italic">
                                                    ₹{Math.round(payroll.calculationLog?.dailyRate || 0)} × {(() => {
                                                        const isSalary = employee.employment?.category === 'Salary';
                                                        const isPrivileged = employee.employment?.privilegeType === 'Privileged';
                                                        if (isPrivileged) return calendarDays.length;
                                                        return payroll.presentDays;
                                                    })()} Days
                                                </span>
                                            </div>
                                            <span className="text-sm font-black tabular-nums text-emerald-400">₹{payroll.salaryDetails?.calculatedGross?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-400 transition-colors">Chronological Base Earning</span>
                                                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter italic">
                                                    ₹{(payroll.calculationLog?.dailyRate || 0).toFixed(2)} × {(() => {
                                                        const isSalary = employee.employment?.category === 'Salary';
                                                        const isPrivileged = employee.employment?.privilegeType === 'Privileged';
                                                        if (isSalary || isPrivileged) return payroll.presentDays;
                                                        return payroll.presentDays;
                                                    })()} Days
                                                </span>
                                            </div>
                                            <span className="text-sm font-black tabular-nums text-emerald-400">₹{chronologicalBreakdown.base.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        {chronologicalBreakdown.bonus > 0 && (
                                            <div className="flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-amber-500 group-hover:text-amber-400 transition-colors">Holiday/Sunday Work Bonus (+)</span>
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter italic">
                                                        ₹{(payroll.calculationLog?.dailyRate || 0).toFixed(2)} × {attendance.filter(log => {
                                                            const d = new Date(log.date);
                                                            const isHol = isSunday(d) || (payrollSettings.holidays || []).some((h: any) => isSameDay(new Date(h.date), d));
                                                            return isHol && log.inTime;
                                                        }).length} Worked Days
                                                    </span>
                                                </div>
                                                <span className="text-sm font-black tabular-nums text-amber-400">₹{chronologicalBreakdown.bonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        {chronologicalBreakdown.ot > 0 && (
                                            <div className="flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-indigo-400 transition-colors">Total Overtime Yield (+)</span>
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter italic text-indigo-400/50">
                                                        {payroll.totalExtraMinutes}m × ₹{(payroll.calculationLog?.minuteRate || 0).toFixed(2)} /min
                                                    </span>
                                                </div>
                                                <span className="text-sm font-black tabular-nums text-indigo-400">₹{chronologicalBreakdown.ot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        {chronologicalBreakdown.late > 0 && (
                                            <div className="flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-rose-400 transition-colors">Attendance Penalties (-)</span>
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter italic text-rose-400/50">
                                                        {payroll.totalLateMinutes}m × ₹{(payroll.calculationLog?.minuteRate || 0).toFixed(2)} /min
                                                    </span>
                                                </div>
                                                <span className="text-sm font-black tabular-nums text-rose-400">₹{chronologicalBreakdown.late.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Attendance Source Parameters */}
                                    <div className="pt-8 border-t border-slate-800 mt-6 grid grid-cols-2 lg:grid-cols-5 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Active Present</p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm font-black text-white tabular-nums" title="Normal Working Days">
                                                    {payroll.presentDays - attendance.filter(log => {
                                                        const d = new Date(log.date);
                                                        const isHol = isSunday(d) || (payrollSettings.holidays || []).some((h: any) => isSameDay(new Date(h.date), d));
                                                        return isHol && log.inTime;
                                                    }).length}
                                                    <span className="text-[8px] text-slate-600 font-bold tracking-tighter uppercase ml-1">Norm</span>
                                                </p>
                                                <p className="text-sm font-black text-white tabular-nums" title="Worked on Sun/Hol">
                                                    {attendance.filter(log => {
                                                        const d = new Date(log.date);
                                                        const isHol = isSunday(d) || (payrollSettings.holidays || []).some((h: any) => isSameDay(new Date(h.date), d));
                                                        return isHol && log.inTime;
                                                    }).length}
                                                    <span className="text-[8px] text-slate-600 font-bold tracking-tighter uppercase ml-1">Hol</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 border-l border-slate-800 pl-6">
                                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Sundays/Holi</p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm font-black text-white tabular-nums">{calendarDays.filter(d => isSunday(d)).length} <span className="text-[8px] text-slate-600 font-bold tracking-tighter uppercase">Sun</span></p>
                                                <p className="text-sm font-black text-white tabular-nums">{calendarDays.filter(d => !isSunday(d) && (payrollSettings.holidays || []).some(h => isSameDay(new Date(h.date), d))).length} <span className="text-[8px] text-slate-600 font-bold tracking-tighter uppercase">Hol</span></p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 border-l border-slate-800 pl-6">
                                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Overtime Days</p>
                                            <p className="text-sm font-black text-indigo-400 tabular-nums">
                                                {attendance.filter(log => {
                                                    const d = new Date(log.date);
                                                    const isHol = isSunday(d) || (payrollSettings.holidays || []).some((h: any) => isSameDay(new Date(h.date), d));
                                                    return isHol && log.inTime;
                                                }).length}
                                                <span className="text-[8px] text-indigo-900/40 font-bold tracking-tighter uppercase ml-1">WORKED</span>
                                            </p>
                                        </div>
                                        <div className="space-y-1 border-l border-slate-800 pl-6">
                                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Unpaid Absent</p>
                                            <p className="text-sm font-black text-rose-500 tabular-nums">{payroll.absentDays} <span className="text-[8px] text-rose-900/40 font-bold tracking-tighter uppercase">Days</span></p>
                                        </div>
                                        <div className="space-y-1 border-l border-slate-800 pl-6">
                                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Paid Quota</p>
                                            <p className="text-sm font-black text-emerald-400 tabular-nums">
                                                {(() => {
                                                    const isSalary = employee.employment?.category === 'Salary';
                                                    const isPrivileged = employee.employment?.privilegeType === 'Privileged';
                                                    if (isPrivileged) return calendarDays.length;
                                                    return payroll.presentDays;
                                                })()}
                                                <span className="text-[8px] text-emerald-900/40 font-bold tracking-tighter uppercase ml-1">Total</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:w-px bg-slate-800" />

                            <div className="flex flex-col justify-center items-center md:items-end md:min-w-[240px]">
                                <div className="space-y-4 w-full">
                                    <div className="flex flex-col items-center md:items-end">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.4em] mb-1">Pro-rated Package</p>
                                        <div className="text-4xl font-black text-white tracking-tighter tabular-nums text-emerald-400">₹{payroll.salaryDetails?.netSalary?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <p className="text-[7px] font-bold text-slate-600 uppercase tracking-tighter mt-1">
                                            Base: ₹{Math.round(payroll.calculationLog?.dailyRate || 0)} × {(() => {
                                                const isSalary = employee.employment?.category === 'Salary';
                                                const isPrivileged = employee.employment?.privilegeType === 'Privileged';
                                                if (isSalary || isPrivileged) return payroll.presentDays;
                                                return payroll.presentDays;
                                            })()} Days
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-col items-center md:items-end p-4 rounded-2xl bg-slate-800/40 border border-indigo-500/10 transition-all border-dashed mt-2">
                                        <p className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-1 italic">Actual Chronological Sum</p>
                                        <div className="text-2xl font-black text-white tracking-tighter tabular-nums text-indigo-300">₹{sumProducedYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                    <CheckCircle2 size={10} /> Certified Calculation
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chronological Logs */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                        Chronological Presence
                        <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                    </h3>
                    <div className="border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-400">Temporal Marker</th>
                                    <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Inbound</th>
                                    <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Outbound</th>
                                    <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Variance</th>
                                    <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Net</th>
                                    <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Daily Yield</th>
                                    <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {calendarDays.map(date => {
                                    const log = attendance.find(d => isSameDay(new Date(d.date), date));
                                    const isSun = isSunday(date);
                                    const holidayMatch = (payrollSettings.holidays || []).find((h: any) => isSameDay(new Date(h.date), date));
                                    const isHol = !!holidayMatch;

                                    let finalStatus = log?.status;
                                    if (!finalStatus) {
                                        if (isHol) finalStatus = 'Holiday';
                                        else if (isSun) finalStatus = 'Sunday';
                                        else finalStatus = 'Absent';
                                    } else if (finalStatus === 'Holiday') {
                                        if (isSun && !isHol) finalStatus = 'Sunday';
                                    }

                                    const isOffDay = isSun || isHol;
                                    return (
                                        <tr key={date.toISOString()} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${isOffDay ? (isHol ? 'bg-amber-50/30 dark:bg-amber-900/10' : 'bg-indigo-50/20 dark:bg-indigo-900/10') : ''}`}>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black text-slate-800 dark:text-white tabular-nums">{format(date, 'dd MMM')}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isHol ? 'text-amber-500' : isSun ? 'text-indigo-500' : 'text-slate-400'}`}>{format(date, 'EEEE')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-center font-mono text-[11px] font-black text-slate-600 dark:text-slate-400">{log?.inTime || '--:--'}</td>
                                            <td className="px-6 py-3.5 text-center font-mono text-[11px] font-black text-slate-600 dark:text-slate-400">{log?.outTime || '--:--'}</td>
                                            <td className="px-6 py-3.5 text-center">
                                                <div className="flex flex-col gap-0.5 items-center">
                                                    {(log?.lateMinutes ?? 0) > 0 && <span className="text-[10px] font-black text-rose-500 tabular-nums">-{log?.lateMinutes}m</span>}
                                                    {(log?.extraMinutes ?? 0) > 0 && <span className="text-[10px] font-black text-emerald-500 tabular-nums">+{log?.extraMinutes}m</span>}
                                                    {(!(log?.lateMinutes ?? 0) && !(log?.extraMinutes ?? 0)) && <span className="text-[10px] font-black text-slate-300">--</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                {(() => {
                                                    const net = (log?.extraMinutes || 0) - (log?.lateMinutes || 0);
                                                    if (net === 0) return <span className="text-[10px] font-black text-slate-300">--</span>;
                                                    return (
                                                        <span className={`text-[10px] font-black tabular-nums ${net > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {net > 0 ? '+' : ''}{net}m
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                {(() => {
                                                    if (!payroll) return '--';
                                                    const isSalary = employee.employment?.category === 'Salary';
                                                    const isPrivileged = employee.employment?.privilegeType === 'Privileged';
                                                    const dailyRate = payroll.calculationLog?.dailyRate || 0;
                                                    const minuteRate = payroll.calculationLog?.minuteRate || 0;

                                                    let base = 0;
                                                    let bonus = 0;
                                                    let ot = 0;
                                                    let late = 0;

                                                    if (log?.status === 'Present' || log?.status === 'Late' || log?.status === 'Half Day' || log?.inTime) {
                                                        base = dailyRate;
                                                    }

                                                    if (isOffDay && log?.inTime) bonus = dailyRate;
                                                    if (log?.extraMinutes) ot = log.extraMinutes * minuteRate;
                                                    if (log?.lateMinutes) late = log.lateMinutes * minuteRate;
                                                    
                                                    const dayYield = Math.max(0, base + bonus + ot - late);

                                                    if (dayYield <= 0 && !log?.inTime && !((isSalary || isPrivileged) && isHol)) return <span className="text-[10px] font-black text-slate-300">--</span>;

                                                    return (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[11px] font-black text-slate-800 dark:text-white tabular-nums">₹{dayYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            {(isOffDay && log?.inTime) && <span className="text-[7px] font-black text-amber-500 uppercase tracking-tighter">Double</span>}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                                    {isHol && (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusBadge('Holiday')}`}>
                                                            {getStatusIcon('Holiday')}{holidayMatch?.name || 'HOLIDAY'}
                                                        </span>
                                                    )}
                                                    {isSun && !isHol && (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusBadge('Sunday')}`}>
                                                            {getStatusIcon('Sunday')}SUNDAY
                                                        </span>
                                                    )}
                                                    {(log?.status === 'Present' || log?.status === 'Late' || log?.inTime) && (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(finalStatus || 'Present')}`}>
                                                            {getStatusIcon(finalStatus || 'Present')}{finalStatus}
                                                        </span>
                                                    )}
                                                    {(isOffDay && log?.inTime) && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-lg shadow-amber-500/10 animate-pulse">
                                                            <Star size={10} className="fill-current" /> 2X BONUS
                                                        </span>
                                                    )}
                                                    {(!isOffDay && !log?.inTime) && (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(finalStatus || 'Absent')}`}>
                                                            {getStatusIcon(finalStatus || 'Absent')}{finalStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-slate-900 text-white font-black border-t-4 border-slate-800">
                                    <td className="px-6 py-5 text-left">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-indigo-400">Monthly Aggregates</span>
                                            <span className="text-[8px] text-slate-400 uppercase font-bold">Total temporal variance</span>
                                        </div>
                                    </td>
                                    <td colSpan={2} className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-6">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] font-black text-emerald-400 tabular-nums">{payroll?.presentDays}</span>
                                                <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">Present</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] font-black text-rose-400 tabular-nums">{payroll?.absentDays}</span>
                                                <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">Absent</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] font-black text-indigo-400 tabular-nums">{payroll?.holidays}</span>
                                                <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">Holi/Sun</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            {Number(payroll?.totalLateMinutes) > 0 && <span className="text-xs font-black text-rose-400 tabular-nums">-{payroll?.totalLateMinutes}m</span>}
                                            {Number(payroll?.totalExtraMinutes) > 0 && <span className="text-xs font-black text-emerald-400 tabular-nums">+{payroll?.totalExtraMinutes}m</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                                            <span className="text-[10px] font-black tabular-nums text-slate-300">
                                                {((payroll?.totalExtraMinutes || 0) - (payroll?.totalLateMinutes || 0)) > 0 ? '+' : ''}
                                                {(payroll?.totalExtraMinutes || 0) - (payroll?.totalLateMinutes || 0)}m
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[11px] font-black text-emerald-400 tabular-nums">₹{(sumProducedYield || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    <span className="text-[7px] text-emerald-400/50 uppercase font-bold text-right">{calendarDays.length}-Day Net Sum</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Verification Footer */}
                <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-t border-dashed border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        System Verified: {format(new Date(), 'dd MMM yyyy, HH:mm')}
                    </div>
                    <div className="flex items-center gap-2">
                        KK Trendz Enterprise Engine v4.0
                    </div>
                </div>
            </div>
            </>
            )}
        </Modal>
    );
};

export default EmployeeDetailModal;
