import mongoose, { Schema, Document } from 'mongoose';

export interface IFinishingProduction extends Document {
    finishingId: string;
    finishingDate: Date;
    orderId: mongoose.Types.ObjectId;
    batchNumber: string;
    shift: 'Morning' | 'Evening' | 'Night';
    supervisorId: mongoose.Types.ObjectId;
    inputBundles: Array<{
        stitchingId: mongoose.Types.ObjectId;
        bundleNumber: string;
        quantity: number;
        issuedFrom: mongoose.Types.ObjectId;
        issuedBy: mongoose.Types.ObjectId;
    }>;
    threadCutting: {
        operatorId: mongoose.Types.ObjectId;
        startTime: Date;
        endTime: Date;
        inputQuantity: number;
        outputQuantity: number;
        defects: number;
        defectsDetails: Array<{ defectType: string; quantity: number }>;
        remarks: string;
    };
    ironing: {
        machineId: string;
        operatorId: mongoose.Types.ObjectId;
        startTime: Date;
        endTime: Date;
        inputQuantity: number;
        outputQuantity: number;
        defects: number;
        parameters: {
            temperature: string;
            pressure: string;
            steamConsumption: number;
        };
        defectsDetails: Array<{ defectType: string; quantity: number }>;
        remarks: string;
    };
    outputBundles: Array<{
        bundleNumber: string;
        quantity: number;
        pieceNumbers: string;
    }>;
    outputStorage: {
        storedAt: mongoose.Types.ObjectId;
        binNumber: string;
        storedBy: mongoose.Types.ObjectId;
        storedDate: Date;
    };
    qualityCheck: {
        checkedBy: mongoose.Types.ObjectId;
        checkDate: Date;
        parameters: Array<{
            parameter: string;
            result: string;
            status: 'Pass' | 'Fail';
        }>;
        remarks?: string;
        status: string;
    };
    createdBy: mongoose.Types.ObjectId;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const FinishingProductionSchema: Schema = new Schema(
    {
        finishingId: { type: String, required: true, unique: true },
        finishingDate: { type: Date, default: Date.now },
        orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
        batchNumber: { type: String, required: true },
        shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
        supervisorId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        inputBundles: [
            {
                stitchingId: { type: Schema.Types.ObjectId, ref: 'StitchingProduction' },
                bundleNumber: String,
                quantity: Number,
                issuedFrom: { type: Schema.Types.ObjectId, ref: 'Location' },
                issuedBy: { type: Schema.Types.ObjectId, ref: 'Employee' }
            }
        ],
        threadCutting: {
            operatorId: { type: Schema.Types.ObjectId, ref: 'Employee' },
            startTime: Date,
            endTime: Date,
            inputQuantity: Number,
            outputQuantity: Number,
            defects: Number,
            defectsDetails: [{ defectType: String, quantity: Number }],
            remarks: String
        },
        ironing: {
            machineId: String,
            operatorId: { type: Schema.Types.ObjectId, ref: 'Employee' },
            startTime: Date,
            endTime: Date,
            inputQuantity: Number,
            outputQuantity: Number,
            defects: Number,
            parameters: {
                temperature: String,
                pressure: String,
                steamConsumption: Number
            },
            defectsDetails: [{ defectType: String, quantity: Number }],
            remarks: String
        },
        outputBundles: [
            {
                bundleNumber: String,
                quantity: Number,
                pieceNumbers: String
            }
        ],
        outputStorage: {
            storedAt: { type: Schema.Types.ObjectId, ref: 'Location' },
            binNumber: String,
            storedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
            storedDate: { type: Date, default: Date.now }
        },
        qualityCheck: {
            checkedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
            checkDate: { type: Date, default: Date.now },
            parameters: [{ parameter: String, result: String, status: String }],
            remarks: String,
            status: { type: String, default: 'Pending' }
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, default: 'Pending' }
    },
    { timestamps: true }
);

export default mongoose.model<IFinishingProduction>('FinishingProduction', FinishingProductionSchema);
