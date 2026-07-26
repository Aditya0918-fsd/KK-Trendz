'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const [mounted, setMounted] = React.useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        const currentTheme = resolvedTheme || theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    if (!mounted) {
        return (
            <div className="h-10 w-10 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/50" />
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 text-slate-900 transition-all duration-300 hover:border-indigo-500/50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:hover:border-indigo-400/50 dark:hover:bg-slate-900 dark:hover:shadow-indigo-400/10"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <div className="relative h-5 w-5">
                <Sun
                    className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${isDark
                            ? 'translate-y-10 rotate-90 scale-0 opacity-0'
                            : 'translate-y-0 rotate-0 scale-100 opacity-100'
                        }`}
                />
                <Moon
                    className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${isDark
                            ? 'translate-y-0 rotate-0 scale-100 opacity-100'
                            : '-translate-y-10 -rotate-90 scale-0 opacity-0'
                        }`}
                />
            </div>

            {/* Subtle glow effect on hover */}
            <span className="absolute inset-0 rounded-xl bg-indigo-500/0 opacity-0 transition-all duration-300 group-hover:bg-indigo-500/5 group-hover:opacity-100 dark:group-hover:bg-indigo-400/10" />
        </button>
    );
}
