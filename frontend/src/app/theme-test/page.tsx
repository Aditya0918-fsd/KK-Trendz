'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeTest() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
            <div className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Theme Test Page
                </h1>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-slate-900 dark:text-white">
                        <strong>Current Theme:</strong> {theme}
                    </p>
                    <p className="text-slate-900 dark:text-white">
                        <strong>Resolved Theme:</strong> {resolvedTheme}
                    </p>
                    <p className="text-slate-900 dark:text-white">
                        <strong>HTML Class:</strong> {typeof document !== 'undefined' ? document.documentElement.className : 'N/A'}
                    </p>
                </div>

                <div className="space-x-4">
                    <button
                        onClick={() => setTheme('light')}
                        className="rounded-md bg-white px-4 py-2 text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                        Light Mode
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className="rounded-md bg-slate-900 px-4 py-2 text-white shadow-sm hover:bg-slate-800"
                    >
                        Dark Mode
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="h-32 rounded-md bg-white dark:bg-slate-900">
                        <p className="p-4 text-slate-900 dark:text-white">
                            This box should be white in light mode and dark slate in dark mode
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
