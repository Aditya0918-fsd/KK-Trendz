'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Tab {
    label: string;
    href: string;
    icon: LucideIcon;
}

interface SubNavProps {
    title: string;
    subtitle: string;
    tabs: Tab[];
    titleHighlight?: string;
}

export function SubNav({ title, subtitle, tabs, titleHighlight }: SubNavProps) {
    const pathname = usePathname();

    return (
        <div className="space-y-8 mb-8">
            <div className="flex flex-col">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-3">
                    {title} {titleHighlight && <span className="text-indigo-600 dark:text-indigo-400">{titleHighlight}</span>}
                </h1>
                <p className="mt-2 text-slate-500 font-medium">{subtitle}</p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 min-w-max">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href || (pathname.startsWith(tab.href) && tab.href !== '/dashboard/masters' && tab.href !== '/dashboard/procurement');
                        // Special check for overview tabs
                        const isOverview = tab.label.toLowerCase() === 'overview';
                        const active = isOverview ? pathname === tab.href : pathname.startsWith(tab.href);

                        return (
                            <Link key={tab.label} href={tab.href}>
                                <div className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap",
                                    active
                                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/30"
                                )}>
                                    <tab.icon className="h-3.5 w-3.5" />
                                    {tab.label}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
