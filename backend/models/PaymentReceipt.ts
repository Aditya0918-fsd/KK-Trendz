import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentReceipt extends Document {
    receiptNumber: string;
    receiptDate: Date;
    partyId: mongoose.Types.ObjectId;
    partyType: 'Customer' | 'Supplier';
    partyName: string;
    paymentMode: 'Bank Transfer' | 'Cheque' | 'Cash' | 'UPI' | 'Credit Card';
    amount: number;
    receiptImage?: string;
    bankDetails: {
        bankName?: string;
        branchName?: string;
        transactionReference?: string;
        transactionDate?: Date;
        chequeNumber?: string;
        chequeDate?: Date;
        drawnOnBank?: string;
        upiId?: string;
        cardLastFour?: string;
        denominations?: Array<{ note: number, count: number }>;
    };
    againstInvoices: Array<{
        invoiceId: mongoose.Types.ObjectId;
        invoiceType: 'Sales' | 'Purchase';
        invoiceNumber: string;
        invoiceDate: Date;
        invoiceAmount: number;
        dueDate: Date;
        amountApplied: number;
        balanceAfter: number;
    }>;
    amountInWords: string;
    status: 'Pending' | 'Verified' | 'Reconciled' | 'Bounced';
    receivedBy: mongoose.Types.ObjectId;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
}

const PaymentReceiptSchema: Schema = new Schema({
    receiptNumber: { type: String, required: true, unique: true },
    receiptDate: { type: Date, default: Date.now },
    partyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    partyType: { type: String, enum: ['Customer', 'Supplier'], required: true },
    partyName: { type: String },
    paymentMode: { type: String, enum: ['Bank Transfer', 'Cheque', 'Cash', 'UPI', 'Credit Card'], required: true },
    amount: { type: Number, required: true },
    receiptImage: { type: String },
    bankDetails: {
        bankName: String,
        branchName: String,
        transactionReference: String,
        transactionDate: Date,
        chequeNumber: String,
        chequeDate: Date,
        drawnOnBank: String,
        upiId: String,
        cardLastFour: String,
        denominations: [{ note: Number, count: Number }]
    },
    againstInvoices: [{
        invoiceId: { type: Schema.Types.ObjectId, required: true },
        invoiceType: { type: String, enum: ['Sales', 'Purchase'], required: true },
        invoiceNumber: String,
        invoiceDate: Date,
        invoiceAmount: Number,
        dueDate: Date,
        amountApplied: Number,
        balanceAfter: Number
    }],
    amountInWords: { type: String },
    status: { type: String, enum: ['Pending', 'Verified', 'Reconciled', 'Bounced'], default: 'Pending' },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date }
}, { timestamps: true });

export default mongoose.models.PaymentReceipt || mongoose.model<IPaymentReceipt>('PaymentReceipt', PaymentReceiptSchema);
