import React from 'react';
import { CheckCircle2, XCircle, Star, Clock } from 'lucide-react';

export const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Present': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800';
        case 'Absent': return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800';
        case 'Holiday': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800';
        case 'Sunday': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800';
        case 'Late': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800';
        default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
    }
};

export const getStatusIcon = (status: string) => {
    switch (status) {
        case 'Present': return React.createElement(CheckCircle2, { size: 14, className: "text-emerald-500" });
        case 'Absent': return React.createElement(XCircle, { size: 14, className: "text-rose-500" });
        case 'Holiday': return React.createElement(Star, { size: 14, className: "text-amber-500" });
        case 'Sunday': return React.createElement(Star, { size: 14, className: "text-indigo-400" });
        case 'Late': return React.createElement(Clock, { size: 14, className: "text-amber-500" });
        default: return React.createElement(XCircle, { size: 14, className: "text-slate-300" });
    }
};

export const formatMinutes = (mins: number = 0) => {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
};
