'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <AlertCircle className="h-5 w-5 text-rose-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    };

    const bgColors = {
        success: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950 dark:border-emerald-800',
        error: 'bg-rose-50 border-rose-100 dark:bg-rose-950 dark:border-rose-800',
        info: 'bg-blue-50 border-blue-100 dark:bg-blue-950 dark:border-blue-800',
        warning: 'bg-amber-50 border-amber-100 dark:bg-amber-950 dark:border-amber-800',
    };

    return (
        <div className={clsx(
            "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right-10 duration-300 min-w-[300px] max-w-[450px]",
            bgColors[toast.type]
        )}>
            <div className="flex-shrink-0">
                {icons[toast.type]}
            </div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {toast.message}
                </p>
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-400 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
