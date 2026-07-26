'use client';

import React from 'react';
import { 
    Printer, 
    XCircle, 
    IndianRupee 
} from 'lucide-react';
import { isSunday, isSameDay } from 'date-fns';

interface ViewReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptViewPayment: any;
    payrollData: any[];
    detailAttendance: any[];
    payrollSettings: any;
    formatMinutes: (mins: number) => string;
}

const ViewReceiptModal: React.FC<ViewReceiptModalProps> = ({
    isOpen,
    onClose,
    receiptViewPayment,
    payrollData,
    detailAttendance,
    payrollSettings,
    formatMinutes
}) => {
    if (!isOpen || !receiptViewPayment) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Receipt Actions */}
                <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Money Receipt</p>
                    <div className="flex gap-3">
                        <button onClick={() => window.print()}
                            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all">
                            <Printer size={13} /> Print
                        </button>
                        <button onClick={onClose}
                            className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all">
                            <XCircle size={14} />
                        </button>
                    </div>
                </div>

                {/* Printable Receipt Body */}
                <div className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-4 border-slate-900 pb-5">
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">KK TRENDZ</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Textile ERP | Workforce Management</p>
                        </div>
                        <div className="text-right">
                            <div className="inline-block bg-slate-900 text-white px-5 py-2 rounded-lg font-black uppercase text-base tracking-widest">
                                MONEY RECEIPT
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
                                {receiptViewPayment.paymentType === 'Advance' ? 'Advance Payment' : 'Salary Disbursement'}
                            </p>
                        </div>
                    </div>

                    {/* Receipt Meta */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">Receipt Details</p>
                            <div className="grid grid-cols-2 gap-y-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Receipt No.</span>
                                <span className="text-[11px] font-black font-mono text-indigo-600">{receiptViewPayment.receiptNumber}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Date</span>
                                <span className="text-[11px] font-black">
                                    {receiptViewPayment.paymentDate ? new Date(receiptViewPayment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '--'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Period</span>
                                <span className="text-[11px] font-black">
                                    {new Date(0, receiptViewPayment.month - 1).toLocaleString('default', { month: 'long' })} {receiptViewPayment.year}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Mode</span>
                                <span className="text-[11px] font-black">{receiptViewPayment.paymentMode}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">Employee Details</p>
                            <div className="grid grid-cols-2 gap-y-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Name</span>
                                <span className="text-[11px] font-black uppercase">{receiptViewPayment.employeeName}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Code</span>
                                <span className="text-[11px] font-black font-mono">{receiptViewPayment.employeeCode}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Net Salary</span>
                                <span className="text-[11px] font-black">₹{receiptViewPayment.netSalaryDue?.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Prev. Due</span>
                                <span className="text-[11px] font-black text-rose-600">₹{receiptViewPayment.previousDue?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Amount Block */}
                    <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Amount Paid</p>
                            <p className="text-4xl font-black tabular-nums tracking-tighter">₹{receiptViewPayment.amount?.toLocaleString()}</p>
                            {receiptViewPayment.advanceDeduction > 0 && (
                                <p className="text-[10px] font-bold text-amber-400 mt-1 uppercase">
                                    Advance deducted: ₹{receiptViewPayment.advanceDeduction?.toLocaleString()}
                                </p>
                            )}
                        </div>
                        <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
                            <IndianRupee size={32} className="text-white" />
                        </div>
                    </div>

                    {/* CALCULATION BREAKDOWN SYNC */}
                    {(() => {
                        const payroll = payrollData.find(p => (p.employee?._id || p.employee) === (receiptViewPayment.employee?._id || receiptViewPayment.employee || receiptViewPayment.employeeId));
                        if (!payroll) return null;
                        const isProduction = payroll.employee?.employment?.department === 'Production' || payroll.employee?.employment?.category === 'Contract';

                        return (
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Calculation Breakdown</p>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Present</span>
                                            <span className="text-[10px] font-black">{payroll.presentDays} Days</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Late</span>
                                            <span className="text-[10px] font-black text-amber-600">{formatMinutes(payroll.totalLateMinutes)}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Extra</span>
                                            <span className="text-[10px] font-black text-indigo-600">{formatMinutes(payroll.totalExtraMinutes)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl flex flex-col group">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase text-slate-500">Base Package</span>
                                            <span className="text-[10px] font-black tabular-nums">₹{isProduction ? 0 : payroll.salaryDetails?.baseGross?.toLocaleString()}</span>
                                        </div>
                                        {!isProduction && <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Official Gross</span>}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl flex flex-col group text-emerald-600">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase">Pro-rated Earnings</span>
                                            <span className="text-[10px] font-black tabular-nums">₹{isProduction ? 0 : payroll.salaryDetails?.calculatedGross?.toLocaleString()}</span>
                                        </div>
                                        {!isProduction && (
                                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                                                ₹{Math.round(payroll.calculationLog?.dailyRate || 0)} × {(() => {
                                                    const isSalary = payroll.employee?.employment?.category === 'Salary';
                                                    const isPrivileged = payroll.employee?.employment?.privilegeType === 'Privileged';
                                                    if (isPrivileged) return 30;
                                                    return payroll.presentDays || 0;
                                                })()} Days
                                            </span>
                                        )}
                                    </div>
                                    {payroll.salaryDetails?.holidaySundayExtraPay > 0 && (
                                        <div className="bg-amber-500/5 p-3 rounded-xl flex flex-col group col-span-2 text-amber-600 border border-amber-500/10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black uppercase tracking-widest italic">Holiday Work Bonus (+)</span>
                                                <span className="text-[10px] font-black tabular-nums">+₹{payroll.salaryDetails?.holidaySundayExtraPay?.toLocaleString()}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                                                {detailAttendance.filter(log => {
                                                    const d = new Date(log.date);
                                                    const isHol = isSunday(d) || (payrollSettings.holidays || []).some((h: any) => isSameDay(new Date(h.date), d));
                                                    return isHol && log.inTime;
                                                }).length} Worked Days
                                            </span>
                                        </div>
                                    )}
                                    {payroll.salaryDetails?.overtimePay > 0 && (
                                        <div className="bg-indigo-500/5 p-3 rounded-xl flex flex-col group text-indigo-600 border border-indigo-500/10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black uppercase">Overtime yield (+)</span>
                                                <span className="text-[10px] font-black tabular-nums">+₹{payroll.salaryDetails?.overtimePay?.toLocaleString()}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{formatMinutes(payroll.totalExtraMinutes)}</span>
                                        </div>
                                    )}
                                    {payroll.salaryDetails?.deductions > 0 && (
                                        <div className="bg-rose-500/5 p-3 rounded-xl flex flex-col group text-rose-600 border border-rose-500/10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black uppercase">Penalties (-)</span>
                                                <span className="text-[10px] font-black tabular-nums">-₹{payroll.salaryDetails?.deductions?.toLocaleString()}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{formatMinutes(payroll.totalLateMinutes)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Remarks & Bank Details */}
                    {(receiptViewPayment.remarks || receiptViewPayment.bankDetails?.transactionReference) && (
                        <div className="bg-indigo-50/60 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-4 space-y-2">
                            {receiptViewPayment.remarks && (
                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    <span className="font-black uppercase text-indigo-600 mr-2">Remarks:</span>{receiptViewPayment.remarks}
                                </p>
                            )}
                            {receiptViewPayment.bankDetails?.transactionReference && (
                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    <span className="font-black uppercase text-indigo-600 mr-2">Ref #:</span>{receiptViewPayment.bankDetails.transactionReference}
                                </p>
                            )}
                            {receiptViewPayment.bankDetails?.chequeNumber && (
                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    <span className="font-black uppercase text-indigo-600 mr-2">Cheque #:</span>{receiptViewPayment.bankDetails.chequeNumber}
                                </p>
                            )}
                            {receiptViewPayment.bankDetails?.upiId && (
                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    <span className="font-black uppercase text-indigo-600 mr-2">UPI ID:</span>{receiptViewPayment.bankDetails.upiId}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Signature */}
                    <div className="grid grid-cols-2 gap-16 pt-8">
                        <div className="text-center border-t-2 border-slate-900 pt-3">
                            <p className="text-[10px] font-black uppercase">Employee Signature</p>
                        </div>
                        <div className="text-center border-t-2 border-slate-900 pt-3">
                            <p className="text-[10px] font-black uppercase">Authorized Signatory</p>
                        </div>
                    </div>

                    {/* Receipt Image */}
                    {(receiptViewPayment.bankDetails?.upiScreenshotUrl || receiptViewPayment.screenshotUrl) && (
                        <div className="mt-8 flex justify-center pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 break-inside-avoid">
                            <img 
                                src={receiptViewPayment.bankDetails?.upiScreenshotUrl || receiptViewPayment.screenshotUrl} 
                                alt="Payment Receipt" 
                                className="max-w-full max-h-[400px] object-contain rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                            />
                        </div>
                    )}

                    {/* Footer */}
                    <p className="text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 mt-8 break-inside-avoid">
                        Computer-generated receipt | Receipt ID: {receiptViewPayment?._id?.slice(-8).toUpperCase()} | KK Trendz Textile ERP
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ViewReceiptModal;
