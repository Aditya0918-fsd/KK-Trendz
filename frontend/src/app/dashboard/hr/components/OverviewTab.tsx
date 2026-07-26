'use client';

import React from 'react';
import { 
    Users, 
    UserCheck, 
    UserMinus, 
    Clock, 
    Calendar, 
    Upload, 
    Calculator,
    Star,
    Eye,
    TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import StatCard from './StatCard';

interface OverviewTabProps {
    employees: any[];
    payrollData: any[];
    month: number;
    year: number;
    dataLoading: boolean;
    avgPresent: string | number;
    avgAbsent: string | number;
    totalNetPayroll: number;
    syncedCount: number;
    monthCalendar: {
        sundays: Date[];
        manualHolidays: any[];
        totalHolidays: number;
        workingDays: number;
    };
    areaChartData: any[];
    pieData: any[];
    COLORS: string[];
    topPerformers: any[];
    presentCount: number;
    absentCount: number;
    setIsFinalizeModalOpen: (open: boolean) => void;
    openEmployeeDetail: (emp: any) => void;
    setActiveTab: (tab: any) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    employees,
    payrollData,
    month,
    year,
    dataLoading,
    avgPresent,
    avgAbsent,
    totalNetPayroll,
    syncedCount,
    monthCalendar,
    areaChartData,
    pieData,
    COLORS,
    topPerformers,
    presentCount,
    absentCount,
    setIsFinalizeModalOpen,
    openEmployeeDetail,
    setActiveTab
}) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    label="Total Employees" 
                    value={dataLoading ? '...' : employees.length} 
                    icon={Users} 
                    color="indigo" 
                    trend="+12% vs last month"
                    sub=""
                />
                <StatCard 
                    label="Average Present Days (Month)" 
                    value={dataLoading ? '...' : avgPresent} 
                    icon={UserCheck} 
                    color="emerald" 
                    trend="+2.4 days"
                    sub=""
                />
                <StatCard 
                    label="Average Absent Days (Month)" 
                    value={dataLoading ? '...' : avgAbsent} 
                    icon={UserMinus} 
                    color="rose" 
                    trend="-0.8 days"
                    sub=""
                />
                <StatCard 
                    label="Net Payroll" 
                    value={dataLoading ? '...' : `₹${totalNetPayroll.toLocaleString()}`} 
                    icon={Clock} 
                    color="amber" 
                    trend="Calculated"
                    sub=""
                />
            </div>

            {/* MONTH HOLIDAY CALENDAR */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-5 rounded-3xl relative overflow-hidden group">
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                        <Calendar size={100} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Total Holidays</p>
                    <h4 className="text-2xl font-black">{monthCalendar.totalHolidays} <span className="text-[10px] font-bold uppercase opacity-80">Scheduled</span></h4>
                    <p className="text-[9px] font-bold text-indigo-100/80 uppercase mt-2 italic">* Including all Sundays</p>
                </Card>

                <div className="md:col-span-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Sundays */}
                    {monthCalendar.sundays.map((date, i) => (
                        <div key={`sun-${i}`} className="min-w-[120px] bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center transition-all hover:border-amber-200 dark:hover:border-amber-900/40 group">
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Sunday</span>
                            <span className="text-xl font-black text-slate-800 dark:text-white">{format(date, 'dd')}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{format(date, 'MMM yyyy')}</span>
                            <div className="h-1 w-6 bg-rose-500 rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                    {/* Holidays */}
                    {monthCalendar.manualHolidays.map((h, i) => (
                        <div key={`hol-${i}`} className="min-w-[120px] bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm flex flex-col items-center justify-center transition-all hover:scale-105 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-20">
                                <Star size={24} className="text-indigo-500 fill-indigo-500" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 truncate max-w-full px-2" title={h.name}>{h.name || 'Holiday'}</span>
                            <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">{format(new Date(h.date), 'dd')}</span>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tight">{format(new Date(h.date), 'EEEE, MMM yyyy')}</span>
                            <div className="h-1 w-6 bg-indigo-500 rounded-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm xl:col-span-3 overflow-hidden bg-white dark:bg-slate-900">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-8 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                                    Workforce Attendance Trend
                                </CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Daily analytics for {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black uppercase text-slate-500">Present</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                                    <span className="text-[10px] font-black uppercase text-slate-500">Absent</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                            background: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(8px)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ fontWeight: 900, fontSize: '11px', textTransform: 'uppercase' }}
                                        labelStyle={{ fontWeight: 900, marginBottom: '4px', color: '#1e293b' }}
                                    />
                                    <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorPresent)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                    <Area type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorAbsent)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative group">
                        <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Calculator size={140} />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Payroll Status</p>
                            <h4 className="text-xl font-black mb-4">
                                {employees.length > 0 ? Math.round((syncedCount / employees.length) * 100) : 0}% Processed
                            </h4>
                            <div className="h-2 w-full bg-indigo-500/50 rounded-full mb-4 overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                                    style={{ width: `${employees.length > 0 ? (syncedCount / employees.length) * 100 : 0}%` }}
                                />
                            </div>
                            <Button
                                onClick={() => setIsFinalizeModalOpen(true)}
                                className="w-full bg-white text-indigo-600 hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest h-10 rounded-xl"
                            >
                                Finalize Batch
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Biometric Sync Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 py-5">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Upload size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight">Last Successful Ingestion</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{payrollData[0]?.updatedAt ? format(new Date(payrollData[0].updatedAt), 'dd MMM yyyy, HH:mm') : 'No recent sync'}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Workforce</span>
                                        <span className="text-[11px] font-black text-indigo-600">{syncedCount}/{employees.length}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${employees.length > 0 ? (syncedCount / employees.length) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-2 italic text-center">
                                        * {employees.length - syncedCount} Employees awaiting biometric mapping
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm lg:col-span-2 overflow-hidden bg-white dark:bg-slate-900">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-8 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                                    Top Performers (Attendance)
                                </CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setActiveTab('attendance')}
                                className="text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 px-3 h-8 rounded-lg tracking-widest"
                            >
                                View All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                {topPerformers.map((emp, i) => {
                                    return (
                                        <TableRow key={emp._id} className="border-b-slate-50 dark:border-b-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <TableCell className="pl-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-1">
                                                        <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 relative`}>
                                                            {emp.employeeName.charAt(0)}
                                                            {i === 0 && (
                                                                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                                                    <Star size={8} className="text-white fill-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{emp.employeeName}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{emp.employment?.designation || 'Staff'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-xs font-black text-slate-800 dark:text-white tabular-nums">{emp.presentDays}</span>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Days</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${i === 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'}`}>
                                                    {i === 0 ? '🏆 Month Champion' : 'Regular'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-8 text-right">
                                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => openEmployeeDetail(emp)}>
                                                    <Eye size={14} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <div className="px-8 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight italic">
                                * Ranked by highest active days in the current biometric cycle.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden group">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-8 py-5">
                        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Attendance Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-56 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            textTransform: 'uppercase',
                                            fontSize: '10px',
                                            fontWeight: '900'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-800 dark:text-white">
                                    {presentCount > 0 ? Math.round((presentCount / (presentCount + absentCount)) * 100) : 0}%
                                </span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Attendance Rate</span>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            {pieData.map((item, idx) => (
                                <div key={item.name} className="flex flex-col items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`h-1.5 w-1.5 rounded-full`} style={{ background: COLORS[idx] }} />
                                        <span className="text-[9px] font-black uppercase text-slate-500">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{item.value} <span className="text-[9px] text-slate-400 font-bold">Days</span></span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center leading-relaxed">
                                Calculated by totaling <span className="text-emerald-500">Present</span> vs <span className="text-rose-500">Absent</span> days for all synced employees in {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OverviewTab;
