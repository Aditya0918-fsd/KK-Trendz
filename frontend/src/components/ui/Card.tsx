import { cn } from '@/lib/utils';

export const Card = ({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) => (
    <div className={cn('rounded-2xl border border-slate-200/60 bg-white/70 shadow-xl shadow-indigo-500/5 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/60 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10', className)} onClick={onClick}>
        {children}
    </div>
);

export const CardHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <h3 className={cn('text-xl font-bold leading-none tracking-tight', className)}>{children}</h3>
);

export const CardDescription = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)}>{children}</p>
);

export const CardContent = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cn('p-6 pt-0', className)}>{children}</div>
);

export const CardFooter = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cn('flex items-center p-6 pt-0', className)}>{children}</div>
);
