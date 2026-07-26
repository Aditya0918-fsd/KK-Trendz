'use client';

import { useAuth } from './AuthProvider';
import { ThemeToggle } from './ThemeToggle';
import { Bell, Search } from 'lucide-react';

export function TopBar() {
    const { user } = useAuth();


    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/60 bg-white/70 px-8 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70 shadow-xs">
            {/* Left Section - Search */}
            <div className="flex flex-1 items-center gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search inventory, orders, customers..."
                        className="h-11 w-full rounded-xl border border-slate-200/80 bg-white/60 pl-11 pr-4 text-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-800/80 dark:bg-slate-950/60 dark:text-white dark:focus:bg-slate-900"
                    />
                </div>
            </div>

            {/* Right Section - Actions & Profile */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative rounded-xl p-2.5 hover:bg-indigo-50/80 text-slate-600 dark:text-slate-400 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-pink-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Divider */}
                <div className="h-8 w-px bg-slate-200/80 dark:bg-slate-800/80"></div>

                {/* User Profile */}
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white font-bold shadow-md shadow-indigo-500/20 transform hover:scale-105 transition-transform">
                        <span className="text-sm font-extrabold">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {user?.role || 'Staff'}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
