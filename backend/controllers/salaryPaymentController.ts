import { Request, Response } from 'express';
import SalaryPayment from '../models/SalaryPayment';
import Payroll from '../models/Payroll';
import Employee from '../models/Employee';

// Auto-generate receipt number: SP-YYYYMM-XXXX
const generateReceiptNumber = async (): Promise<string> => {
    const now = new Date();
    const prefix = `SP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
    const last = await SalaryPayment.findOne({ receiptNumber: { $regex: `^${prefix}` } })
        .sort({ receiptNumber: -1 })
        .lean();
    let seq = 1;
    if (last) {
        const parts = (last as any).receiptNumber.split('-');
        seq = parseInt(parts[parts.length - 1] || '0') + 1;
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
};

// GET /payroll/salary-payments?month=&year=&employeeId=
export const getSalaryPayments = async (req: Request, res: Response) => {
    try {
        const { month, year, employeeId } = req.query;
        const query: any = {};
        if (month) query.month = Number(month);
        if (year) query.year = Number(year);
        if (employeeId) query.employee = employeeId;

        const payments = await SalaryPayment.find(query)
            .populate('employee', 'employeeName employeeCode compensation employment')
            .sort({ paymentDate: -1, createdAt: -1 });

        res.json(payments);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /payroll/salary-balance/:employeeId?month=&year=
export const getSalaryBalance = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const { month, year } = req.query;

        const payroll = await Payroll.findOne({
            employee: employeeId,
            month: Number(month),
            year: Number(year),
        });

        // Sum all advances given (not this month's salary payments)
        const allPayments = await SalaryPayment.find({ employee: employeeId });
        const totalAdvances = allPayments
            .filter((p) => p.paymentType === 'Advance')
            .reduce((sum, p) => sum + p.amount, 0);
        const totalSalaryPaid = allPayments
            .filter(
                (p) =>
                    p.paymentType === 'Salary' &&
                    p.month === Number(month) &&
                    p.year === Number(year)
            )
            .reduce((sum, p) => sum + p.amount, 0);

        const netSalary = payroll?.salaryDetails?.netSalary ?? 0;
        const outstandingDue = Math.max(0, netSalary - totalSalaryPaid);

        res.json({
            netSalary,
            totalSalaryPaid,
            totalAdvances,
            outstandingDue,
            payrollStatus: payroll?.status ?? 'Draft',
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// POST /payroll/salary-payments
export const createSalaryPayment = async (req: Request, res: Response) => {
    try {
        const {
            employee,
            month,
            year,
            paymentType,
            paymentMode,
            amount,
            netSalaryDue,
            previousDue,
            advanceDeduction,
            remarks,
            paymentDate,
            bankDetails,
        } = req.body;

        if (!employee || !amount || !month || !year) {
            return res
                .status(400)
                .json({ message: 'Employee, amount, month and year are required' });
        }

        // Fetch employee details for denormalisation
        const emp = await Employee.findById(employee).lean();
        if (!emp) return res.status(404).json({ message: 'Employee not found' });

        const receiptNumber = await generateReceiptNumber();

        const payment = new SalaryPayment({
            receiptNumber,
            employee,
            employeeName: (emp as any).employeeName,
            employeeCode: (emp as any).employeeCode,
            month: Number(month),
            year: Number(year),
            paymentType: paymentType || 'Salary',
            paymentMode: paymentMode || 'Cash',
            amount: Number(amount),
            netSalaryDue: Number(netSalaryDue ?? 0),
            previousDue: Number(previousDue ?? 0),
            advanceDeduction: Number(advanceDeduction ?? 0),
            remarks: remarks || '',
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            bankDetails: bankDetails || {},
            status: 'Paid',
            createdBy: (req as any).user?._id,
        });

        await payment.save();
        res.status(201).json(payment);
    } catch (error: any) {
        console.error('Create SalaryPayment error:', error);
        res.status(500).json({ message: error.message });
    }
};

// DELETE /payroll/salary-payments/:id
export const deleteSalaryPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await SalaryPayment.findByIdAndDelete(id);
        res.json({ message: 'Payment deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /payroll/employee-ledger/:employeeId
export const getEmployeeLedger = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        // 1. Fetch all Payroll records
        const payrolls = await Payroll.find({ employee: employeeId }).sort({ year: 1, month: 1 });

        // 2. Fetch all SalaryPayment records
        const payments = await SalaryPayment.find({ employee: employeeId }).sort({ paymentDate: 1 });

        const ledger: any[] = [];

        // Add payroll entries (Credit: Employee earns)
        payrolls.forEach(p => {
            ledger.push({
                date: new Date(p.year, p.month, 0), // Last day of that month
                type: 'Salary',
                description: `Salary Accrued - ${new Date(0, p.month - 1).toLocaleString('default', { month: 'long' })} ${p.year}`,
                debit: 0,
                credit: p.salaryDetails?.netSalary || 0,
                referenceId: p._id,
                status: p.status
            });
        });

        // Add payment entries (Debit: Employee receives)
        payments.forEach(p => {
            ledger.push({
                date: p.paymentDate,
                type: p.paymentType,
                description: `${p.paymentType} Receipt: ${p.receiptNumber} (${p.paymentMode})`,
                debit: p.amount,
                credit: 0,
                referenceId: p._id,
                status: 'Paid',
                paymentMode: p.paymentMode,
                screenshotUrl: (p.bankDetails as any)?.upiScreenshotUrl || ''
            });
        });

        // Sort by date then type (Payroll before payments if same day)
        ledger.sort((a, b) => {
            const dateDiff = a.date.getTime() - b.date.getTime();
            if (dateDiff !== 0) return dateDiff;
            return a.credit > b.credit ? -1 : 1; // Credit (Salary Accrued) first
        });

        // Calculate running balance (Credit - Debit)
        let balance = 0;
        const finalLedger = ledger.map(entry => {
            balance += (entry.credit - entry.debit);
            return { ...entry, balance };
        });

        res.json(finalLedger);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// POST /payroll/upload-salary-screenshot
export const uploadSalaryScreenshot = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        res.json({ url: (req.file as any).path });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /payroll/balances
export const getAllBalances = async (req: Request, res: Response) => {
    try {
        const payrolls = await Payroll.find();
        const payments = await SalaryPayment.find();
        const balances: Record<string, number> = {};

        payrolls.forEach(p => {
            const empId = String(p.employee);
            balances[empId] = (balances[empId] || 0) + (p.salaryDetails?.netSalary || 0);
        });

        payments.forEach(p => {
            const empId = String(p.employee);
            balances[empId] = (balances[empId] || 0) - (p.amount || 0);
        });

        res.json(balances);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
