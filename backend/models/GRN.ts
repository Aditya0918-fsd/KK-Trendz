import mongoose, { Schema, Document } from 'mongoose';

export interface IGRN extends Document {
    grnNumber: string;
    grnDate: Date;
    poId?: mongoose.Types.ObjectId;
    supplierId: mongoose.Types.ObjectId;
    receiptType: 'Yarn' | 'Fabric' | 'JobWork Return';
    challanNo: string;
    challanDate: Date;
    vehicleNumber?: string;
    transporterName?: string;
    lrNumber?: string;
    items: {
        poItemId?: mongoose.Types.ObjectId;
        productId: mongoose.Types.ObjectId;
        productDescription: string;
        batchNumber?: string;
        manufacturingDate?: Date;
        expiryDate?: Date;
        receivedQuantity: number;
        unit: string;
        acceptedQuantity: number;
        rejectedQuantity: number;
        shortageQuantity: number;
        excessAccepted: number;
        uom: string;
        packageDetails?: {
            packageType: string;
            packageNumber: string;
            quantity: number;
            weight: number;
        }[];
        fabricRolls?: {
            rollNumber: string;
            weight: number;
            length: number;
            width: number;
            gsm: number;
            shade: string;
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
            status: 'Accepted' | 'Rejected' | 'Quarantine';
        };
        storageLocation: mongoose.Types.ObjectId;
        binNumber?: string;
        status: 'Accepted' | 'Rejected';
    }[];
    summary: {
        totalReceived: number;
        totalAccepted: number;
        totalRejected: number;
        totalShortage: number;
        totalPackages: number;
    };
    debitNoteGenerated: boolean;
    receivedBy: mongoose.Types.ObjectId;
    checkedBy?: mongoose.Types.ObjectId;
    status: 'Completed';
    createdAt: Date;
    updatedAt: Date;
}

const GRNSchema: Schema = new Schema(
    {
        grnNumber: { type: String, required: true, unique: true },
        grnDate: { type: Date, default: Date.now },
        poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
        supplierId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
        receiptType: { type: String, enum: ['Yarn', 'Fabric', 'JobWork Return'], required: true },
        challanNo: { type: String, required: true },
        challanDate: { type: Date, required: true },
        vehicleNumber: { type: String },
        transporterName: { type: String },
        lrNumber: { type: String },
        items: [
            {
                poItemId: { type: Schema.Types.ObjectId },
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                productDescription: { type: String, required: true },
                batchNumber: { type: String },
                manufacturingDate: { type: Date },
                expiryDate: { type: Date },
                receivedQuantity: { type: Number, required: true },
                unit: { type: String, required: true },
                acceptedQuantity: { type: Number, required: true },
                rejectedQuantity: { type: Number, default: 0 },
                shortageQuantity: { type: Number, default: 0 },
                excessAccepted: { type: Number, default: 0 },
                uom: { type: String, required: true },
                packageDetails: [{
                    packageType: String,
                    packageNumber: String,
                    quantity: Number,
                    weight: Number
                }],
                fabricRolls: [{
                    rollNumber: String,
                    weight: Number,
                    length: Number,
                    width: Number,
                    gsm: Number,
                    shade: String
                }],
                qualityCheck: {
                    checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                    checkDate: { type: Date },
                    parameters: [{
                        parameter: String,
                        value: Schema.Types.Mixed,
                        result: { type: String, enum: ['Pass', 'Fail'] }
                    }],
                    remarks: String,
                    status: { type: String, enum: ['Accepted', 'Rejected', 'Quarantine'] }
                },
                storageLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
                binNumber: { type: String },
                status: { type: String, enum: ['Accepted', 'Rejected'], default: 'Accepted' }
            }
        ],
        summary: {
            totalReceived: { type: Number, required: true },
            totalAccepted: { type: Number, required: true },
            totalRejected: { type: Number, default: 0 },
            totalShortage: { type: Number, default: 0 },
            totalPackages: { type: Number, default: 0 }
        },
        debitNoteGenerated: { type: Boolean, default: false },
        receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Completed'], default: 'Completed' }
    },
    { timestamps: true }
);

export default mongoose.model<IGRN>('GRN', GRNSchema);
