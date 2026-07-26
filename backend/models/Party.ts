import mongoose, { Schema, Document } from 'mongoose';

export interface IParty extends Document {
    partyCode: string;
    partyType: string;
    partyName: string;
    partyGroup: string;
    legalName: string;
    ownership: string;
    establishedYear: number;
    addresses: Array<{
        addressType: string;

        address1: string;
        address2: string;
        city: string;
        district: string;
        state: string;
        pincode: string;
        country: string;
        isDefault: boolean;
        gstin: string;
    }>;
    contacts: Array<{
        name: string;
        designation: string;
        department: string;
        phone1: string;
        phone2: string;
        email: string;
        whatsapp: string;
        isPrimary: boolean;
    }>;
    financial: {
        creditLimit: number;
        creditDays: number;
        paymentTerms: string;
        outstandingAmount: number;
        lastPaymentDate: Date;
        lastPaymentAmount: number;
        msmeRegistered: boolean;
        msmeNumber: string;
    };
    bankAccounts: Array<{
        beneficiaryName: string;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        swiftCode: string;
        branchName: string;
        isDefault: boolean;
    }>;
    taxDetails: {
        gstRegistered: boolean;
        gstType: string;
        pan: string;
        tan: string;
        cin: string;
        iec: string;
        aadhar: string;
    };
    jobWorkCapabilities: Array<{
        processType: string;
        machineTypes: string[];
        capacityPerDay: number;
        ratePerUnit: number;
        qualityStandards: string[];
    }>;
    suppliedProducts: Array<{
        productCategory: string;
        productIds: mongoose.Types.ObjectId[];
        brandNames: string[];
        leadTime: number;
        minimumOrder: number;
    }>;
    documents: Array<{
        documentType: string;
        documentNumber: string;
        issueDate: Date;
        expiryDate: Date;
        fileUrl: string;
    }>;
    logistics: {
        transporterCode: string;
        transportMode: string;
        deliveryTerms: string;
        shippingMarks: string;
    };
    status: string;
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
}

const PartySchema: Schema = new Schema(
    {
        partyCode: { type: String, required: true, unique: true },
        partyType: { type: String, required: true },
        partyName: { type: String, required: true },
        partyGroup: String,
        legalName: String,
        ownership: String,
        establishedYear: Number,
        addresses: [{
            addressType: String,

            address1: String,
            address2: String,
            city: String,
            district: String,
            state: String,
            pincode: String,
            country: String,
            isDefault: Boolean,
            gstin: String
        }],
        contacts: [{
            name: String,
            designation: String,
            department: String,
            phone1: String,
            phone2: String,
            email: String,
            whatsapp: String,
            isPrimary: Boolean
        }],
        financial: {
            creditLimit: Number,
            creditDays: Number,
            paymentTerms: String,
            outstandingAmount: Number,
            lastPaymentDate: Date,
            lastPaymentAmount: Number,
            msmeRegistered: Boolean,
            msmeNumber: String
        },
        bankAccounts: [{
            beneficiaryName: String,
            bankName: String,
            accountNumber: String,
            ifscCode: String,
            swiftCode: String,
            branchName: String,
            isDefault: Boolean
        }],
        taxDetails: {
            gstRegistered: Boolean,
            gstType: String,
            pan: String,
            tan: String,
            cin: String,
            iec: String,
            aadhar: String
        },
        jobWorkCapabilities: [{
            processType: String,
            machineTypes: [String],
            capacityPerDay: Number,
            ratePerUnit: Number,
            qualityStandards: [String]
        }],
        suppliedProducts: [{
            productCategory: String,
            productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
            brandNames: [String],
            leadTime: Number,
            minimumOrder: Number
        }],
        documents: [{
            documentType: String,
            documentNumber: String,
            issueDate: Date,
            expiryDate: Date,
            fileUrl: String
        }],
        logistics: {
            transporterCode: String,
            transportMode: String,
            deliveryTerms: String,
            shippingMarks: String
        },
        status: { type: String, default: 'Active' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }

    },
    { timestamps: true }
);

export default mongoose.model<IParty>('Party', PartySchema);
