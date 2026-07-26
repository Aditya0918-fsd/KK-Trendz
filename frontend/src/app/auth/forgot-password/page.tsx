'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("If an account exists, a reset link has been sent.");
                setEmail('');
            } else {
                setError(data.message || "Something went wrong");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600 text-white shadow-lg">
                        <span className="text-2xl font-bold italic">KK</span>
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Forgot Password?</h2>
                    <p className="mt-2 text-sm text-slate-500 text-center">Enter your email and we'll send you a reset link</p>
                </CardHeader>

                <CardContent>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {message && (
                            <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email Address"
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />

                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full"
                            size="lg"
                        >
                            Send Reset Link
                        </Button>

                        <div className="text-center">
                            <Link href="/auth/signin" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                Back to Sign In
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

