import { Request, Response } from 'express';
import Company from '../models/Company';

export const getCompanies = async (req: Request, res: Response): Promise<void> => {
    try {
        const companies = await Company.find();
        res.json(companies);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        const company = new Company(req.body);
        const savedCompany = await company.save();
        res.status(201).json(savedCompany);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedCompany = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedCompany);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        await Company.findByIdAndDelete(req.params.id);
        res.json({ message: 'Company deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
