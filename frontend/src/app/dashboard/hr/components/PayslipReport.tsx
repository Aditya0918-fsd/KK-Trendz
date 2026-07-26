'use client';

import React from 'react';
import { ChevronLeft, Download } from 'lucide-react';
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
import { Employee, PayrollResult, AttendanceRecord, PayrollSettings } from '../types';
import { formatMinutes, getMonthName } from '../utils';

interface PayslipReportProps {
    employee: Employee;
    payroll: PayrollResult | null;
    attendance: AttendanceRecord[];
    month: number;
    year: number;
    onClose: () => void;
    calendarDays: Date[];
    payrollSettings: PayrollSettings;
}

const PayslipReport: React.FC<PayslipReportProps> = ({
    employee,
    payroll,
    attendance,
    month,
    year,
    onClose,
    calendarDays,
    payrollSettings
}) => {
    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 overflow-y-auto print:static print:block print:h-auto print:overflow-visible">
            {/* Report Header Controls - Hidden on Print */}
            <div className="max-w-5xl mx-auto px-4 md:px-10 pt-10 print:hidden">
                <div className="flex items-center justify-between mb-8 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 z-10 border-b border-slate-100 dark:border-slate-800">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
                        <ChevronLeft size={16} /> Back to Dashboard
                    </Button>
                    <div className="flex gap-3">
                        <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
                            <Download size={14} /> Download / Print PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Printable Content */}
            <div className="max-w-5xl mx-auto bg-white p-8 md:p-12 space-y-8 print:p-0 print:max-w-full text-slate-800">

                {/* Professional Payslip Header */}
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900">KK TRENDZ</h1>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Textile ERP | Workforce Management</p>
                        <div className="mt-4 text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                            <p>Plot No. 123, Textile Cluster, Industrial Area</p>
                            <p>Surat, Gujarat - 395001 | contact@kktrendz.com</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg font-black uppercase text-xl tracking-widest">
                            PAYSLIP
                        </div>
                        <p className="mt-4 text-xs font-black uppercase text-slate-500">Statement for the Period</p>
                        <p className="text-xl font-black italic text-slate-900 leading-none">
                            {getMonthName(month)} {year}
                        </p>
                    </div>
                </div>

                {/* Employee & Record Info Grid */}
                <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50/50 p-6 space-y-4">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 pb-2">Employee Particulars</p>
                        <div className="grid grid-cols-2 gap-y-3">
                            <div className="text-[10px] font-bold text-slate-500 uppercase">Name</div>
                            <div className="text-[11px] font-black uppercase">{employee.employeeName}</div>

                            <div className="text-[10px] font-bold text-slate-500 uppercase">Employee Code</div>
                            <div className="text-[11px] font-black font-mono">{employee.employeeCode}</div>

                            <div className="text-[10px] font-bold text-slate-500 uppercase">Department</div>
                            <div className="text-[11px] font-black uppercase">{employee.employment?.department || 'N/A'}</div>

                            <div className="text-[10px] font-bold text-slate-500 uppercase">Designation</div>
                            <div className="text-[11px] font-black uppercase">{employee.employment?.designation || 'N/A'}</div>

                            <div className="text-[10px] font-bold text-slate-500 uppercase">Privilege Level</div>
                            <div className="text-[11px] font-black uppercase">
                                {employee.employment?.privilegeType === 'Privileged' ? (
                                    <span className="text-indigo-600">Privileged</span>
                                ) : (
                                    <span className="text-slate-500">Non-Privileged</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50/50 p-6 space-y-4 text-right">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 pb-2">Record Summary</p>
                        <div className="grid grid-cols-2 gap-y-3 text-left">
                            <div className="text-[10px] font-bold text-slate-500 uppercase text-right mr-4">Present Days</div>
                            <div className="text-[11px] font-black">{payroll?.presentDays ?? 0}</div>

                            <div className="text-[10px] font-bold text-slate-500 uppercase text-right mr-4">Total Late</div>
                            <div className="text-[11px] font-black text-amber-600">{formatMinutes(payroll?.totalLateMinutes)}</div>

                            <div className="text-[10px] font-bold text-slate-500 uppercase text-right mr-4">Total Extra</div>
                            <div className="text-[11px] font-black text-indigo-600">{formatMinutes(payroll?.totalExtraMinutes)}</div>

                            <div className="text-[10px] font-bold text-slate-500 uppercase text-right mr-4">Absent/Loss</div>
                            <div className="text-[11px] font-black text-rose-600">{payroll?.absentDays ?? 0} Days</div>
                        </div>
                    </div>
                </div>

                {/* Salary Computation (Earnings vs Deductions) */}
                {payroll && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salary Computation Detail</p>
                        <div className="border-2 border-slate-900 rounded-xl overflow-hidden">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
                                        <th className="px-6 py-3 text-left w-1/2">Description / Component</th>
                                        <th className="px-6 py-3 text-right">Calculation</th>
                                        <th className="px-6 py-3 text-right">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="font-bold text-slate-700">
                                    <tr className="border-b border-slate-100">
                                        <td className="px-6 py-4 italic">Base Package</td>
                                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-[10px]">Official Gross</td>
                                        <td className="px-6 py-4 text-right">
                                            ₹{employee.employment?.department === 'Production' || employee.employment?.category === 'Contract'
                                                ? 0
                                                : payroll.salaryDetails?.baseGross?.toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <td className="px-6 py-4">Pro-rated Earnings</td>
                                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-[10px]">
                                            ₹{Math.round(payroll.calculationLog?.dailyRate || 0)} × {(() => {
                                                const isPrivileged = employee.employment?.privilegeType === 'Privileged';
                                                if (isPrivileged) return payroll.presentDays;
                                                return payroll.presentDays;
                                            })()} Days
                                        </td>
                                        <td className="px-6 py-4 text-right">₹{payroll.salaryDetails?.calculatedGross?.toLocaleString()}</td>
                                    </tr>
                                    {payroll.salaryDetails?.holidaySundayExtraPay > 0 && (
                                        <tr className="border-b border-slate-100 text-amber-600 bg-amber-50/20">
                                            <td className="px-6 py-4 italic font-black">Holiday Work Bonus (+)</td>
                                            <td className="px-6 py-4 text-right text-slate-400 font-mono text-[10px]">
                                                {attendance.filter(log => {
                                                    const d = new Date(log.date);
                                                    const isHol = isSunday(d) || (payrollSettings.holidays || []).some((h: any) => isSameDay(new Date(h.date), d));
                                                    return isHol && log.inTime;
                                                }).length} Worked Days
                                            </td>
                                            <td className="px-6 py-4 text-right font-black">+₹{payroll.salaryDetails?.holidaySundayExtraPay?.toLocaleString()}</td>
                                        </tr>
                                    )}
                                    {payroll.salaryDetails?.overtimePay > 0 && (
                                        <tr className="border-b border-slate-100 text-indigo-600">
                                            <td className="px-6 py-4 italic">Overtime yield (+)</td>
                                            <td className="px-6 py-4 text-right text-slate-400 font-mono text-[10px]">{formatMinutes(payroll.totalExtraMinutes)}</td>
                                            <td className="px-6 py-4 text-right font-black">+₹{payroll.salaryDetails?.overtimePay?.toLocaleString()}</td>
                                        </tr>
                                    )}
                                    {payroll.salaryDetails?.deductions > 0 && (
                                        <tr className="border-b border-slate-100 text-rose-600">
                                            <td className="px-6 py-4 italic">Penalties (-)</td>
                                            <td className="px-6 py-4 text-right text-slate-400 font-mono text-[10px]">{formatMinutes(payroll.totalLateMinutes)}</td>
                                            <td className="px-6 py-4 text-right font-black">-₹{payroll.salaryDetails?.deductions?.toLocaleString()}</td>
                                        </tr>
                                    )}
                                    <tr className="bg-slate-900 text-white text-lg">
                                        <td colSpan={2} className="px-6 py-5 font-black uppercase tracking-widest">Net Payable Amount</td>
                                        <td className="px-6 py-5 text-right font-black">
                                            ₹{employee.employment?.department === 'Production' || employee.employment?.category === 'Contract'
                                                ? 0
                                                : payroll.salaryDetails?.netSalary?.toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Attendance Chronology (Compact for Print) */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Attendance Chronology</p>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-200">
                                <TableRow className="border-none">
                                    <TableHead className="px-6 py-3 text-[9px] font-black uppercase text-slate-500">Date</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center">In Time</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center">Out Time</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center">Late</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase text-slate-500 text-center">Extra</TableHead>
                                    <TableHead className="text-right px-6 text-[9px] font-black uppercase text-slate-500">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {calendarDays.map(date => {
                                    const log = attendance.find(d => isSameDay(new Date(d.date), date));
                                    const isSun = isSunday(date);
                                    const holidayMatch = (payrollSettings.holidays || []).find((h: any) => isSameDay(new Date(h.date), date));
                                    const isHol = !!holidayMatch;
                                    const isOffDay = isSun || isHol;

                                    let finalStatus = log?.status;
                                    if (!finalStatus) {
                                        if (isHol) finalStatus = 'Holiday';
                                        else if (isSun) finalStatus = 'Sunday';
                                        else finalStatus = 'Absent';
                                    } else if (finalStatus === 'Holiday') {
                                        if (isSun && !isHol) finalStatus = 'Sunday';
                                    }


                                    return (
                                        <TableRow key={date.toISOString()} className={`border-b border-slate-100 h-9 ${isHol ? 'bg-amber-50/30 font-bold' : isSun ? 'bg-slate-50/50 font-bold' : ''}`}>
                                            <TableCell className="px-6 py-1 text-[10px]">
                                                <span className="font-black">{format(date, 'dd MMM')}</span>
                                                <span className={`ml-2 text-[9px] font-bold ${isHol ? 'text-amber-500' : isSun ? 'text-indigo-500' : 'text-slate-400'}`}>{format(date, 'EEE')}</span>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-[10px]">{log?.inTime || '--:--'}</TableCell>
                                            <TableCell className="text-center font-mono text-[10px]">{log?.outTime || '--:--'}</TableCell>
                                            <TableCell className="text-center text-[10px] text-amber-600">{log?.lateMinutes ? formatMinutes(log.lateMinutes) : '-'}</TableCell>
                                            <TableCell className="text-center text-[10px] text-indigo-500">{log?.extraMinutes ? formatMinutes(log.extraMinutes) : '-'}</TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex flex-col items-end gap-0.5">
                                                    {isHol && (
                                                        <span className="text-[9px] font-black uppercase tracking-tighter text-amber-500">
                                                            {holidayMatch?.name || 'HOLIDAY'}
                                                        </span>
                                                    )}
                                                    {isSun && !isHol && (
                                                        <span className="text-[9px] font-black uppercase tracking-tighter text-indigo-500">
                                                            SUNDAY
                                                        </span>
                                                    )}
                                                    {(log?.inTime || log?.status === 'Present' || log?.status === 'Late') && (
                                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${finalStatus === 'Present' || log?.inTime ? 'text-emerald-600' :
                                                            finalStatus === 'Late' ? 'text-amber-600' : 'text-emerald-600'
                                                        }`}>
                                                            PRESENT
                                                        </span>
                                                    )}
                                                    {isOffDay && log?.inTime && (
                                                        <span className="text-[8px] font-black uppercase tracking-tighter text-amber-500">
                                                            2X BONUS
                                                        </span>
                                                    )}
                                                    {!isOffDay && !log?.inTime && (
                                                        <span className="text-[9px] font-black uppercase tracking-tighter text-rose-500">
                                                            ABSENT
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Signatures & Verification */}
                <div className="pt-20 grid grid-cols-2 gap-20">
                    <div className="text-center">
                        <div className="border-t-2 border-slate-900 pt-3">
                            <p className="text-xs font-black uppercase">Employee Signature</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Verification of Recorded Attendance & Pay</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="border-t-2 border-slate-900 pt-3">
                            <p className="text-xs font-black uppercase">Authorized Signatory</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">KK Trendz Textile ERP | HR Department</p>
                        </div>
                    </div>
                </div>

                {/* Report Footer */}
                <div className="pt-10 flex border-t border-slate-100 border-dashed justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                    <p>This is a computer-generated statement and does not require a physical seal if digitally verified.</p>
                    <p>Report ID: {payroll?._id?.slice(-8).toUpperCase() || 'REF-N/A'} | Generated: {format(new Date(), 'dd MMM yyyy, HH:mm')}</p>
                </div>
            </div>
        </div>
    );
};

export default PayslipReport;
