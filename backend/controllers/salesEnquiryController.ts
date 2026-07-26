import { Request, Response } from 'express';
import SalesEnquiry from '../models/SalesEnquiry';

export const getSalesEnquiries = async (req: Request, res: Response): Promise<void> => {
    try {
        const enquiries = await SalesEnquiry.find()
            .populate('customerId', 'partyName')
            .populate('items.productId', 'productName')
            .populate('followUp.handledBy', 'name')
            .sort({ createdAt: -1 });
        res.json(enquiries);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSalesEnquiryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const enquiry = await SalesEnquiry.findById(req.params.id)
            .populate('customerId', 'partyName')
            .populate('items.productId', 'productName');
        if (!enquiry) { res.status(404).json({ message: 'Enquiry not found' }); return; }
        res.json(enquiry);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createSalesEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('--- CREATE SALES ENQUIRY ---');
        console.log('Incoming Data:', JSON.stringify(req.body, null, 2));
        
        const enquiry = new SalesEnquiry({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        
        const saved = await enquiry.save();
        console.log('Successfully saved enquiry:', saved.enquiryNumber);
        res.status(201).json(saved);
    } catch (error: any) {
        console.error(' Sales Enquiry Create Error:', error.message);
        if (error.errors) {
            console.error('Validation Details:', JSON.stringify(error.errors, null, 2));
        }
        res.status(400).json({ message: error.message });
    }
};

export const updateSalesEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        const updated = await SalesEnquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) { res.status(404).json({ message: 'Enquiry not found' }); return; }
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteSalesEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        await SalesEnquiry.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sales Enquiry deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
