import { CheckCircle2, AlertCircle, Clock, Calendar, Star } from 'lucide-react';
import React from 'react';

export interface AttendanceRecord {
    _id: string;
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    date: string;
    inTime: string | null;
    outTime: string | null;
    lateMinutes: number;
    extraMinutes: number;
    status: 'Present' | 'Absent' | 'Half Day' | 'Late' | 'Holiday' | 'Sunday';
    remarks?: string;
}

export interface SyncLog {
    _id: string;
    timestamp: string;
    type: 'Biometric' | 'Manual' | 'System';
    status: 'Success' | 'Failed' | 'Warning';
    message: string;
    recordsProcessed: number;
    batchId: string;
}

export interface PayrollSettings {
    standardIn: string;
    standardOut: string;
    lateThreshold: string;
    extraThreshold: string;
    lateMinutes: number;
    extraMinutes: number;
    lateAmount: number;
    extraAmount: number;
    holidays: { date: string; name: string }[];
}

export interface Employee {
    _id: string;
    employeeCode: string;
    employeeName: string;
    employment?: {
        designation?: string;
        department?: string;
        subDepartment?: string;
        category?: string;
        privilegeType?: 'Privileged' | 'Non-Privileged';
    };
    salary?: {
        gross?: number;
    };
}

export interface PayrollResult {
    _id: string;
    employeeId: string;
    month: number;
    year: number;
    presentDays: number;
    absentDays: number;
    holidays: number;
    totalLateMinutes: number;
    totalExtraMinutes: number;
    salaryDetails: {
        baseGross: number;
        calculatedGross: number;
        overtimePay: number;
        holidaySundayExtraPay: number;
        deductions: number;
        netSalary: number;
    };
    calculationLog: {
        dailyRate: number;
        minuteRate: number;
    };
}

export interface Payment {
    _id: string;
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    amount: number;
    date: string;
    type: 'Salary' | 'Advance' | 'Bonus' | 'Incentive';
    mode: 'Cash' | 'Bank Transfer' | 'Cheque';
    status: 'Paid' | 'Pending';
    remarks?: string;
    receiptNo: string;
    bankName?: string;
    transactionId?: string;
}

export interface LedgerEntry {
    _id: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    type: 'Salary' | 'Payment' | 'Adjustment' | 'Advance';
    referenceId?: string;
    paymentMode?: string;
    screenshotUrl?: string;
}
