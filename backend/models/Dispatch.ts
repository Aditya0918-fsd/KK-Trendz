import mongoose, { Schema, Document } from 'mongoose';

export interface IDispatch extends Document {
    dispatchId: string;
    dispatchDate: Date;
    orderId: mongoose.Types.ObjectId;

    // Batch Details
    packingId: mongoose.Types.ObjectId;
    dispatchType: string;
    priority: string;

    // Customer Details
    customerId: mongoose.Types.ObjectId;
    shippingAddress: {
        address1: string;
        address2: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
        contactPerson: string;
        contactPhone: string;
        email: string;
    };

    // Transporter Details
    transporter: {
        name: string;
        transporterId: mongoose.Types.ObjectId;
        vehicleNumber: string;
        vehicleType: string;
        driverName: string;
        driverLicense: string;
        driverPhone: string;
        helperName: string;
        helperPhone: string;
        vehicleCondition: string;
    };

    // Execution Details (7.2)
    execution: {
        arrivalTime: Date;
        departureTime: Date;
        odometerStart: number;
        odometerEnd: number;
        gatePassNumber: string;
        loadingSupervisor: mongoose.Types.ObjectId;
    };

    // Dispatch Documents
    documents: {
        lrNumber: string;
        lrDate: Date;
        grNumber: string;
        grDate: Date;
        eWayBillNumber: string;
        eWayBillDate: Date;
        invoiceNumber: string;
        invoiceDate: Date;
        packingListNumber: string;
        challanNumber: string;
        challanDate: Date;
        ewayBillValidity: Date;
    };

    // Items Dispatched
    items: [{
        productId: mongoose.Types.ObjectId;
        productName: string;
        size: string;
        color: string;
        quantity: number;
        unit: string;
        rate: number;
        amount: number;
    }];

    // Carton Details
    cartonDetails: [{
        cartonNumber: string;
        quantity: number;
        sizes: string;
        colors: string;
        grossWeight: number;
        netWeight: number;
        sealNumber: string;
    }];

    // Shipping Details
    shippingDetails: {
        totalCartons: number;
        totalPieces: number;
        totalGrossWeight: number;
        totalNetWeight: number;
        totalVolume: number;
        freightCharge: number;
        insuranceAmount: number;
        handlingCharges: number;
    };

    // Invoice
    invoice: {
        invoiceNumber: string;
        invoiceDate: Date;
        invoiceType: string;

        items: [{
            description: string;
            hsnCode: string;
            quantity: number;
            unit: string;
            rate: number;
            taxableValue: number;
            gstRate: number;
            gstAmount: number;
            totalValue: number;
        }];

        summary: {
            totalTaxable: number;
            totalGst: number;
            totalInvoiceValue: number;
            freightCharges: number;
            insuranceCharges: number;
            grandTotal: number;
        };

        amountInWords: string;
        paymentTerms: string;
        dueDate: Date;
    };

    // Tracking
    tracking: {
        trackingNumber: string;
        carrier: string;
        status: string;
        url: string;

        updates: [{
            timestamp: Date;
            location: string;
            status: string;
            remarks: string;
        }];
    };

    // POD (Proof of Delivery)
    pod: {
        receivedBy: string;
        receivedDate: Date;
        signature: string;
        stamp: boolean;
        hasShortages: boolean;
        hasDamages: boolean;
        remarks: string;
    };

    // System Fields
    dispatchedBy: mongoose.Types.ObjectId;
    status: string;
}

const DispatchSchema: Schema = new Schema({
    dispatchId: { type: String, required: true, unique: true },
    dispatchDate: { type: Date, required: true, default: Date.now },
    orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },

    packingId: { type: Schema.Types.ObjectId, ref: 'Packing' },
    dispatchType: { type: String, enum: ['Road', 'Air', 'Sea', 'Rail'], default: 'Road' },
    priority: { type: String, enum: ['Normal', 'Express'], default: 'Normal' },

    customerId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    shippingAddress: {
        address1: String,
        address2: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        contactPerson: String,
        contactPhone: String,
        email: String
    },

    transporter: {
        name: String,
        transporterId: { type: Schema.Types.ObjectId, ref: 'Party' },
        vehicleNumber: String,
        vehicleType: String,
        driverName: String,
        driverLicense: String,
        driverPhone: String,
        helperName: String,
        helperPhone: String,
        vehicleCondition: String
    },

    execution: {
        arrivalTime: Date,
        departureTime: Date,
        odometerStart: Number,
        odometerEnd: Number,
        gatePassNumber: String,
        loadingSupervisor: { type: Schema.Types.ObjectId, ref: 'Employee' }
    },

    documents: {
        lrNumber: String,
        lrDate: Date,
        grNumber: String,
        grDate: Date,
        eWayBillNumber: String,
        eWayBillDate: Date,
        invoiceNumber: String,
        invoiceDate: Date,
        packingListNumber: String,
        challanNumber: String,
        challanDate: Date,
        ewayBillValidity: Date
    },

    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        size: String,
        color: String,
        quantity: Number,
        unit: String,
        rate: Number,
        amount: Number
    }],

    cartonDetails: [{
        cartonNumber: String,
        quantity: Number,
        sizes: String,
        colors: String,
        grossWeight: Number,
        netWeight: Number,
        sealNumber: String
    }],

    shippingDetails: {
        totalCartons: Number,
        totalPieces: Number,
        totalGrossWeight: Number,
        totalNetWeight: Number,
        totalVolume: Number,
        freightCharge: Number,
        insuranceAmount: Number,
        handlingCharges: Number
    },

    invoice: {
        invoiceNumber: String,
        invoiceDate: Date,
        invoiceType: String,
        items: [{
            description: String,
            hsnCode: String,
            quantity: Number,
            unit: String,
            rate: Number,
            taxableValue: Number,
            gstRate: Number,
            gstAmount: Number,
            totalValue: Number
        }],
        summary: {
            totalTaxable: Number,
            totalGst: Number,
            totalInvoiceValue: Number,
            freightCharges: Number,
            insuranceCharges: Number,
            grandTotal: Number
        },
        amountInWords: String,
        paymentTerms: String,
        dueDate: Date
    },

    tracking: {
        trackingNumber: String,
        carrier: String,
        status: String,
        url: String,
        updates: [{
            timestamp: { type: Date, default: Date.now },
            location: String,
            status: String,
            remarks: String
        }]
    },

    pod: {
        receivedBy: String,
        receivedDate: Date,
        signature: String, // String representation or path to file
        stamp: { type: Boolean, default: false },
        hasShortages: { type: Boolean, default: false },
        hasDamages: { type: Boolean, default: false },
        remarks: String
    },

    dispatchedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['Dispatched', 'In Transit', 'Delivered', 'Cancelled'], default: 'Dispatched' }
}, {
    timestamps: true
});

export default mongoose.models.Dispatch || mongoose.model<IDispatch>('Dispatch', DispatchSchema);
