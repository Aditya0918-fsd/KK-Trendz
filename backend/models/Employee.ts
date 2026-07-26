import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    employeeCode: string;
    employeeName: string;
    personalDetails: {
        dateOfBirth: Date;
        gender: string;
        bloodGroup: string;
        maritalStatus: string;
        nationality: string;
        religion: string;
        category: string;
    };
    contact: {
        permanentAddress: {
            address1: string;
            city: string;
            district: string;
            state: string;
            pincode: string;
        };
        currentAddress: {
            address1: string;
            city: string;
            pincode: string;
        };
        phone1: string;
        phone2: string;
        email: string;
        emergencyContact: {
            name: string;
            relation: string;
            phone: string;
        };
    };
    employment: {
        department: string;
        subDepartment: string;
        designation: string;
        grade: string;
        joiningDate: Date;
        confirmationDate: Date;
        employmentType: string;
        category?: string;
        privilegeType: 'Privileged' | 'Non-Privileged';
        workingShift: string;
        inTime: string;
        outTime: string;
        reportingTo: mongoose.Types.ObjectId;
        location?: string;
        skills: string[];
        experience: number;
    };
    compensation: {
        salaryStructure: string;
        basic: number;
        hra: number;
        conveyance: number;
        medical: number;
        specialAllowance: number;
        grossSalary: number;
        pfNumber: string;
        esiNumber: string;
        uanNumber: string;
        bankDetails: {
            bankName: string;
            accountNumber: string;
            ifscCode: string;
            branchName: string;
        };
        dailyRate?: number;
    };
    attendance: {
        workDays: number;
        presentDays: number;
        leaveBalance: {
            casualLeave: number;
            sickLeave: number;
            earnedLeave: number;
        };
    };
    documents: Array<{
        documentType: string;
        documentNumber: string;
        fileUrl: string;
    }>;
    certifications: Array<{
        name: string;
        issuedBy: string;
        date: Date;
        validTill: Date;
    }>;
    performance: Array<{
        reviewDate: Date;
        rating: number;
        comments: string;
        reviewedBy: mongoose.Types.ObjectId;
    }>;
    status: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema(
    {
        employeeCode: { type: String, required: true, unique: true },
        employeeName: { type: String, required: true },
        personalDetails: {
            dateOfBirth: Date,
            gender: String,
            bloodGroup: String,
            maritalStatus: String,
            nationality: String,
            religion: String,
            category: String
        },
        contact: {
            permanentAddress: {
                address1: String,
                city: String,
                district: String,
                state: String,
                pincode: String
            },
            currentAddress: {
                address1: String,
                city: String,
                pincode: String
            },
            phone1: String,
            phone2: String,
            email: String,
            emergencyContact: {
                name: String,
                relation: String,
                phone: String
            }
        },
        employment: {
            department: String,
            subDepartment: String,
            designation: String,
            grade: String,
            joiningDate: Date,
            confirmationDate: Date,
            employmentType: String,
            category: { type: String, default: 'Salary' },
            privilegeType: { type: String, enum: ['Privileged', 'Non-Privileged'], default: 'Privileged' },
            workingShift: String,
            inTime: String,
            outTime: String,
            reportingTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
            location: String,
            skills: [String],
            experience: Number
        },
        compensation: {
            salaryStructure: String,
            basic: Number,
            hra: Number,
            conveyance: Number,
            medical: Number,
            specialAllowance: Number,
            grossSalary: Number,
            pfNumber: String,
            esiNumber: String,
            uanNumber: String,
            bankDetails: {
                bankName: String,
                accountNumber: String,
                ifscCode: String,
                branchName: String
            },
            dailyRate: Number
        },
        attendance: {
            workDays: Number,
            presentDays: Number,
            leaveBalance: {
                casualLeave: Number,
                sickLeave: Number,
                earnedLeave: Number
            }
        },
        documents: [{
            documentType: String,
            documentNumber: String,
            fileUrl: String
        }],
        certifications: [{
            name: String,
            issuedBy: String,
            date: Date,
            validTill: Date
        }],
        performance: [{
            reviewDate: Date,
            rating: Number,
            comments: String,
            reviewedBy: { type: Schema.Types.ObjectId, ref: 'Employee' }
        }],
        status: { type: String, default: 'Active' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
