import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderAllocation extends Document {
    allocationNumber: string;
    allocationDate: Date;
    orderId: mongoose.Types.ObjectId;
    fabricAllocation: {
        productId: mongoose.Types.ObjectId;
        fabricType: string;
        requiredQuantity: number;
        allocatedFrom: {
            sourceType: string;
            sourceId: mongoose.Types.ObjectId;
            batchNumber?: string;
            rollNumbers?: string[];
            quantity: number;
            unit: string;
            allocatedQuantity: number;
            remainingQuantity: number;
            location?: mongoose.Types.ObjectId;
        }[];
    }[];
    accessoriesAllocation: {
        accessoryType: string;
        requiredQuantity: number;
        allocatedFrom: {
            sourceId: mongoose.Types.ObjectId;
            batchNumber?: string;
            quantity: number;
            allocatedQuantity: number;
            location?: mongoose.Types.ObjectId;
        }[];
    }[];
    createdBy: mongoose.Types.ObjectId;
    status: 'Draft' | 'Completed';
    createdAt: Date;
    updatedAt: Date;
}

const OrderAllocationSchema: Schema = new Schema(
    {
        allocationNumber: { type: String, required: true, unique: true },
        allocationDate: { type: Date, default: Date.now },
        orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
        fabricAllocation: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                fabricType: { type: String },
                requiredQuantity: { type: Number, required: true },
                allocatedFrom: [
                    {
                        sourceType: { type: String, default: 'Purchase' },
                        sourceId: { type: String },
                        batchNumber: { type: String },
                        rollNumbers: [{ type: String }],
                        quantity: { type: Number },
                        unit: { type: String, default: 'Kgs' },
                        allocatedQuantity: { type: Number },
                        remainingQuantity: { type: Number },
                        location: { type: String }
                    }
                ]
            }
        ],
        accessoriesAllocation: [
            {
                accessoryType: { type: String, required: true },
                requiredQuantity: { type: Number, required: true },
                allocatedFrom: [
                    {
                        sourceId: { type: String },
                        batchNumber: { type: String },
                        quantity: { type: Number },
                        allocatedQuantity: { type: Number },
                        location: { type: String }
                    }
                ]
            }
        ],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['Draft', 'Completed'], default: 'Draft' }
    },
    { timestamps: true }
);

export default mongoose.model<IOrderAllocation>('OrderAllocation', OrderAllocationSchema);
