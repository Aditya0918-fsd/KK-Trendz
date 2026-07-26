import * as XLSX from 'xlsx';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import Payroll from '../models/Payroll';
import Holiday from '../models/Holiday';
import SystemSetting from '../models/SystemSetting';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSunday, isSameDay, parse } from 'date-fns';

export class PayrollService {
    static async processBiometricReport(filePath: string, month: number, year: number, shiftStartTime: string = '09:30', startDateStr?: string, endDateStr?: string) {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Check if this is the KK Traders format
        const firstRow = data[0] && data[0][0] ? data[0][0].toString() : '';
        if (firstRow.includes('Monthly Attendance Report') || firstRow.includes('KK TRENDZ')) {
            return this.processKKTradersReport(data, month, year, shiftStartTime, startDateStr, endDateStr);
        }

        const baseDate = '2024-01-01 ';
        const shiftStart = parse(baseDate + shiftStartTime, 'yyyy-MM-dd H:mm', new Date());

        const missingEmployeesStr = new Set<string>();
        const results = [];
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(monthStart);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Fetch holidays for the month
        const holidays = await Holiday.find({
            date: { $gte: monthStart, $lte: monthEnd }
        });

        // Fetch Payroll Settings
        const settings = await SystemSetting.find({
            settingKey: {
                $in: [
                    'payroll_late_threshold', 'payroll_extra_threshold',
                    'payroll_late_minutes', 'payroll_extra_minutes',
                    'payroll_late_amount', 'payroll_extra_amount',
                    'payroll_standard_in', 'payroll_standard_out',
                    'payroll_holiday_late_threshold', 'payroll_holiday_extra_threshold',
                    'payroll_holiday_standard_in', 'payroll_holiday_standard_out',
                    'payroll_holiday_late_minutes', 'payroll_holiday_extra_minutes',
                    'payroll_holiday_late_amount', 'payroll_holiday_extra_amount'
                ]
            }
        });

        // Standard Settings
        const lateThresholdStr = settings.find(s => s.settingKey === 'payroll_late_threshold')?.settingValue || '09:40';
        const extraThresholdStr = settings.find(s => s.settingKey === 'payroll_extra_threshold')?.settingValue || '19:30';
        const standardInStr = settings.find(s => s.settingKey === 'payroll_standard_in')?.settingValue || '09:30';
        const standardOutStr = settings.find(s => s.settingKey === 'payroll_standard_out')?.settingValue || '19:00';

        // Holiday/Sunday Settings
        const holLateThresholdStr = settings.find(s => s.settingKey === 'payroll_holiday_late_threshold')?.settingValue || lateThresholdStr;
        const holExtraThresholdStr = settings.find(s => s.settingKey === 'payroll_holiday_extra_threshold')?.settingValue || extraThresholdStr;
        const holStandardInStr = settings.find(s => s.settingKey === 'payroll_holiday_standard_in')?.settingValue || standardInStr;
        const holStandardOutStr = settings.find(s => s.settingKey === 'payroll_holiday_standard_out')?.settingValue || standardOutStr;

        const lateMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_late_minutes')?.settingValue || 30);
        const extraMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_extra_minutes')?.settingValue || 30);
        const lateAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_late_amount')?.settingValue || 0);
        const extraAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_extra_amount')?.settingValue || 0);

        // Holiday/Sunday Settings (Numeric)
        const holLateMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_holiday_late_minutes')?.settingValue || lateMinutesSetting);
        const holExtraMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_holiday_extra_minutes')?.settingValue || extraMinutesSetting);
        const holLateAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_holiday_late_amount')?.settingValue || lateAmountSetting);
        const holExtraAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_holiday_extra_amount')?.settingValue || extraAmountSetting);

        // Helper to parse time string to minutes
        const getMins = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const standardInMins = getMins(standardInStr);
        const standardOutMins = getMins(standardOutStr);
        const lateThresholdMins = getMins(lateThresholdStr);
        const extraThresholdMins = getMins(extraThresholdStr);

        const holStandardInMins = getMins(holStandardInStr);
        const holStandardOutMins = getMins(holStandardOutStr);
        const holLateThresholdMins = getMins(holLateThresholdStr);
        const holExtraThresholdMins = getMins(holExtraThresholdStr);

        // Base exit time for extra minutes calculation (usually 30 mins before threshold)
        const baseExitMins = extraThresholdMins - 30;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // If column A is a serial number and Column B is a text (employee name)
            if (row[0] && !isNaN(Number(row[0])) && row[1] && typeof row[1] === 'string') {
                const empName = row[1].trim();

                // Find employee by name (case-insensitive and trimmed)
                const employee = await Employee.findOne({
                    employeeName: { $regex: new RegExp(`^\\s*${empName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }
                });

                if (!employee) {
                    missingEmployeesStr.add(empName);
                    continue;
                }

                // IMPORTANT: Some Excel formats place times in the row immediately following the name
                const nextRow = data[i + 1] || [];

                let empLateThresholdMins = lateThresholdMins;
                let empExtraThresholdMins = extraThresholdMins;
                let empBaseExitMins = extraThresholdMins - 30;
                let empStandardInMins = standardInMins;
                let empStandardOutMins = standardOutMins;

                if (employee.employment?.inTime && employee.employment.inTime.includes(':')) {
                    const empIn = parse(baseDate + employee.employment.inTime, 'yyyy-MM-dd HH:mm', new Date());
                    empLateThresholdMins = empIn.getHours() * 60 + empIn.getMinutes();
                    empStandardInMins = empLateThresholdMins;
                }
                if (employee.employment?.outTime && employee.employment.outTime.includes(':')) {
                    const empOut = parse(baseDate + employee.employment.outTime, 'yyyy-MM-dd HH:mm', new Date());
                    empExtraThresholdMins = empOut.getHours() * 60 + empOut.getMinutes();
                    empBaseExitMins = empExtraThresholdMins - 30;
                    empStandardOutMins = empExtraThresholdMins - 30;
                }

                const attendanceSummary = {
                    present: 0,
                    absent: 0,
                    late: 0,
                    totalLateMinutes: 0,
                    totalExtraMinutes: 0,
                    holidaysCount: 0,
                    deductionPay: 0,
                    bonusPay: 0,
                    dailyLogs: [] as any[]
                };

                for (let dayIdx = 0; dayIdx < daysInMonth.length; dayIdx++) {
                    const currentDate = daysInMonth[dayIdx];
                    const colIdx = 2 + dayIdx; // Correct column index for Days (starts at Col C)
                    // Check both the name row and the potential log row below it
                    const val = row[colIdx] || nextRow[colIdx];

                    const holiday = holidays.find(h => isSameDay(new Date(h.date), currentDate));
                    const isSun = isSunday(currentDate);

                    let status: any = 'Absent';
                    let inTime = '';
                    let outTime = '';
                    let lateMinutes = 0;
                    let extraMinutes = 0;

                    if (val) {
                        const valStr = val.toString().trim().toLowerCase();
                        if (valStr === 'holiday' || valStr === 'a' || valStr === 'na' || valStr === 'gh' || valStr === 'wo') {
                            if (valStr === 'holiday' || valStr === 'wo' || isSun || holiday) {
                                status = 'Holiday';
                                attendanceSummary.holidaysCount++;
                            } else {
                                status = 'Absent';
                            }
                        } else {
                            const times = val.toString().split(/[\r\n\s]+/);
                            if (times.length >= 1 && times[0].includes(':')) {
                                inTime = times[0].trim();
                                outTime = times[1] ? times[1].trim() : '';

                                try {
                                    const employeeIn = parse(baseDate + inTime, 'yyyy-MM-dd H:mm', new Date());
                                    const employeeOut = outTime ? parse(baseDate + outTime, 'yyyy-MM-dd H:mm', new Date()) : null;

                                    const inMins = employeeIn.getHours() * 60 + employeeIn.getMinutes();
                                    const outMins = employeeOut ? (employeeOut.getHours() * 60 + employeeOut.getMinutes()) : 0;

                                    const isOffDay = !!(holiday || isSun);
                                    const currentStdInMins = isOffDay ? holStandardInMins : standardInMins;
                                    const currentStdOutMins = isOffDay ? holStandardOutMins : standardOutMins;
                                    const currentLateThresholdMins = isOffDay ? holLateThresholdMins : lateThresholdMins;
                                    const currentExtraThresholdMins = isOffDay ? holExtraThresholdMins : extraThresholdMins;

                                    const currentLateMinutesSlab = isOffDay ? holLateMinutesSetting : lateMinutesSetting;
                                    const currentExtraMinutesSlab = isOffDay ? holExtraMinutesSetting : extraMinutesSetting;

                                    // 1. Late Penalty Logic (Arrivals)
                                    if (inMins > currentLateThresholdMins) {
                                        // Block Penalty: if late by 1m+, it hits the first block
                                        const diff = inMins - currentLateThresholdMins;
                                        lateMinutes += Math.ceil(diff / currentLateMinutesSlab) * currentLateMinutesSlab;
                                    }

                                    // 2. Early Departure Penalty Logic
                                    if (employeeOut && outMins < currentStdOutMins) {
                                        // Block Penalty: if early by 1m+, it hits the first block
                                        const diff = currentStdOutMins - outMins;
                                        lateMinutes += Math.ceil(diff / currentLateMinutesSlab) * currentLateMinutesSlab;
                                    }

                                    if (lateMinutes > 0) {
                                        attendanceSummary.totalLateMinutes += lateMinutes;
                                        attendanceSummary.late++;
                                        status = 'Late';
                                    } else {
                                        status = 'Present';
                                    }

                                    // 3. Extra Time (Overtime Yield)
                                    // 3a. Morning Extra (Early Arrival)
                                    if (inMins < currentStdInMins) {
                                        const diff = currentStdInMins - inMins;
                                        // Block Bonus: e.g. 30m blocks
                                        extraMinutes += Math.floor(diff / currentExtraMinutesSlab) * currentExtraMinutesSlab;
                                    }

                                    // 3b. Evening Extra (Past Threshold)
                                    if (employeeOut && outMins >= currentExtraThresholdMins) {
                                        // Extra time count starts from Standard Out
                                        const diff = outMins - currentStdOutMins;
                                        // Block Bonus: e.g. 30m blocks
                                        extraMinutes += Math.floor(diff / currentExtraMinutesSlab) * currentExtraMinutesSlab;
                                    }

                                    attendanceSummary.totalExtraMinutes += extraMinutes;

                                    // Financial Accumulation (Daily Precision)
                                    const currentLateAmt = isOffDay ? holLateAmountSetting : lateAmountSetting;
                                    const currentExtraAmt = isOffDay ? holExtraAmountSetting : extraAmountSetting;

                                    if (lateMinutes > 0 && currentLateAmt > 0) {
                                        attendanceSummary.deductionPay += (lateMinutes / currentLateMinutesSlab) * currentLateAmt;
                                    }
                                    if (extraMinutes > 0 && currentExtraAmt > 0) {
                                        attendanceSummary.bonusPay += (extraMinutes / currentExtraMinutesSlab) * currentExtraAmt;
                                    }
                                } catch (e) {
                                    status = 'Present';
                                }
                            } else if (!isNaN(Number(val))) {
                                if (Number(val) > 0) status = 'Present';
                                else status = 'Absent';
                            } else {
                                status = 'Present';
                            }
                        }
                    } else if (holiday || isSun) {
                        status = 'Holiday';
                        attendanceSummary.holidaysCount++;
                    }

                    if (status === 'Present' || status === 'Late') attendanceSummary.present++;
                    if (status === 'Absent' && !isSun && !holiday) attendanceSummary.absent++;

                    attendanceSummary.dailyLogs.push({
                        date: currentDate,
                        inTime,
                        outTime,
                        status,
                        lateMinutes,
                        extraMinutes,
                        isHolidayOrSunday: !!(holiday || isSun)
                    });

                    await Attendance.findOneAndUpdate(
                        { employee: employee._id, date: currentDate },
                        {
                            employee: employee._id,
                            date: currentDate,
                            inTime,
                            outTime,
                            status,
                            lateMinutes,
                            extraMinutes,
                            source: 'Biometric Excel'
                        },
                        { upsert: true }
                    );
                }

                const totalDaysInMonth = daysInMonth.length;
                const baseSalary = employee.compensation?.grossSalary || 10000;

                // EXACT MATH: perday salary = total base salary / months numbers of days
                const dailyRate = baseSalary / totalDaysInMonth;
                // EXACT MATH: per hour salary = per day salary / shift hour (e.g. 9.5 hours)
                const shiftDurationMins = standardOutMins - standardInMins;
                const hourRate = dailyRate / (shiftDurationMins / 60);
                const minuteRate = hourRate / 60;

                // Categories & Privilege Level Logic
                const isSalary = employee.employment?.employmentType === 'Salary';
                const isPrivileged = employee.employment?.privilegeType === 'Privileged';

                let calculatedGross = 0;
                let deductions = 0;
                let holidaySundayExtraPay = 0;
                let payableDays = 0;

                if (isSalary && isPrivileged) {
                    calculatedGross = baseSalary;
                    payableDays = 30; // Represent full month
                } else if (isSalary && !isPrivileged) {
                    // Paid for actual working days only
                    payableDays = attendanceSummary.present;
                    calculatedGross = Math.round(dailyRate * payableDays);

                    // Use flat deductions if configured, otherwise fallback to minute-rate
                    if (attendanceSummary.deductionPay > 0) {
                        deductions = Math.round(attendanceSummary.deductionPay);
                    } else {
                        deductions = Math.round(attendanceSummary.totalLateMinutes * minuteRate);
                    }
                } else {
                    // Non-Salary: Paid only for working days
                    payableDays = attendanceSummary.present;
                    calculatedGross = Math.round(dailyRate * payableDays);

                    if (attendanceSummary.deductionPay > 0) {
                        deductions = Math.round(attendanceSummary.deductionPay);
                    } else {
                        deductions = Math.round(attendanceSummary.totalLateMinutes * minuteRate);
                    }
                }

                // Holiday / Sunday Work Logic (Double Salary)
                for (const log of attendanceSummary.dailyLogs) {
                    if (log.isHolidayOrSunday) {
                        if (log.inTime && log.outTime) {
                            try {
                                const [inH, inM] = log.inTime.split(':').map(Number);
                                const [outH, outM] = log.outTime.split(':').map(Number);
                                let inMins = inH * 60 + inM;
                                let outMins = outH * 60 + outM;
                                if (outMins < inMins) outMins += 1440; // Handle overnight

                                const workedMins = outMins - inMins;

                                if (workedMins >= 420) { // 7 hours threshold
                                    holidaySundayExtraPay += Math.round(dailyRate);
                                } else {
                                    holidaySundayExtraPay += Math.round(workedMins * minuteRate);
                                }
                            } catch (e) {
                                console.error('Error calculating holiday work pay:', e);
                            }
                        } else if (log.status === 'Present' || log.status === 'Late') {
                            // Fallback for reports that only mark status without times
                            holidaySundayExtraPay += Math.round(dailyRate);
                        }
                    }
                }

                let overtimePay = 0;
                if (attendanceSummary.bonusPay > 0) {
                    overtimePay = Math.round(attendanceSummary.bonusPay);
                } else {
                    overtimePay = Math.round(attendanceSummary.totalExtraMinutes * minuteRate);
                }

                // Final Net Salary
                let netSalary = calculatedGross + overtimePay + holidaySundayExtraPay - deductions;

                const category = employee.employment?.category || 'Salary';
                if (category === 'Contract') {
                    overtimePay = 0;
                    holidaySundayExtraPay = 0;
                    deductions = 0;
                    calculatedGross = 0;
                    netSalary = 0;
                }

                // PRIVILEGE OVERRIDE: Record everything, but pay only the Base Base Salary
                if (isPrivileged) {
                    overtimePay = 0;
                    deductions = 0;
                    holidaySundayExtraPay = 0;
                    calculatedGross = baseSalary;
                    netSalary = baseSalary;
                    payableDays = totalDaysInMonth;
                }

                const payrollRecord = await Payroll.findOneAndUpdate(
                    { employee: employee._id, month, year },
                    {
                        employee: employee._id,
                        month,
                        year,
                        totalDays: totalDaysInMonth,
                        presentDays: attendanceSummary.present,
                        totalLateMinutes: attendanceSummary.totalLateMinutes,
                        totalExtraMinutes: attendanceSummary.totalExtraMinutes,
                        absentDays: attendanceSummary.absent,
                        holidays: attendanceSummary.holidaysCount,
                        salaryDetails: {
                            baseGross: baseSalary,
                            calculatedGross: calculatedGross,
                            overtimePay: overtimePay,
                            holidaySundayExtraPay: holidaySundayExtraPay,
                            deductions: deductions,
                            netSalary: netSalary
                        },
                        calculationLog: {
                            attendanceSummary,
                            shiftStartTime,
                            dailyRate,
                            minuteRate
                        }
                    },
                    { upsert: true, new: true }
                );

                results.push({
                    employeeName: employee.employeeName,
                    employeeCode: employee.employeeCode,
                    payableDays,
                    netSalary,
                    payrollId: payrollRecord._id
                });
            }
        }

        return { results, missingEmployees: Array.from(missingEmployeesStr) };
    }

    static async processKKTradersReport(data: any[][], month: number, year: number, shiftStartTime: string = '09:30', startDateStr?: string, endDateStr?: string) {
        const firstRow = data[0] && data[0][0] ? data[0][0].toString() : '';

        // Log detected month/year for debug, but we will use the user-selected month/year from the UI
        const weekStart = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
        const weekEnd = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

        const periodMatch = firstRow.match(/(\d{2})\/(\d{2})\/(\d{4})\s+To\s+(\d{2})\/(\d{2})\/(\d{4})/);
        if (periodMatch) {
            console.log(`[PAYROLL] Excel header specifies: ${periodMatch[5]}/${periodMatch[6]}`);
        }
        console.log(`[PAYROLL] Using user-selected period: ${month}/${year}`);

        const baseDate = '2024-01-01 ';
        const shiftStart = parse(baseDate + shiftStartTime, 'yyyy-MM-dd H:mm', new Date());
        const missingEmployeesStr = new Set<string>();
        const results = [];
        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(monthStart);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Fetch holidays for the selected month
        const holidays = await Holiday.find({
            date: { $gte: monthStart, $lte: monthEnd }
        });

        // Fetch Payroll Settings
        const settings = await SystemSetting.find({
            settingKey: {
                $in: [
                    'payroll_late_threshold', 'payroll_extra_threshold',
                    'payroll_late_minutes', 'payroll_extra_minutes',
                    'payroll_late_amount', 'payroll_extra_amount',
                    'payroll_standard_in', 'payroll_standard_out',
                    'payroll_holiday_late_threshold', 'payroll_holiday_extra_threshold',
                    'payroll_holiday_late_minutes', 'payroll_holiday_extra_minutes',
                    'payroll_holiday_late_amount', 'payroll_holiday_extra_amount',
                    'payroll_holiday_standard_in', 'payroll_holiday_standard_out'
                ]
            }
        });

        // Standard Settings
        const lateThresholdStr = settings.find(s => s.settingKey === 'payroll_late_threshold')?.settingValue || '09:40';
        const extraThresholdStr = settings.find(s => s.settingKey === 'payroll_extra_threshold')?.settingValue || '19:30';
        const standardInStr = settings.find(s => s.settingKey === 'payroll_standard_in')?.settingValue || '09:30';
        const standardOutStr = settings.find(s => s.settingKey === 'payroll_standard_out')?.settingValue || '19:30';
        const lateMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_late_minutes')?.settingValue || 30);
        const extraMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_extra_minutes')?.settingValue || 30);
        const lateAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_late_amount')?.settingValue || 0);
        const extraAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_extra_amount')?.settingValue || 0);

        const holLateThresholdStr = settings.find(s => s.settingKey === 'payroll_holiday_late_threshold')?.settingValue || lateThresholdStr;
        const holExtraThresholdStr = settings.find(s => s.settingKey === 'payroll_holiday_extra_threshold')?.settingValue || extraThresholdStr;
        const holStandardInStr = settings.find(s => s.settingKey === 'payroll_holiday_standard_in')?.settingValue || standardInStr;
        const holStandardOutStr = settings.find(s => s.settingKey === 'payroll_holiday_standard_out')?.settingValue || standardOutStr;
        const holLateMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_holiday_late_minutes')?.settingValue || lateMinutesSetting);
        const holExtraMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_holiday_extra_minutes')?.settingValue || extraMinutesSetting);
        const holLateAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_holiday_late_amount')?.settingValue || lateAmountSetting);
        const holExtraAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_holiday_extra_amount')?.settingValue || extraAmountSetting);

        // Helper to parse time string to minutes
        const getMins = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const standardInMins = getMins(standardInStr);
        const standardOutMins = getMins(standardOutStr);
        const lateThresholdMins = getMins(lateThresholdStr);
        const extraThresholdMins = getMins(extraThresholdStr);

        const holStandardInMins = getMins(holStandardInStr);
        const holStandardOutMins = getMins(holStandardOutStr);
        const holLateThresholdMins = getMins(holLateThresholdStr);
        const holExtraThresholdMins = getMins(holExtraThresholdStr);


        // Find employee rows. They start from row 9 (index 8)
        // Col D (index 3) is name, Col B (index 1) is serial
        for (let i = 8; i < data.length; i++) {
            const row = data[i];
            const empCodeVal = (row[1] !== undefined && row[1] !== '') ? row[1] : row[2];
            if (row[3] && typeof row[3] === 'string' && row[3].trim().length > 1 && empCodeVal !== undefined && !isNaN(Number(empCodeVal))) {
                const empName = row[3].trim();
                const serialNum = empCodeVal;
                console.log(`Processing Excel Row ${i + 1}, Name: "${empName}"`);

                let employee = await Employee.findOne({
                    employeeName: { $regex: new RegExp(`^\\s*${empName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }
                });

                if (!employee) {
                    missingEmployeesStr.add(empName);
                    console.log(`[PAYROLL] ⚠️ Employee not found: "${empName}"`);
                    continue;
                } else {
                    console.log(`[PAYROLL] ✅ Found existing employee: "${employee.employeeName}"`);
                }

                let empLateThresholdMins = lateThresholdMins;
                let empExtraThresholdMins = extraThresholdMins;
                let empBaseExitMins = extraThresholdMins - 30;
                let empStandardInMins = standardInMins;
                let empStandardOutMins = standardOutMins;

                if (employee.employment?.inTime && employee.employment.inTime.includes(':')) {
                    const empIn = parse(baseDate + employee.employment.inTime, 'yyyy-MM-dd HH:mm', new Date());
                    empLateThresholdMins = empIn.getHours() * 60 + empIn.getMinutes();
                    empStandardInMins = empLateThresholdMins;
                }
                if (employee.employment?.outTime && employee.employment.outTime.includes(':')) {
                    const empOut = parse(baseDate + employee.employment.outTime, 'yyyy-MM-dd HH:mm', new Date());
                    empExtraThresholdMins = empOut.getHours() * 60 + empOut.getMinutes();
                    empBaseExitMins = empExtraThresholdMins - 30;
                    empStandardOutMins = empExtraThresholdMins - 30;
                }

                // Fetch existing month attendance to preserve previous weeks' data
                const existingMonthLogs = (weekStart && weekEnd) ? await Attendance.find({
                    employee: employee._id,
                    date: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) }
                }) : [];

                const attendanceSummary = {
                    present: 0,
                    absent: 0,
                    late: 0,
                    totalLateMinutes: 0,
                    totalExtraMinutes: 0,
                    holidaysCount: 0,
                    deductionPay: 0,
                    bonusPay: 0,
                    dailyLogs: [] as any[]
                };

                for (let dayIdx = 0; dayIdx < daysInMonth.length; dayIdx++) {
                    const currentDate = daysInMonth[dayIdx];
                    const colIdx = 5 + dayIdx; // Column F is index 5
                    const val = row[colIdx];

                    const holiday = holidays.find(h => isSameDay(new Date(h.date), currentDate));
                    const isSun = isSunday(currentDate);
                    const isOffDay = !!(holiday || isSun);

                    const currentStdInMins = isOffDay ? holStandardInMins : standardInMins;
                    const currentStdOutMins = isOffDay ? holStandardOutMins : standardOutMins;
                    const currentLateThresholdMins = isOffDay ? holLateThresholdMins : lateThresholdMins;
                    const currentExtraThresholdMins = isOffDay ? holExtraThresholdMins : extraThresholdMins;

                    const currentLateMinutesSlab = isOffDay ? holLateMinutesSetting : lateMinutesSetting;
                    const currentExtraMinutesSlab = isOffDay ? holExtraMinutesSetting : extraMinutesSetting;

                    const currentLateAmt = isOffDay ? holLateAmountSetting : lateAmountSetting;
                    const currentExtraAmt = isOffDay ? holExtraAmountSetting : extraAmountSetting;

                    let status: any = 'Absent';
                    let inTime = '';
                    let outTime = '';
                    let lateMinutes = 0;
                    let extraMinutes = 0;

                    // If this day is outside the uploaded week, use existing DB record instead
                    const isOutsideWeek = weekStart && weekEnd && (currentDate < weekStart || currentDate > weekEnd);
                    if (isOutsideWeek) {
                        const dbLog = existingMonthLogs.find((l: any) => isSameDay(new Date(l.date), currentDate));
                        if (dbLog) {
                            status = dbLog.status;
                            inTime = dbLog.inTime || '';
                            outTime = dbLog.outTime || '';
                            lateMinutes = dbLog.lateMinutes || 0;
                            extraMinutes = dbLog.extraMinutes || 0;
                            if (status === 'Present' || status === 'Late') attendanceSummary.present++;
                            if (status === 'Absent' && !isSun && !holiday) attendanceSummary.absent++;
                            if (status === 'Holiday') attendanceSummary.holidaysCount++;
                            attendanceSummary.totalLateMinutes += lateMinutes;
                            attendanceSummary.totalExtraMinutes += extraMinutes;
                            if (lateMinutes > 0 && currentLateAmt > 0) attendanceSummary.deductionPay += (lateMinutes / currentLateMinutesSlab) * currentLateAmt;
                            if (extraMinutes > 0 && currentExtraAmt > 0) attendanceSummary.bonusPay += (extraMinutes / currentExtraMinutesSlab) * currentExtraAmt;
                            attendanceSummary.dailyLogs.push({ date: currentDate, inTime, outTime, status, lateMinutes, extraMinutes, isHolidayOrSunday: isOffDay });
                        } else if (isSun || holiday) {
                            status = 'Holiday';
                            attendanceSummary.holidaysCount++;
                            attendanceSummary.dailyLogs.push({ date: currentDate, inTime: '', outTime: '', status, lateMinutes: 0, extraMinutes: 0, isHolidayOrSunday: true });
                        }
                        continue;
                    }

                    if (val) {
                        const valStr = val.toString().trim().toUpperCase();
                        if (valStr === 'A' || valStr === 'ABSENT' || valStr === 'NA') {
                            status = 'Absent';
                        } else if (valStr === 'H' || valStr === 'HOLIDAY' || valStr === 'WO' || valStr === 'GH') {
                            status = 'Holiday';
                            attendanceSummary.holidaysCount++;
                        } else {
                            // Split by newline or space
                            const times = val.toString().split(/[\r\n\s]+/);
                            if (times.length >= 1 && times[0].includes(':')) {
                                inTime = times[0].trim();
                                outTime = times[1] ? times[1].trim() : '';

                                try {
                                    const employeeIn = parse(baseDate + inTime, 'yyyy-MM-dd H:mm', new Date());
                                    const inMins = employeeIn.getHours() * 60 + employeeIn.getMinutes();

                                    const isOffDay = !!(holiday || isSun);
                                    const currentStdInMins = isOffDay ? holStandardInMins : standardInMins;
                                    const currentStdOutMins = isOffDay ? holStandardOutMins : standardOutMins;
                                    const currentLateThresholdMins = isOffDay ? holLateThresholdMins : lateThresholdMins;
                                    const currentExtraThresholdMins = isOffDay ? holExtraThresholdMins : extraThresholdMins;

                                    const currentLateMinutesSlab = isOffDay ? holLateMinutesSetting : lateMinutesSetting;
                                    const currentExtraMinutesSlab = isOffDay ? holExtraMinutesSetting : extraMinutesSetting;

                                    // 1. Late Penalty Logic (Arrivals)
                                    if (inMins > currentLateThresholdMins) {
                                        // Block Penalty: if late by 1m+, it hits the first block
                                        const diff = inMins - currentLateThresholdMins;
                                        lateMinutes += Math.ceil(diff / currentLateMinutesSlab) * currentLateMinutesSlab;
                                    }

                                    // 2. Early Departure Penalty Logic
                                    const employeeOut = outTime && outTime.includes(':') ? parse(baseDate + outTime, 'yyyy-MM-dd H:mm', new Date()) : null;
                                    const outMins = employeeOut ? (employeeOut.getHours() * 60 + employeeOut.getMinutes()) : 0;

                                    if (employeeOut && outMins < currentStdOutMins) {
                                        // Block Penalty: if early by 1m+, it hits the first block
                                        const diff = currentStdOutMins - outMins;
                                        lateMinutes += Math.ceil(diff / currentLateMinutesSlab) * currentLateMinutesSlab;
                                    }

                                    if (lateMinutes > 0) {
                                        attendanceSummary.totalLateMinutes += lateMinutes;
                                        attendanceSummary.late++;
                                        status = 'Late';
                                    } else {
                                        status = 'Present';
                                    }

                                    // 3. Extra Time (Overtime Yield)
                                    // 3a. Morning Extra (Early Arrival)
                                    if (inMins < currentStdInMins) {
                                        const diff = currentStdInMins - inMins;
                                        // Block Bonus: e.g. 30m blocks
                                        extraMinutes += Math.floor(diff / currentExtraMinutesSlab) * currentExtraMinutesSlab;
                                    }

                                    // 3b. Evening Extra (Past Threshold)
                                    if (employeeOut && outMins >= currentExtraThresholdMins) {
                                        // Extra time count starts from Standard Out
                                        const diff = outMins - currentStdOutMins;
                                        // Block Bonus: e.g. 30m blocks
                                        extraMinutes += Math.floor(diff / currentExtraMinutesSlab) * currentExtraMinutesSlab;
                                    }

                                    attendanceSummary.totalExtraMinutes += extraMinutes;

                                    // Financial Accumulation (Daily Precision)
                                    const currentLateAmt = isOffDay ? holLateAmountSetting : lateAmountSetting;
                                    const currentExtraAmt = isOffDay ? holExtraAmountSetting : extraAmountSetting;

                                    if (lateMinutes > 0 && currentLateAmt > 0) {
                                        attendanceSummary.deductionPay += (lateMinutes / currentLateMinutesSlab) * currentLateAmt;
                                    }
                                    if (extraMinutes > 0 && currentExtraAmt > 0) {
                                        attendanceSummary.bonusPay += (extraMinutes / currentExtraMinutesSlab) * currentExtraAmt;
                                    }
                                } catch (e) {
                                    status = 'Present';
                                }
                            } else {
                                status = 'Present';
                            }
                        }
                    } else if (holiday || isSun) {
                        status = 'Holiday';
                        attendanceSummary.holidaysCount++;
                    }

                    if (status === 'Present' || status === 'Late') attendanceSummary.present++;
                    if (status === 'Absent' && !isSun && !holiday) attendanceSummary.absent++;

                    attendanceSummary.dailyLogs.push({
                        date: currentDate,
                        inTime,
                        outTime,
                        status,
                        lateMinutes,
                        extraMinutes,
                        isHolidayOrSunday: !!(holiday || isSun)
                    });

                    await Attendance.findOneAndUpdate(
                        { employee: employee._id, date: currentDate },
                        {
                            employee: employee._id,
                            date: currentDate,
                            inTime,
                            outTime,
                            status,
                            lateMinutes,
                            extraMinutes,
                            source: 'KK Traders Excel'
                        },
                        { upsert: true }
                    );
                }

                const totalDaysInMonth = daysInMonth.length;
                const baseSalary = employee.compensation?.grossSalary || 0;

                // Use explicit Daily Rate if provided in master data, otherwise calculate it
                const dailyRate = employee.compensation?.dailyRate || (baseSalary / totalDaysInMonth);

                const shiftDurationMins = standardOutMins - standardInMins;
                const hourRate = dailyRate / (shiftDurationMins / 60);
                const minuteRate = hourRate / 60;

                // Category Evaluation
                const category = employee.employment?.category || 'Salary';
                const isPrivileged = employee.employment?.privilegeType === 'Privileged';

                let calculatedGross = 0;
                let deductions = 0;
                let holidaySundayExtraPay = 0;
                let payableDays = 0;

                // 1. Contract (Production-Wise): NO Automatic Calculation
                if (category === 'Contract') {
                    // netSalary remains 0
                }
                // 2. Salary Category
                else if (category === 'Salary') {
                    if (isPrivileged) {
                        calculatedGross = baseSalary;
                        payableDays = totalDaysInMonth;
                    } else {
                        // Paid for actual working days only
                        payableDays = attendanceSummary.present;
                        calculatedGross = Math.round(dailyRate * payableDays);

                        // Deductions based on daily logic (chunks) or minutes
                        if (attendanceSummary.deductionPay > 0) {
                            deductions = Math.round(attendanceSummary.deductionPay);
                        } else {
                            deductions = Math.round(attendanceSummary.totalLateMinutes * minuteRate);
                        }
                    }
                }
                // 3. Temporary: Paid by Daily Rate
                else if (category === 'Temporary') {
                    if (isPrivileged) {
                        // Privileged Temporary gets paid for all days in the month
                        payableDays = totalDaysInMonth;
                        calculatedGross = Math.round(dailyRate * payableDays);
                    } else {
                        // Standard Temporary gets paid only for present days
                        payableDays = attendanceSummary.present;
                        calculatedGross = Math.round(dailyRate * payableDays);

                        if (attendanceSummary.deductionPay > 0) {
                            deductions = Math.round(attendanceSummary.deductionPay);
                        } else {
                            deductions = Math.round(attendanceSummary.totalLateMinutes * minuteRate);
                        }
                    }
                }

                // Holiday / Sunday Work Logic (Double Salary)
                for (const log of attendanceSummary.dailyLogs) {
                    if (log.isHolidayOrSunday) {
                        if (log.inTime && log.outTime) {
                            try {
                                const [inH, inM] = log.inTime.split(':').map(Number);
                                const [outH, outM] = log.outTime.split(':').map(Number);
                                let inMins = inH * 60 + inM;
                                let outMins = outH * 60 + outM;
                                if (outMins < inMins) outMins += 1440; // Handle overnight

                                const workedMins = outMins - inMins;

                                // If worked more than 7 hours (420 mins), full day pay. Else pro-rated.
                                if (workedMins >= 420) {
                                    holidaySundayExtraPay += Math.round(dailyRate);
                                } else {
                                    holidaySundayExtraPay += Math.round(workedMins * minuteRate);
                                }
                            } catch (e) {
                                console.error('Error calculating holiday work pay:', e);
                            }
                        } else if (log.status === 'Present' || log.status === 'Late') {
                            // Fallback for reports that only mark status without times
                            holidaySundayExtraPay += Math.round(dailyRate);
                        }
                    }
                }

                let overtimePay = 0;
                if (attendanceSummary.bonusPay > 0) {
                    overtimePay = Math.round(attendanceSummary.bonusPay);
                } else {
                    overtimePay = Math.round(attendanceSummary.totalExtraMinutes * minuteRate);
                }

                // Final Net Salary
                let netSalary = calculatedGross + overtimePay + holidaySundayExtraPay - deductions;

                if (category === 'Contract') {
                    overtimePay = 0;
                    holidaySundayExtraPay = 0;
                    deductions = 0;
                    calculatedGross = 0;
                    netSalary = 0;
                }

                // PRIVILEGE OVERRIDE: Record everything, but pay only the Base Base Salary
                if (isPrivileged) {
                    overtimePay = 0;
                    deductions = 0;
                    holidaySundayExtraPay = 0;
                    calculatedGross = baseSalary;
                    netSalary = baseSalary;
                    payableDays = totalDaysInMonth;
                }

                const payrollRecord = await Payroll.findOneAndUpdate(
                    { employee: employee._id, month, year },
                    {
                        employee: employee._id,
                        month,
                        year,
                        totalDays: totalDaysInMonth,
                        presentDays: attendanceSummary.present,
                        totalLateMinutes: attendanceSummary.totalLateMinutes,
                        totalExtraMinutes: attendanceSummary.totalExtraMinutes,
                        absentDays: attendanceSummary.absent,
                        holidays: attendanceSummary.holidaysCount,
                        salaryDetails: {
                            baseGross: baseSalary,
                            calculatedGross: calculatedGross,
                            overtimePay: overtimePay,
                            holidaySundayExtraPay: holidaySundayExtraPay,
                            deductions: deductions,
                            netSalary: netSalary
                        },
                        calculationLog: {
                            attendanceSummary,
                            shiftStartTime,
                            format: 'KK Traders',
                            dailyRate,
                            minuteRate
                        }
                    },
                    { upsert: true, new: true }
                );

                console.log(`[PAYROLL] Updated payroll for ${employee.employeeName} (Month: ${month}, Year: ${year})`);

                results.push({
                    employeeName: employee.employeeName,
                    employeeCode: employee.employeeCode,
                    payableDays,
                    netSalary,
                    payrollId: payrollRecord._id
                });
            }
        }
        return { results, missingEmployees: Array.from(missingEmployeesStr) };
    }

    static async processSingleEmployeeAttendance(filePath: string, employeeId: string, month: number, year: number) {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            throw new Error('Employee not found');
        }

        const monthStart = startOfMonth(new Date(year, month - 1));
        const monthEnd = endOfMonth(monthStart);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Fetch holidays for the month
        const holidays = await Holiday.find({
            date: { $gte: monthStart, $lte: monthEnd }
        });

        const attendanceSummary = {
            present: 0,
            absent: 0,
            late: 0,
            totalLateMinutes: 0,
            totalExtraMinutes: 0,
            holidaysCount: 0,
            deductionPay: 0,
            bonusPay: 0,
            dailyLogs: [] as any[]
        };

        // Standard shift start for calculation if not specified
        const baseDate = '2024-01-01 ';
        const shiftStart = parse(baseDate + (employee.employment?.workingShift?.split('-')[0] || '09:30'), 'yyyy-MM-dd HH:mm', new Date());

        // Find the row for this employee or use the first data row if it's a single-employee file
        // Looking at the provided image, row 3 (index 2) starts with data.
        // We'll search for the employee name in column B (index 1)
        let empRow: any[] | null = null;
        for (const row of data) {
            if (row[1] && row[1].toString().toLowerCase().includes(employee.employeeName.toLowerCase())) {
                empRow = row;
                break;
            }
        }

        // If not found by name, try looking for the first row that has a number in column A and something in B
        if (!empRow) {
            for (let i = 0; i < data.length; i++) {
                if (!isNaN(Number(data[i][0])) && data[i][1]) {
                    empRow = data[i];
                    break;
                }
            }
        }

        if (!empRow) {
            throw new Error('Could not identify employee data row in Excel');
        }

        // Fetch Payroll Settings
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

        const lateThresholdStr = settings.find(s => s.settingKey === 'payroll_late_threshold')?.settingValue || '09:40';
        const extraThresholdStr = settings.find(s => s.settingKey === 'payroll_extra_threshold')?.settingValue || '19:30';
        const standardInStr = settings.find(s => s.settingKey === 'payroll_standard_in')?.settingValue || '09:30';
        const standardOutStr = settings.find(s => s.settingKey === 'payroll_standard_out')?.settingValue || '19:30';
        const lateMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_late_minutes')?.settingValue || 30);
        const extraMinutesSetting = Number(settings.find(s => s.settingKey === 'payroll_extra_minutes')?.settingValue || 30);
        const lateAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_late_amount')?.settingValue || 0);
        const extraAmountSetting = Number(settings.find(s => s.settingKey === 'payroll_extra_amount')?.settingValue || 0);

        const lateThresholdMins = parse(baseDate + lateThresholdStr, 'yyyy-MM-dd H:mm', new Date()).getHours() * 60 +
            parse(baseDate + lateThresholdStr, 'yyyy-MM-dd H:mm', new Date()).getMinutes();
        const extraThresholdMins = parse(baseDate + extraThresholdStr, 'yyyy-MM-dd H:mm', new Date()).getHours() * 60 +
            parse(baseDate + extraThresholdStr, 'yyyy-MM-dd H:mm', new Date()).getMinutes();
        const standardInMins = parse(baseDate + standardInStr, 'yyyy-MM-dd H:mm', new Date()).getHours() * 60 +
            parse(baseDate + standardInStr, 'yyyy-MM-dd H:mm', new Date()).getMinutes();
        const standardOutMins = parse(baseDate + standardOutStr, 'yyyy-MM-dd H:mm', new Date()).getHours() * 60 +
            parse(baseDate + standardOutStr, 'yyyy-MM-dd H:mm', new Date()).getMinutes();

        // Base exit time for extra minutes calculation (usually 30 mins before threshold)
        const baseExitMins = extraThresholdMins - 30;

        let empLateThresholdMins = lateThresholdMins;
        let empExtraThresholdMins = extraThresholdMins;
        let empBaseExitMins = extraThresholdMins - 30;
        let empStandardInMins = standardInMins;
        let empStandardOutMins = standardOutMins;

        if (employee.employment?.inTime && employee.employment.inTime.includes(':')) {
            const empIn = parse(baseDate + employee.employment.inTime, 'yyyy-MM-dd HH:mm', new Date());
            empLateThresholdMins = empIn.getHours() * 60 + empIn.getMinutes();
            empStandardInMins = empLateThresholdMins;
        }
        if (employee.employment?.outTime && employee.employment.outTime.includes(':')) {
            const empOut = parse(baseDate + employee.employment.outTime, 'yyyy-MM-dd HH:mm', new Date());
            empExtraThresholdMins = empOut.getHours() * 60 + empOut.getMinutes();
            empBaseExitMins = empExtraThresholdMins - 30;
            empStandardOutMins = empExtraThresholdMins - 30;
        }

        for (let dayIdx = 0; dayIdx < daysInMonth.length; dayIdx++) {
            const currentDate = daysInMonth[dayIdx];
            // Based on image: Col A=Serial, B=Name, C=Day 1, D=Day 2...
            const colIdx = 2 + dayIdx;
            const val = empRow[colIdx];

            const holiday = holidays.find(h => isSameDay(new Date(h.date), currentDate));
            const isSun = isSunday(currentDate);

            let status: any = 'Absent';
            let inTime = '';
            let outTime = '';
            let lateMinutes = 0;
            let extraMinutes = 0;

            if (val) {
                const valStr = val.toString().trim().toLowerCase();
                if (valStr === 'holiday' || valStr === 'a' || valStr === 'na' || valStr === 'gh') {
                    if (valStr === 'holiday' || isSun || holiday) {
                        status = 'Holiday';
                        attendanceSummary.holidaysCount++;
                    } else {
                        status = 'Absent';
                    }
                } else {
                    // Assume it's time data like "09:46 21:00" or has a shift value like "0.5" or "1" above it
                    // The image shows times inside the cell
                    const times = val.toString().split(/[\r\n\s]+/);
                    if (times.length >= 1 && times[0].includes(':')) {
                        inTime = times[0];
                        outTime = times[1] || '';

                        try {
                            const employeeIn = parse(baseDate + inTime, 'yyyy-MM-dd HH:mm', new Date());
                            const employeeOut = outTime ? parse(baseDate + outTime, 'yyyy-MM-dd HH:mm', new Date()) : null;

                            const inMins = employeeIn.getHours() * 60 + employeeIn.getMinutes();
                            const outMins = employeeOut ? (employeeOut.getHours() * 60 + employeeOut.getMinutes()) : 0;

                            // Late Logic: Arrival
                            if (inMins > empLateThresholdMins) {
                                lateMinutes += lateMinutesSetting + Math.floor((inMins - (empLateThresholdMins + 1)) / lateMinutesSetting) * lateMinutesSetting;
                            }

                            // Late Logic: Early Departure
                            if (employeeOut && (employeeOut.getHours() * 60 + employeeOut.getMinutes()) < empStandardOutMins) {
                                const outM = employeeOut.getHours() * 60 + employeeOut.getMinutes(); const earlyOutMins = empStandardOutMins - outM;
                                lateMinutes += lateMinutesSetting + Math.floor((earlyOutMins - 1) / lateMinutesSetting) * lateMinutesSetting;
                            }

                            if (lateMinutes > 0) {
                                attendanceSummary.totalLateMinutes += lateMinutes;
                                attendanceSummary.late++;
                                status = 'Late';
                            } else {
                                status = 'Present';
                            }

                            // Extra Logic: Dynamic Threshold (Evening)
                            if (outMins >= empExtraThresholdMins) {
                                extraMinutes += Math.floor((outMins - empBaseExitMins) / extraMinutesSetting) * extraMinutesSetting;
                            }

                            // Morning Extra Logic: Support for Early Arrival
                            if (inMins < empStandardInMins) {
                                const earlyMins = empStandardInMins - inMins;
                                extraMinutes += Math.floor(earlyMins / extraMinutesSetting) * extraMinutesSetting;
                            }

                            attendanceSummary.totalExtraMinutes += extraMinutes;
                        } catch (e) {
                            status = 'Present';
                        }
                    } else if (!isNaN(Number(val))) {
                        status = 'Present';
                    } else {
                        status = 'Present';
                    }
                }
            } else if (holiday || isSun) {
                status = 'Holiday';
                attendanceSummary.holidaysCount++;
            }

            if (status === 'Present' || status === 'Late') attendanceSummary.present++;
            if (status === 'Absent' && !isSun && !holiday) attendanceSummary.absent++;

            attendanceSummary.dailyLogs.push({
                date: currentDate,
                inTime,
                outTime,
                status,
                lateMinutes,
                extraMinutes,
                isHolidayOrSunday: !!(holiday || isSun)
            });

            await Attendance.findOneAndUpdate(
                { employee: employee._id, date: currentDate },
                {
                    employee: employee._id,
                    date: currentDate,
                    inTime,
                    outTime,
                    status,
                    lateMinutes,
                    extraMinutes,
                    source: 'Individual Excel Upload'
                },
                { upsert: true }
            );
        }

        const totalDaysInMonth = daysInMonth.length;
        const baseSalary = employee.compensation?.grossSalary || 10000;

        // Divisor changed to 30 for daily rate to align with 225 monthly hours (30 * 7.5)
        const dailyRate = baseSalary / 30;
        const hourRate = baseSalary / 225;
        const minuteRate = hourRate / 60;

        // Categories & Privilege Level Logic
        const isSalary = employee.employment?.employmentType === 'Salary';
        const isPrivileged = employee.employment?.privilegeType === 'Privileged';

        let calculatedGross = 0;
        let deductions = 0;
        let holidaySundayExtraPay = 0;
        let payableDays = 0;

        if (isSalary && isPrivileged) {
            calculatedGross = baseSalary;
            payableDays = 30; // Full month representation
            // Deductions (late) are not applied to privileged employees
        } else if (isSalary && !isPrivileged) {
            // Paid for working days + holidays
            payableDays = attendanceSummary.present + attendanceSummary.holidaysCount;
            calculatedGross = Math.round(dailyRate * payableDays);
            deductions = Math.round(attendanceSummary.totalLateMinutes * minuteRate);
        } else {
            // Non-Salary: Paid only for working days
            payableDays = attendanceSummary.present;
            calculatedGross = Math.round(dailyRate * payableDays);
            deductions = Math.round(attendanceSummary.totalLateMinutes * minuteRate);
        }

        // Holiday / Sunday Work Logic (Double Salary)
        for (const log of attendanceSummary.dailyLogs) {
            if (log.isHolidayOrSunday && log.inTime && log.outTime) {
                try {
                    const [inH, inM] = log.inTime.split(':').map(Number);
                    const [outH, outM] = log.outTime.split(':').map(Number);
                    let inMins = inH * 60 + inM;
                    let outMins = outH * 60 + outM;
                    if (outMins < inMins) outMins += 1440; // Handle overnight

                    const workedMins = outMins - inMins;

                    if (workedMins >= 420) { // 7 hours threshold
                        holidaySundayExtraPay += Math.round(dailyRate);
                    } else {
                        holidaySundayExtraPay += Math.round(workedMins * minuteRate);
                    }
                } catch (e) {
                    console.error('Error calculating holiday work pay:', e);
                }
            }
        }

        let overtimePay = 0;
        if (extraAmountSetting > 0) {
            overtimePay = Math.round((attendanceSummary.totalExtraMinutes / extraMinutesSetting) * extraAmountSetting);
        } else {
            overtimePay = Math.round(attendanceSummary.totalExtraMinutes * minuteRate);
        }

        // Final Net Salary
        let netSalary = calculatedGross + overtimePay + holidaySundayExtraPay - deductions;

        const category = employee.employment?.category || 'Salary';
        if (category === 'Contract') {
            overtimePay = 0;
            holidaySundayExtraPay = 0;
            deductions = 0;
            calculatedGross = 0;
            netSalary = 0;
        }

        const payrollRecord = await Payroll.findOneAndUpdate(
            { employee: employee._id, month, year },
            {
                employee: employee._id,
                month,
                year,
                totalDays: totalDaysInMonth,
                presentDays: attendanceSummary.present,
                totalLateMinutes: attendanceSummary.totalLateMinutes,
                totalExtraMinutes: attendanceSummary.totalExtraMinutes,
                absentDays: attendanceSummary.absent,
                holidays: attendanceSummary.holidaysCount,
                salaryDetails: {
                    baseGross: baseSalary,
                    calculatedGross: calculatedGross,
                    overtimePay: overtimePay,
                    holidaySundayExtraPay: holidaySundayExtraPay,
                    deductions: deductions,
                    netSalary: netSalary
                },
                calculationLog: {
                    attendanceSummary,
                    uploadType: 'Individual',
                    dailyRate,
                    minuteRate
                }
            },
            { upsert: true, new: true }
        );

        return {
            employeeName: employee.employeeName,
            payableDays,
            netSalary,
            payrollId: payrollRecord._id
        };
    }
}

