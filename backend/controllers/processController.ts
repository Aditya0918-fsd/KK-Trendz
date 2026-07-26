import { Request, Response } from 'express';
import Process from '../models/Process';

export const getProcesses = async (req: Request, res: Response): Promise<void> => {
    try {
        const processes = await Process.find().populate('createdBy');
        res.json(processes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createProcess = async (req: Request, res: Response): Promise<void> => {
    try {
        const process = new Process({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const savedProcess = await process.save();
        res.status(201).json(savedProcess);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateProcess = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedProcess = await Process.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProcess);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteProcess = async (req: Request, res: Response): Promise<void> => {
    try {
        await Process.findByIdAndDelete(req.params.id);
        res.json({ message: 'Process deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
