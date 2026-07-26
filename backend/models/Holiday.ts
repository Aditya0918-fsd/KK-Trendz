import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
    name: string;
    date: Date;
    type: 'Public' | 'Company' | 'Other';
    isPaid: boolean;
    description: string;
}

const HolidaySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        date: { type: Date, required: true, unique: true },
        type: { type: String, enum: ['Public', 'Company', 'Other'], default: 'Public' },
        isPaid: { type: Boolean, default: true },
        description: String
    },
    { timestamps: true }
);

export default mongoose.model<IHoliday>('Holiday', HolidaySchema);
