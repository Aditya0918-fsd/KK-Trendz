'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetTheme() {
    const router = useRouter();
    const [currentTheme, setCurrentTheme] = useState('');
    const [htmlClass, setHtmlClass] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        updateStatus();
    }, []);

    const updateStatus = () => {
        if (typeof window !== 'undefined') {
            setCurrentTheme(localStorage.getItem('kk-traders-theme') || 'Not set');
            setHtmlClass(document.documentElement.className || 'None');
        }
    };

    const clearTheme = () => {
        if (typeof window !== 'undefined') {
            // Clear all possible theme keys
            localStorage.removeItem('kk-traders-theme');
            localStorage.removeItem('theme');

            // Remove dark class
            document.documentElement.classList.remove('dark');

            // Set to light mode
            localStorage.setItem('kk-traders-theme', 'light');

            setMessage('✅ Theme cleared and set to light mode!');
            updateStatus();

            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <h1 className="mb-4 text-3xl font-bold text-slate-900">🔧 Theme Reset Tool</h1>
                <p className="mb-6 text-slate-600">
                    Click the button below to clear the theme and force light mode:
                </p>

                <div className="space-y-3">
                    <button
                        onClick={clearTheme}
                        className="w-full rounded-md bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
                    >
                        Clear Theme & Set Light Mode
                    </button>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full rounded-md border border-slate-300 bg-white px-6 py-3 text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Go to Dashboard
                    </button>
                </div>

                {message && (
                    <div className="mt-4 rounded-md bg-green-50 p-3 text-green-700">
                        {message}
                    </div>
                )}

                <hr className="my-6" />

                <div className="text-left">
                    <h3 className="mb-3 text-lg font-semibold text-slate-900">Current Status:</h3>
                    <div className="space-y-2 text-sm">
                        <p className="text-slate-600">
                            <strong>LocalStorage Theme:</strong> <span className="font-mono">{currentTheme}</span>
                        </p>
                        <p className="text-slate-600">
                            <strong>HTML Class:</strong> <span className="font-mono">{htmlClass}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
