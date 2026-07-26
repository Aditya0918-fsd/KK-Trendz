import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseInvoice extends Document {
    invoiceNumber: string;
    invoiceDate: Date;
    poId?: mongoose.Types.ObjectId;
    grnId?: mongoose.Types.ObjectId;
    supplierId: mongoose.Types.ObjectId;
    supplierInvoiceNo: string;
    supplierInvoiceDate: Date;
    items: {
        productId: mongoose.Types.ObjectId;
        description: string;
        quantity: number;
        unit: string;
        rate: number;
        discount: number;
        taxableAmount: number;
        gstRate: number;
        gstAmount: number;
        totalAmount: number;
    }[];
    summary: {
        taxableAmount: number;
        gstAmount: number;
        freight: number;
        insurance: number;
        handlingCharges: number;
        tds: number;
        tdsApplicable: boolean;
        reverseCharge: boolean;
        placeOfSupply: string;
        netPayable: number;
        paidAmount: number;
    };
    payment: {
        dueDate: Date;
        paymentStatus: 'Pending' | 'Partially Paid' | 'Paid';
        payments: {
            paymentDate: Date;
            amount: number;
            mode: 'Bank Transfer' | 'Cheque' | 'Cash';
            referenceNo?: string;
            remarks?: string;
            receiptImage?: string;
        }[];
    };
    status: 'Verified' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    grnImage?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseInvoiceSchema: Schema = new Schema<IPurchaseInvoice>(
    {
        invoiceNumber: { type: String, required: true, unique: true },
        invoiceDate: { type: Date, default: Date.now },
        poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
        grnId: { type: Schema.Types.ObjectId, ref: 'GRN' },
        supplierId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        supplierInvoiceNo: { type: String, required: true },
        supplierInvoiceDate: { type: Date, required: true },
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                description: { type: String, required: true },
                quantity: { type: Number, required: true },
                unit: { type: String, required: true },
                rate: { type: Number, required: true },
                discount: { type: Number, default: 0 },
                taxableAmount: { type: Number, required: true },
                gstRate: { type: Number, required: true },
                gstAmount: { type: Number, required: true },
                totalAmount: { type: Number, required: true }
            }
        ],
        summary: {
            taxableAmount: { type: Number, required: true },
            gstAmount: { type: Number, required: true },
            freight: { type: Number, default: 0 },
            insurance: { type: Number, default: 0 },
            handlingCharges: { type: Number, default: 0 },
            tds: { type: Number, default: 0 },
            tdsApplicable: { type: Boolean, default: false },
            reverseCharge: { type: Boolean, default: false },
            placeOfSupply: String,
            netPayable: { type: Number, required: true },
            paidAmount: { type: Number, default: 0 }
        },
        payment: {
            dueDate: { type: Date },
            paymentStatus: {
                type: String,
                enum: ['Pending', 'Partially Paid', 'Paid'],
                default: 'Pending'
            },
            payments: [{
                paymentDate: { type: Date },
                amount: { type: Number },
                mode: { type: String, enum: ['Bank Transfer', 'Cheque', 'Cash'] },
                referenceNo: String,
                remarks: String,
                receiptImage: String
            }]
        },
        status: { type: String, enum: ['Verified', 'Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
        grnImage: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

export default mongoose.models.PurchaseInvoice || mongoose.model<IPurchaseInvoice>('PurchaseInvoice', PurchaseInvoiceSchema);
