import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryTransaction extends Document {
    materialId: mongoose.Types.ObjectId;
    transactionType: 'Opening' | 'Receipt' | 'Issue' | 'Dispatch' | 'Adjustment' | 'JobWorkIssue' | 'JobWorkReturn';
    referenceId: mongoose.Types.ObjectId;
    referenceModel: string; // 'GRN' | 'MaterialIssue' | 'Dispatch' | 'JobWorkReceipt' etc.
    quantity: number;
    unit: string;
    locationId?: mongoose.Types.ObjectId; // Optional — not all transactions have a storage location
    batchNumber?: string;
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

const InventoryTransactionSchema: Schema = new Schema(
    {
        materialId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        transactionType: {
            type: String,
            enum: ['Opening', 'Receipt', 'Issue', 'Dispatch', 'Adjustment', 'JobWorkIssue', 'JobWorkReturn'],
            required: true
        },
        referenceId: { type: Schema.Types.ObjectId, required: true },
        referenceModel: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: false },
        batchNumber: { type: String },
        remarks: { type: String }
    },
    { timestamps: true }
);

// Compound index for common query patterns (inventory report, stock by product)
InventoryTransactionSchema.index({ materialId: 1, transactionType: 1, createdAt: -1 });
InventoryTransactionSchema.index({ referenceId: 1, referenceModel: 1 });

export default mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);
