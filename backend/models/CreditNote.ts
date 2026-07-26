import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditNote extends Document {
    creditNoteNumber: string;
    creditNoteType: 'Sales Return' | 'Discount' | 'Price Difference';
    creditNoteDate: Date;
    referenceInvoiceId: mongoose.Types.ObjectId;
    referenceInvoiceNo: string;
    referenceInvoiceDate: Date;
    customerId: mongoose.Types.ObjectId;
    customerName: string;
    customerGSTIN: string;
    reason: string;
    returnType: 'Full' | 'Partial';
    items: Array<{
        itemId: string;
        productId: mongoose.Types.ObjectId;
        productName: string;
        specifications: any;
        originalQuantity: number;
        returnedQuantity: number;
        unit: string;
        rate: number;
        discount: number;
        taxableValue: number;
        taxRate: number;
        cgstAmount: number;
        sgstAmount: number;
        totalTax: number;
        totalAmount: number;
        returnCondition: string;
        returnRemarks: string;
        accepted: boolean;
    }>;
    summary: {
        totalTaxableValue: number;
        totalTax: number;
        totalCreditNoteValue: number;
        adjustmentType: 'Refund' | 'Adjust in Next Bill';
    };
    stockUpdate?: {
        productId: mongoose.Types.ObjectId;
        quantity: number;
        location: mongoose.Types.ObjectId;
        condition: string;
        remarks: string;
    };
    audit: {
        createdBy: mongoose.Types.ObjectId;
        createdAt: Date;
        approvedBy?: mongoose.Types.ObjectId;
        approvedAt?: Date;
    };
    status: 'Generated' | 'Approved' | 'Applied' | 'Cancelled';
}

const CreditNoteSchema: Schema = new Schema({
    creditNoteNumber: { type: String, required: true, unique: true },
    creditNoteType: { type: String, enum: ['Sales Return', 'Discount', 'Price Difference'], required: true },
    creditNoteDate: { type: Date, default: Date.now },
    referenceInvoiceId: { type: Schema.Types.ObjectId, ref: 'SalesInvoice', required: true },
    referenceInvoiceNo: { type: String, required: true },
    referenceInvoiceDate: { type: Date },
    customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    customerName: { type: String },
    customerGSTIN: { type: String },
    reason: { type: String },
    returnType: { type: String, enum: ['Full', 'Partial'] },
    items: [{
        itemId: String,
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        specifications: Schema.Types.Mixed,
        originalQuantity: Number,
        returnedQuantity: Number,
        unit: String,
        rate: Number,
        discount: Number,
        taxableValue: Number,
        taxRate: Number,
        cgstAmount: Number,
        sgstAmount: Number,
        totalTax: Number,
        totalAmount: Number,
        returnCondition: String,
        returnRemarks: String,
        accepted: { type: Boolean, default: true }
    }],
    summary: {
        totalTaxableValue: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 },
        totalCreditNoteValue: { type: Number, default: 0 },
        adjustmentType: { type: String, enum: ['Refund', 'Adjust in Next Bill'] }
    },
    stockUpdate: {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        location: { type: Schema.Types.ObjectId, ref: 'Location' },
        condition: String,
        remarks: String
    },
    audit: {
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        approvedAt: Date
    },
    status: { type: String, enum: ['Generated', 'Approved', 'Applied', 'Cancelled'], default: 'Generated' }
}, { timestamps: true });

export default mongoose.models.CreditNote || mongoose.model<ICreditNote>('CreditNote', CreditNoteSchema);
