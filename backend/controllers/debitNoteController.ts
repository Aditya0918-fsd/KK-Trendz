import { Request, Response } from 'express';
import DebitNote from '../models/DebitNote';
import PurchaseInvoice from '../models/PurchaseInvoice';

export const getDebitNotes = async (req: Request, res: Response) => {
    try {
        const debitNotes = await DebitNote.find()
            .populate('supplierId referenceInvoiceId items.productId audit.createdBy')
            .sort({ createdAt: -1 });
        res.json({ debitNotes });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createDebitNote = async (req: Request, res: Response) => {
    try {
        const dn = new DebitNote({
            ...req.body,
            audit: {
                createdBy: (req as any).user?._id,
                createdAt: new Date()
            }
        });
        const savedDn = await dn.save();

        // Update purchase invoice total if adjusted immediately
        if (req.body.status === 'Adjusted' || req.body.status === 'Generated') {
            await PurchaseInvoice.findByIdAndUpdate(req.body.referenceInvoiceId, {
                $inc: { 'summary.netPayable': -req.body.summary.totalDebitNoteValue }
            });
        }

        res.status(201).json(savedDn);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateDebitNoteStatus = async (req: Request, res: Response) => {
    try {
        const updated = await DebitNote.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
