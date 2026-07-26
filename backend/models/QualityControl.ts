import mongoose, { Schema, Document } from 'mongoose';

export interface IQualityControl extends Document {
    checkingId: string;
    checkingDate: Date;
    orderId: mongoose.Types.ObjectId;
    batchNumber: string;
    shift: 'Morning' | 'Evening' | 'Night';
    checkerId: mongoose.Types.ObjectId;
    supervisorId: mongoose.Types.ObjectId;

    inputBundles: {
        finishingId: mongoose.Types.ObjectId;
        bundleNumber: string;
        quantity: number;
        issuedFrom: mongoose.Types.ObjectId;
    }[];

    checkingDetails: {
        bundleNumber: string;
        size: string;
        color: string;
        quantity: number;
        checked: {
            pieceNumber: string;
            defects: {
                defectType: string;
                location?: string;
                count: number;
                severity: 'Minor' | 'Major' | 'Critical';
            }[];
        }[];
        passed: number;
        rejected: number;
        rework: number;
    }[];

    qualityParameters: {
        parameter: string;
        standard: string;
        method: string;
        result: 'Pass' | 'Fail';
        defects?: number;
        measurements?: {
            point: string;
            standard: string;
            tolerance: string;
            actual: string;
            result: 'Pass' | 'Fail';
        }[];
    }[];

    summary: {
        totalChecked: number;
        totalPassed: number;
        totalRejected: number;
        totalRework: number;
        acceptanceRate: number;
        rejectionRate: number;
        aqlLevel?: string;
    };

    rejectionAnalysis: {
        defectType: string;
        quantity: number;
        percentage: number;
        cause: string;
        action: string;
    }[];

    gradeWiseOutput: {
        'A Grade': number;
        'B Grade': number;
        'Rejected': number;
    };

    outputBundles: {
        bundleNumber: string;
        size: string;
        color: string;
        quantity: number;
        grade: string;
    }[];

    rejectedItems: {
        quantity: number;
        storedAt: mongoose.Types.ObjectId;
        binNumber: string;
        remarks: string;
    };

    outputStorage: {
        storedAt: mongoose.Types.ObjectId;
        binNumber: string;
        storedBy: mongoose.Types.ObjectId;
        storedDate: Date;
    };

    qualityCertificate: {
        issuedBy: mongoose.Types.ObjectId;
        issuedDate: Date;
        certificateNumber: string;
        validUntil: Date;
    };

    status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const QualityControlSchema: Schema = new Schema({
    checkingId: { type: String, required: true, unique: true },
    checkingDate: { type: Date, default: Date.now },
    orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    batchNumber: { type: String, required: true },
    shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
    checkerId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },

    inputBundles: [{
        finishingId: { type: Schema.Types.ObjectId, ref: 'FinishingProduction' },
        bundleNumber: String,
        quantity: Number,
        issuedFrom: { type: Schema.Types.ObjectId, ref: 'Location' }
    }],

    checkingDetails: [{
        bundleNumber: String,
        size: String,
        color: String,
        quantity: Number,
        checked: [{
            pieceNumber: String,
            defects: [{
                defectType: String,
                location: String,
                count: Number,
                severity: { type: String, enum: ['Minor', 'Major', 'Critical'] }
            }]
        }],
        passed: Number,
        rejected: Number,
        rework: Number
    }],

    qualityParameters: [{
        parameter: String,
        standard: String,
        method: String,
        result: { type: String, enum: ['Pass', 'Fail'] },
        defects: Number,
        measurements: [{
            point: String,
            standard: String,
            tolerance: String,
            actual: String,
            result: { type: String, enum: ['Pass', 'Fail'] }
        }]
    }],

    summary: {
        totalChecked: { type: Number, default: 0 },
        totalPassed: { type: Number, default: 0 },
        totalRejected: { type: Number, default: 0 },
        totalRework: { type: Number, default: 0 },
        acceptanceRate: { type: Number, default: 0 },
        rejectionRate: { type: Number, default: 0 },
        aqlLevel: { type: String, default: '1.5' }
    },

    rejectionAnalysis: [{
        defectType: String,
        quantity: Number,
        percentage: Number,
        cause: String,
        action: String
    }],

    gradeWiseOutput: {
        'A Grade': { type: Number, default: 0 },
        'B Grade': { type: Number, default: 0 },
        'Rejected': { type: Number, default: 0 }
    },

    outputBundles: [{
        bundleNumber: String,
        size: String,
        color: String,
        quantity: Number,
        grade: String
    }],

    rejectedItems: {
        quantity: { type: Number, default: 0 },
        storedAt: { type: Schema.Types.ObjectId, ref: 'Location' },
        binNumber: String,
        remarks: String
    },

    outputStorage: {
        storedAt: { type: Schema.Types.ObjectId, ref: 'Location' },
        binNumber: String,
        storedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
        storedDate: { type: Date, default: Date.now }
    },

    qualityCertificate: {
        issuedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
        issuedDate: { type: Date, default: Date.now },
        certificateNumber: String,
        validUntil: Date
    },

    status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Rejected'], default: 'Pending' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Employee' }
}, {
    timestamps: true
});

export default mongoose.model<IQualityControl>('QualityControl', QualityControlSchema);
