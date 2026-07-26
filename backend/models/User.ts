import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPermission {
    module: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
}

export interface IUser extends Document {
    userId: string;
    employeeId: mongoose.Types.ObjectId;
    username: string;
    email: string;
    password?: string;
    role: 'Admin' | 'Supervisor' | 'Operator' | 'Stores';
    permissions: IUserPermission[];
    lastLogin?: Date;
    loginAttempts: number;
    passwordChangedAt?: Date;
    status: 'Active' | 'Inactive' | 'Locked';
    resetToken?: string;
    resetTokenExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        userId: { type: String, required: true, unique: true },
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ['Admin', 'Supervisor', 'Operator', 'Stores'],
            default: 'Operator'
        },
        permissions: [{
            module: String,
            canView: { type: Boolean, default: true },
            canCreate: { type: Boolean, default: false },
            canEdit: { type: Boolean, default: false },
            canDelete: { type: Boolean, default: false },
            canApprove: { type: Boolean, default: false }
        }],
        lastLogin: { type: Date },
        loginAttempts: { type: Number, default: 0 },
        passwordChangedAt: { type: Date },
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Locked'],
            default: 'Active'
        },
        resetToken: { type: String },
        resetTokenExpiry: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
