import { Request, Response } from 'express';
import OrderAllocation from '../models/OrderAllocation';
import SalesOrder from '../models/SalesOrder';

export const getOrderAllocations = async (req: Request, res: Response): Promise<void> => {
    try {
        const allocations = await OrderAllocation.find()
            .populate('orderId', 'orderNumber')
            .populate('fabricAllocation.productId', 'productName')
            .sort({ createdAt: -1 });
        res.json(allocations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrderAllocationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const allocation = await OrderAllocation.findById(req.params.id)
            .populate('orderId', 'orderNumber')
            .populate('fabricAllocation.productId', 'productName')
            .populate('fabricAllocation.allocatedFrom.location', 'name');
        if (!allocation) {
            res.status(404).json({ message: 'Order Allocation not found' });
            return;
        }
        res.json(allocation);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createOrderAllocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const allocation = new OrderAllocation({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const saved = await allocation.save();

        // Update SalesOrder status to 'Materials Allocated'
        if (req.body.orderId) {
            await SalesOrder.findByIdAndUpdate(req.body.orderId, { status: 'Materials Allocated' });
        }

        res.status(201).json(saved);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateOrderAllocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const updated = await OrderAllocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) {
            res.status(404).json({ message: 'Order Allocation not found' });
            return;
        }
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteOrderAllocation = async (req: Request, res: Response): Promise<void> => {
    try {
        await OrderAllocation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order Allocation deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
