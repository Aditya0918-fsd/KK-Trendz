import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionJobCard extends Document {
    jobCardNumber: string;
    date: Date;
    orderId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    styleNo: string;
    brand: string;
    gender: string;
    sizeRange: string;
    printType: string;
    garmentImage?: string;
    fabricSwatch?: string;
    patternNo?: string;

    // Ratio & Size Planning
    planning: {
        ratio: string; // e.g., "1:1:1:1"
        sizes: Array<{
            size: string;
            quantity: number;
        }>;
        totalQuantity: number;
        fabricLotNo?: string;
        bodyFabric?: string; // Evergreen - Loop Knit - Black - 220gsm
    };

    // Fabric Status
    fabricStatus: {
        ordered: number;
        received: Array<{
            quantity: number;
            date?: Date;
        }>;
        totalReceived: number;
    };

    // Cutting Breakdown
    cuttingQuantity: Array<{
        shade: string; // A, B, C, Total
        sizes: Array<{
            size: string;
            quantity: number;
        }>;
    }>;

    // Consumption Details
    consumptionDetails: {
        drawingWeight: number;
        pcs: number;
        consumption: number;
    };

    // Logistics & Personnel
    logistics: {
        cuttingPlant: string; // Ganganagar, Donnagar
        otherLocation?: string; // Donnagar, etc.
        styleCategory: string; // Essential, etc.
        layeringPerson?: string;
        drawingMaster?: string;
        cuttingMaster?: string;
    };

    status: 'Draft' | 'Approved' | 'Closed';
    createdBy: mongoose.Types.ObjectId;
}

const ProductionJobCardSchema: Schema = new Schema(
    {
        jobCardNumber: { type: String, required: true, unique: true },
        date: { type: Date, default: Date.now },
        orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        styleNo: String,
        brand: String,
        gender: String,
        sizeRange: String,
        printType: String,
        garmentImage: String,
        fabricSwatch: String,
        patternNo: String,
        planning: {
            ratio: String,
            sizes: [{ size: String, quantity: Number }],
            totalQuantity: Number,
            fabricLotNo: String,
            bodyFabric: String
        },
        fabricStatus: {
            ordered: Number,
            received: [{ quantity: Number, date: Date }],
            totalReceived: { type: Number, default: 0 }
        },
        cuttingQuantity: [
            {
                shade: String,
                sizes: [{ size: String, quantity: Number }]
            }
        ],
        consumptionDetails: {
            drawingWeight: Number,
            pcs: Number,
            consumption: Number
        },
        logistics: {
            cuttingPlant: String,
            otherLocation: String,
            styleCategory: String,
            layeringPerson: String,
            drawingMaster: String,
            cuttingMaster: String
        },
        status: { type: String, enum: ['Draft', 'Approved', 'Closed'], default: 'Draft' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

export default mongoose.model<IProductionJobCard>('ProductionJobCard', ProductionJobCardSchema);
