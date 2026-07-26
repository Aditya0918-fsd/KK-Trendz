import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, type, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        'flex w-full rounded-xl border border-slate-200/80 bg-white/60 px-4 py-2.5 text-base text-slate-900 backdrop-blur-md transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900',
                        error && 'border-red-500 focus:ring-red-500/30 dark:border-red-500',
                        className
                    )}
                    ref={ref}
                    {...props}
                    value={props.value !== undefined && props.value !== null ? (Number.isNaN(props.value as any) ? '' : props.value) : (props.onChange ? '' : undefined)}
                />
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
