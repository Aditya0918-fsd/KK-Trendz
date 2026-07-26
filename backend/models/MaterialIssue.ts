import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialIssue extends Document {
    issueNumber: string;
    issueDate: Date;
    jwoId: mongoose.Types.ObjectId;
    deliveryChallanNo: string;
    vehicleNo?: string;
    driverName?: string;
    driverPhone?: string;
    items: {
        materialId: mongoose.Types.ObjectId;
        description: string;
        batchNumber: string;
        quantity: number;
        unit: string;
        rollNumbers?: string[];
        packageDetails?: {
            type: string;
            quantity: number;
            weight: number;
        }[];
        fromLocation: mongoose.Types.ObjectId;
        binNumber?: string;
    }[];
    receivedBy?: {
        name: string;
        date: Date;
        signature?: string;
    };
    issuedBy: mongoose.Types.ObjectId;
    status: 'Issued';
    createdAt: Date;
    updatedAt: Date;
}

const MaterialIssueSchema: Schema = new Schema(
    {
        issueNumber: { type: String, required: true, unique: true },
        issueDate: { type: Date, default: Date.now },
        jwoId: { type: Schema.Types.ObjectId, ref: 'JobWorkOrder', required: true },
        deliveryChallanNo: { type: String, required: true },
        vehicleNo: { type: String },
        driverName: { type: String },
        driverPhone: { type: String },
        items: [
            {
                materialId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                description: { type: String },
                batchNumber: { type: String },
                quantity: { type: Number, required: true },
                unit: { type: String, required: true },
                rollNumbers: [String],
                packageDetails: [
                    {
                        type: String,
                        quantity: Number,
                        weight: Number
                    }
                ],
                fromLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
                binNumber: String
            }
        ],
        receivedBy: {
            name: String,
            date: Date,
            signature: String
        },
        issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['Issued'], default: 'Issued' }
    },
    { timestamps: true }
);

export default mongoose.model<IMaterialIssue>('MaterialIssue', MaterialIssueSchema);
