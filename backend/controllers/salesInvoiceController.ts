import { Request, Response } from 'express';
import SalesInvoice from '../models/SalesInvoice';

// @desc    Get all sales invoices
// @route   GET /api/sales-invoices
export const getSalesInvoices = async (req: Request, res: Response) => {
    try {
        const records = await SalesInvoice.find()
            .populate('orderId')
            .populate('customerId')
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single sales invoice
// @route   GET /api/sales-invoices/:id
export const getSalesInvoiceById = async (req: Request, res: Response) => {
    try {
        const record = await SalesInvoice.findById(req.params.id)
            .populate('orderId')
            .populate('customerId')
            .populate('dispatchId')
            .populate('items.productId');
        if (record) {
            res.json(record);
        } else {
            res.status(404).json({ message: 'Sales invoice not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create sales invoice
// @route   POST /api/sales-invoices
export const createSalesInvoice = async (req: Request, res: Response) => {
    try {
        const record = await SalesInvoice.create(req.body);
        res.status(201).json(record);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update sales invoice
// @route   PUT /api/sales-invoices/:id
export const updateSalesInvoice = async (req: Request, res: Response) => {
    try {
        const record = await SalesInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (record) {
            res.json(record);
        } else {
            res.status(404).json({ message: 'Sales invoice not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete sales invoice
// @route   DELETE /api/sales-invoices/:id
export const deleteSalesInvoice = async (req: Request, res: Response) => {
    try {
        const record = await SalesInvoice.findByIdAndDelete(req.params.id);
        if (record) {
            res.json({ message: 'Sales invoice deleted' });
        } else {
            res.status(404).json({ message: 'Sales invoice not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
