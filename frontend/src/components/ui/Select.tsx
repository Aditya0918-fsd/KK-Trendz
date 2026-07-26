'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function Select({ value, onChange, options, placeholder = 'Select...', className = '', disabled = false }: SelectProps) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const ref = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);

    useEffect(() => {
        setMounted(true);
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (ref.current && ref.current.contains(target)) return;
            if (menuRef.current && menuRef.current.contains(target)) return;
            setOpen(false);
        };
        const scrollHandler = (e: Event) => {
            if (open && menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            updateCoords();
            document.addEventListener('mousedown', handler);
            window.addEventListener('scroll', scrollHandler, true);
        }

        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', scrollHandler, true);
        };
    }, [open]);

    const updateCoords = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const toggleOpen = () => {
        if (!disabled) {
            updateCoords();
            setOpen(!open);
        }
    };

    const dropdown = open && mounted && (
        <div 
            ref={menuRef}
            style={{ 
                position: 'absolute', 
                top: coords.top + 4, 
                left: coords.left, 
                width: coords.width,
                zIndex: 9999
            }}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100"
        >
            <div className="max-h-64 overflow-y-auto py-1">
                <button
                    type="button"
                    onClick={() => { onChange(''); setOpen(false); }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors
                        ${!value
                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold italic'
                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                >
                    {placeholder}
                    {!value && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />

                {options.filter(o => o.value && o.label).map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => { onChange(opt.value); setOpen(false); }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors
                            ${opt.value === value
                                ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold'
                                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <span className="truncate pr-4">{opt.label}</span>
                        {opt.value === value && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </button>
                ))}
                {options.length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 text-center uppercase font-black tracking-widest">No options</p>
                )}
            </div>
        </div>
    );

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={toggleOpen}
                className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors
                    bg-white dark:bg-slate-800
                    border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-slate-100
                    hover:bg-slate-50 dark:hover:bg-slate-700
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${open ? 'ring-2 ring-indigo-500' : ''}`}
            >
                <span className={`truncate ${selected ? '' : 'text-slate-400 dark:text-slate-500'}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && mounted && createPortal(dropdown, document.body)}
        </div>
    );
}

// Smaller variant (h-8 / text-[11px]) for use inside tables/rows
export function SelectSm({ value, onChange, options, placeholder = 'Select...', className = '', disabled = false }: SelectProps) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const ref = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);

    useEffect(() => {
        setMounted(true);
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (ref.current && ref.current.contains(target)) return;
            if (menuRef.current && menuRef.current.contains(target)) return;
            setOpen(false);
        };
        const scrollHandler = (e: Event) => {
            if (open && menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            updateCoords();
            document.addEventListener('mousedown', handler);
            window.addEventListener('scroll', scrollHandler, true);
        }

        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', scrollHandler, true);
        };
    }, [open]);

    const updateCoords = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const toggleOpen = () => {
        if (!disabled) {
            updateCoords();
            setOpen(!open);
        }
    };

    const dropdown = open && mounted && (
        <div 
            ref={menuRef}
            style={{ 
                position: 'absolute', 
                top: coords.top + 4, 
                left: coords.left, 
                width: Math.max(coords.width, 180),
                zIndex: 9999
            }}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100"
        >
            <div className="max-h-44 overflow-y-auto py-1">
                <button
                    type="button"
                    onClick={() => { onChange(''); setOpen(false); }}
                    className={`flex w-full items-center justify-between px-2 py-1.5 text-[10px] transition-colors
                        ${!value
                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold italic'
                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                >
                    <span className="uppercase font-black tracking-widest">{placeholder}</span>
                    {!value && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />}
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-1" />

                {options.filter(o => o.value && o.label).map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => { onChange(opt.value); setOpen(false); }}
                        className={`flex w-full items-center justify-between px-2 py-1.5 text-[10px] transition-colors
                            ${opt.value === value
                                ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold'
                                : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <span className="truncate pr-2">{opt.label}</span>
                        {opt.value === value && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={toggleOpen}
                className={`flex h-9 w-full items-center justify-between rounded-md border px-2 text-[11px] transition-colors
                    bg-white dark:bg-slate-800
                    border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-slate-100
                    hover:bg-slate-50 dark:hover:bg-slate-700
                    focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${open ? 'ring-2 ring-indigo-500' : ''}`}
            >
                <span className={`truncate ${selected ? '' : 'text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest'}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && mounted && createPortal(dropdown, document.body)}
        </div>
    );
}
