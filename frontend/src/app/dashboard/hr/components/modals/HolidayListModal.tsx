'use client';

import React from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { 
    Table, 
    TableHeader, 
    TableBody, 
    TableRow, 
    TableHead, 
    TableCell 
} from '@/components/ui/Table';
import { getMonthName } from '../../utils';

interface HolidayListModalProps {
    isOpen: boolean;
    onClose: () => void;
    month: number;
    year: number;
    holidays: any[];
}

const HolidayListModal: React.FC<HolidayListModalProps> = ({
    isOpen,
    onClose,
    month,
    year,
    holidays
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Holidays - ${getMonthName(month)} ${year}`}
            maxWidth="3xl"
        >
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <TableRow className="border-none">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 py-4">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Name</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6 py-4">Type</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {holidays.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12">
                                    <p className="text-[11px] font-black uppercase text-slate-400">No holidays this month</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            holidays.map((h, i) => (
                                <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b border-slate-50 dark:border-slate-800/50">
                                    <TableCell className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {format(new Date(h.date), 'dd MMM yyyy')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{h.name}</span>
                                    </TableCell>
                                    <TableCell className="text-right px-6 py-4">
                                        <span className={`inline-flex items-center justify-center text-[10px] font-black uppercase px-2 py-1 rounded-md ${h.type === 'Public' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                                            h.type === 'Company' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {h.type}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Modal>
    );
};

export default HolidayListModal;
