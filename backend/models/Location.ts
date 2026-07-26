import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
    locationCode: string;
    locationName: string;
    locationType: string;
    department: string;
    area: number;
    address: {
        building: string;
        floor: string;
        zone: string;
    };
    inchargeId: mongoose.Types.ObjectId;
    alternateIncharge: mongoose.Types.ObjectId;
    capacity: {
        total: number;
        utilized: number;
        available: number;
        unit: string;
    };
    storage: Array<{
        binNumber: string;
        rowNumber: string;
        rackNumber: string;
        capacity: number;
        currentStock: number;
        productType: string;
    }>;
    authorizedPersons: mongoose.Types.ObjectId[];
    environment: {
        temperature: string;
        humidity: string;
        monitoring: boolean;
    };
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const LocationSchema: Schema = new Schema(
    {
        locationCode: { type: String, required: true, unique: true },
        locationName: { type: String, required: true },
        locationType: { type: String, required: true },
        department: String,
        area: Number,
        address: {
            building: String,
            floor: String,
            zone: String
        },
        inchargeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
        alternateIncharge: { type: Schema.Types.ObjectId, ref: 'Employee' },
        capacity: {
            total: Number,
            utilized: { type: Number, default: 0 },
            available: Number,
            unit: String
        },
        storage: [{
            binNumber: String,
            rowNumber: String,
            rackNumber: String,
            capacity: Number,
            currentStock: { type: Number, default: 0 },
            productType: String
        }],
        authorizedPersons: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
        environment: {
            temperature: String,
            humidity: String,
            monitoring: Boolean
        },
        status: { type: String, default: 'Active' }
    },
    { timestamps: true }
);

export default mongoose.models.Location || mongoose.model<ILocation>('Location', LocationSchema);
