import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseRequisition extends Document {
    requisitionNumber: string;
    requisitionDate: Date;
    generatedBy: 'Manual' | 'System_Shortage' | 'System_Reorder';
    referenceSalesOrderId?: mongoose.Types.ObjectId;
    requiredDeliveryDate: Date;
    items: {
        materialId: mongoose.Types.ObjectId;
        materialName: string;
        requiredQuantity: number;
        availableStock: number;
        shortageQuantity: number;
        unit: string;
    }[];
    status: 'Pending Approval' | 'Approved' | 'Rejected' | 'PO_Created';
    approvedBy?: mongoose.Types.ObjectId;
    remarks?: string;
    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseRequisitionSchema: Schema = new Schema(
    {
        requisitionNumber: { type: String, required: true, unique: true },
        requisitionDate: { type: Date, default: Date.now },
        generatedBy: { type: String, enum: ['Manual', 'System_Shortage', 'System_Reorder'], default: 'Manual' },
        referenceSalesOrderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder' },
        requiredDeliveryDate: { type: Date, required: true },
        items: [
            {
                materialId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                materialName: { type: String },
                requiredQuantity: { type: Number, required: true },
                availableStock: { type: Number, required: true },
                shortageQuantity: { type: Number, required: true },
                unit: { type: String, required: true }
            }
        ],
        status: {
            type: String,
            enum: ['Pending Approval', 'Approved', 'Rejected', 'PO_Created'],
            default: 'Pending Approval'
        },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        remarks: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

export default mongoose.model<IPurchaseRequisition>('PurchaseRequisition', PurchaseRequisitionSchema);
