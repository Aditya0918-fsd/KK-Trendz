import mongoose, { Schema, Document } from 'mongoose';

export interface IProcess extends Document {
    processCode: string;
    processName: string;
    processType: string;
    department: string;
    sequenceNumber: number;
    description: string;
    standardTime: number;
    costPerUnit: number;
    setupTime: number;
    cleaningTime: number;
    qualityParameters: Array<{
        parameter: string;
        standardValue: any;
        tolerance: any;
        unit: string;
        checkFrequency: string;
        checkMethod: string;
    }>;
    machineRequirements: Array<{
        machineType: string;
        specifications: any;
    }>;
    skillRequirements: Array<{
        skill: string;
        level: string;
        experience: number;
    }>;
    inputs: Array<{
        materialType: string;
        uom: string;
        wastagePercentage: number;
    }>;
    outputs: Array<{
        materialType: string;
        uom: string;
        yieldPercentage: number;
    }>;
    status: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ProcessSchema: Schema = new Schema(
    {
        processCode: { type: String, required: true, unique: true },
        processName: { type: String, required: true },
        processType: { type: String, required: true },
        department: String,
        sequenceNumber: Number,
        description: String,
        standardTime: Number,
        costPerUnit: Number,
        setupTime: Number,
        cleaningTime: Number,
        qualityParameters: [{
            parameter: String,
            standardValue: Schema.Types.Mixed,
            tolerance: Schema.Types.Mixed,
            unit: String,
            checkFrequency: String,
            checkMethod: String
        }],
        machineRequirements: [{
            machineType: String,
            specifications: Schema.Types.Mixed
        }],
        skillRequirements: [{
            skill: String,
            level: String,
            experience: Number
        }],
        inputs: [{
            materialType: String,
            uom: String,
            wastagePercentage: Number
        }],
        outputs: [{
            materialType: String,
            uom: String,
            yieldPercentage: Number
        }],
        status: { type: String, default: 'Active' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' }

    },
    { timestamps: true }
);

export default mongoose.model<IProcess>('Process', ProcessSchema);
