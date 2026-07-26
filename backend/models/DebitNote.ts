import mongoose, { Schema, Document } from 'mongoose';

export interface IDebitNote extends Document {
    debitNoteNumber: string;
    debitNoteType: 'Purchase Return' | 'Shortage' | 'Price Difference';
    debitNoteDate: Date;
    referenceInvoiceId: mongoose.Types.ObjectId;
    referenceInvoiceNo: string;
    referenceInvoiceDate: Date;
    supplierId: mongoose.Types.ObjectId;
    supplierName: string;
    supplierGSTIN: string;
    reason: string;
    items: Array<{
        productId: mongoose.Types.ObjectId;
        productName: string;
        originalQuantity: number;
        returnedQuantity: number;
        unit: string;
        rate: number;
        taxableValue: number;
        taxRate: number;
        cgstAmount: number;
        sgstAmount: number;
        totalTax: number;
        totalAmount: number;
    }>;
    summary: {
        totalDebitNoteValue: number;
    };
    audit: {
        createdBy: mongoose.Types.ObjectId;
        createdAt: Date;
    };
    status: 'Generated' | 'Sent' | 'Adjusted' | 'Cancelled';
}

const DebitNoteSchema: Schema = new Schema({
    debitNoteNumber: { type: String, required: true, unique: true },
    debitNoteType: { type: String, enum: ['Purchase Return', 'Shortage', 'Price Difference'], required: true },
    debitNoteDate: { type: Date, default: Date.now },
    referenceInvoiceId: { type: Schema.Types.ObjectId, ref: 'PurchaseInvoice', required: true },
    referenceInvoiceNo: { type: String, required: true },
    referenceInvoiceDate: { type: Date },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    supplierName: { type: String },
    supplierGSTIN: { type: String },
    reason: { type: String },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        originalQuantity: Number,
        returnedQuantity: Number,
        unit: String,
        rate: Number,
        taxableValue: Number,
        taxRate: Number,
        cgstAmount: Number,
        sgstAmount: Number,
        totalTax: Number,
        totalAmount: Number
    }],
    summary: {
        totalDebitNoteValue: { type: Number, default: 0 }
    },
    audit: {
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    },
    status: { type: String, enum: ['Generated', 'Sent', 'Adjusted', 'Cancelled'], default: 'Generated' }
}, { timestamps: true });

export default mongoose.models.DebitNote || mongoose.model<IDebitNote>('DebitNote', DebitNoteSchema);
