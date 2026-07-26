'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp,
    Calendar,
    Settings,
    Wallet,
    IndianRupee,
    BadgeCheck,
    AlertTriangle,
    Banknote
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/lib/api';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    startOfDay,
    isSunday
} from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

// Components
import OverviewTab from './components/OverviewTab';
import AttendanceTab from './components/AttendanceTab';
import PaymentTab from './components/PaymentTab';
import SettingsTab from './components/SettingsTab';

// Modals
import AttendanceUploadModal from './components/modals/AttendanceUploadModal';
import RecordPaymentModal from './components/modals/RecordPaymentModal';
import FinalizeBatchModal from './components/modals/FinalizeBatchModal';
import EmployeeDetailModal from './components/modals/EmployeeDetailModal';
import EmployeeLedgerModal from './components/modals/EmployeeLedgerModal';
import ViewReceiptModal from './components/modals/ViewReceiptModal';
import PayslipReport from './components/PayslipReport';

type Tab = 'overview' | 'attendance' | 'payment' | 'settings';

export default function HRPage() {
    const { loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Shared State
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [employees, setEmployees] = useState<any[]>([]);
    const [payrollData, setPayrollData] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [employeeBalances, setEmployeeBalances] = useState<Record<string, number>>({});
    const [dataLoading, setDataLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Attendance Tab State
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
    const [weekStart, setWeekStart] = useState<string>(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const mon = new Date(today);
        mon.setDate(today.getDate() + diff);
        return mon.toISOString().slice(0, 10);
    });
    const [weekEnd, setWeekEnd] = useState<string>(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = day === 0 ? 0 : 7 - day;
        const sun = new Date(today);
        sun.setDate(today.getDate() + diff);
        return sun.toISOString().slice(0, 10);
    });
    const [showFilterBar, setShowFilterBar] = useState(false);
    const [filterDepartment, setFilterDepartment] = useState('All');
    
    // Reset sub-dept when dept changes
    useEffect(() => {
        setFilterSubDept('All');
    }, [filterDepartment]);

    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterSubDept, setFilterSubDept] = useState('All');
    const [filterLocation, setFilterLocation] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [jumpInput, setJumpInput] = useState('');

    // Modals Visibility
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [showReport, setShowReport] = useState(false);

    // Detail/Ledger State
    const [detailEmployee, setDetailEmployee] = useState<any>(null);
    const [detailPayroll, setDetailPayroll] = useState<any>(null);
    const [detailAttendance, setDetailAttendance] = useState<any[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [ledgerEmp, setLedgerEmp] = useState<any>(null);
    const [ledgerData, setLedgerData] = useState<any[]>([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [receiptViewPayment, setReceiptViewPayment] = useState<any>(null);
    const [paymentEmp, setPaymentEmp] = useState<any>(null);

    // Payment Tab State
    const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentForm, setPaymentForm] = useState({
        paymentType: 'Salary',
        paymentMode: 'Cash',
        amount: '',
        advanceDeduction: '',
        remarks: '',
        paymentDate: new Date().toISOString().split('T')[0],
        bankDetails: { bankName: '', transactionReference: '', chequeNumber: '', upiId: '', upiScreenshotUrl: '' }
    });
    const [savingPayment, setSavingPayment] = useState(false);

    // Settings State
    const [payrollSettings, setPayrollSettings] = useState({
        standardIn: '09:30',
        standardOut: '19:30',
        lateThreshold: '09:40',
        extraThreshold: '19:30',
        lateMinutes: 30,
        extraMinutes: 30,
        lateAmount: 0,
        extraAmount: 0,
        holidayIn: '09:30',
        holidayOut: '17:00',
        holidayLateThreshold: '09:40',
        holidayExtraThreshold: '17:30',
        holidayLateMinutes: 30,
        holidayExtraMinutes: 30,
        holidayLateAmount: 0,
        holidayExtraAmount: 0,
        holidays: [] as any[]
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

    // Upload Modal State
    const [uploadMode, setUploadMode] = useState<'monthly' | 'weekly'>('monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [uploadWeekStart, setUploadWeekStart] = useState<string>('');
    const [uploadWeekEnd, setUploadWeekEnd] = useState<string>('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Initial Fetch
    useEffect(() => {
        if (!authLoading) {
            fetchData();
            fetchSalaryPayments();
        }
    }, [authLoading, month, year, viewMode, weekStart, weekEnd]);

    useEffect(() => {
        if (!authLoading) {
            fetchSettings();
        }
    }, [authLoading]);

    const fetchData = async () => {
        setDataLoading(true);
        try {
            let payrollUrl = `/payroll?month=${month}&year=${year}`;
            if (viewMode === 'weekly' && weekStart && weekEnd) {
                payrollUrl = `/payroll?startDate=${weekStart}&endDate=${weekEnd}`;
            }

            const [empRes, payrollRes, holidayRes, balanceRes] = await Promise.all([
                api.get('/employees'),
                api.get(payrollUrl),
                api.get('/payroll/holidays'),
                api.get('/payroll/balances')
            ]);
            setEmployees(empRes.data);
            setPayrollData(payrollRes.data);
            setEmployeeBalances(balanceRes.data);

            const filteredHolidays = holidayRes.data.filter((h: any) => {
                const d = new Date(h.date);
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            });
            setHolidays(filteredHolidays);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setDataLoading(false);
        }
    };

    const fetchSalaryPayments = async () => {
        setPaymentLoading(true);
        try {
            const res = await api.get(`/payroll/salary-payments?month=${month}&year=${year}`);
            setSalaryPayments(res.data);
        } catch (error) {
            console.error('Error fetching salary payments:', error);
        } finally {
            setPaymentLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/payroll/settings');
            if (res.data) setPayrollSettings(res.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchEmployeeLedger = async (empId: string) => {
        setLedgerLoading(true);
        setIsLedgerModalOpen(true);
        try {
            const res = await api.get(`/payroll/employee-ledger/${empId}`);
            setLedgerData(res.data);
        } catch (error) {
            console.error('Error fetching ledger:', error);
        } finally {
            setLedgerLoading(false);
        }
    };

    const openEmployeeDetail = async (emp: any) => {
        setDetailEmployee(emp);
        setDetailPayroll(null);
        setDetailLoading(true);
        setIsDetailModalOpen(true);
        try {
            const [attRes, payrollRes] = await Promise.all([
                api.get(`/payroll/attendance?employeeId=${emp._id}&month=${month}&year=${year}`),
                api.get(`/payroll?month=${month}&year=${year}`)
            ]);
            setDetailAttendance(attRes.data);
            const employeePayroll = payrollRes.data.find((p: any) => (p.employee?._id || p.employee) === emp._id);
            setDetailPayroll(employeePayroll || null);
        } catch (error) {
            console.error('Error fetching attendance details:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;
        setProcessing(true);
        setUploadProgress(1);

        // Progress simulation: Slow climb from 1 to 95
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 95) return 95;
                const increment = Math.max(0.1, (95 - prev) / 30); // Dynamic speed: slower as it nears 95
                return prev + increment;
            });
        }, 200);

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);

            if (uploadMode === 'monthly') {
                formData.append('month', selectedMonth.toString());
                formData.append('year', selectedYear.toString());
                formData.append('mode', 'monthly');
            } else {
                formData.append('startDate', uploadWeekStart);
                formData.append('endDate', uploadWeekEnd);
                formData.append('mode', 'weekly');
            }

            const endpoint = uploadMode === 'monthly' ? '/payroll/process-attendance' : '/payroll/process-attendance-weekly';
            const response = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.missingEmployees && response.data.missingEmployees.length > 0) {
                showToast(`Missing employees: ${response.data.missingEmployees.join(', ')}`, 'warning');
            }

            // Stop simulation and jump to 100 on success
            clearInterval(progressInterval);
            setUploadProgress(100);

            setTimeout(() => {
                setIsAttendanceModalOpen(false);
                setUploadFile(null);
                fetchData();
                setProcessing(false);
                setUploadProgress(0);
            }, 800);
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Upload failed:', error);
            alert('Error processing file');
            setProcessing(false);
            setUploadProgress(0);
        }
    };

    const handleCreatePayment = async () => {
        if (!paymentEmp || !paymentForm.amount) return;
        setSavingPayment(true);
        try {
            const payroll = payrollData.find(p => (p.employee?._id || p.employee) === paymentEmp._id);
            const netSalaryDue = payroll?.salaryDetails?.netSalary ?? 0;
            const empPayments = salaryPayments.filter(
                p => (p.employee?._id || p.employee) === paymentEmp._id &&
                    p.paymentType === 'Salary'
            );
            const totalPaid = empPayments.reduce((s: number, p: any) => s + p.amount, 0);

            await api.post('/payroll/salary-payments', {
                employee: paymentEmp._id,
                month,
                year,
                paymentType: paymentForm.paymentType,
                paymentMode: paymentForm.paymentMode,
                amount: Number(paymentForm.amount),
                netSalaryDue,
                previousDue: Math.max(0, netSalaryDue - totalPaid),
                advanceDeduction: Number(paymentForm.advanceDeduction || 0),
                remarks: paymentForm.remarks,
                paymentDate: paymentForm.paymentDate,
                bankDetails: paymentForm.bankDetails,
            });
            setIsPaymentModalOpen(false);
            setPaymentForm({
                paymentType: 'Salary',
                paymentMode: 'Cash',
                amount: '',
                advanceDeduction: '',
                remarks: '',
                paymentDate: new Date().toISOString().split('T')[0],
                bankDetails: { bankName: '', transactionReference: '', chequeNumber: '', upiId: '', upiScreenshotUrl: '' }
            });
            fetchSalaryPayments();
        } catch (err) {
            console.error(err);
            alert('Failed to record payment');
        } finally {
            setSavingPayment(false);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await api.post('/payroll/settings', payrollSettings);
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const loadWBHolidays = () => {
        const wb2026 = [
            { date: '2026-01-01', name: 'New Year Day' },
            { date: '2026-01-14', name: 'Makar Sankranti' },
            { date: '2026-01-23', name: 'Netaji Birthday' },
            { date: '2026-01-26', name: 'Republic Day' },
            { date: '2026-03-05', name: 'Doljatra (Holi)' },
            { date: '2026-04-03', name: 'Good Friday' },
            { date: '2026-04-14', name: 'Dr. Ambedkar Birthday' },
            { date: '2026-04-15', name: 'Bengali New Year' },
            { date: '2026-05-01', name: 'May Day' },
            { date: '2026-05-09', name: 'Rabindra Jayanti' },
            { date: '2026-08-15', name: 'Independence Day' },
            { date: '2026-10-02', name: 'Gandhi Jayanti' },
            { date: '2026-10-17', name: 'Mahalaya' },
            { date: '2026-10-20', name: 'Durga Puja (Saptami)' },
            { date: '2026-10-21', name: 'Durga Puja (Ashtami)' },
            { date: '2026-10-22', name: 'Durga Puja (Navami)' },
            { date: '2026-10-23', name: 'Durga Puja (Dashami)' },
            { date: '2026-11-10', name: 'Kali Puja / Diwali' },
            { date: '2026-12-25', name: 'Christmas' }
        ];
        setPayrollSettings({ ...payrollSettings, holidays: wb2026 });
    };

    const formatMinutes = (mins: number) => {
        if (!mins) return '0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    // Derived Data
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = emp.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDept = filterDepartment === 'All' || emp.employment?.department === filterDepartment;
            const matchesSubDept = filterSubDept === 'All' || emp.employment?.subDepartment === filterSubDept;
            const matchesLocation = filterLocation === 'All' || emp.employment?.location === filterLocation;

            // Category Filter mapping
            let matchesCategory = true;
            if (filterCategory !== 'All') {
                if (filterCategory === 'Monthly') matchesCategory = emp.employment?.category === 'Salary';
                else if (filterCategory === 'Privileged') matchesCategory = emp.employment?.privilegeType === 'Privileged';
                else if (filterCategory === 'Production') matchesCategory = emp.employment?.category === 'Contract';
                else if (filterCategory === 'Daily') matchesCategory = emp.employment?.category === 'Temporary';
            }

            const p = payrollData.find(pd => (pd.employee?._id || pd.employee) === emp._id);
            let matchesStatus = true;
            if (filterStatus === 'Present') matchesStatus = !!p;
            if (filterStatus === 'Absent') matchesStatus = !p;

            return matchesSearch && matchesDept && matchesSubDept && matchesLocation && matchesStatus && matchesCategory;
        });
    }, [employees, searchQuery, filterDepartment, filterSubDept, filterLocation, filterStatus, filterCategory, payrollData]);

    const paginatedEmployees = useMemo(() => {
        return filteredEmployees.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    }, [filteredEmployees, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

    const calendarDays = useMemo(() => eachDayOfInterval({
        start: startOfMonth(new Date(year, month - 1)),
        end: endOfMonth(new Date(year, month - 1))
    }), [month, year]);

    const totalNetPayroll = useMemo(() => payrollData.reduce((acc, p) => acc + (p.salaryDetails?.netSalary || 0), 0), [payrollData]);
    const totalPaid = useMemo(() => salaryPayments.filter(p => p.paymentType === 'Salary').reduce((acc, p) => acc + p.amount, 0), [salaryPayments]);
    const totalAdvances = useMemo(() => salaryPayments.filter(p => p.paymentType === 'Advance').reduce((acc, p) => acc + p.amount, 0), [salaryPayments]);
    const statsTotalLate = useMemo(() => filteredEmployees.reduce((acc, emp) => {
        const p = payrollData.find(pd => (pd.employee?._id || pd.employee) === emp._id);
        return acc + (p?.totalLateMinutes || 0);
    }, 0), [filteredEmployees, payrollData]);
    const statsTotalExtra = useMemo(() => filteredEmployees.reduce((acc, emp) => {
        const p = payrollData.find(pd => (pd.employee?._id || pd.employee) === emp._id);
        return acc + (p?.totalExtraMinutes || 0);
    }, 0), [filteredEmployees, payrollData]);

    const presentCount = useMemo(() => payrollData.reduce((acc, p) => acc + (p.presentDays || 0), 0), [payrollData]);
    const totalHolidays = holidays.length;
    const avgPresence = useMemo(() => (employees.length ? (presentCount / employees.length).toFixed(1) : '0'), [presentCount, employees.length]);

    const absentCount = useMemo(() => payrollData.reduce((acc, p) => acc + (p.absentDays || 0), 0), [payrollData]);

    const syncedCount = useMemo(() => payrollData.filter(p => {
        const empId = p.employee?._id || p.employee;
        return employees.some(e => e._id === empId);
    }).length, [payrollData, employees]);

    const avgPresent = useMemo(() => syncedCount > 0 ? (presentCount / syncedCount).toFixed(1) : 0, [presentCount, syncedCount]);
    const avgAbsent = useMemo(() => syncedCount > 0 ? (absentCount / syncedCount).toFixed(2) : 0, [absentCount, syncedCount]);

    const monthCalendar = useMemo(() => {
        const start = startOfMonth(new Date(year, month - 1));
        const end = endOfMonth(start);
        const daysExport = eachDayOfInterval({ start, end });

        const sundays = daysExport.filter(d => isSunday(d));
        const manualHolidays = (payrollSettings.holidays || []).filter((h: any) => {
            const hDate = new Date(h.date);
            return hDate.getMonth() + 1 === month && hDate.getFullYear() === year;
        });

        return {
            sundays,
            manualHolidays,
            totalHolidays: sundays.length + manualHolidays.length,
            workingDays: daysExport.length - (sundays.length + manualHolidays.length)
        };
    }, [month, year, payrollSettings.holidays]);

    const daysInMonth = new Date(year, month, 0).getDate();
    const areaChartData = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const factor = Math.sin(day / 3) * 2;
        return {
            name: `${day} ${new Date(0, month - 1).toLocaleString('default', { month: 'short' })}`,
            present: Math.max(0, Math.floor(Number(avgPresent) + factor)),
            absent: Math.max(0, Math.floor(Number(avgAbsent) - factor * 0.5)),
        };
    }), [month, year, avgPresent, avgAbsent, daysInMonth]);

    const pieData = useMemo(() => [
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: absentCount },
    ], [presentCount, absentCount]);

    const COLORS = ['#10b981', '#f43f5e'];

    const departments = useMemo(() => {
        return Array.from(new Set(employees.map(emp => emp.employment?.department).filter(Boolean)));
    }, [employees]);

    const subDepartments = useMemo(() => {
        const filteredByDept = filterDepartment === 'All' 
            ? employees 
            : employees.filter(emp => emp.employment?.department === filterDepartment);
        return Array.from(new Set(filteredByDept.map(emp => emp.employment?.subDepartment).filter(Boolean)));
    }, [employees, filterDepartment]);

    const locations = useMemo(() => {
        return Array.from(new Set(employees.map(emp => emp.employment?.location).filter(Boolean)));
    }, [employees]);

    const topPerformers = useMemo(() => {
        return [...employees]
            .map(emp => {
                const p = payrollData.find(pd => (pd.employee?._id || pd.employee) === emp._id);
                return { ...emp, presentDays: p?.presentDays || 0 };
            })
            .sort((a, b) => b.presentDays - a.presentDays)
            .slice(0, 4);
    }, [employees, payrollData]);

    const syncLogs = useMemo(() => {
        // Mock sync log matching the original UI
        return [{
            _id: '1',
            timestamp: new Date().toISOString(),
            status: 'Success',
            recordsProcessed: employees.length,
            message: 'Engine sync completed successfully',
            type: 'Biometric',
            batchId: 'B-0239'
        }];
    }, [employees.length]);

    if (showReport && detailEmployee) {
        // Get the payroll for report
        const reportPayroll = payrollData.find(p => (p.employee?._id || p.employee) === detailEmployee._id);
        const calendarDays = eachDayOfInterval({
            start: startOfMonth(new Date(year, month - 1)),
            end: endOfMonth(new Date(year, month - 1))
        });

        return (
            <PayslipReport
                employee={detailEmployee}
                payroll={reportPayroll || null}
                attendance={detailAttendance}
                month={month}
                year={year}
                calendarDays={calendarDays}
                payrollSettings={payrollSettings}
                onClose={() => setShowReport(false)}
            />
        );
    }

    return (
        <DashboardLayout>
            <div className={`space-y-6 pb-10 ${showReport ? 'print:hidden' : ''}`}>
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                            Attendance <span className="text-indigo-600"> &amp; Payroll</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Workforce management, attendance sync &amp; payroll engine
                        </p>
                    </div>
                    <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1 shadow-sm shrink-0">
                        <select className="bg-transparent text-[11px] font-black uppercase px-3 py-1.5 focus:outline-none dark:text-white text-slate-900" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                            {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1} className="dark:bg-slate-900 dark:text-white text-slate-900">{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>))}
                        </select>
                        <select className="bg-transparent text-[11px] font-black uppercase px-3 py-1.5 focus:outline-none dark:text-white text-slate-900" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="dark:bg-slate-900 dark:text-white text-slate-900">{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit">
                    {[
                        { id: 'overview' as Tab, label: 'Overview', icon: TrendingUp },
                        { id: 'attendance' as Tab, label: 'Attendance Calculation', icon: Calendar },
                        { id: 'payment' as Tab, label: 'Payments', icon: Wallet },
                        { id: 'settings' as Tab, label: 'Attendance Configuration', icon: Settings },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                                        ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'overview' && (
                    <OverviewTab
                        employees={employees}
                        payrollData={payrollData}
                        month={month}
                        year={year}
                        dataLoading={dataLoading}
                        avgPresent={avgPresent}
                        avgAbsent={avgAbsent}
                        totalNetPayroll={totalNetPayroll}
                        syncedCount={syncedCount}
                        monthCalendar={monthCalendar}
                        areaChartData={areaChartData}
                        pieData={pieData}
                        COLORS={COLORS}
                        topPerformers={topPerformers}
                        presentCount={presentCount}
                        absentCount={absentCount}
                        setIsFinalizeModalOpen={setIsFinalizeModalOpen}
                        openEmployeeDetail={openEmployeeDetail}
                        setActiveTab={setActiveTab}
                    />
                )}

                {activeTab === 'attendance' && (
                    <AttendanceTab
                        employees={employees}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        setIsAttendanceModalOpen={setIsAttendanceModalOpen}
                        showFilterBar={showFilterBar}
                        setShowFilterBar={setShowFilterBar}
                        filterDepartment={filterDepartment}
                        setFilterDepartment={setFilterDepartment}
                        departments={departments}
                        filterSubDept={filterSubDept}
                        setFilterSubDept={setFilterSubDept}
                        subDepartments={subDepartments}
                        filterLocation={filterLocation}
                        setFilterLocation={setFilterLocation}
                        locations={locations}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        filteredEmployees={filteredEmployees}
                        payrollData={payrollData}
                        dataLoading={dataLoading}
                        paginatedEmployees={paginatedEmployees}
                        formatMinutes={formatMinutes}
                        setPaymentEmp={setPaymentEmp}
                        setIsPaymentModalOpen={setIsPaymentModalOpen}
                        setLedgerEmp={setLedgerEmp}
                        fetchEmployeeLedger={fetchEmployeeLedger}
                        openEmployeeDetail={openEmployeeDetail}
                        statsTotalLate={statsTotalLate}
                        statsTotalExtra={statsTotalExtra}
                        rowsPerPage={rowsPerPage}
                        setRowsPerPage={setRowsPerPage}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        weekStart={weekStart}
                        setWeekStart={setWeekStart}
                        weekEnd={weekEnd}
                        setWeekEnd={setWeekEnd}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        jumpInput={jumpInput}
                        setJumpInput={setJumpInput}
                    />
                )}

                {activeTab === 'payment' && (
                    <PaymentTab
                        employees={employees}
                        payrollData={payrollData}
                        salaryPayments={salaryPayments}
                        paymentLoading={paymentLoading}
                        paymentSearch={paymentSearch}
                        setPaymentSearch={setPaymentSearch}
                        month={month}
                        year={year}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        setPaymentEmp={setPaymentEmp}
                        setIsPaymentModalOpen={setIsPaymentModalOpen}
                        setReceiptViewPayment={setReceiptViewPayment}
                        setIsReceiptModalOpen={setIsReceiptModalOpen}
                        setLedgerEmp={setLedgerEmp}
                        fetchEmployeeLedger={fetchEmployeeLedger}
                        employeeBalances={employeeBalances}
                        filterDepartment={filterDepartment}
                        setFilterDepartment={setFilterDepartment}
                        departments={departments}
                        filterSubDept={filterSubDept}
                        setFilterSubDept={setFilterSubDept}
                        subDepartments={subDepartments}
                        filterLocation={filterLocation}
                        setFilterLocation={setFilterLocation}
                        locations={locations}
                    />
                )}

                {activeTab === 'settings' && (
                    <SettingsTab
                        payrollSettings={payrollSettings}
                        setPayrollSettings={setPayrollSettings}
                        newHoliday={newHoliday}
                        setNewHoliday={setNewHoliday}
                        loadWBHolidays={loadWBHolidays}
                        handleSaveSettings={handleSaveSettings}
                        savingSettings={savingSettings}
                    />
                )}
            </div>

            {/* Modals Spectrum */}
            <AttendanceUploadModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                uploadMode={uploadMode}
                setUploadMode={setUploadMode}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                uploadWeekStart={uploadWeekStart}
                setUploadWeekStart={setUploadWeekStart}
                uploadWeekEnd={uploadWeekEnd}
                setUploadWeekEnd={setUploadWeekEnd}
                uploadFile={uploadFile}
                setUploadFile={setUploadFile}
                processing={processing}
                uploadProgress={uploadProgress}
                handleFileUpload={handleFileUpload}
            />

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                paymentEmp={paymentEmp}
                paymentForm={paymentForm}
                setPaymentForm={setPaymentForm}
                savingPayment={savingPayment}
                handleCreatePayment={handleCreatePayment}
                totalNetSalary={payrollData.find(p => (p.employee?._id || p.employee) === paymentEmp?._id)?.salaryDetails?.netSalary ?? 0}
                netBalance={paymentEmp ? (employeeBalances[paymentEmp._id] || 0) : 0}
            />

            <EmployeeDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                employee={detailEmployee}
                payroll={detailPayroll || (detailEmployee ? (payrollData.find(p => (p.employee?._id || p.employee) === detailEmployee._id) || null) : null)}
                attendance={detailAttendance}
                month={month}
                year={year}
                calendarDays={calendarDays}
                payrollSettings={payrollSettings}
                onViewLedger={(empId) => fetchEmployeeLedger(empId)}
                onExportPDF={() => setShowReport(true)}
                loading={detailLoading}
            />

            <EmployeeLedgerModal
                isOpen={isLedgerModalOpen}
                onClose={() => setIsLedgerModalOpen(false)}
                employee={ledgerEmp}
                ledgerEntries={ledgerData}
                loading={ledgerLoading}
            />

            <ViewReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                receiptViewPayment={receiptViewPayment}
                payrollData={payrollData}
                detailAttendance={detailAttendance}
                payrollSettings={payrollSettings}
                formatMinutes={formatMinutes}
            />
        </DashboardLayout>
    );
}
