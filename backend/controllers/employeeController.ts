import { Request, Response } from 'express';
import Employee from '../models/Employee';

export const getEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        const employees = await Employee.find().populate('employment.reportingTo performance.reviewedBy createdBy');
        res.json(employees);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const employee = new Employee({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const savedEmployee = await employee.save();
        res.status(201).json(savedEmployee);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEmployee);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ message: 'Employee deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
