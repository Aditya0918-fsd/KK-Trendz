import mongoose, { Schema, Document } from 'mongoose';

export interface IPacking extends Document {
    packingId: string;
    packingDate: Date;
    orderId: mongoose.Types.ObjectId;

    // Batch Details
    batchNumber: string;
    shift: string;
    supervisorId: mongoose.Types.ObjectId;

    // Input from Quality
    inputBundles: [{
        checkingId: mongoose.Types.ObjectId;
        bundleNumber: string;
        quantity: number;
        issuedFrom: mongoose.Types.ObjectId;
        issuedBy: mongoose.Types.ObjectId;
    }];

    // Packing Materials Used
    packingMaterials: [{
        materialType: string;
        productId: mongoose.Types.ObjectId;
        batchNumber: string;
        quantity: number;
        unit: string;
        specification: string;
    }];

    // Packing Details
    packingDetails: [{
        cartonNumber: string;
        bundleNumbers: [string];
        piecesPerCarton: number;
        totalPieces: number;
        sizes: [{
            size: string;
            quantity: number;
        }];
        colors: [{
            color: string;
            quantity: number;
        }];
        grossWeight: number;
        netWeight: number;
        cartonDimensions: string;
        barcode: string;

        // Packing List
        packingList: [{
            bundleNumber: string;
            quantity: number;
            pieceNumbers: string;
        }];
    }];

    // Palletizing (Step 10)
    palletDetails: [{
        palletNumber: string;
        cartonNumbers: [string];
        totalCartons: number;
        cartonCount?: number;
        wrapApplied: boolean; // Stretch film
        isWrapped?: boolean;
        isLabeled?: boolean;
        location: string;
    }];

    // Summary
    summary: {
        totalPieces: number;
        totalCartons: number;
        totalPallets: number;
        totalGrossWeight: number;
        totalNetWeight: number;
        totalVolume: number;
    };

    // Output Storage
    outputStorage: {
        storedAt: mongoose.Types.ObjectId;
        binNumber: string;
        storedBy: mongoose.Types.ObjectId;
        storedDate: Date;
    };

    // Quality Check
    qualityCheck: {
        checkedBy: mongoose.Types.ObjectId;
        checkDate: Date;
        parameters: [{
            parameter: string;
            result: string;
            status: string; // Pass/Fail
        }];
        remarks: string;
        status: string; // Approved/Pending/Rejected
    };

    // Process Tracking
    stepProgress: [{
        stepNumber: number;
        stepName: string;
        completed: boolean;
        completedAt: Date;
        completedBy: mongoose.Types.ObjectId;
        remarks: string;
    }];

    // System Fields
    createdBy: mongoose.Types.ObjectId;
    status: string; // Completed/In Progress/Packed
}

const PackingSchema: Schema = new Schema({
    packingId: { type: String, required: true, unique: true },
    packingDate: { type: Date, required: true, default: Date.now },
    orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },

    batchNumber: { type: String, required: true },
    shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },

    inputBundles: [{
        checkingId: { type: Schema.Types.ObjectId, ref: 'QualityControl' },
        bundleNumber: { type: String },
        quantity: { type: Number },
        issuedFrom: { type: Schema.Types.ObjectId, ref: 'Location' },
        issuedBy: { type: Schema.Types.ObjectId, ref: 'Employee' }
    }],

    packingMaterials: [{
        materialType: { type: String },
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        batchNumber: { type: String },
        quantity: { type: Number },
        unit: { type: String },
        specification: { type: String }
    }],

    packingDetails: [{
        cartonNumber: { type: String },
        bundleNumbers: [{ type: String }],
        piecesPerCarton: { type: Number },
        totalPieces: { type: Number },
        sizes: [{
            size: { type: String },
            quantity: { type: Number }
        }],
        colors: [{
            color: { type: String },
            quantity: { type: Number }
        }],
        grossWeight: { type: Number },
        netWeight: { type: Number },
        cartonDimensions: { type: String },
        barcode: { type: String },
        packingList: [{
            bundleNumber: { type: String },
            quantity: { type: Number },
            pieceNumbers: { type: String }
        }]
    }],

    palletDetails: [{
        palletNumber: { type: String },
        cartonNumbers: [{ type: String }],
        totalCartons: { type: Number },
        cartonCount: { type: Number },
        wrapApplied: { type: Boolean, default: true },
        isWrapped: { type: Boolean, default: false },
        isLabeled: { type: Boolean, default: false },
        location: { type: String }
    }],

    summary: {
        totalPieces: { type: Number, default: 0 },
        totalCartons: { type: Number, default: 0 },
        totalPallets: { type: Number, default: 0 },
        totalGrossWeight: { type: Number, default: 0 },
        totalNetWeight: { type: Number, default: 0 },
        totalVolume: { type: Number, default: 0 }
    },

    outputStorage: {
        storedAt: { type: Schema.Types.ObjectId, ref: 'Location' },
        binNumber: { type: String },
        storedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
        storedDate: { type: Date, default: Date.now }
    },

    qualityCheck: {
        checkedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
        checkDate: { type: Date, default: Date.now },
        parameters: [{
            parameter: { type: String },
            result: { type: String },
            status: { type: String, default: 'Pass' }
        }],
        remarks: { type: String },
        status: { type: String, default: 'Approved' }
    },

    stepProgress: [{
        stepNumber: { type: Number },
        stepName: { type: String },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: Date.now },
        completedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
        remarks: { type: String }
    }],

    createdBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, default: 'In Progress' }
}, {
    timestamps: true
});

export default mongoose.models.Packing || mongoose.model<IPacking>('Packing', PackingSchema);
