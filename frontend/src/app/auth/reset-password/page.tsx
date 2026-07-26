'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Password reset successful! Redirecting to sign in...");
                setTimeout(() => router.push('/auth/signin'), 3000);
            } else {
                setError(data.message || "Something went wrong");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="pt-6 text-center">
                    <p className="text-red-500 font-medium">Invalid or missing reset token.</p>
                    <Link href="/auth/signin" className="mt-4 inline-block text-indigo-600 font-medium">
                        Back to Sign In
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-indigo-600 text-white shadow-lg">
                    <span className="text-2xl font-bold italic">KK</span>
                </div>
                <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
                <p className="mt-2 text-sm text-slate-500 text-center">Enter your new password below</p>
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

                    <div className="space-y-4">
                        <Input
                            label="New Password"
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <Input
                            label="Confirm New Password"
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        className="w-full"
                        size="lg"
                    >
                        Reset Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function ResetPassword() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
            <Suspense fallback={<div className="text-slate-500 font-medium">Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}

