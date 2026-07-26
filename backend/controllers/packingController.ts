import { Request, Response } from 'express';
import Packing from '../models/Packing';

// @desc    Get all packing records
// @route   GET /api/packing
export const getPackings = async (req: Request, res: Response) => {
    try {
        const records = await Packing.find()
            .populate('orderId')
            .populate('supervisorId')
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single packing record
// @route   GET /api/packing/:id
export const getPackingById = async (req: Request, res: Response) => {
    try {
        const record = await Packing.findById(req.params.id)
            .populate('orderId')
            .populate('supervisorId')
            .populate('inputBundles.checkingId')
            .populate('packingMaterials.productId');
        if (record) {
            res.json(record);
        } else {
            res.status(404).json({ message: 'Packing record not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create packing record
// @route   POST /api/packing
export const createPacking = async (req: Request, res: Response) => {
    try {
        const record = await Packing.create(req.body);
        res.status(201).json(record);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update packing record
// @route   PUT /api/packing/:id
export const updatePacking = async (req: Request, res: Response) => {
    try {
        const record = await Packing.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (record) {
            res.json(record);
        } else {
            res.status(404).json({ message: 'Packing record not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete packing record
// @route   DELETE /api/packing/:id
export const deletePacking = async (req: Request, res: Response) => {
    try {
        const record = await Packing.findByIdAndDelete(req.params.id);
        if (record) {
            res.json({ message: 'Packing record deleted' });
        } else {
            res.status(404).json({ message: 'Packing record not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
