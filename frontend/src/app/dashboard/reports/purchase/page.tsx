'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ShoppingCart, PackageOpen, Users, CircleDollarSign } from 'lucide-react';

export default function PurchaseReport() {
    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col border-b pb-6 text-slate-800">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                        PURCHASE <span className="text-emerald-500">REPORT</span>
                    </h1>
                    <p className="text-sm font-bold tracking-widest uppercase text-slate-500">Month: February 2024</p>
                </div>

                <div className="space-y-8 text-slate-700 font-medium">
                    {/* SUMMARY */}
                    <section>
                        <h2 className="text-lg font-black uppercase tracking-widest text-emerald-600 border-b pb-2 mb-4">SUMMARY:</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="border-emerald-100 shadow-sm">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Total Purchase Orders</p>
                                        <p className="text-3xl font-black text-slate-800">8</p>
                                    </div>
                                    <ShoppingCart size={32} className="text-emerald-200" />
                                </CardContent>
                            </Card>
                            <Card className="border-emerald-100 shadow-sm">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Total Value</p>
                                        <p className="text-3xl font-black text-slate-800">₹25,00,000</p>
                                    </div>
                                    <CircleDollarSign size={32} className="text-emerald-200" />
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* MATERIAL WISE */}
                    <section>
                        <h2 className="text-lg font-black uppercase tracking-widest text-emerald-600 border-b pb-2 mb-4">MATERIAL WISE:</h2>
                        <ul className="space-y-3 text-sm uppercase tracking-widest bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                                <span className="font-bold flex items-center gap-3"><PackageOpen size={16} className="text-emerald-500" /> Yarn Purchase</span>
                                <div className="text-right">
                                    <span className="font-black">₹15,00,000</span> <span className="text-slate-400 text-xs lowercase ml-2">(3000 kgs)</span>
                                </div>
                            </li>
                            <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                                <span className="font-bold flex items-center gap-3"><PackageOpen size={16} className="text-emerald-500" /> Fabric Purchase</span>
                                <div className="text-right">
                                    <span className="font-black">₹5,00,000</span> <span className="text-slate-400 text-xs lowercase ml-2">(1000 kgs)</span>
                                </div>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="font-bold flex items-center gap-3"><PackageOpen size={16} className="text-emerald-500" /> Accessories</span>
                                <div className="text-right">
                                    <span className="font-black">₹5,00,000</span>
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* SUPPLIER WISE */}
                    <section>
                        <h2 className="text-lg font-black uppercase tracking-widest text-emerald-600 border-b pb-2 mb-4">SUPPLIER WISE:</h2>
                        <ul className="space-y-3 text-sm uppercase tracking-widest bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                                <span className="font-bold flex items-center gap-3"><Users size={16} className="text-slate-400" /> XYZ Fabrics</span>
                                <span className="font-black text-emerald-700">₹10,00,000</span>
                            </li>
                            <li className="flex justify-between items-center pb-2 border-b border-slate-50">
                                <span className="font-bold flex items-center gap-3"><Users size={16} className="text-slate-400" /> ABC Yarns</span>
                                <span className="font-black text-emerald-700">₹8,00,000</span>
                            </li>
                            <li className="flex justify-between items-center">
                                <span className="font-bold flex items-center gap-3"><Users size={16} className="text-slate-400" /> PQR Threads</span>
                                <span className="font-black text-emerald-700">₹7,00,000</span>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
