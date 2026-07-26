import { Request, Response } from 'express';
import SalesQuotation from '../models/SalesQuotation';
import SalesEnquiry from '../models/SalesEnquiry';

export const getSalesQuotations = async (req: Request, res: Response): Promise<void> => {
    try {
        const quotations = await SalesQuotation.find()
            .populate('customerId', 'partyName')
            .populate('enquiryId', 'enquiryNumber')
            .populate('items.productId', 'productName')
            .sort({ createdAt: -1 });
        res.json(quotations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSalesQuotationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const q = await SalesQuotation.findById(req.params.id)
            .populate('customerId', 'partyName')
            .populate('enquiryId', 'enquiryNumber');
        if (!q) { res.status(404).json({ message: 'Quotation not found' }); return; }
        res.json(q);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createSalesQuotation = async (req: Request, res: Response): Promise<void> => {
    try {
        const q = new SalesQuotation({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const saved = await q.save();

        // If linked to an enquiry, mark it as Converted
        if (req.body.enquiryId) {
            await SalesEnquiry.findByIdAndUpdate(req.body.enquiryId, { status: 'Converted' });
        }

        res.status(201).json(saved);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateSalesQuotation = async (req: Request, res: Response): Promise<void> => {
    try {
        const updated = await SalesQuotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) { res.status(404).json({ message: 'Quotation not found' }); return; }
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteSalesQuotation = async (req: Request, res: Response): Promise<void> => {
    try {
        await SalesQuotation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sales Quotation deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
