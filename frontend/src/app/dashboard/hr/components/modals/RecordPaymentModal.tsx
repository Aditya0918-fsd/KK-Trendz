'use client';

import React from 'react';
import { 
    RefreshCcw, 
    BadgeCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentEmp: any;
    paymentForm: any;
    setPaymentForm: (form: any) => void;
    savingPayment: boolean;
    handleCreatePayment: () => void;
    totalNetSalary: number;
    netBalance: number;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
    isOpen,
    onClose,
    paymentEmp,
    paymentForm,
    setPaymentForm,
    savingPayment,
    handleCreatePayment,
    totalNetSalary,
    netBalance
}) => {
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

    if (!paymentEmp) return null;

    const outstanding = Math.max(0, netBalance);
    const totalAdvances = Math.max(0, -netBalance);
    const finalPayout = outstanding;

    return (
        <>
            <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Record Payment — ${paymentEmp.employeeName}`}
            className="max-w-2xl"
        >
            <div className="space-y-6 pt-4">
                {/* Employee Summary */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Net Salary', value: `₹${totalNetSalary.toLocaleString()}`, color: 'indigo' },
                        { label: 'Outstanding', value: `₹${outstanding.toLocaleString()}`, color: 'rose' },
                        { label: 'Total Advances', value: `₹${totalAdvances.toLocaleString()}`, color: 'amber' },
                        { label: 'FINAL PAYOUT', value: `₹${finalPayout.toLocaleString()}`, color: 'emerald' },
                    ].map((c, i) => (
                        <div key={i} className={`rounded-2xl p-4 bg-${c.color}-50 dark:bg-${c.color}-900/20 border border-${c.color}-100 dark:border-${c.color}-800/40 font-bold`}>
                            <p className={`text-[8px] font-black uppercase tracking-tight text-${c.color}-500 mb-1 leading-tight`}>{c.label}</p>
                            <p className={`text-lg font-black text-${c.color}-700 dark:text-${c.color}-300 tabular-nums`}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Payment Type</label>
                        <select
                            className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            value={paymentForm.paymentType}
                            onChange={e => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
                        >
                            <option value="Salary">Salary Payment</option>
                            <option value="Advance">Advance Payment</option>
                            <option value="Adjustment">Adjustment</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Payment Mode</label>
                        <select
                            className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            value={paymentForm.paymentMode}
                            onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Amount (₹)</label>
                        <input
                            type="number"
                            placeholder={`Outstanding: ₹${outstanding}`}
                            className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            value={paymentForm.amount}
                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Payment Date</label>
                        <input
                            type="date"
                            className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            value={paymentForm.paymentDate}
                            onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                        />
                    </div>
                    {totalAdvances > 0 && (
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Advance Deduction (₹)</label>
                            <input
                                type="number"
                                placeholder={`Max: ₹${totalAdvances}`}
                                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                value={paymentForm.advanceDeduction}
                                onChange={e => setPaymentForm({ ...paymentForm, advanceDeduction: e.target.value })}
                            />
                        </div>
                    )}
                    {/* Conditional Bank/UPI/Cheque fields */}
                    {paymentForm.paymentMode === 'Bank Transfer' && (
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Transaction Ref #</label>
                            <input type="text" placeholder="UTR / NEFT Ref"
                                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                value={paymentForm.bankDetails.transactionReference}
                                onChange={e => setPaymentForm({ ...paymentForm, bankDetails: { ...paymentForm.bankDetails, transactionReference: e.target.value } })} />
                        </div>
                    )}
                    {paymentForm.paymentMode === 'UPI' && (
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">UPI Transaction ID</label>
                            <input type="text" placeholder="UPI Ref ID"
                                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                value={paymentForm.bankDetails.upiId}
                                onChange={e => setPaymentForm({ ...paymentForm, bankDetails: { ...paymentForm.bankDetails, upiId: e.target.value } })} />
                        </div>
                    )}
                    {paymentForm.paymentMode === 'Cheque' && (
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Cheque Number</label>
                            <input type="text" placeholder="Cheque No."
                                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                value={paymentForm.bankDetails.chequeNumber}
                                onChange={e => setPaymentForm({ ...paymentForm, bankDetails: { ...paymentForm.bankDetails, chequeNumber: e.target.value } })} />
                        </div>
                    )}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Remarks</label>
                            <input type="text" placeholder="Optional note..."
                                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                value={paymentForm.remarks}
                                onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Payment Screenshot</label>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        
                                        try {
                                            const res = await api.post('/payroll/upload-salary-screenshot', formData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            setPaymentForm({
                                                ...paymentForm,
                                                bankDetails: {
                                                    ...paymentForm.bankDetails,
                                                    upiScreenshotUrl: res.data.url
                                                }
                                            });
                                        } catch (err) {
                                            console.error('Upload failed:', err);
                                            alert('Screenshot upload failed');
                                        }
                                    }}
                                />
                                <div className={`w-full h-12 flex items-center justify-between px-4 rounded-xl border-2 border-dashed transition-all ${
                                    paymentForm.bankDetails.upiScreenshotUrl 
                                    ? "border-emerald-500 bg-emerald-50/30 text-emerald-600" 
                                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400"
                                }`}>
                                    <span className="text-[10px] font-black uppercase tracking-wider truncate mr-2">
                                        {paymentForm.bankDetails.upiScreenshotUrl ? '✅ Screenshot Uploaded' : 'Click to Upload Receipt'}
                                    </span>
                                    {paymentForm.bankDetails.upiScreenshotUrl && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedImage(paymentForm.bankDetails.upiScreenshotUrl);
                                            }}
                                            className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded-md hover:bg-emerald-600 transition-colors z-20"
                                        >
                                            View
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="ghost" onClick={onClose}
                        className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreatePayment}
                        disabled={savingPayment || !paymentForm.amount}
                        className="bg-indigo-600 hover:bg-indigo-700 h-12 px-10 rounded-2xl font-black uppercase text-[11px] tracking-wider text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                    >
                        {savingPayment ? (
                            <><RefreshCcw size={15} className="mr-2 animate-spin" />Saving...</>
                        ) : (
                            <><BadgeCheck size={15} className="mr-2" />Record Payment</>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>

        {/* Image Preview Modal */}
            <Modal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                title="Receipt Preview"
                maxWidth="2xl"
            >
                <div className="flex items-center justify-center p-2">
                    {selectedImage && (
                        <img 
                            src={selectedImage} 
                            alt="Receipt Large" 
                            className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
                        />
                    )}
                </div>
                <div className="flex justify-center mt-6">
                    <Button 
                        onClick={() => setSelectedImage(null)}
                        className="bg-slate-900 text-white h-12 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    >
                        Close Preview
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default RecordPaymentModal;
