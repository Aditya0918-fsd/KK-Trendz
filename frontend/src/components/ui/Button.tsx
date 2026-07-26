import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-linear-to-r from-violet-600 via-indigo-600 to-pink-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.97] border-none',
            secondary: 'bg-slate-900/90 text-white hover:bg-slate-800 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700/80 backdrop-blur-md border border-slate-700/40 hover:scale-[1.02] active:scale-[0.97]',
            outline: 'border border-indigo-500/30 bg-white/40 dark:bg-slate-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 backdrop-blur-md hover:border-indigo-500/60 hover:scale-[1.02] active:scale-[0.97]',
            ghost: 'bg-transparent hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-[0.97]',
            danger: 'bg-linear-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.97]',
        };

        const sizes = {
            sm: 'h-9 px-4 text-xs rounded-lg',
            md: 'h-11 px-6 text-sm rounded-xl',
            lg: 'h-14 px-8 text-base rounded-xl',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex items-center justify-center rounded-md font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
