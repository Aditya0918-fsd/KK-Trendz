import { Request, Response } from 'express';
import mongoose from 'mongoose';
import BOM from '../models/BOM';

export const getBOMs = async (req: Request, res: Response): Promise<void> => {
    try {
        const boms = await BOM.find()
            .populate('productId', 'productName productCode')
            .populate('materials.materialId', 'productName productCode inventory.unitOfMeasure')
            .sort({ createdAt: -1 });
        res.json(boms);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getBOMById = async (req: Request, res: Response): Promise<void> => {
    try {
        const bom = await BOM.findById(req.params.id)
            .populate('productId', 'productName productCode')
            .populate('materials.materialId', 'productName productCode inventory.unitOfMeasure');
        if (!bom) { res.status(404).json({ message: 'BOM not found' }); return; }
        res.json(bom);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getBOMByProductId = async (req: Request, res: Response): Promise<void> => {
    try {
        const bom = await BOM.findOne({ productId: req.params.productId, isActive: true })
            .populate('productId', 'productName productCode')
            .populate('materials.materialId', 'productName productCode inventory.unitOfMeasure');
        if (!bom) { res.status(404).json({ message: 'Active BOM not found for this product' }); return; }
        res.json(bom);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createBOM = async (req: Request, res: Response): Promise<void> => {
    try {
        const existingBom = await BOM.findOne({ productId: req.body.productId, isActive: true });
        
        // Disable existing active BOMs if a new active one is being created
        if (existingBom && req.body.isActive) {
            existingBom.isActive = false;
            await existingBom.save();
        }

        const bom = new BOM({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const saved = await bom.save();
        res.status(201).json(saved);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateBOM = async (req: Request, res: Response): Promise<void> => {
    try {
        if (req.body.isActive && req.body.productId) {
           const existingBom = await BOM.findOne({ productId: req.body.productId, _id: { $ne: new mongoose.Types.ObjectId(req.params.id as string) }, isActive: true });
           if (existingBom) {
               existingBom.isActive = false;
               await existingBom.save();
           }
        }

        const updated = await BOM.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: (req as any).user?._id },
            { new: true }
        );
        if (!updated) { res.status(404).json({ message: 'BOM not found' }); return; }
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteBOM = async (req: Request, res: Response): Promise<void> => {
    try {
        await BOM.findByIdAndDelete(req.params.id);
        res.json({ message: 'BOM deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
