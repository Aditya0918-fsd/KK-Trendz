import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobWorkMaterial extends Types.Subdocument {
    materialId: mongoose.Types.ObjectId;
    batchNumber: string;
    quantity: number;
    unit: string;
    issuedFrom?: mongoose.Types.ObjectId;
    issuedDate?: Date;
    issuedBy?: mongoose.Types.ObjectId;
    challanNo?: string;
}

export interface IJobWorkOrder extends Document {
    jwoNumber: string;
    jwoDate: Date;
    jobWorkerId: mongoose.Types.ObjectId;
    processType: 'Knitting' | 'Dyeing' | 'Printing' | 'Embroidery' | 'Compact';
    sourceType: 'Purchase Order' | 'Sales Order' | 'Internal Transfer' | 'Direct';
    sourceId?: mongoose.Types.ObjectId;
    inputMaterials: Types.DocumentArray<IJobWorkMaterial>;
    processInstructions: {
        knitting?: {
            construction: string;
            gsm: number;
            width: number;
            machineGauge: string;
            quality: string;
        };
        dyeing?: {
            color: string;
            shadeCode: string;
            dyeType: string;
            fastness: string;
            recipe: string;
        };
        compact?: {
            processes: string;
            temperature: string;
            overfeed: string;
        };
    };
    expectedOutput: {
        quantity: number;
        unit: string;
        wastage: number;
        wastagePercentage: number;
        deliveryDate: Date;
    };
    charges: {
        rateType: string;
        rate: number;
        quantity: number;
        amount: number;
        gst: number;
        total: number;
    };
    createdBy: mongoose.Types.ObjectId;
    status: 'Created' | 'Approved' | 'Issued' | 'In-Process' | 'Completed' | 'Received';
    createdAt: Date;
    updatedAt: Date;
}

const JobWorkOrderSchema: Schema = new Schema(
    {
        jwoNumber: { type: String, required: true, unique: true },
        jwoDate: { type: Date, default: Date.now },
        jobWorkerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        processType: { type: String, enum: ['Knitting', 'Dyeing', 'Printing', 'Embroidery', 'Compact'], required: true },
        sourceType: { type: String, enum: ['Purchase Order', 'Sales Order', 'Internal Transfer', 'Direct'], required: true },
        sourceId: { type: Schema.Types.ObjectId },
        inputMaterials: [
            {
                materialId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                batchNumber: { type: String },
                quantity: { type: Number, required: true },
                unit: { type: String, required: true },
                issuedFrom: { type: Schema.Types.ObjectId, ref: 'Location' },
                issuedDate: { type: Date },
                issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                challanNo: { type: String }
            }
        ],
        processInstructions: {
            knitting: {
                construction: String,
                gsm: Number,
                width: Number,
                machineGauge: String,
                quality: String
            },
            dyeing: {
                color: String,
                shadeCode: String,
                dyeType: String,
                fastness: String,
                recipe: String
            },
            compact: {
                processes: String,
                temperature: String,
                overfeed: String
            }
        },
        expectedOutput: {
            quantity: { type: Number, required: true },
            unit: { type: String, required: true },
            wastage: { type: Number, default: 0 },
            wastagePercentage: { type: Number, default: 0 },
            deliveryDate: { type: Date }
        },
        charges: {
            rateType: String,
            rate: { type: Number, default: 0 },
            quantity: { type: Number, default: 0 },
            amount: { type: Number, default: 0 },
            gst: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['Created', 'Approved', 'Issued', 'In-Process', 'Completed', 'Received'],
            default: 'Created'
        }
    },
    { timestamps: true }
);

export default mongoose.model<IJobWorkOrder>('JobWorkOrder', JobWorkOrderSchema);
