import mongoose, { Schema, Document } from 'mongoose';

export interface IJobWorkReceipt extends Document {
    receiptNumber: string;
    receiptDate: Date;
    jwoId: mongoose.Types.ObjectId;
    issueId?: mongoose.Types.ObjectId;
    jobWorkerId: mongoose.Types.ObjectId;
    jobChallanNo: string;
    jobChallanDate: Date;
    vehicleNumber?: string;
    inputMaterialReturn?: {
        quantity: number;
        unit: string;
        reason: string;
    };
    outputMaterials: {
        materialId: mongoose.Types.ObjectId;
        description: string;
        processType: string;
        batchNumber: string;
        manufacturingDate?: Date;
        receivedQuantity: number;
        unit: string;
        acceptedQuantity: number;
        rejectedQuantity: number;
        rollDetails: {
            rollNumber: string;
            weight: number;
            length?: number;
            width?: number;
            gsm?: number;
            quality: string;
        }[];
        qualityCheck?: {
            checkedBy: mongoose.Types.ObjectId;
            checkDate: Date;
            parameters: {
                parameter: string;
                value: any;
                result: 'Pass' | 'Fail';
            }[];
            remarks?: string;
            status: 'Accepted' | 'Rejected';
        };
        storageLocation: mongoose.Types.ObjectId;
        binNumber?: string;
    }[];
    wastage: {
        quantity: number;
        unit: string;
        percentage: number;
        reason?: string;
        disposalMethod?: string;
    };
    jobCharges: {
        rateType: string;
        rate: number;
        quantity: number;
        amount: number;
        gst: number;
        total: number;
    };
    invoiceStatus: 'Pending' | 'Invoiced' | 'Paid';
    receivedBy: mongoose.Types.ObjectId;
    checkedBy?: mongoose.Types.ObjectId;
    status: 'Completed';
    createdAt: Date;
    updatedAt: Date;
}

const JobWorkReceiptSchema: Schema = new Schema(
    {
        receiptNumber: { type: String, required: true, unique: true },
        receiptDate: { type: Date, default: Date.now },
        jwoId: { type: Schema.Types.ObjectId, ref: 'JobWorkOrder', required: true },
        issueId: { type: Schema.Types.ObjectId, ref: 'MaterialIssue' },
        jobWorkerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        jobChallanNo: { type: String, required: true },
        jobChallanDate: { type: Date, required: true },
        vehicleNumber: { type: String },
        inputMaterialReturn: {
            quantity: { type: Number, default: 0 },
            unit: String,
            reason: String
        },
        outputMaterials: [
            {
                materialId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                description: { type: String },
                processType: String,
                batchNumber: { type: String },
                manufacturingDate: Date,
                receivedQuantity: { type: Number, required: true },
                unit: { type: String, required: true },
                acceptedQuantity: { type: Number, required: true },
                rejectedQuantity: { type: Number, default: 0 },
                rollDetails: [
                    {
                        rollNumber: String,
                        weight: Number,
                        length: Number,
                        width: Number,
                        gsm: Number,
                        quality: String
                    }
                ],
                qualityCheck: {
                    checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                    checkDate: Date,
                    parameters: [
                        {
                            parameter: String,
                            value: Schema.Types.Mixed,
                            result: { type: String, enum: ['Pass', 'Fail'] }
                        }
                    ],
                    remarks: String,
                    status: { type: String, enum: ['Accepted', 'Rejected'] }
                },
                storageLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
                binNumber: String
            }
        ],
        wastage: {
            quantity: { type: Number, default: 0 },
            unit: String,
            percentage: { type: Number, default: 0 },
            reason: String,
            disposalMethod: String
        },
        jobCharges: {
            rateType: String,
            rate: { type: Number, default: 0 },
            quantity: { type: Number, default: 0 },
            amount: { type: Number, default: 0 },
            gst: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        },
        invoiceStatus: { type: String, enum: ['Pending', 'Invoiced', 'Paid'], default: 'Pending' },
        receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Completed'], default: 'Completed' }
    },
    { timestamps: true }
);

export default mongoose.model<IJobWorkReceipt>('JobWorkReceipt', JobWorkReceiptSchema);
