'use client';

import React from 'react';
import { 
    History, 
    TrendingUp, 
    DollarSign, 
    ArrowRightLeft, 
    Plus, 
    Minus,
    Download 
} from 'lucide-react';
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
import { Employee, LedgerEntry } from '../../types';

interface EmployeeLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    ledgerEntries: LedgerEntry[];
    loading?: boolean;
}

const EmployeeLedgerModal: React.FC<EmployeeLedgerModalProps> = ({
    isOpen,
    onClose,
    employee,
    ledgerEntries,
    loading
}) => {
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

    return (
        <>
            <Modal 
                isOpen={isOpen} 
                onClose={onClose} 
                title={`Employee Ledger: ${employee?.employeeName || ''}`} 
                maxWidth="6xl"
            >
            <div className="space-y-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                                <DollarSign size={16} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase text-indigo-900 dark:text-indigo-300 tracking-widest">Net Balance</h4>
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white tabular-nums">
                            ₹{(ledgerEntries[ledgerEntries.length - 1]?.balance || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                                <Plus size={16} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase text-emerald-900 dark:text-emerald-300 tracking-widest">Total Credits</h4>
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white tabular-nums">
                            ₹{ledgerEntries.reduce((acc, curr) => acc + curr.credit, 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                                <Minus size={16} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase text-rose-900 dark:text-rose-300 tracking-widest">Total Debits</h4>
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white tabular-nums">
                            ₹{ledgerEntries.reduce((acc, curr) => acc + curr.debit, 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                            <TableRow className="h-16 border-none">
                                <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Timeline</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Type</TableHead>
                                <TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-400">Description</TableHead>
                                <TableHead className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Debit (-)</TableHead>
                                <TableHead className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Credit (+)</TableHead>
                                <TableHead className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400">Image</TableHead>
                                <TableHead className="text-right px-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Net Position</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <TrendingUp size={32} className="text-slate-200 animate-pulse" />
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Decoding Ledger Matrix...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : ledgerEntries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <p className="text-[11px] font-black uppercase text-slate-300 italic">No temporal transactions identified...</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                ledgerEntries.map((entry, index) => (
                                    <TableRow key={`ledger-entry-${index}-${entry._id || entry.referenceId || 'fallback'}`} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-b border-slate-50 dark:border-slate-800/50 h-16 transition-colors">
                                        <TableCell className="px-6 font-mono text-[10px] font-black text-slate-500">{new Date(entry.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-black px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-tighter">
                                                {entry.paymentMode || (entry.type === 'Salary' ? 'Cash' : entry.type)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                    entry.type === 'Salary' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500' :
                                                    entry.type === 'Payment' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                    <ArrowRightLeft size={14} />
                                                </div>
                                                <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate">{entry.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-[10px] font-black text-rose-500 tabular-nums">{entry.debit > 0 ? `-₹${entry.debit.toLocaleString()}` : '--'}</TableCell>
                                        <TableCell className="text-center text-[10px] font-black text-emerald-500 tabular-nums">{entry.credit > 0 ? `+₹${entry.credit.toLocaleString()}` : '--'}</TableCell>
                                        <TableCell className="text-center">
                                            {entry.screenshotUrl ? (
                                                <button 
                                                    onClick={() => setSelectedImage(entry.screenshotUrl!)}
                                                    className="inline-block relative group/img focus:outline-none"
                                                >
                                                    <img 
                                                        src={entry.screenshotUrl} 
                                                        alt="Receipt" 
                                                        className="h-10 w-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform shadow-sm"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                                                        <Plus size={12} className="text-white" />
                                                    </div>
                                                </button>
                                            ) : (
                                                <span className="text-[9px] font-black text-slate-300 uppercase italic">No Image</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right px-6 text-[11px] font-black text-slate-800 dark:text-white tabular-nums">₹{entry.balance.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                    <Button 
                        onClick={() => window.print()}
                        className="bg-slate-100 hover:bg-slate-900 text-slate-500 hover:text-white h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 transition-all shadow-sm"
                    >
                        <Download size={16} /> Export Statement
                    </Button>
                    <Button 
                        onClick={onClose}
                        className="bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    >
                        Close Registry
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

export default EmployeeLedgerModal;
