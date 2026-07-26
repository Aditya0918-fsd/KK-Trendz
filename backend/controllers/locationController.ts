import { Request, Response } from 'express';
import Location from '../models/Location';

export const getLocations = async (req: Request, res: Response): Promise<void> => {
    try {
        const locations = await Location.find().populate('inchargeId alternateIncharge authorizedPersons');
        res.json(locations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const location = new Location(req.body);
        const savedLocation = await location.save();
        res.status(201).json(savedLocation);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedLocation = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedLocation);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        await Location.findByIdAndDelete(req.params.id);
        res.json({ message: 'Location deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
