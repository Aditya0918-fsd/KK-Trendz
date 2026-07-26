import mongoose, { Schema, Document } from 'mongoose';

export interface ICuttingProduction extends Document {
    cuttingId: string;
    cuttingDate: Date;
    orderId: mongoose.Types.ObjectId;
    batchNumber: string;
    shift: 'Morning' | 'Evening' | 'Night';
    supervisorId: mongoose.Types.ObjectId;
    inputFabric: Array<{
        allocationId: mongoose.Types.ObjectId;
        fabricId: mongoose.Types.ObjectId;
        batchNumber: string;
        rollNumbers: string[];
        issuedQuantity: number;
        unit: string;
        usedQuantity: number;
        returnedQuantity: number;
        issuedFrom: mongoose.Types.ObjectId;
        issuedBy: mongoose.Types.ObjectId;
        issuedDate: Date;
    }>;
    cuttingPlan: {
        markerName: string;
        markerLength: number;
        markerWidth: number;
        layers: number;
        piecesPerLayer: number;
        totalExpectedPieces: number;
        fabricConsumptionPerPiece: number;
        totalFabricConsumption: number;
        efficiency: number;
    };
    productionDetails: Array<{
        size: string;
        color: string;
        plannedQuantity: number;
        actualPieces: number;
        bundles: Array<{
            bundleNumber: string;
            size: string;
            color: string;
            layerNumbers: string;
            quantity: number;
            rollNumbers: string[];
            pieceNumbers: string;
        }>;
    }>;
    defects: {
        total: number;
        reasons: Array<{
            reason: string;
            quantity: number;
        }>;
    };
    wastage: {
        fabric: number;
        reason: string;
        recyclable: number;
        disposal: number;
    };
    outputStorage: {
        bundleNumbers: string[];
        totalPieces: number;
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
        status: 'Approved' | 'Rejected' | 'Pending';
    };
    createdBy: mongoose.Types.ObjectId;
    status: 'In Progress' | 'Completed' | 'Pending';
    createdAt: Date;
    updatedAt: Date;
}

const CuttingProductionSchema: Schema = new Schema(
    {
        cuttingId: { type: String, required: true, unique: true },
        cuttingDate: { type: Date, default: Date.now },
        orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
        batchNumber: { type: String, required: true },
        shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
        supervisorId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        inputFabric: [
            {
                allocationId: { type: Schema.Types.ObjectId, ref: 'OrderAllocation' },
                fabricId: { type: Schema.Types.ObjectId, ref: 'Product' },
                batchNumber: String,
                rollNumbers: [String],
                issuedQuantity: Number,
                unit: { type: String, default: 'Kgs' },
                usedQuantity: Number,
                returnedQuantity: Number,
                issuedFrom: { type: Schema.Types.ObjectId, ref: 'Location' },
                issuedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
                issuedDate: Date
            }
        ],
        cuttingPlan: {
            markerName: String,
            markerLength: Number,
            markerWidth: Number,
            layers: Number,
            piecesPerLayer: Number,
            totalExpectedPieces: Number,
            fabricConsumptionPerPiece: Number,
            totalFabricConsumption: Number,
            efficiency: Number
        },
        productionDetails: [
            {
                size: String,
                color: String,
                plannedQuantity: Number,
                actualPieces: Number,
                bundles: [
                    {
                        bundleNumber: String,
                        size: String,
                        color: String,
                        layerNumbers: String,
                        quantity: Number,
                        rollNumbers: [String],
                        pieceNumbers: String
                    }
                ]
            }
        ],
        defects: {
            total: { type: Number, default: 0 },
            reasons: [{ reason: String, quantity: Number }]
        },
        wastage: {
            fabric: { type: Number, default: 0 },
            reason: String,
            recyclable: Number,
            disposal: Number
        },
        outputStorage: {
            bundleNumbers: [String],
            totalPieces: Number,
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

export default mongoose.model<ICuttingProduction>('CuttingProduction', CuttingProductionSchema);
