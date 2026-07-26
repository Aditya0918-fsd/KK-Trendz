import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPurchaseOrderItem extends Types.Subdocument {
    itemId: string;
    productId: mongoose.Types.ObjectId;
    productDescription: string;
    yarnSpecs?: {
        count: string;
        ply: string;
        blend: string;
        lotNumber: string;
        brand: string;
    };
    fabricSpecs?: {
        construction: string;
        gsm: number;
        width: number;
        color: string;
        shadeCode: string;
        finish: string;
    };
    jobWorkSpecs?: {
        processType: string;
        inputMaterialId: mongoose.Types.ObjectId;
        inputQuantity: number;
        outputQuantity: number;
        instructions: string;
        rateType: string;
        charges: number;
    };
    orderQuantity: number;
    unit: string;
    rate: number;
    discountPercentage: number;
    discountAmount: number;
    taxableAmount: number;
    gstRate: number;
    gstAmount: number;
    totalAmount: number;
    deliverySchedule: {
        scheduledDate: Date;
        quantity: number;
    }[];
    receivedQuantity: number;
    pendingQuantity: number;
    status: string;
}


export interface IPurchaseOrder extends Document {
    poNumber: string;
    poDate: Date;
    poType: 'Yarn' | 'Fabric' | 'Accessories' | 'JobWork';
    supplierId: mongoose.Types.ObjectId;
    supplierReference?: string;
    expectedDelivery: Date;
    deliveryTerms: string;
    paymentTerms: string;
    currency: string;
    exchangeRate: number;
    items: Types.DocumentArray<IPurchaseOrderItem>;
    financialSummary: {
        subtotal: number;
        discountTotal: number;
        taxableTotal: number;
        gstTotal: number;
        freightCharges: number;
        insuranceCharges: number;
        packingCharges: number;
        roundOff: number;
        grandTotal: number;
    };
    taxDetails: {
        placeOfSupply: string;
        reverseCharge: boolean;
        eWayBillRequired: boolean;
    };
    attachments: {
        documentType: string;
        fileUrl: string;
    }[];
    approval: {
        required: boolean;
        approvedBy?: mongoose.Types.ObjectId;
        approvedDate?: Date;
        remarks?: string;
    };
    status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Partially Received' | 'Completed' | 'Cancelled' | 'Rejected';
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseOrderSchema: Schema = new Schema(
    {
        poNumber: { type: String, required: true, unique: true },
        poDate: { type: Date, default: Date.now },
        poType: { type: String, enum: ['Yarn', 'Fabric', 'Accessories', 'JobWork'], required: true },
        supplierId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        supplierReference: { type: String },
        expectedDelivery: { type: Date, required: true },
        deliveryTerms: { type: String },
        paymentTerms: { type: String },
        currency: { type: String, default: 'INR' },
        exchangeRate: { type: Number, default: 1 },
        items: [
            {
                itemId: { type: String, required: true },
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                productDescription: { type: String, required: true },
                yarnSpecs: {
                    count: String,
                    ply: String,
                    blend: String,
                    lotNumber: String,
                    brand: String
                },
                fabricSpecs: {
                    construction: String,
                    gsm: Number,
                    width: Number,
                    color: String,
                    shadeCode: String,
                    finish: String
                },
                jobWorkSpecs: {
                    processType: String,
                    inputMaterialId: { type: Schema.Types.ObjectId, ref: 'Product' },
                    inputQuantity: Number,
                    outputQuantity: Number,
                    instructions: String,
                    rateType: String,
                    charges: Number
                },
                orderQuantity: { type: Number, required: true },
                unit: { type: String, required: true },
                rate: { type: Number, required: true },
                discountPercentage: { type: Number, default: 0 },
                discountAmount: { type: Number, default: 0 },
                taxableAmount: { type: Number, required: true },
                gstRate: { type: Number, required: true },
                gstAmount: { type: Number, required: true },
                totalAmount: { type: Number, required: true },
                deliverySchedule: [{
                    scheduledDate: Date,
                    quantity: Number
                }],
                receivedQuantity: { type: Number, default: 0 },
                pendingQuantity: { type: Number, required: true },
                status: { type: String, default: 'Pending' }
            }
        ],
        financialSummary: {
            subtotal: { type: Number, required: true },
            discountTotal: { type: Number, default: 0 },
            taxableTotal: { type: Number, required: true },
            gstTotal: { type: Number, required: true },
            freightCharges: { type: Number, default: 0 },
            insuranceCharges: { type: Number, default: 0 },
            packingCharges: { type: Number, default: 0 },
            roundOff: { type: Number, default: 0 },
            grandTotal: { type: Number, required: true }
        },
        taxDetails: {
            placeOfSupply: { type: String },
            reverseCharge: { type: Boolean, default: false },
            eWayBillRequired: { type: Boolean, default: false }
        },
        attachments: [{
            documentType: String,
            fileUrl: String
        }],
        approval: {
            required: { type: Boolean, default: true },
            approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            approvedDate: { type: Date },
            remarks: { type: String }
        },
        status: {
            type: String,
            enum: ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Partially Received', 'Completed', 'Cancelled', 'Rejected'],
            default: 'Draft'
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

export default mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
