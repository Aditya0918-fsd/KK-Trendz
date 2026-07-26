import { Request, Response } from 'express';
import QualityControl from '../models/QualityControl';

// @desc    Get all quality control records
// @route   GET /api/quality-control
// @access  Private
export const getQualityControls = async (req: Request, res: Response) => {
    try {
        const qualityControls = await QualityControl.find()
            .populate('orderId', 'orderNumber')
            .populate('checkerId', 'employeeName')
            .populate('supervisorId', 'employeeName')
            .sort({ createdAt: -1 });
        res.status(200).json(qualityControls);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single quality control record
// @route   GET /api/quality-control/:id
// @access  Private
export const getQualityControlById = async (req: Request, res: Response) => {
    try {
        const qualityControl = await QualityControl.findById(req.params.id)
            .populate('orderId')
            .populate('checkerId')
            .populate('supervisorId')
            .populate('inputBundles.finishingId')
            .populate('inputBundles.issuedFrom')
            .populate('rejectedItems.storedAt')
            .populate('outputStorage.storedAt')
            .populate('outputStorage.storedBy')
            .populate('qualityCertificate.issuedBy');

        if (!qualityControl) {
            return res.status(404).json({ message: 'Quality control record not found' });
        }
        res.status(200).json(qualityControl);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create quality control record
// @route   POST /api/quality-control
// @access  Private
export const createQualityControl = async (req: Request, res: Response) => {
    try {
        const newQualityControl = new QualityControl(req.body);
        const savedQualityControl = await newQualityControl.save();
        res.status(201).json(savedQualityControl);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update quality control record
// @route   PUT /api/quality-control/:id
// @access  Private
export const updateQualityControl = async (req: Request, res: Response) => {
    try {
        const updatedQualityControl = await QualityControl.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedQualityControl) {
            return res.status(404).json({ message: 'Quality control record not found' });
        }
        res.status(200).json(updatedQualityControl);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete quality control record
// @route   DELETE /api/quality-control/:id
// @access  Private
export const deleteQualityControl = async (req: Request, res: Response) => {
    try {
        const qualityControl = await QualityControl.findByIdAndDelete(req.params.id);
        if (!qualityControl) {
            return res.status(404).json({ message: 'Quality control record not found' });
        }
        res.status(200).json({ message: 'Quality control record deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
