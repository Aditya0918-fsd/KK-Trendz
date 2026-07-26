'use client';

import React from 'react';
import { 
    Calendar, 
    Briefcase, 
    FileSpreadsheet, 
    RefreshCcw 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface AttendanceUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    uploadMode: 'monthly' | 'weekly';
    setUploadMode: (mode: 'monthly' | 'weekly') => void;
    selectedMonth: number;
    setSelectedMonth: (month: number) => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    uploadWeekStart: string;
    setUploadWeekStart: (date: string) => void;
    uploadWeekEnd: string;
    setUploadWeekEnd: (date: string) => void;
    uploadFile: File | null;
    setUploadFile: (file: File | null) => void;
    processing: boolean;
    uploadProgress: number;
    handleFileUpload: (e: React.FormEvent) => void;
}

const AttendanceUploadModal: React.FC<AttendanceUploadModalProps> = ({
    isOpen,
    onClose,
    uploadMode,
    setUploadMode,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    uploadWeekStart,
    setUploadWeekStart,
    uploadWeekEnd,
    setUploadWeekEnd,
    uploadFile,
    setUploadFile,
    processing,
    uploadProgress,
    handleFileUpload
}) => {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Intelligence Source: Biometric Sync" 
            className="max-w-xl"
        >
            <form onSubmit={handleFileUpload} className="space-y-8 pt-6">
                <style jsx>{`
                    @keyframes progress-pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.85; }
                    }
                    .animate-steady {
                        animation: progress-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                `}</style>
                
                <div className="space-y-6">
                    {/* Upload Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
                        <button
                            type="button"
                            onClick={() => setUploadMode("monthly")}
                            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                uploadMode === "monthly"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            Monthly Sync
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode("weekly")}
                            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                uploadMode === "weekly"
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            Weekly Sync
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-[0.2em]">Deployment Month</label>
                            <select 
                                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer text-slate-900 dark:text-white" 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1} className="dark:bg-slate-900">{new Date(0, i).toLocaleString("default", { month: "long" })}</option>))}
                            </select>
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-[0.2em]">Deployment Year</label>
                            <select 
                                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer text-slate-900 dark:text-white" 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y} className="dark:bg-slate-900">{y}</option>)}
                            </select>
                        </div>
                    </div>

                    {uploadMode === "weekly" && (
                        <div className="grid grid-cols-2 gap-6 p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/20">
                            <div className="group">
                                <label className="text-[9px] font-black uppercase text-amber-600 mb-1.5 block tracking-widest">Week Start Date</label>
                                <input
                                    type="date"
                                    required={uploadMode === "weekly"}
                                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white"
                                    value={uploadWeekStart}
                                    onChange={e => setUploadWeekStart(e.target.value)}
                                />
                            </div>
                            <div className="group">
                                <label className="text-[9px] font-black uppercase text-amber-600 mb-1.5 block tracking-widest">Week End Date</label>
                                <input
                                    type="date"
                                    required={uploadMode === "weekly"}
                                    min={uploadWeekStart}
                                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 text-sm font-black focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white"
                                    value={uploadWeekEnd}
                                    onChange={e => setUploadWeekEnd(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="relative group">
                        <input 
                            type="file" 
                            id="attendance-excel-upload" 
                            className="hidden" 
                            accept=".xlsx, .xls" 
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                            required 
                        />
                        <label 
                            htmlFor="attendance-excel-upload" 
                            className="block p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-indigo-500/5 min-h-[280px] flex flex-col items-center justify-center"
                        >
                            {processing ? (
                                <div className="w-full space-y-6 animate-in fade-in zoom-in duration-500">
                                    <div className="h-24 w-24 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center mx-auto mb-2 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
                                        <RefreshCcw className="h-10 w-10 text-indigo-400 animate-spin" />
                                    </div>
                                    
                                    <div className="space-y-4 max-w-sm mx-auto">
                                        <div className="flex justify-between items-end mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Syncing Intelligence Engine</span>
                                            </div>
                                            <span className="text-sm font-black text-emerald-500 tabular-nums">{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50 shadow-inner">
                                            <div 
                                                className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(79,70,229,0.4)] animate-steady"
                                                style={{ width: `${Math.max(5, uploadProgress)}%` }}
                                            />
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center animate-pulse">Reconciling biometric markers... Do not close</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="h-20 w-20 rounded-3xl bg-white dark:bg-slate-950 shadow-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 relative">
                                        <FileSpreadsheet className={`h-10 w-10 ${uploadFile ? "text-emerald-500" : "text-indigo-600"}`} />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                {uploadFile ? uploadFile.name : "Source Selection: Biometric Excel"}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Supported: .xlsx, .xls (ZKTeco format)
                                            </p>
                                        </div>
                                        
                                        {!uploadFile && (
                                            <a 
                                                href="/Attendance_Master_Template.xlsx" 
                                                download 
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
                                            >
                                                <FileSpreadsheet size={12} />
                                                Download Template Excell
                                            </a>
                                        )}
                                    </div>
                                </>
                            )}
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={onClose} 
                            className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400"
                        >
                            Abort Mission
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={!uploadFile || processing} 
                            className="bg-indigo-600 hover:bg-indigo-700 h-14 px-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] text-white shadow-2xl shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {processing ? (
                                <><RefreshCcw size={15} className="mr-2 animate-spin" />Synchronizing...</>
                            ) : "Execute Engine Sync"}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AttendanceUploadModal;
