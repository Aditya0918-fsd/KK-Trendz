'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, Clock, User, CheckCircle2, XCircle,
    AlertCircle, Search, Filter, Download, ChevronLeft,
    ChevronRight, Info, Plus
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

export default function AttendancePage() {
    const { loading: authLoading } = useAuth();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Holiday State
    const [holidays, setHolidays] = useState<any[]>([]);
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [holidayForm, setHolidayForm] = useState({ name: '', date: '', type: 'Public' });

    // Fetch dependencies
    useEffect(() => {
        const initData = async () => {
            try {
                const [empRes, holRes] = await Promise.all([
                    api.get('/employees'),
                    api.get('/payroll/holidays')
                ]);
                setEmployees(empRes.data);
                setHolidays(holRes.data);
                if (empRes.data.length > 0) setSelectedEmployee(empRes.data[0]._id);
            } catch (error) {
                console.error('Error init data:', error);
            }
        };
        if (!authLoading) initData();
    }, [authLoading]);

    // Fetch attendance for selected employee and month
    const fetchAttendance = async () => {
        if (!selectedEmployee) return;
        setLoading(true);
        try {
            const res = await api.get(`/payroll/attendance?employeeId=${selectedEmployee}&month=${month}&year=${year}`);
            setAttendanceData(res.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedEmployee) fetchAttendance();
    }, [selectedEmployee, month, year]);

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/payroll/holidays', holidayForm);
            setIsHolidayModalOpen(false);
            setHolidayForm({ name: '', date: '', type: 'Public' });
            // Refresh holidays
            const res = await api.get('/payroll/holidays');
            setHolidays(res.data);
        } catch (error) {
            console.error('Error adding holiday:', error);
        }
    };

    // Calculate metrics
    const stats = {
        present: attendanceData.filter(d => d.status === 'Present').length,
        halfDay: attendanceData.filter(d => d.status === 'Half Day').length,
        absent: attendanceData.filter(d => d.status === 'Absent').length,
        holidays: attendanceData.filter(d => d.status === 'Holiday').length,
    };

    // Generate days of the month for the table
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Present': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
            case 'Half Day': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
            case 'Absent': return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
            case 'Holiday': return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20';
            default: return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight italic">Attendance <span className="text-indigo-600">Logs</span></h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Detailed daily biometric verification</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            onClick={() => setIsHolidayModalOpen(true)}
                            variant="outline"
                            className="h-11 border-slate-200 dark:border-slate-800 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest"
                        >
                            <Calendar size={16} className="mr-2 text-indigo-600" /> Manage Holidays
                        </Button>
                        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm shrink-0">
                            <select
                                className="bg-transparent text-[11px] font-black uppercase px-4 py-2 focus:outline-none min-w-[200px]"
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                            >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.employeeName} ({emp.employeeCode})</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1 shadow-sm">
                            <select
                                className="bg-transparent text-[11px] font-black uppercase px-3 py-1.5 focus:outline-none"
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select
                                className="bg-transparent text-[11px] font-black uppercase px-3 py-1.5 focus:outline-none"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Present', value: stats.present, color: 'emerald' },
                        { label: 'Half Day', value: stats.halfDay, color: 'amber' },
                        { label: 'Absent', value: stats.absent, color: 'rose' },
                        { label: 'Holidays', value: stats.holidays, color: 'indigo' },
                    ].map(s => (
                        <div key={s.label} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                            <p className={`text-2xl font-black text-${s.color}-600 italic`}>{s.value} <span className="text-[10px] text-slate-300 font-bold not-italic">Days</span></p>
                        </div>
                    ))}
                </div>

                {/* Calendar View Card */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-indigo-600" />
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                                    Log Timeline: {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}
                                    {selectedEmployee && employees.find(e => e._id === selectedEmployee) && (
                                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                                            <span className="text-indigo-600 lowercase font-bold tracking-tight">
                                                {employees.find(e => e._id === selectedEmployee).employment?.designation}
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-400 lowercase font-bold tracking-tight">
                                                {employees.find(e => e._id === selectedEmployee).employment?.department} / {employees.find(e => e._id === selectedEmployee).employment?.subDepartment}
                                            </span>
                                        </div>
                                    )}
                                </CardTitle>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase rounded-lg border-slate-200"><Download size={14} className="mr-2" /> Export Logs</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/30 dark:bg-slate-800/20">
                                <TableRow className="border-none">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">Date</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">In Time</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Out Time</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Late (Mins)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Source</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                                <p className="text-[10px] font-black uppercase text-slate-400">Scanning Biometric Vault...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : calendarDays.map((date) => {
                                    const log = attendanceData.find(d => isSameDay(new Date(d.date), date));
                                    const holiday = holidays.find(h => isSameDay(new Date(h.date), date));
                                    const isSun = format(date, 'EEEE') === 'Sunday';

                                    let displayStatus = log?.status;
                                    if (!displayStatus) {
                                        if (holiday || isSun) displayStatus = 'Holiday';
                                        else displayStatus = 'Absent';
                                    }

                                    return (
                                        <TableRow key={date.toISOString()} className={`group border-b-slate-100 dark:border-b-slate-800/50 ${isSun ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''}`}>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">{format(date, 'dd MMM')}</span>
                                                    <span className={`text-[9px] font-bold uppercase ${isSun ? 'text-indigo-500' : 'text-slate-400'}`}>{format(date, 'EEEE')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {log?.inTime ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                        <span className="text-xs font-black font-mono text-slate-700 dark:text-slate-300">{log.inTime}</span>
                                                    </div>
                                                ) : <span className="text-xs font-bold text-slate-300">--:--</span>}
                                            </TableCell>
                                            <TableCell>
                                                {log?.outTime ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                        <span className="text-xs font-black font-mono text-slate-700 dark:text-slate-300">{log.outTime}</span>
                                                    </div>
                                                ) : <span className="text-xs font-bold text-slate-300">--:--</span>}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${getStatusStyle(displayStatus)}`}>
                                                    {displayStatus}
                                                    {holiday && <span className="ml-1 opacity-60 text-[8px]">({holiday.name})</span>}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {log?.lateMinutes > 0 ? (
                                                    <span className="text-[10px] font-black text-rose-500">+{log.lateMinutes} min</span>
                                                ) : <span className="text-xs font-bold text-slate-300">0</span>}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{log?.source || 'System'}</span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Legend / Info */}
                <div className="flex items-center gap-6 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-slate-400">Legend:</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {[
                            { label: 'Present', color: 'bg-emerald-500' },
                            { label: 'Half Day', color: 'bg-amber-500' },
                            { label: 'Absent/Leave', color: 'bg-rose-500' },
                            { label: 'Holiday/Sunday', color: 'bg-indigo-500' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <div className={`h-2 w-2 rounded-full ${item.color}`} />
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-tight">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Holiday Modal */}
                <Modal isOpen={isHolidayModalOpen} onClose={() => setIsHolidayModalOpen(false)} title="Holiday Management">
                    <form onSubmit={handleAddHoliday} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Holiday Name</label>
                                <Input
                                    placeholder="e.g. Republic Day"
                                    value={holidayForm.name}
                                    onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Date</label>
                                <Input
                                    type="date"
                                    value={holidayForm.date}
                                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Type</label>
                            <select
                                className="w-full h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold"
                                value={holidayForm.type}
                                onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                            >
                                <option value="Public">Public Holiday</option>
                                <option value="Company">Company Holiday</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <Button type="submit" className="w-full bg-indigo-600 h-11 rounded-xl font-black uppercase tracking-widest text-xs">
                            Register Holiday
                        </Button>

                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Recently Registered</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {holidays.slice(-5).reverse().map(h => (
                                    <div key={h._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div>
                                            <p className="text-xs font-black">{h.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400">{format(new Date(h.date), 'dd MMM yyyy')}</p>
                                        </div>
                                        <span className="text-[8px] font-black uppercase px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">{h.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
