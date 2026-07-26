import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseQuotation extends Document {
    quotationNumber: string;
    quotationDate: Date;
    enquiryId?: mongoose.Types.ObjectId;
    supplierId: mongoose.Types.ObjectId;
    validTill: Date;
    deliveryTerms: string;
    paymentTerms: string;
    items: {
        productId: mongoose.Types.ObjectId;
        productName: string;
        quantity: number;
        unit: string;
        rate: number;
        discountPercentage: number;
        discountAmount: number;
        taxableAmount: number;
        gstRate: number;
        gstAmount: number;
        totalAmount: number;
        deliveryDate: Date;
        minOrderQuantity: number;
    }[];
    summary: {
        totalTaxable: number;
        totalGst: number;
        totalAmount: number;
        freightCharges: number;
        insuranceCharges: number;
        netAmount: number;
    };
    termsAndConditions: string;
    status: 'Pending' | 'Accepted' | 'Rejected';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseQuotationSchema: Schema = new Schema(
    {
        quotationNumber: { type: String, required: true, unique: true },
        quotationDate: { type: Date, default: Date.now },
        enquiryId: { type: Schema.Types.ObjectId, ref: 'PurchaseEnquiry' },
        supplierId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        validTill: { type: Date, required: true },
        deliveryTerms: { type: String },
        paymentTerms: { type: String },
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                productName: { type: String, required: true },
                quantity: { type: Number, required: true },
                unit: { type: String, required: true },
                rate: { type: Number, required: true },
                discountPercentage: { type: Number, default: 0 },
                discountAmount: { type: Number, default: 0 },
                taxableAmount: { type: Number, required: true },
                gstRate: { type: Number, required: true },
                gstAmount: { type: Number, required: true },
                totalAmount: { type: Number, required: true },
                deliveryDate: { type: Date },
                minOrderQuantity: { type: Number, default: 1 },
            },
        ],
        summary: {
            totalTaxable: { type: Number, required: true },
            totalGst: { type: Number, required: true },
            totalAmount: { type: Number, required: true },
            freightCharges: { type: Number, default: 0 },
            insuranceCharges: { type: Number, default: 0 },
            netAmount: { type: Number, required: true },
        },
        termsAndConditions: { type: String },
        status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IPurchaseQuotation>('PurchaseQuotation', PurchaseQuotationSchema);
