import mongoose, { Schema, Document } from 'mongoose';

export interface IProformaInvoice extends Document {
    proformaNumber: string;
    proformaDate: Date;
    validTill: Date;
    customerId: mongoose.Types.ObjectId;
    customerName: string;
    quotationId?: mongoose.Types.ObjectId;
    quotationNumber?: string;
    items: Array<{
        productId: mongoose.Types.ObjectId;
        description: string;
        quantity: number;
        unit: string;
        rate: number;
        amount: number;
    }>;
    totalAmount: number;
    termsAndConditions: string;
    status: 'Generated' | 'Accepted' | 'Converted' | 'Expired';
    convertedToInvoice?: mongoose.Types.ObjectId;
    convertedDate?: Date;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const ProformaInvoiceSchema: Schema = new Schema({
    proformaNumber: { type: String, required: true, unique: true },
    proformaDate: { type: Date, default: Date.now },
    validTill: { type: Date },
    customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    customerName: { type: String },
    quotationId: { type: Schema.Types.ObjectId, ref: 'SalesQuotation' },
    quotationNumber: { type: String },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        description: String,
        quantity: Number,
        unit: String,
        rate: Number,
        amount: Number
    }],
    totalAmount: { type: Number, default: 0 },
    termsAndConditions: { type: String, default: "This is a proforma invoice, not a tax invoice." },
    status: { type: String, enum: ['Generated', 'Accepted', 'Converted', 'Expired'], default: 'Generated' },
    convertedToInvoice: { type: Schema.Types.ObjectId, ref: 'SalesInvoice' },
    convertedDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.ProformaInvoice || mongoose.model<IProformaInvoice>('ProformaInvoice', ProformaInvoiceSchema);
