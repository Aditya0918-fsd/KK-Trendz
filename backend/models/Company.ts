import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
    companyCode: string;
    companyName: string;
    companyType: string;
    unitType: string;
    registrationDetails: {
        gstin: string;
        pan: string;
        cin: string;
        iec: string;
        tan: string;
        msme: string;
    };
    address: {
        registeredOffice: {
            address1: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        };
        factoryAddress: {
            address1: string;
            city: string;
            state: string;
            pincode: string;
        };
    };
    contact: {
        phone1: string;
        phone2: string;
        email: string;
        website: string;
    };
    bankDetails: Array<{
        beneficiaryName: string;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        swiftCode: string;
        upiId: string;
        branchName: string;
        accountType: string;
        isDefault: boolean;
    }>;
    financialSettings: {
        financialYear: string;
        booksBeginningDate: Date | null;
        currency: string;
        decimalPrecision: number;
    };
    logo: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
    {
        companyCode: { type: String, required: true, unique: true },
        companyName: { type: String, required: true },
        companyType: { type: String, default: 'Private Limited' },
        unitType: { type: String, required: true },
        registrationDetails: {
            gstin: String,
            pan: String,
            cin: String,
            iec: String,
            tan: String,
            msme: String
        },
        address: {
            registeredOffice: {
                address1: String,
                city: String,
                state: String,
                pincode: String,
                country: String
            },
            factoryAddress: {
                address1: String,
                city: String,
                state: String,
                pincode: String
            }
        },
        contact: {
            phone1: String,
            phone2: String,
            email: String,
            website: String
        },
        bankDetails: [{
            beneficiaryName: String,
            bankName: String,
            accountNumber: String,
            ifscCode: String,
            swiftCode: String,
            upiId: String,
            branchName: String,
            accountType: String,
            isDefault: Boolean
        }],
        financialSettings: {
            financialYear: String,
            booksBeginningDate: Date,
            currency: { type: String, default: 'INR' },
            decimalPrecision: { type: Number, default: 2 }
        },
        logo: String,
        status: { type: String, default: 'Active' }
    },
    { timestamps: true }
);

export default mongoose.model<ICompany>('Company', CompanySchema);
