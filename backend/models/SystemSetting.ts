import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
    settingKey: string;
    settingValue: string;
    dataType: 'string' | 'number' | 'boolean' | 'date' | 'object';
    category: 'General' | 'Financial' | 'Inventory';
    isEditable: boolean;
    description: string;
    updatedBy?: mongoose.Types.ObjectId;
    updatedAt: Date;
}

const SystemSettingSchema: Schema = new Schema(
    {
        settingKey: { type: String, required: true, unique: true },
        settingValue: { type: String, required: true },
        dataType: {
            type: String,
            enum: ['string', 'number', 'boolean', 'date', 'object'],
            default: 'string'
        },
        category: {
            type: String,
            enum: ['General', 'Financial', 'Inventory'],
            default: 'General'
        },
        isEditable: { type: Boolean, default: true },
        description: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'Employee' }
    },
    { timestamps: true }
);

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
