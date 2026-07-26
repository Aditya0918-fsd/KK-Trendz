'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Package, Truck, ReceiptText, TrendingUp,
    ArrowUpRight, ArrowDownRight, Activity,
    Box, Ship, CreditCard, BarChart3
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import api from '@/lib/api';
import { format } from 'date-fns';

const trendData = [
    { name: 'Mon', packing: 400, dispatch: 240, revenue: 2400 },
    { name: 'Tue', packing: 300, dispatch: 139, revenue: 2210 },
    { name: 'Wed', packing: 200, dispatch: 980, revenue: 2290 },
    { name: 'Thu', packing: 278, dispatch: 390, revenue: 2000 },
    { name: 'Fri', packing: 189, dispatch: 480, revenue: 2181 },
    { name: 'Sat', packing: 239, dispatch: 380, revenue: 2500 },
    { name: 'Sun', packing: 349, dispatch: 430, revenue: 2100 },
];

const dispatchStatusData = [
    { name: 'On Time', value: 400, color: '#10b981' },
    { name: 'Delayed', value: 30, color: '#f43f5e' },
    { name: 'In Transit', value: 300, color: '#6366f1' },
    { name: 'Delivered', value: 200, color: '#8b5cf6' },
];

export default function LogisticsOverviewPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Weekly Packing', value: '2,840', change: '+12.5%', icon: Box, color: 'indigo' },
                    { label: 'Outbound Load', value: '18.4 Tons', change: '+5.2%', icon: Truck, color: 'emerald' },
                    { label: 'Revenue Generated', value: '₹ 12.4 L', change: '+8.1%', icon: CreditCard, color: 'violet' },
                    { label: 'Fulfillment Rate', value: '98.2%', change: '+1.4%', icon: Activity, color: 'amber' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg bg-${kpi.color}-50 dark:bg-${kpi.color}-900/20`}>
                                    <kpi.icon className={`h-5 w-5 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    <TrendingUp className="h-3 w-3" /> {kpi.change}
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-montserrat">{kpi.label}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{kpi.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm">
                    <CardHeader className="pb-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 italic">Logistics Velocity</CardTitle>
                                <p className="text-[10px] font-medium text-slate-500 mt-1">Packing vs Dispatch daily volume trends</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-indigo-500"></div><span className="text-[9px] font-black text-slate-400 uppercase">Packing</span></div>
                                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-black text-slate-400 uppercase">Dispatch</span></div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] pt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorPacking" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDispatch" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                                    labelStyle={{ color: '#64748b', fontSize: '9px', marginBottom: '4px' }}
                                />
                                <Area type="monotone" dataKey="packing" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPacking)" />
                                <Area type="monotone" dataKey="dispatch" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDispatch)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 italic">Dispatch Efficiency</CardTitle>
                        <p className="text-[10px] font-medium text-slate-500 mt-1">Real-time consignment status distribution</p>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center pt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dispatchStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dispatchStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-[150px] space-y-3">
                            {dispatchStatusData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase">{item.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 italic">Revenue Collection Trend</CardTitle>
                    <p className="text-[10px] font-medium text-slate-500 mt-1">Daily billing amount (Lakhs)</p>
                </CardHeader>
                <CardContent className="h-[250px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                            />
                            <Tooltip
                                cursor={{ fill: '#6366f1', opacity: 0.05 }}
                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}
                            />
                            <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40}>
                                {trendData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
