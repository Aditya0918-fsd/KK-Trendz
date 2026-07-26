import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
    employee: mongoose.Types.ObjectId;
    month: number;
    year: number;
    totalDays: number;
    presentDays: number;
    totalLateMinutes: number;
    totalExtraMinutes: number;
    absentDays: number;
    paidLeaves: number;
    holidays: number;
    salaryDetails: {
        baseGross: number;
        calculatedGross: number;
        overtimePay: number;
        holidaySundayExtraPay: number;
        deductions: number;
        netSalary: number;
    };
    status: 'Draft' | 'Approved' | 'Paid';
    paymentDate: Date;
    calculationLog: any;
}

const PayrollSchema: Schema = new Schema(
    {
        employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        totalDays: { type: Number, default: 0 },
        presentDays: { type: Number, default: 0 },
        totalLateMinutes: { type: Number, default: 0 },
        totalExtraMinutes: { type: Number, default: 0 },
        absentDays: { type: Number, default: 0 },
        paidLeaves: { type: Number, default: 0 },
        holidays: { type: Number, default: 0 },
        salaryDetails: {
            baseGross: Number,
            calculatedGross: Number,
            overtimePay: { type: Number, default: 0 },
            holidaySundayExtraPay: { type: Number, default: 0 },
            deductions: { type: Number, default: 0 },
            netSalary: Number
        },
        status: { type: String, enum: ['Draft', 'Approved', 'Paid'], default: 'Draft' },
        paymentDate: Date,
        calculationLog: Schema.Types.Mixed
    },
    { timestamps: true }
);

PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
