import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesInvoice extends Document {
    invoiceNumber: string;
    invoiceDate: Date;
    orderId: mongoose.Types.ObjectId;
    dispatchId: mongoose.Types.ObjectId;

    // Party Details
    customerId: mongoose.Types.ObjectId;
    billingAddress: any;
    shippingAddress: any;

    // Invoice Details
    invoiceType: string;
    placeOfSupply: string;
    reverseCharge: boolean;

    // Transport Details (8.1.7)
    transport: {
        transporterName: string;
        vehicleNumber: string;
        lrNumber: string;
        lrDate: Date;
        distance: number;
        eWayBillRequired: boolean;
        eWayBillNumber: string;
    };

    // Compliance (8.1.12-13)
    compliance: {
        irn: string;
        acknowledgementNo: string;
        acknowledgementDate: Date;
        signedQrCode: string;
    };

    // Items
    items: [{
        productId: mongoose.Types.ObjectId;
        description: string;
        hsnCode: string;
        quantity: number;
        unit: string;
        rate: number;
        discountPercentage: number;
        discountAmount: number;
        taxableValue: number;
        gstRate: number;
        gstAmount: number;
        totalValue: number;
    }];

    // Summary
    summary: {
        totalTaxable: number;
        totalCgst: number;
        totalSgst: number;
        totalIgst: number;
        totalGst: number;
        totalInvoiceValue: number;
        roundOff: number;
        grandTotal: number;
    };

    // Additional Charges
    additionalCharges: [{
        chargeType: string;
        amount: number;
        gstRate: number;
        gstAmount: number;
    }];

    // Payment
    payment: {
        paymentTerms: string;
        dueDate: Date;
        paymentStatus: string;
        payments: [{
            paymentDate: Date;
            amount: number;
            mode: string;
            referenceNo: string;
            remarks: string;
        }];
        balanceAmount: number;
        bankDetails: {
            bankName: string;
            accountNumber: string;
            ifscCode: string;
            branch: string;
        };
    };

    // System Fields
    createdBy: mongoose.Types.ObjectId;
    status: string;
}

const SalesInvoiceSchema: Schema = new Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder' },
    dispatchId: { type: Schema.Types.ObjectId, ref: 'Dispatch' },

    customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    billingAddress: Schema.Types.Mixed,
    shippingAddress: Schema.Types.Mixed,

    invoiceType: { type: String, enum: ['Tax Invoice', 'Export Invoice', 'Retail Invoice'], default: 'Tax Invoice' },
    placeOfSupply: String,
    reverseCharge: { type: Boolean, default: false },

    transport: {
        transporterName: String,
        vehicleNumber: String,
        lrNumber: String,
        lrDate: Date,
        distance: Number,
        eWayBillRequired: { type: Boolean, default: false },
        eWayBillNumber: String
    },

    compliance: {
        irn: String,
        acknowledgementNo: String,
        acknowledgementDate: Date,
        signedQrCode: String
    },

    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        description: String,
        hsnCode: String,
        quantity: Number,
        unit: String,
        rate: Number,
        discountPercentage: { type: Number, default: 0 },
        discountAmount: { type: Number, default: 0 },
        taxableValue: Number,
        gstRate: Number,
        gstAmount: Number,
        totalValue: Number
    }],

    summary: {
        totalTaxable: { type: Number, default: 0 },
        totalCgst: { type: Number, default: 0 },
        totalSgst: { type: Number, default: 0 },
        totalIgst: { type: Number, default: 0 },
        totalGst: { type: Number, default: 0 },
        totalInvoiceValue: { type: Number, default: 0 },
        roundOff: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 }
    },

    additionalCharges: [{
        chargeType: String,
        amount: Number,
        gstRate: Number,
        gstAmount: Number
    }],

    payment: {
        paymentTerms: String,
        dueDate: Date,
        paymentStatus: { type: String, enum: ['Pending', 'Partially Paid', 'Paid'], default: 'Pending' },
        payments: [{
            paymentDate: { type: Date, default: Date.now },
            amount: Number,
            mode: String,
            referenceNo: String,
            remarks: String
        }],
        balanceAmount: Number,
        bankDetails: {
            bankName: String,
            accountNumber: String,
            ifscCode: String,
            branch: String
        }
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['Generated', 'Sent', 'Paid', 'Cancelled'], default: 'Generated' }
}, {
    timestamps: true
});

export default mongoose.models.SalesInvoice || mongoose.model<ISalesInvoice>('SalesInvoice', SalesInvoiceSchema);
