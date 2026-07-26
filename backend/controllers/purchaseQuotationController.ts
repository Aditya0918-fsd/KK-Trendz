import { Request, Response } from 'express';
import PurchaseQuotation from '../models/PurchaseQuotation';

export const getQuotations = async (req: Request, res: Response): Promise<void> => {
    try {
        const quotations = await PurchaseQuotation.find()
            .populate('supplierId enquiryId items.productId createdBy')
            .sort({ createdAt: -1 });
        res.json(quotations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const acceptQuotation = async (req: Request, res: Response): Promise<void> => {
    try {
        const quotation = await PurchaseQuotation.findById(req.params.id);
        if (!quotation) {
            res.status(404).json({ message: 'Quotation not found' });
            return;
        }

        quotation.status = 'Accepted';
        await quotation.save();

        if (quotation.enquiryId) {
            // Auto-reject other pending quotations for the same enquiry
            await PurchaseQuotation.updateMany(
                {
                    enquiryId: quotation.enquiryId,
                    _id: { $ne: quotation._id },
                    status: 'Pending'
                },
                { status: 'Rejected' }
            );
        }

        res.json({ message: 'Quotation accepted. Competing quotations have been rejected.' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createQuotation = async (req: Request, res: Response): Promise<void> => {
    try {
        const quotation = new PurchaseQuotation({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const savedQuotation = await quotation.save();
        res.status(201).json(savedQuotation);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateQuotation = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedQuotation = await PurchaseQuotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedQuotation);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteQuotation = async (req: Request, res: Response): Promise<void> => {
    try {
        await PurchaseQuotation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Quotation deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
