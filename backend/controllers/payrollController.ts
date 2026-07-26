import { Request, Response } from 'express';
import { PayrollService } from '../services/payrollService';
import Payroll from '../models/Payroll';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import Holiday from '../models/Holiday';
import SystemSetting from '../models/SystemSetting';
import path from 'path';
import fs from 'fs';

export const processAttendanceWeekly = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { startDate, endDate, shiftStartTime } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required for weekly upload' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        // Use the month/year of the startDate to drive payroll processing.
        // The service method processes the whole Excel per month range but only
        // saves attendance records for dates in the file; passing a week-spanning
        // month means only the relevant days get written.
        const month = start.getMonth() + 1;
        const year = start.getFullYear();

        const results = await PayrollService.processBiometricReport(
            req.file.path,
            month,
            year,
            shiftStartTime || '09:30',
            startDate,
            endDate
        );

        // Cleanup temp file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: `Weekly attendance processed successfully (${startDate} → ${endDate})`,
            summary: results.results,
            missingEmployees: results.missingEmployees
        });
    } catch (error: any) {
        console.error('Process Weekly Attendance Error:', error);
        if (req.file?.path) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
        }
        res.status(500).json({ message: error.message || 'Error processing weekly attendance' });
    }
};

export const processAttendance = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { month, year, shiftStartTime } = req.body;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and Year are required' });
        }

        const results = await PayrollService.processBiometricReport(
            req.file.path,
            Number(month),
            Number(year),
            shiftStartTime || '09:30'
        );

        // Cleanup temp file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: 'Attendance processed successfully',
            summary: results.results,
            missingEmployees: results.missingEmployees
        });
    } catch (error: any) {
        console.error('Process Attendance Error:', error);
        res.status(500).json({ message: error.message || 'Error processing attendance' });
    }
};

export const uploadEmployeeAttendance = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { employeeId, month, year } = req.body;

        if (!employeeId || !month || !year) {
            return res.status(400).json({ message: 'Employee ID, Month, and Year are required' });
        }

        const results = await PayrollService.processSingleEmployeeAttendance(
            req.file.path,
            employeeId,
            Number(month),
            Number(year)
        );

        // Cleanup temp file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: 'Employee attendance processed successfully',
            summary: results
        });
    } catch (error: any) {
        console.error('Upload Employee Attendance Error:', error);
        res.status(500).json({ message: error.message || 'Error processing attendance' });
    }
};

export const getPayrolls = async (req: Request, res: Response) => {
    try {
        const { month, year, startDate, endDate } = req.query;

        if (startDate && endDate) {
            // Weekly/Custom Range View: Aggregate from Attendance on the fly
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setHours(23, 59, 59, 999);

            const employees = await Employee.find({ status: 'Active' });
            
            // Fetch all attendance records in the range for all employees
            const allAttendance = await Attendance.find({
                date: { $gte: start, $lte: end }
            });

            const results = await Promise.all(employees.map(async (emp) => {
                const empAttendance = allAttendance.filter(a => a.employee.toString() === emp._id.toString());
                
                const presentDays = empAttendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day').length;
                const totalLateMinutes = empAttendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
                const totalExtraMinutes = empAttendance.reduce((sum, a) => sum + (a.extraMinutes || 0), 0);
                const absentDays = empAttendance.filter(a => a.status === 'Absent').length;
                const holidays = empAttendance.filter(a => a.status === 'Holiday').length;

                // Simple salary estimation for the period
                const baseSalary = emp.compensation?.grossSalary || 10000;
                const dailyRate = baseSalary / 31;
                const payableDays = presentDays + holidays;
                let calculatedGross = Math.round(dailyRate * payableDays);
                
                // 2026-03-20: PRODUCTION SECTION LOGIC
                const isProductionSection = emp.employment?.department === 'Production' || emp.personalDetails?.category === 'Contract';
                if (isProductionSection) {
                    calculatedGross = 0;
                }

                // For weekly view, we'll use a simplified net salary estimate
                const netSalary = calculatedGross; // Simplified for now

                return {
                    employee: {
                        _id: emp._id,
                        employeeName: emp.employeeName,
                        employeeCode: emp.employeeCode
                    },
                    presentDays,
                    totalLateMinutes,
                    totalExtraMinutes,
                    absentDays,
                    holidays,
                    totalDays: empAttendance.length,
                    salaryDetails: {
                        netSalary
                    },
                    updatedAt: empAttendance.length > 0 ? (empAttendance[0] as any).updatedAt : null
                };
            }));

            return res.json(results);
        }

        const query: any = {};
        if (month) query.month = Number(month);
        if (year) query.year = Number(year);

        const payrolls = await Payroll.find(query).populate('employee', 'employeeName employeeCode employment.department employment.category');
        res.json(payrolls);
    } catch (error: any) {
        console.error('Error in getPayrolls:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getAttendance = async (req: Request, res: Response) => {
    try {
        const { employeeId, month, year } = req.query;
        const query: any = {};

        if (employeeId) query.employee = employeeId;
        if (month && year) {
            const start = new Date(Number(year), Number(month) - 1, 1);
            const end = new Date(Number(year), Number(month), 0);
            query.date = { $gte: start, $lte: end };
        }

        const attendance = await Attendance.find(query).sort({ date: 1 });
        res.json(attendance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const getHolidays = async (req: Request, res: Response) => {
    try {
        const holidays = await Holiday.find().sort({ date: 1 });
        res.json(holidays);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createHoliday = async (req: Request, res: Response) => {
    try {
        const holiday = new Holiday(req.body);
        await holiday.save();
        res.status(201).json(holiday);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getPayrollSettings = async (req: Request, res: Response) => {
    try {
        const settings = await SystemSetting.find({
            settingKey: {
                $in: [
                    'payroll_late_threshold', 'payroll_extra_threshold',
                    'payroll_late_minutes', 'payroll_extra_minutes',
                    'payroll_late_amount', 'payroll_extra_amount',
                    'payroll_standard_in', 'payroll_standard_out'
                ]
            }
        });

        const holidays = await Holiday.find().sort({ date: 1 });

        // Default values if not found
        const responseData = {
            standardIn: settings.find(s => s.settingKey === 'payroll_standard_in')?.settingValue || '09:30',
            standardOut: settings.find(s => s.settingKey === 'payroll_standard_out')?.settingValue || '19:00',
            lateThreshold: settings.find(s => s.settingKey === 'payroll_late_threshold')?.settingValue || '09:40',
            extraThreshold: settings.find(s => s.settingKey === 'payroll_extra_threshold')?.settingValue || '19:30',
            lateMinutes: Number(settings.find(s => s.settingKey === 'payroll_late_minutes')?.settingValue || 30),
            extraMinutes: Number(settings.find(s => s.settingKey === 'payroll_extra_minutes')?.settingValue || 30),
            lateAmount: Number(settings.find(s => s.settingKey === 'payroll_late_amount')?.settingValue || 0),
            extraAmount: Number(settings.find(s => s.settingKey === 'payroll_extra_amount')?.settingValue || 0),
            holidayIn: settings.find(s => s.settingKey === 'payroll_holiday_standard_in')?.settingValue || '09:30',
            holidayOut: settings.find(s => s.settingKey === 'payroll_holiday_standard_out')?.settingValue || '19:00',
            holidayLateThreshold: settings.find(s => s.settingKey === 'payroll_holiday_late_threshold')?.settingValue || '09:40',
            holidayExtraThreshold: settings.find(s => s.settingKey === 'payroll_holiday_extra_threshold')?.settingValue || '19:30',
            holidayLateMinutes: Number(settings.find(s => s.settingKey === 'payroll_holiday_late_minutes')?.settingValue || 30),
            holidayExtraMinutes: Number(settings.find(s => s.settingKey === 'payroll_holiday_extra_minutes')?.settingValue || 30),
            holidayLateAmount: Number(settings.find(s => s.settingKey === 'payroll_holiday_late_amount')?.settingValue || 0),
            holidayExtraAmount: Number(settings.find(s => s.settingKey === 'payroll_holiday_extra_amount')?.settingValue || 0),
            holidays: holidays.map(h => ({ date: h.date, name: h.name }))
        };

        res.json(responseData);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePayrollSettings = async (req: Request, res: Response) => {
    try {
        const {
            standardIn, standardOut,
            lateThreshold, extraThreshold,
            lateMinutes, extraMinutes,
            lateAmount, extraAmount,
            holidayIn, holidayOut,
            holidayLateThreshold, holidayExtraThreshold,
            holidayLateMinutes, holidayExtraMinutes,
            holidayLateAmount, holidayExtraAmount,
            holidays
        } = req.body;

        const updates = [
            { key: 'payroll_standard_in', value: standardIn, desc: 'Official Company Start Time' },
            { key: 'payroll_standard_out', value: standardOut, desc: 'Official Company End Time' },
            { key: 'payroll_late_threshold', value: lateThreshold, desc: 'Time after which employee is considered late' },
            { key: 'payroll_extra_threshold', value: extraThreshold, desc: 'Time after which employee earns extra minutes' },
            { key: 'payroll_late_minutes', value: lateMinutes?.toString(), desc: 'Minutes to penalize for each late slab' },
            { key: 'payroll_extra_minutes', value: extraMinutes?.toString(), desc: 'Minutes to award for each extra work slab' },
            { key: 'payroll_late_amount', value: lateAmount?.toString(), desc: 'Flat penalty amount per late slab' },
            { key: 'payroll_extra_amount', value: extraAmount?.toString(), desc: 'Flat bonus amount per extra work slab' },
            { key: 'payroll_holiday_standard_in', value: holidayIn, desc: 'Holiday Start Time' },
            { key: 'payroll_holiday_standard_out', value: holidayOut, desc: 'Holiday End Time' },
            { key: 'payroll_holiday_late_threshold', value: holidayLateThreshold, desc: 'Holiday Late Threshold' },
            { key: 'payroll_holiday_extra_threshold', value: holidayExtraThreshold, desc: 'Holiday Extra Threshold' },
            { key: 'payroll_holiday_late_minutes', value: holidayLateMinutes?.toString(), desc: 'Holiday Late Minutes Slab' },
            { key: 'payroll_holiday_extra_minutes', value: holidayExtraMinutes?.toString(), desc: 'Holiday Extra Minutes Slab' },
            { key: 'payroll_holiday_late_amount', value: holidayLateAmount?.toString(), desc: 'Holiday Late Penalty Amount' },
            { key: 'payroll_holiday_extra_amount', value: holidayExtraAmount?.toString(), desc: 'Holiday Extra Bonus Amount' }
        ];

        for (const update of updates) {
            if (update.value) {
                await SystemSetting.findOneAndUpdate(
                    { settingKey: update.key },
                    {
                        settingKey: update.key,
                        settingValue: update.value,
                        dataType: 'string',
                        category: 'General',
                        description: update.desc,
                        updatedBy: (req as any).user?._id
                    },
                    { upsert: true, new: true }
                );
            }
        }

        // Handle Holidays sync
        if (holidays && Array.isArray(holidays)) {
            // Get all existing holidays to figure out which ones to delete
            const incomingDates = holidays.map(h => new Date(h.date).toISOString().split('T')[0]);

            // Delete holidays that are NOT in the incoming list (optional: restrict to a year if needed)
            // For now, if the user manages the registry, we'll assume they want it to match the provided list
            const existingHolidays = await Holiday.find({});
            for (const existing of existingHolidays) {
                const dateStr = existing.date.toISOString().split('T')[0];
                if (!incomingDates.includes(dateStr)) {
                    await Holiday.findByIdAndDelete(existing._id);
                }
            }

            // Upsert incoming holidays
            for (const h of holidays) {
                await Holiday.findOneAndUpdate(
                    { date: new Date(h.date) },
                    { name: h.name, date: new Date(h.date) },
                    { upsert: true, new: true }
                );
            }
        }

        res.json({ message: 'Payroll settings updated successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
