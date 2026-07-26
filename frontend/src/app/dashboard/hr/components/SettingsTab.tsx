'use client';

import React from 'react';
import { 
    Settings, 
    Briefcase, 
    Clock, 
    ShieldCheck, 
    AlertCircle, 
    Calculator, 
    TrendingUp, 
    PlusCircle, 
    Star, 
    Calendar, 
    Plus, 
    CheckCircle2, 
    XCircle, 
    Save, 
    RefreshCcw 
} from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SettingsTabProps {
    payrollSettings: any;
    setPayrollSettings: (settings: any) => void;
    newHoliday: { date: string; name: string };
    setNewHoliday: (holiday: { date: string; name: string }) => void;
    loadWBHolidays: () => void;
    handleSaveSettings: () => void;
    savingSettings: boolean;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
    payrollSettings,
    setPayrollSettings,
    newHoliday,
    setNewHoliday,
    loadWBHolidays,
    handleSaveSettings,
    savingSettings
}) => {
    return (
        <div className="w-full">
            <Card className="border-none shadow-sm overflow-hidden relative">
                <Settings className="absolute -right-4 -bottom-4 h-64 w-64 text-slate-100 dark:text-slate-800/30" />
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 rounded-lg shadow-sm text-slate-600 dark:text-slate-400">
                            <Settings size={18} />
                        </div>
                        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Attendance Configuration
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-10 space-y-12 relative z-10 backdrop-blur-sm bg-white/30 dark:bg-slate-900/40">
                    {/* Standard Company Hours */}
                    <div className="bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/50 rounded-[2.5rem] p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                                <Briefcase size={18} />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                                Official Duty Hours
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="group">
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 flex items-center gap-2 group-focus-within:text-indigo-600 transition-colors tracking-[0.2em]">
                                    Standard In-Time (Morning)
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type="time"
                                        className="w-full h-16 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-14 text-base font-black focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                        value={payrollSettings.standardIn}
                                        onChange={(e) => setPayrollSettings({ ...payrollSettings, standardIn: e.target.value })}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2.5 font-bold uppercase tracking-tight">Set the official start of the workday</p>
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 flex items-center gap-2 group-focus-within:text-indigo-600 transition-colors tracking-[0.2em]">
                                    Standard Out-Time (Evening)
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                    <input
                                        type="time"
                                        className="w-full h-16 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-14 text-base font-black focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                        value={payrollSettings.standardOut}
                                        onChange={(e) => setPayrollSettings({ ...payrollSettings, standardOut: e.target.value })}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2.5 font-bold uppercase tracking-tight">Set the official end of the workday</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-indigo-200/50 dark:border-indigo-800/50 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="group">
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 flex items-center gap-2 group-focus-within:text-indigo-600 transition-colors tracking-[0.2em]">
                                    Late Rule Trigger
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                    <input
                                        type="time"
                                        className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                        value={payrollSettings.lateThreshold}
                                        onChange={(e) => setPayrollSettings({ ...payrollSettings, lateThreshold: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2.5 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                    <AlertCircle size={12} className="text-amber-500" />
                                    Start fine deduction if employee arrives after this time.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 block tracking-[0.2em]">Late Deduction Block</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">MIN</div>
                                        <input
                                            type="number"
                                            className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                            value={payrollSettings.lateMinutes}
                                            min="1"
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, lateMinutes: Number(e.target.value) })}
                                        />
                                        <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400" size={16} />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 block tracking-[0.2em]">Deduction Amount</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-300">₹</div>
                                        <input
                                            type="number"
                                            className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                            value={payrollSettings.lateAmount}
                                            min="0"
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, lateAmount: Number(e.target.value) })}
                                        />
                                        <Calculator className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400" size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="group">
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 flex items-center gap-2 group-focus-within:text-emerald-600 transition-colors tracking-[0.2em]">
                                    Extra Time Trigger
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </label>
                                <div className="relative">
                                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
                                    <input
                                        type="time"
                                        className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                        value={payrollSettings.extraThreshold}
                                        onChange={(e) => setPayrollSettings({ ...payrollSettings, extraThreshold: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2.5 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    Start bonus calculation if employee stays until this time.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 block tracking-[0.2em]">Bonus Time Block</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">MIN</div>
                                        <input
                                            type="number"
                                            className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                            value={payrollSettings.extraMinutes}
                                            min="1"
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, extraMinutes: Number(e.target.value) })}
                                        />
                                        <TrendingUp className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 block tracking-[0.2em]">Bonus Amount</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-300">₹</div>
                                        <input
                                            type="number"
                                            className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                            value={payrollSettings.extraAmount}
                                            min="0"
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, extraAmount: Number(e.target.value) })}
                                        />
                                        <Calculator className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>

                    {/* Sunday & Holiday Duty Hours */}
                    <div className="bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-800/50 rounded-[2.5rem] p-10 space-y-8 mt-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-600 rounded-xl text-white shadow-lg shadow-rose-500/30">
                                <Calendar size={18} />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
                                Sunday & Holiday Duty Hours
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="group">
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 flex items-center gap-2 group-focus-within:text-rose-600 transition-colors tracking-[0.2em]">
                                    Standard In-Time (Morning)
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-400 group-focus-within:text-rose-600 transition-colors" size={18} />
                                    <input
                                        type="time"
                                        className="w-full h-16 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-14 text-base font-black focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                        value={payrollSettings.holidayIn || '09:30'}
                                        onChange={(e) => setPayrollSettings({ ...payrollSettings, holidayIn: e.target.value })}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2.5 font-bold uppercase tracking-tight">Set the official start of the workday</p>
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 flex items-center gap-2 group-focus-within:text-rose-600 transition-colors tracking-[0.2em]">
                                    Standard Out-Time (Evening)
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-400 group-focus-within:text-rose-600 transition-colors" size={18} />
                                    <input
                                        type="time"
                                        className="w-full h-16 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-14 text-base font-black focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                        value={payrollSettings.holidayOut || '17:00'}
                                        onChange={(e) => setPayrollSettings({ ...payrollSettings, holidayOut: e.target.value })}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2.5 font-bold uppercase tracking-tight">Set the official end of the workday</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-rose-200/50 dark:border-rose-800/50 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="group">
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 flex items-center gap-2 group-focus-within:text-rose-600 transition-colors tracking-[0.2em]">
                                    Late Rule Trigger
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 group-focus-within:text-rose-600 transition-colors" size={16} />
                                    <input
                                        type="time"
                                        className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                        value={payrollSettings.holidayLateThreshold || '09:40'}
                                        onChange={(e) => setPayrollSettings({ ...payrollSettings, holidayLateThreshold: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2.5 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                    <AlertCircle size={12} className="text-amber-500" />
                                    Start fine deduction if employee arrives after this time.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 block tracking-[0.2em]">Late Deduction Block</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">MIN</div>
                                        <input
                                            type="number"
                                            className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                            value={payrollSettings.holidayLateMinutes || 30}
                                            min="1"
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, holidayLateMinutes: Number(e.target.value) })}
                                        />
                                        <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400" size={16} />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 block tracking-[0.2em]">Deduction Amount</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-300">₹</div>
                                        <input
                                            type="number"
                                            className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                            value={payrollSettings.holidayLateAmount || 0}
                                            min="0"
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, holidayLateAmount: Number(e.target.value) })}
                                        />
                                        <Calculator className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400" size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="group">
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 flex items-center gap-2 group-focus-within:text-emerald-600 transition-colors tracking-[0.2em]">
                                    Extra Time Trigger
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </label>
                                <div className="relative">
                                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
                                    <input
                                        type="time"
                                        className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                        value={payrollSettings.holidayExtraThreshold || '17:30'}
                                        onChange={(e) => setPayrollSettings({ ...payrollSettings, holidayExtraThreshold: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2.5 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    Start bonus calculation if employee stays until this time.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 block tracking-[0.2em]">Bonus Time Block</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">MIN</div>
                                        <input
                                            type="number"
                                            className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                            value={payrollSettings.holidayExtraMinutes || 30}
                                            min="1"
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, holidayExtraMinutes: Number(e.target.value) })}
                                        />
                                        <TrendingUp className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2.5 block tracking-[0.2em]">Bonus Amount</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-slate-300">₹</div>
                                        <input
                                            type="number"
                                            className="w-full h-14 bg-white dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-2xl px-12 text-sm font-black focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm text-slate-800 dark:text-white"
                                            value={payrollSettings.holidayExtraAmount || 0}
                                            min="0"
                                            onChange={(e) => setPayrollSettings({ ...payrollSettings, holidayExtraAmount: Number(e.target.value) })}
                                        />
                                        <Calculator className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800 border-dashed">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 mb-6 flex items-center justify-between tracking-[0.2em]">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="leading-none mb-1">Public Holiday Registry</span>
                                        <div className="h-0.5 w-12 bg-indigo-500 rounded-full" />
                                    </div>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-3 pr-3 border-r border-slate-100 dark:border-slate-800">
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">{(payrollSettings.holidays || []).length}</span>
                                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Total</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-black text-rose-500 leading-none">
                                                    {(payrollSettings.holidays || []).filter((h: any) => isBefore(new Date(h.date), startOfDay(new Date()))).length}
                                                </span>
                                                <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Passed</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-black text-emerald-500 leading-none">
                                                    {(payrollSettings.holidays || []).filter((h: any) => !isBefore(new Date(h.date), startOfDay(new Date()))).length}
                                                </span>
                                                <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Upcoming</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadWBHolidays}
                                    className="h-10 px-6 rounded-xl border-indigo-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm transition-all flex items-center gap-3"
                                >
                                    <PlusCircle size={14} /> Load West Bengal 2026 Holidays
                                </Button>
                            </label>

                            <div className="bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-100/50 dark:border-slate-800/50 mb-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 pl-2">System Manual Entry</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-3">Holiday Label</p>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-4 flex items-center text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                                <Star size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Example: Holi Festival"
                                                className="w-full h-14 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 text-xs font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm"
                                                value={newHoliday.name}
                                                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-3">Target Date</p>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-4 flex items-center text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                                <Calendar size={14} />
                                            </div>
                                            <input
                                                type="date"
                                                className="w-full h-14 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 text-xs font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm"
                                                value={newHoliday.date}
                                                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (!newHoliday.date || !newHoliday.name) return;
                                                setPayrollSettings({
                                                    ...payrollSettings,
                                                    holidays: [...(payrollSettings.holidays || []), newHoliday]
                                                });
                                                setNewHoliday({ date: '', name: '' });
                                            }}
                                            className="w-full h-14 bg-indigo-600 hover:bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                                        >
                                            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                                            Add to System Registry
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {Object.entries(
                                    (payrollSettings.holidays || []).reduce((acc: any, h: any) => {
                                        const m = format(new Date(h.date), 'MMMM yyyy');
                                        if (!acc[m]) acc[m] = [];
                                        acc[m].push(h);
                                        return acc;
                                    }, {})
                                ).sort((a: any, b: any) => new Date((a[1] as any[])[0].date).getTime() - new Date((b[1] as any[])[0].date).getTime())
                                    .map(([monthName, monthHolidays]: [string, any]) => (
                                        <div key={monthName} className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 px-4 py-2 rounded-2xl">
                                                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest leading-none">{monthName}</span>
                                                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                                                    <span className="text-[11px] font-black text-indigo-500 leading-none">{monthHolidays.length} <span className="text-[8px] text-slate-400">Days</span></span>
                                                </div>
                                                <div className="h-px flex-1 bg-gradient-to-r from-slate-100 dark:from-slate-800 to-transparent" />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {monthHolidays.map((h: any, idx: number) => {
                                                    const globalIdx = (payrollSettings.holidays || []).findIndex((orig: any) => orig.date === h.date && orig.name === h.name);
                                                    const isSpecial = h.name.toLowerCase().includes('puja') || h.name.toLowerCase().includes('diwali') || h.name.toLowerCase().includes('eid');
                                                    const isPassed = isBefore(new Date(h.date), startOfDay(new Date()));

                                                    return (
                                                        <div key={idx} className={`group flex items-center gap-4 border p-4 rounded-2xl transition-all ${isPassed ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-60 grayscale-[0.5]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 hover:shadow-md'}`}>
                                                            <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm relative ${isPassed ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : isSpecial ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                                {isPassed && (
                                                                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center">
                                                                        <CheckCircle2 size={8} className="text-white" />
                                                                    </div>
                                                                )}
                                                                <span className="text-[13px] font-black leading-none">{h.date ? format(new Date(h.date), 'dd') : ''}</span>
                                                                <span className="text-[7px] font-bold uppercase tracking-tighter opacity-80 mt-0.5">{h.date ? format(new Date(h.date), 'MMM') : ''}</span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <p className={`text-[11px] font-black uppercase truncate leading-tight ${isPassed ? 'text-slate-400' : isSpecial ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>{h.name}</p>
                                                                    {isPassed && <span className="text-[6px] font-black bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Passed</span>}
                                                                </div>
                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{h.date ? format(new Date(h.date), 'EEEE') : ''}</p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const updated = (payrollSettings.holidays || []).filter((_: any, i: number) => i !== globalIdx);
                                                                    setPayrollSettings({ ...payrollSettings, holidays: updated });
                                                                }}
                                                                className="h-8 w-8 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-200 hover:text-rose-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <XCircle size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                {(payrollSettings.holidays || []).length === 0 && (
                                    <div className="py-12 text-center border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-[2rem]">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">No public holidays registered...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="pt-10 flex border-t border-slate-100 dark:border-slate-800 border-dashed">
                        <Button
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="w-full md:w-auto min-w-[240px] bg-indigo-600 text-white hover:bg-indigo-700 h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            {savingSettings ? <RefreshCcw size={18} className="mr-3 animate-spin" /> : <Save size={18} className="mr-3" />}
                            {savingSettings ? 'Synchronizing...' : 'Update Engine Config'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsTab;
