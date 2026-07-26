import { Request, Response } from 'express';
import PurchaseEnquiry from '../models/PurchaseEnquiry';

export const getEnquiries = async (req: Request, res: Response): Promise<void> => {
    try {
        const enquiries = await PurchaseEnquiry.find()
            .populate('suppliers items.productId createdBy')
            .sort({ createdAt: -1 });
        res.json(enquiries);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const sendEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        const enquiry = await PurchaseEnquiry.findById(req.params.id);
        if (!enquiry) {
            res.status(404).json({ message: 'Enquiry not found' });
            return;
        }

        // Mock sending logic (e.g. email/SMS integrations would go here)
        enquiry.status = 'Sent';
        await enquiry.save();

        res.json({ message: 'Enquiry sent successfully to suppliers' });
    } catch (error: any) {
        console.error('SERVER ERROR ON SEND:', error);
        res.status(500).json({ message: `Full Error: ${error.message} - Stack: ${error.stack}` });
    }
};

export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        const enquiry = new PurchaseEnquiry({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const savedEnquiry = await enquiry.save();
        res.status(201).json(savedEnquiry);
    } catch (error: any) {
        console.error('CREATE ENQUIRY ERROR:', error);
        res.status(400).json({ message: error.message });
    }
};

export const updateEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedEnquiry = await PurchaseEnquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEnquiry);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        await PurchaseEnquiry.findByIdAndDelete(req.params.id);
        res.json({ message: 'Enquiry deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

import PurchaseQuotation from '../models/PurchaseQuotation';

export const getEnquiryComparison = async (req: Request, res: Response): Promise<void> => {
    try {
        const enquiry = await PurchaseEnquiry.findById(req.params.id)
            .populate('items.productId');

        if (!enquiry) {
            res.status(404).json({ message: 'Enquiry not found' });
            return;
        }

        const quotations = await PurchaseQuotation.find({ enquiryId: req.params.id })
            .populate('supplierId items.productId');

        res.json({
            enquiry,
            quotations
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
