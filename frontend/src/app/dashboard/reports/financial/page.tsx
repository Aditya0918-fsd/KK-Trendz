'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { PieChart, TrendingUp, TrendingDown, Building, Wallet, Activity } from 'lucide-react';

export default function FinancialReport() {
    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col border-b pb-6 text-slate-800">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                        FINANCIAL <span className="text-rose-500">REPORT</span>
                    </h1>
                    <p className="text-sm font-bold tracking-widest uppercase text-slate-500">Month: February 2024</p>
                </div>

                <div className="space-y-8 text-slate-700 font-medium">
                    {/* PROFIT & LOSS */}
                    <section>
                        <h2 className="text-lg font-black uppercase tracking-widest text-rose-600 border-b pb-2 mb-4">PROFIT & LOSS:</h2>
                        <ul className="space-y-3 text-sm uppercase tracking-widest bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                                <span className="font-bold flex items-center gap-3"><TrendingUp size={16} className="text-emerald-500" /> Sales</span>
                                <span className="font-black">₹45,00,000</span>
                            </li>
                            <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                                <span className="font-bold flex items-center gap-3"><TrendingDown size={16} className="text-rose-500" /> Less: Cost of Goods Sold</span>
                                <span className="font-black text-rose-600">₹30,00,000</span>
                            </li>
                            <li className="flex justify-between items-center pb-2 border-b border-indigo-100 bg-indigo-50/50 p-2 rounded">
                                <span className="font-black flex items-center gap-3 text-indigo-700">Gross Profit</span>
                                <div className="text-right">
                                    <span className="font-black text-indigo-700">₹15,00,000</span> <span className="text-indigo-400 text-xs ml-2">(33.33%)</span>
                                </div>
                            </li>
                            <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                                <span className="font-bold flex items-center gap-3"><TrendingDown size={16} className="text-rose-500" /> Less: Expenses</span>
                                <span className="font-black text-rose-600">₹5,00,000</span>
                            </li>
                            <li className="flex justify-between items-center bg-emerald-50/50 p-3 rounded border border-emerald-100">
                                <span className="font-black flex items-center gap-3 text-emerald-700"><PieChart size={18} /> Net Profit</span>
                                <div className="text-right">
                                    <span className="font-black text-emerald-700 text-lg">₹10,00,000</span> <span className="text-emerald-500 text-xs ml-2">(22.22%)</span>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* ACCOUNTS RECEIVABLE */}
                        <section>
                            <h2 className="text-lg font-black uppercase tracking-widest text-rose-600 border-b pb-2 mb-4">ACCOUNTS RECEIVABLE:</h2>
                            <ul className="space-y-3 text-sm uppercase tracking-widest bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <li className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <span className="font-black flex items-center gap-3 text-slate-800"><Building size={16} className="text-indigo-500" /> Total Outstanding</span>
                                    <span className="font-black text-indigo-600 text-lg">₹20,00,000</span>
                                </li>
                                <li className="flex justify-between items-center pb-2 border-b border-slate-50 pt-2">
                                    <span className="font-bold">0-30 days</span>
                                    <span className="font-black text-slate-600">₹12,00,000</span>
                                </li>
                                <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                                    <span className="font-bold">31-60 days</span>
                                    <span className="font-black text-amber-600">₹5,00,000</span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span className="font-bold">61+ days</span>
                                    <span className="font-black text-rose-600">₹3,00,000</span>
                                </li>
                            </ul>
                        </section>

                        {/* ACCOUNTS PAYABLE */}
                        <section>
                            <h2 className="text-lg font-black uppercase tracking-widest text-rose-600 border-b pb-2 mb-4">ACCOUNTS PAYABLE:</h2>
                            <ul className="space-y-3 text-sm uppercase tracking-widest bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <li className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <span className="font-black flex items-center gap-3 text-slate-800"><Wallet size={16} className="text-rose-500" /> Total Payable</span>
                                    <span className="font-black text-rose-600 text-lg">₹8,00,000</span>
                                </li>
                                <li className="flex justify-between items-center pb-2 border-b border-slate-50 pt-2">
                                    <span className="font-bold flex items-center gap-2"><Activity size={14} className="text-rose-400" /> Due this week</span>
                                    <span className="font-black text-rose-500">₹3,00,000</span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span className="font-bold flex items-center gap-2"><Activity size={14} className="text-amber-400" /> Due next week</span>
                                    <span className="font-black text-amber-500">₹5,00,000</span>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
