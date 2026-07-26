import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISalesEnquiry extends Document {
    enquiryNumber: string;
    enquiryDate: Date;
    customerId: mongoose.Types.ObjectId;
    customerReference?: string;
    receivedThrough: string;
    items: {
        productId: mongoose.Types.ObjectId;
        productName: string;
        quantity: number;
        unit: string;
        specifications: {
            size?: string;
            color?: string;
            fabric?: string;
            gsm?: number;
            print?: string;
            year?: string;
        };
        requiredDate?: Date;
    }[];
    followUp: {
        date: Date;
        status: string;
        remarks?: string;
        nextFollowUp?: Date;
        handledBy?: mongoose.Types.ObjectId;
    }[];
    createdBy: mongoose.Types.ObjectId;
    status: 'Open' | 'Converted' | 'Closed';
    createdAt: Date;
    updatedAt: Date;
}

const SalesEnquirySchema: Schema = new Schema(
    {
        enquiryNumber: { type: String, required: true, unique: true },
        enquiryDate: { type: Date, default: Date.now },
        customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        customerReference: { type: String },
        receivedThrough: { type: String, enum: ['Phone', 'Email', 'Website', 'Reference', 'Walk-in', 'In-person'], default: 'Phone' },
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                productName: { type: String, required: true },
                quantity: { type: Number, required: true },
                unit: { type: String, default: 'Pieces' },
                specifications: {
                    size: String,
                    color: String,
                    fabric: String,
                    gsm: Number,
                    print: String,
                    year: String
                },
                requiredDate: { type: Date }
            }
        ],
        followUp: [
            {
                date: { type: Date, default: Date.now },
                status: { type: String, enum: ['Interested', 'Not Interested', 'Pending', 'Converted'], default: 'Pending' },
                remarks: { type: String },
                nextFollowUp: { type: Date },
                handledBy: { type: Schema.Types.ObjectId, ref: 'Employee' }
            }
        ],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['Open', 'Converted', 'Closed'], default: 'Open' }
    },
    { timestamps: true }
);

export default mongoose.model<ISalesEnquiry>('SalesEnquiry', SalesEnquirySchema);
