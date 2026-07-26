import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesOrder extends Document {
    orderNumber: string;
    orderDate: Date;
    orderType: 'Export' | 'Domestic' | 'Sample';
    customerId: mongoose.Types.ObjectId;
    quotationId?: mongoose.Types.ObjectId;
    customerOrderNo?: string;
    customerOrderDate?: Date;
    priority: 'Normal' | 'High' | 'Emergency';
    deliveryDate: Date;
    incoterms?: string;
    paymentTerms?: string;
    shippingAddress: {
        address1?: string;
        city?: string;
        country?: string;
        zipCode?: string;
        contactPerson?: string;
        phone?: string;
    };
    items: {
        itemId: string;
        productId: mongoose.Types.ObjectId;
        productName: string;
        specifications: {
            size?: string;
            color?: string;
            fabric?: string;
            gsm?: number;
            style?: string;
            sleeve?: string;
            fit?: string;
        };
        orderQuantity: number;
        unit: string;
        rate: number;
        currency: string;
        exchangeRate: number;
        discountPercentage: number;
        discountAmount: number;
        taxableAmount: number;
        gstRate: number;
        gstAmount: number;
        totalAmount: number;
        sizeBreakup: { size: string; quantity: number }[];
        colorBreakup: { color: string; quantity: number }[];
        fabricRequirement: {
            consumptionPerPiece: number;
            totalFabricRequired: number;
            wastagePercentage: number;
            totalFabricWithWastage: number;
        };
        accessories: { type: string; quantity: number; unit: string }[];
        productionStatus: {
            fabricAllocated: number;
            cuttingCompleted: number;
            stitchingCompleted: number;
            finishingCompleted: number;
            packingCompleted: number;
            dispatched: number;
        };
    }[];
    summary: {
        totalQuantity: number;
        totalAmount: number;
        advanceAmount: number;
        balanceAmount: number;
        currency: string;
    };
    productionPlan: {
        process: string;
        plannedStartDate: Date;
        plannedEndDate: Date;
        quantity: number;
        status: string;
    }[];
    fabricSourcing: {
        productId: mongoose.Types.ObjectId;
        requiredQuantity: number;
        sourcingPlan: {
            receivedQuantity: number;
        }[];
    }[];
    attachments: { documentType: string; fileUrl: string }[];
    approval: {
        required: boolean;
        approvedBy?: mongoose.Types.ObjectId;
        approvedDate?: Date;
        remarks?: string;
    };
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    status: 'Draft' | 'Submitted' | 'Confirmed' | 'In Production' | 'Completed' | 'Delivered' | 'Cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const SalesOrderSchema: Schema = new Schema(
    {
        orderNumber: { type: String, required: true, unique: true },
        orderDate: { type: Date, default: Date.now },
        orderType: { type: String, enum: ['Export', 'Domestic', 'Sample'], default: 'Domestic' },
        customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        quotationId: { type: Schema.Types.ObjectId, ref: 'SalesQuotation' },
        customerOrderNo: { type: String },
        customerOrderDate: { type: Date },
        priority: { type: String, enum: ['Normal', 'High', 'Emergency'], default: 'Normal' },
        deliveryDate: { type: Date, required: true },
        incoterms: { type: String },
        paymentTerms: { type: String },
        shippingAddress: {
            address1: String,
            city: String,
            country: String,
            zipCode: String,
            contactPerson: String,
            phone: String
        },
        items: [
            {
                itemId: { type: String, required: true },
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                productName: { type: String, required: true },
                specifications: {
                    size: String,
                    color: String,
                    fabric: String,
                    gsm: Number,
                    style: String,
                    sleeve: String,
                    fit: String
                },
                orderQuantity: { type: Number, required: true },
                unit: { type: String, default: 'Pieces' },
                rate: { type: Number, required: true },
                currency: { type: String, default: 'INR' },
                exchangeRate: { type: Number, default: 1 },
                discountPercentage: { type: Number, default: 0 },
                discountAmount: { type: Number, default: 0 },
                taxableAmount: { type: Number, required: true },
                gstRate: { type: Number, default: 12 },
                gstAmount: { type: Number, required: true },
                totalAmount: { type: Number, required: true },
                sizeBreakup: [{ size: String, quantity: Number }],
                colorBreakup: [{ color: String, quantity: Number }],
                fabricRequirement: {
                    consumptionPerPiece: { type: Number, default: 0 },
                    totalFabricRequired: { type: Number, default: 0 },
                    wastagePercentage: { type: Number, default: 5 },
                    totalFabricWithWastage: { type: Number, default: 0 }
                },
                accessories: [{ type: { type: String }, quantity: Number, unit: String }],
                productionStatus: {
                    fabricAllocated: { type: Number, default: 0 },
                    cuttingCompleted: { type: Number, default: 0 },
                    stitchingCompleted: { type: Number, default: 0 },
                    finishingCompleted: { type: Number, default: 0 },
                    packingCompleted: { type: Number, default: 0 },
                    dispatched: { type: Number, default: 0 }
                }
            }
        ],
        summary: {
            totalQuantity: { type: Number, default: 0 },
            totalAmount: { type: Number, default: 0 },
            advanceAmount: { type: Number, default: 0 },
            balanceAmount: { type: Number, default: 0 },
            currency: { type: String, default: 'INR' }
        },
        productionPlan: [
            {
                process: { type: String },
                plannedStartDate: { type: Date },
                plannedEndDate: { type: Date },
                quantity: { type: Number },
                status: { type: String, default: 'Planned' }
            }
        ],
        fabricSourcing: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product' },
                requiredQuantity: Number,
                sourcingPlan: [{ receivedQuantity: Number }]
            }
        ],
        attachments: [{ documentType: String, fileUrl: String }],
        approval: {
            required: { type: Boolean, default: true },
            approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            approvedDate: { type: Date },
            remarks: { type: String }
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        status: {
            type: String,
            enum: ['Draft', 'Submitted', 'Confirmed', 'In Production', 'Completed', 'Delivered', 'Cancelled'],
            default: 'Draft'
        }
    },
    { timestamps: true }
);

export default mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);
