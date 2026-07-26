import mongoose, { Schema, Document } from 'mongoose';

export interface IBOMItem {
    materialId: mongoose.Types.ObjectId;
    materialName?: string; // Optional field intended for caching the name from the product model
    quantityPerProduct: number;
    unit: string;
    wastagePercentage: number;
    consumptionDifferencesBySize?: {
        size: string;
        quantity: number;
    }[];
}

export interface IBOM extends Document {
    bomNumber: string;
    productId: mongoose.Types.ObjectId; // The Finished Good
    isActive: boolean;
    materials: IBOMItem[]; // Raw materials & accessories needed
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const BOMSchema: Schema = new Schema(
    {
        bomNumber: { type: String, required: true, unique: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        isActive: { type: Boolean, default: true },
        materials: [
            {
                materialId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                materialName: { type: String },
                quantityPerProduct: { type: Number, required: true },
                unit: { type: String, required: true },
                wastagePercentage: { type: Number, default: 0 },
                consumptionDifferencesBySize: [
                    {
                        size: { type: String, required: true },
                        quantity: { type: Number, required: true }
                    }
                ]
            }
        ],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

export default mongoose.model<IBOM>('BOM', BOMSchema);
