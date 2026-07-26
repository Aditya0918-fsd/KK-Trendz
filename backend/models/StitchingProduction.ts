import mongoose, { Schema, Document } from 'mongoose';

export interface IStitchingProduction extends Document {
    stitchingId: string;
    stitchingDate: Date;
    orderId: mongoose.Types.ObjectId;
    batchNumber: string;
    shift: 'Morning' | 'Evening' | 'Night';
    supervisorId: mongoose.Types.ObjectId;
    productionLine: string;
    inputBundles: Array<{
        cuttingId: mongoose.Types.ObjectId;
        bundleNumber: string;
        size: string;
        color: string;
        quantity: number;
        issuedFrom: mongoose.Types.ObjectId;
        issuedBy: mongoose.Types.ObjectId;
        issuedDate: Date;
    }>;
    inputAccessories: Array<{
        accessoryType: string;
        productId: mongoose.Types.ObjectId;
        batchNumber?: string;
        quantity: number;
        issuedFrom: mongoose.Types.ObjectId;
        issuedBy: mongoose.Types.ObjectId;
    }>;
    inputThread: Array<{
        threadId: mongoose.Types.ObjectId;
        color: string;
        batchNumber?: string;
        quantity: number;
        issuedFrom: mongoose.Types.ObjectId;
    }>;
    operationSequence: Array<{
        operation: string;
        machineType: string;
        operatorId: mongoose.Types.ObjectId;
        startTime: Date;
        endTime: Date;
        inputQuantity: number;
        outputQuantity: number;
        defects: number;
        productionRate: number;
        efficiency: number;
    }>;
    productionSummary: {
        totalInput: number;
        totalOutput: number;
        totalDefects: number;
        efficiency: number;
        totalManHours: number;
        productionPerHour: number;
    };
    defectAnalysis: Array<{
        defectType: string;
        quantity: number;
        percentage: number;
        cause: string;
        correctiveAction?: string;
    }>;
    outputBundles: Array<{
        bundleNumber: string;
        size: string;
        color: string;
        quantity: number;
        pieceNumbers: string;
    }>;
    outputStorage: {
        storedAt: mongoose.Types.ObjectId;
        binNumber: string;
        storedBy: mongoose.Types.ObjectId;
        storedDate: Date;
    };
    finalQualityCheck: {
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

const StitchingProductionSchema: Schema = new Schema(
    {
        stitchingId: { type: String, required: true, unique: true },
        stitchingDate: { type: Date, default: Date.now },
        orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
        batchNumber: { type: String, required: true },
        shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
        supervisorId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        productionLine: { type: String, required: true },
        inputBundles: [
            {
                cuttingId: { type: Schema.Types.ObjectId, ref: 'CuttingProduction' },
                bundleNumber: String,
                size: String,
                color: String,
                quantity: Number,
                issuedFrom: { type: Schema.Types.ObjectId, ref: 'Location' },
                issuedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
                issuedDate: { type: Date, default: Date.now }
            }
        ],
        inputAccessories: [
            {
                accessoryType: String,
                productId: { type: Schema.Types.ObjectId, ref: 'Product' },
                batchNumber: String,
                quantity: Number,
                issuedFrom: { type: Schema.Types.ObjectId, ref: 'Location' },
                issuedBy: { type: Schema.Types.ObjectId, ref: 'Employee' }
            }
        ],
        inputThread: [
            {
                threadId: { type: Schema.Types.ObjectId, ref: 'Product' },
                color: String,
                batchNumber: String,
                quantity: Number,
                issuedFrom: { type: Schema.Types.ObjectId, ref: 'Location' }
            }
        ],
        operationSequence: [
            {
                operation: String,
                machineType: String,
                operatorId: { type: Schema.Types.ObjectId, ref: 'Employee' },
                startTime: Date,
                endTime: Date,
                inputQuantity: Number,
                outputQuantity: Number,
                defects: Number,
                productionRate: Number,
                efficiency: Number
            }
        ],
        productionSummary: {
            totalInput: { type: Number, default: 0 },
            totalOutput: { type: Number, default: 0 },
            totalDefects: { type: Number, default: 0 },
            efficiency: { type: Number, default: 0 },
            totalManHours: { type: Number, default: 0 },
            productionPerHour: { type: Number, default: 0 }
        },
        defectAnalysis: [
            {
                defectType: String,
                quantity: Number,
                percentage: Number,
                cause: String,
                correctiveAction: String
            }
        ],
        outputBundles: [
            {
                bundleNumber: String,
                size: String,
                color: String,
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
        finalQualityCheck: {
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

export default mongoose.model<IStitchingProduction>('StitchingProduction', StitchingProductionSchema);
