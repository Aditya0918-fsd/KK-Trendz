'use client';

import React from 'react';
import { 
    CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface FinalizeBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FinalizeBatchModal: React.FC<FinalizeBatchModalProps> = ({
    isOpen,
    onClose
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Finalize Payroll Batch" className="max-w-md">
            <div className="space-y-6 pt-6">
                <div className="flex items-center gap-4 p-6 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 size={32} />
                    <div>
                        <h5 className="text-xs font-black uppercase tracking-tight">System Ready</h5>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Payroll calculations for the current cycle are complete.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        className="bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-700 h-14 px-12 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-indigo-500/30 transition-all"
                        onClick={() => {
                            alert('Payroll Successfully Finalized (System Generated)');
                            onClose();
                        }}
                    >
                        Confirm & Finalize Batch
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 px-8 text-slate-400"
                    >
                        Back to Review
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default FinalizeBatchModal;
