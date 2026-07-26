'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="mt-4 text-sm text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }


    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
                <TopBar />
                <main className="flex-1 p-8">{children}</main>
            </div>
        </div>
    );
}
