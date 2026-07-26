import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISalesQuotation extends Document {
    quotationNumber: string;
    quotationDate: Date;
    enquiryId?: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    validTill: Date;
    deliveryTerms?: string;
    paymentTerms?: string;
    items: {
        productId: mongoose.Types.ObjectId;
        description: string;
        specifications: {
            size?: string;
            color?: string;
            fabric?: string;
            width?: string;
            style?: string;
            packing?: string;
        };
        quantity: number;
        unit: string;
        rate: number;
        discountPercentage: number;
        discountAmount: number;
        taxableAmount: number;
        gstRate: number;
        gstAmount: number;
        totalAmount: number;
        deliveryDate?: Date;
    }[];
    summary: {
        totalTaxable: number;
        totalGst: number;
        totalAmount: number;
        freightCharges: number;
        insuranceCharges: number;
        packingCharges: number;
        netAmount: number;
    };
    termsAndConditions?: string;
    createdBy: mongoose.Types.ObjectId;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Revised' | 'Converted';
    createdAt: Date;
    updatedAt: Date;
}

const SalesQuotationSchema: Schema = new Schema(
    {
        quotationNumber: { type: String, required: true, unique: true },
        quotationDate: { type: Date, default: Date.now },
        enquiryId: { type: Schema.Types.ObjectId, ref: 'SalesEnquiry' },
        customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        validTill: { type: Date, required: true },
        deliveryTerms: { type: String },
        paymentTerms: { type: String },
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                description: { type: String, required: true },
                specifications: {
                    size: String,
                    color: String,
                    fabric: String,
                    width: String,
                    style: String,
                    packing: String
                },
                quantity: { type: Number, required: true },
                unit: { type: String, default: 'Pieces' },
                rate: { type: Number, required: true },
                discountPercentage: { type: Number, default: 0 },
                discountAmount: { type: Number, default: 0 },
                taxableAmount: { type: Number, required: true },
                gstRate: { type: Number, default: 12 },
                gstAmount: { type: Number, required: true },
                totalAmount: { type: Number, required: true },
                deliveryDate: { type: Date }
            }
        ],
        summary: {
            totalTaxable: { type: Number, default: 0 },
            totalGst: { type: Number, default: 0 },
            totalAmount: { type: Number, default: 0 },
            freightCharges: { type: Number, default: 0 },
            insuranceCharges: { type: Number, default: 0 },
            packingCharges: { type: Number, default: 0 },
            netAmount: { type: Number, default: 0 }
        },
        termsAndConditions: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Revised', 'Converted'], default: 'Draft' }
    },
    { timestamps: true }
);

export default mongoose.model<ISalesQuotation>('SalesQuotation', SalesQuotationSchema);
