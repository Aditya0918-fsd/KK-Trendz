'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/components/AuthProvider';
import api from '@/lib/api';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/auth/login', {
                email,
                password,
            });

            if (res.data.token) {
                setSuccess("Login successful! Redirecting...");
                login(res.data.token, res.data.user);
            } else {
                setError("Invalid email or password");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-10 dark:opacity-20 mix-blend-overlay pointer-events-none"></div>
            
            <Card className="w-full max-w-md backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden z-10">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-40 animate-blob"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-40 animate-blob animation-delay-2000"></div>
                
                <CardHeader className="text-center relative z-20">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform duration-300">
                        <span className="text-2xl font-black tracking-tighter">KK</span>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center font-medium">Enter your credentials to access the ERP</p>
                </CardHeader>

                <CardContent className="relative z-20">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                {success}
                            </div>
                        )}
                        <div className="space-y-4">
                            <Input
                                label="Sign in ID"
                                id="email"
                                type="text"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Aditya Saha"
                            />
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Password
                                    </label>
                                    <Link
                                        href="/auth/forgot-password"
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full"
                            size="lg"
                        >
                            Sign in
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
