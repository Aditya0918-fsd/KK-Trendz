import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
    employee: mongoose.Types.ObjectId;
    date: Date;
    inTime: string;
    outTime: string;
    status: 'Present' | 'Half Day' | 'Absent' | 'Late' | 'Holiday' | 'Paid Leave';
    lateMinutes: number;
    extraMinutes: number;
    remarks: string;
    source: string; // e.g., 'Biometric Excel'
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema(
    {
        employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        date: { type: Date, required: true },
        inTime: String,
        outTime: String,
        status: { type: String, enum: ['Present', 'Half Day', 'Absent', 'Late', 'Holiday', 'Paid Leave'], required: true },
        lateMinutes: { type: Number, default: 0 },
        extraMinutes: { type: Number, default: 0 },
        remarks: String,
        source: { type: String, default: 'Manual' }
    },
    { timestamps: true }
);

// Compound index to prevent duplicate attendance records for same employee/date
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
