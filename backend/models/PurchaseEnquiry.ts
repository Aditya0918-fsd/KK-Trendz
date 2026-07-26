import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseEnquiry extends Document {
    enquiryNumber: string;
    enquiryDate: Date;
    enquiryType: 'Yarn' | 'Fabric' | 'Accessories' | 'JobWork';
    requiredByDate: Date;
    priority: 'Normal' | 'High' | 'Emergency';
    items: {
        productId: mongoose.Types.ObjectId;
        productName: string;
        quantity: number;
        unit: string;
        requiredDate: Date;
        specifications?: {
            count?: string;
            ply?: string;
            brand?: string;
            [key: string]: any;
        };
    }[];
    suppliers: mongoose.Types.ObjectId[];
    supplierNotes?: Map<string, string>;
    status: 'Open' | 'Closed' | 'Cancelled' | 'Sent';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseEnquirySchema: Schema = new Schema(
    {
        enquiryNumber: { type: String, required: true, unique: true },
        enquiryDate: { type: Date, default: Date.now },
        enquiryType: { type: String, enum: ['Yarn', 'Fabric', 'Accessories', 'JobWork'], required: true },
        requiredByDate: { type: Date, required: true },
        priority: { type: String, enum: ['Normal', 'High', 'Emergency'], default: 'Normal' },
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                productName: { type: String, required: true },
                quantity: { type: Number, required: true },
                unit: { type: String, required: true },
                requiredDate: { type: Date, required: true },
                specifications: { type: Map, of: Schema.Types.Mixed },
            },
        ],
        suppliers: [{ type: Schema.Types.ObjectId, ref: 'Party' }],
        supplierNotes: { type: Map, of: String },
        status: { type: String, enum: ['Open', 'Closed', 'Cancelled', 'Sent'], default: 'Open' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IPurchaseEnquiry>('PurchaseEnquiry', PurchaseEnquirySchema);
