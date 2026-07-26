import { Request, Response } from 'express';
import Party from '../models/Party';

export const getParties = async (req: Request, res: Response): Promise<void> => {
    try {
        const parties = await Party.find().populate('createdBy updatedBy');
        res.json(parties);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createParty = async (req: Request, res: Response): Promise<void> => {
    try {
        const party = new Party({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const savedParty = await party.save();
        res.status(201).json(savedParty);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateParty = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedParty = await Party.findByIdAndUpdate(req.params.id, {
            ...req.body,
            updatedBy: (req as any).user?._id
        }, { new: true });
        res.json(updatedParty);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteParty = async (req: Request, res: Response): Promise<void> => {
    try {
        await Party.findByIdAndDelete(req.params.id);
        res.json({ message: 'Party deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
