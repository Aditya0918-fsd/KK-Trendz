import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionPlan extends Document {
    planNumber: string;
    planningDate: Date;
    planningFor: Date;
    shift: 'Morning' | 'Evening' | 'Night';
    productionSchedule: Array<{
        orderId: mongoose.Types.ObjectId;
        productId: mongoose.Types.ObjectId;
        size: string;
        color: string;
        plannedQuantity: number;
        plannedQuantityPerDay?: number;
        processes: Array<{
            processName: string;
            plannedQuantity: number;
            machineId?: string;
            lineId?: string;
            operatorId?: mongoose.Types.ObjectId;
            operatorIds?: mongoose.Types.ObjectId[];
            startTime: Date;
            endTime: Date;
            status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed';
        }>;
    }>;
    resourceAllocation: {
        machines: Array<{
            machineId: string;
            process: string;
            allocatedHours: number;
            utilization: number;
        }>;
        labor: Array<{
            employeeId: mongoose.Types.ObjectId;
            process: string;
            allocatedHours: number;
        }>;
    };
    createdBy: mongoose.Types.ObjectId;
    status: 'Draft' | 'Approved' | 'InProgress' | 'Completed';
    createdAt: Date;
    updatedAt: Date;
}

const ProductionPlanSchema: Schema = new Schema(
    {
        planNumber: { type: String, required: true, unique: true },
        planningDate: { type: Date, default: Date.now },
        planningFor: { type: Date, required: true },
        shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
        productionSchedule: [
            {
                orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                size: String,
                color: String,
                plannedQuantity: { type: Number, required: true },
                plannedQuantityPerDay: Number,
                processes: [
                    {
                        processName: String,
                        plannedQuantity: Number,
                        machineId: String,
                        lineId: String,
                        operatorId: { type: Schema.Types.ObjectId, ref: 'Employee' },
                        operatorIds: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
                        startTime: Date,
                        endTime: Date,
                        status: { type: String, enum: ['Planned', 'In Progress', 'Completed', 'Delayed'], default: 'Planned' }
                    }
                ]
            }
        ],
        resourceAllocation: {
            machines: [
                {
                    machineId: String,
                    process: String,
                    allocatedHours: Number,
                    utilization: Number
                }
            ],
            labor: [
                {
                    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
                    process: String,
                    allocatedHours: Number
                }
            ]
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['Draft', 'Approved', 'InProgress', 'Completed'], default: 'Draft' }
    },
    { timestamps: true }
);

export default mongoose.model<IProductionPlan>('ProductionPlan', ProductionPlanSchema);
