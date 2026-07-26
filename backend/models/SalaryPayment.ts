import mongoose, { Schema, Document } from 'mongoose';

export interface ISalaryPayment extends Document {
    receiptNumber: string;
    employee: mongoose.Types.ObjectId;
    employeeName: string;
    employeeCode: string;
    month: number;
    year: number;
    paymentType: 'Salary' | 'Advance' | 'Adjustment';
    paymentMode: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
    amount: number;
    netSalaryDue: number;
    previousDue: number;
    advanceDeduction: number;
    remarks: string;
    paymentDate: Date;
    bankDetails?: {
        bankName?: string;
        transactionReference?: string;
        chequeNumber?: string;
        upiId?: string;
        upiScreenshotUrl?: string;
    };
    status: 'Pending' | 'Paid' | 'Partial';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SalaryPaymentSchema: Schema = new Schema(
    {
        receiptNumber: { type: String, required: true, unique: true },
        employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        employeeName: { type: String },
        employeeCode: { type: String },
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        paymentType: { type: String, enum: ['Salary', 'Advance', 'Adjustment'], default: 'Salary' },
        paymentMode: { type: String, enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'], default: 'Cash' },
        amount: { type: Number, required: true },
        netSalaryDue: { type: Number, default: 0 },
        previousDue: { type: Number, default: 0 },
        advanceDeduction: { type: Number, default: 0 },
        remarks: { type: String, default: '' },
        paymentDate: { type: Date, default: Date.now },
        bankDetails: {
            bankName: String,
            transactionReference: String,
            chequeNumber: String,
            upiId: String,
            upiScreenshotUrl: String,
        },
        status: { type: String, enum: ['Pending', 'Paid', 'Partial'], default: 'Paid' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.models.SalaryPayment ||
    mongoose.model<ISalaryPayment>('SalaryPayment', SalaryPaymentSchema);
