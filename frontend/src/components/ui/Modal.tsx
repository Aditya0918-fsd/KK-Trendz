'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | string;
}

export function Modal({ isOpen, onClose, title, children, className, maxWidth = "2xl" }: ModalProps) {
    if (!isOpen) return null;

    const maxWidthClasses: Record<string, string> = {
        'xs': 'max-w-xs',
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        'full': 'max-w-full'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={cn(
                "bg-white dark:bg-slate-900 rounded-lg shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200",
                "w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[70vw]", // Fallback bounds
                "max-h-[95vh] sm:max-h-[90vh]", // Safe height
                maxWidthClasses[maxWidth] || maxWidth,
                className
            )}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate pr-4">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function FormField({ label, error, children, className, labelClassName }: { label: string; error?: string; children: React.ReactNode; className?: string; labelClassName?: string }) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <label className={cn("text-sm font-semibold text-slate-700 dark:text-slate-300", labelClassName)}>
                {label}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
}
