import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    productCode: string;
    productCategory: string;
    productSubCategory: string;
    productName: string;
    productDescription: string;
    hsnCode: string;
    sacCode: string;
    images: Array<{
        url: string;
        isDefault: boolean;
        caption: string;
    }>;
    specifications: {
        yarn?: any;
        fabric?: any;
        garment?: any;
        thread?: any;
        button?: any;
        packing?: any;
    };
    inventory: {
        unitOfMeasure: string;
        conversionFactors: Array<{
            fromUnit: string;
            toUnit: string;
            factor: number;
        }>;
        reorderLevel: number;
        reorderQuantity: number;
        safetyStock: number;
        currentStock: number;
        stockLocation: Array<{
            locationId: mongoose.Types.ObjectId;
            quantity: number;
            binNumber: string;
        }>;
        batchTracking: boolean;
        serialTracking: boolean;
        expiryTracking: boolean;
    };
    pricing: Array<{
        partyType: string;
        priceList: string;
        rate: number;
        currency: string;
        effectiveFrom: Date;
        effectiveTo: Date;
        discountAllowed: number;
        minOrderQuantity: number;
    }>;
    costing: {
        standardCost: number;
        averageCost: number;
        lastPurchaseRate: number;
        manufacturingCost: {
            materialCost: number;
            laborCost: number;
            overheadCost: number;
            total: number;
        };
    };
    qualityParameters: Array<{
        parameter: string;
        standardValue: any;
        toleranceMin: any;
        toleranceMax: any;
        unit: string;
        testMethod: string;
    }>;
    bom: Array<{
        materialId: mongoose.Types.ObjectId;
        quantityPerProduct: number;
        unit: string;
        wastagePercentage?: number;
        consumptionDifferencesBySize?: Array<{
            size: string;
            quantity: number;
        }>;
    }>;
    status: string;
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
}

const ProductSchema: Schema = new Schema(
    {
        productCode: { type: String, required: true, unique: true },
        productCategory: { type: String, required: true },
        productSubCategory: String,
        productName: { type: String, required: true },
        productDescription: String,
        hsnCode: String,
        sacCode: String,
        images: [{
            url: String,
            isDefault: Boolean,
            caption: String
        }],
        specifications: {
            yarn: Schema.Types.Mixed,
            fabric: Schema.Types.Mixed,
            garment: Schema.Types.Mixed,
            thread: Schema.Types.Mixed,
            button: Schema.Types.Mixed,
            packing: Schema.Types.Mixed
        },
        inventory: {
            unitOfMeasure: { type: String, required: true },
            conversionFactors: [{
                fromUnit: String,
                toUnit: String,
                factor: Number
            }],
            reorderLevel: Number,
            reorderQuantity: Number,
            safetyStock: Number,
            currentStock: { type: Number, default: 0 },
            stockLocation: [{
                locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
                quantity: Number,
                binNumber: String
            }],
            batchTracking: Boolean,
            serialTracking: Boolean,
            expiryTracking: Boolean
        },
        pricing: [{
            partyType: String,
            priceList: String,
            rate: Number,
            currency: { type: String, default: 'INR' },
            effectiveFrom: Date,
            effectiveTo: Date,
            discountAllowed: Number,
            minOrderQuantity: Number
        }],
        costing: {
            standardCost: Number,
            averageCost: Number,
            lastPurchaseRate: Number,
            manufacturingCost: {
                materialCost: Number,
                laborCost: Number,
                overheadCost: Number,
                total: Number
            }
        },
        qualityParameters: [{
            parameter: String,
            standardValue: Schema.Types.Mixed,
            toleranceMin: Schema.Types.Mixed,
            toleranceMax: Schema.Types.Mixed,
            unit: String,
            testMethod: String
        }],
        bom: [{
            materialId: { type: Schema.Types.ObjectId, ref: 'Product' },
            quantityPerProduct: { type: Number, required: true },
            unit: { type: String, required: true },
            wastagePercentage: { type: Number, default: 0 },
            consumptionDifferencesBySize: [{
                size: String,
                quantity: Number
            }]
        }],
        status: { type: String, default: 'Active' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

// ─── Pre-save hook to handle category-specific logic ───
ProductSchema.pre('save', function(this: any) {
    if (this.productCategory !== 'Garment') {
        this.bom = [];
    }
});

// ─── Pre-findOneAndUpdate hook to handle updates ───
ProductSchema.pre('findOneAndUpdate', function(this: any) {
    const update = this.getUpdate();
    if (update && update.productCategory && update.productCategory !== 'Garment') {
        update.bom = [];
    }
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
