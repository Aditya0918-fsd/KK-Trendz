'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { IndianRupee, Shirt, Box, Scissors } from 'lucide-react';

export default function SalesReport() {
    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col border-b pb-6 text-slate-800">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                        SALES <span className="text-indigo-500">REPORT</span>
                    </h1>
                </div>

                <div className="space-y-6 text-slate-700 font-medium">
                    <h2 className="text-lg font-black uppercase tracking-widest text-indigo-600 border-b pb-2">PRODUCT WISE:</h2>
                    <ul className="space-y-4 text-sm uppercase tracking-widest bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <li className="flex items-center gap-4">
                            <span className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Shirt size={20} /></span>
                            <div className="flex-1">
                                <span className="font-black text-slate-800">T-Shirts</span>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-lg text-slate-800">₹30,00,000</span>
                                <span className="text-slate-400 block text-xs">(6000 pieces)</span>
                            </div>
                        </li>
                        <li className="flex items-center gap-4">
                            <span className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Shirt size={20} /></span>
                            <div className="flex-1">
                                <span className="font-black text-slate-800">Polo Shirts</span>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-lg text-slate-800">₹10,00,000</span>
                                <span className="text-slate-400 block text-xs">(1500 pieces)</span>
                            </div>
                        </li>
                        <li className="flex items-center gap-4">
                            <span className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Shirt size={20} /></span>
                            <div className="flex-1">
                                <span className="font-black text-slate-800">Hoodies</span>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-lg text-slate-800">₹5,00,000</span>
                                <span className="text-slate-400 block text-xs">(500 pieces)</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    );
}
