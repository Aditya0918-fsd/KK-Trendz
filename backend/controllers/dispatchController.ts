import { Request, Response } from 'express';
import Dispatch from '../models/Dispatch';
import Product from '../models/Product';
import Packing from '../models/Packing';
import InventoryTransaction from '../models/InventoryTransaction';

// @desc    Get all dispatch records
// @route   GET /api/dispatch
export const getDispatches = async (req: Request, res: Response) => {
    try {
        const records = await Dispatch.find()
            .populate('orderId')
            .populate('customerId')
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single dispatch record
// @route   GET /api/dispatch/:id
export const getDispatchById = async (req: Request, res: Response) => {
    try {
        const record = await Dispatch.findById(req.params.id)
            .populate('orderId')
            .populate('customerId')
            .populate('packingId')
            .populate('items.productId');
        if (record) {
            res.json(record);
        } else {
            res.status(404).json({ message: 'Dispatch record not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create dispatch record
// @route   POST /api/dispatch
export const createDispatch = async (req: Request, res: Response) => {
    try {
        const record = new Dispatch({
            ...req.body,
            dispatchedBy: (req as any).user?._id
        });
        const savedRecord = await record.save();

        // 1. Fetch Location from Packing record if available
        let locationId = null;
        if (req.body.packingId) {
            const packing = await Packing.findById(req.body.packingId);
            locationId = packing?.outputStorage?.storedAt;
        }

        // 2. Update Product Inventory and create transactions
        if (req.body.items && Array.isArray(req.body.items)) {
            for (const item of req.body.items) {
                if (item.productId && item.quantity > 0) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        // Reduce current stock
                        product.inventory.currentStock = (product.inventory.currentStock || 0) - item.quantity;

                        // Reduce location-wise stock if we have a location
                        if (locationId) {
                            const locEntry = product.inventory.stockLocation.find(
                                (l: any) => l.locationId.toString() === locationId.toString()
                            );
                            if (locEntry) {
                                locEntry.quantity = (locEntry.quantity || 0) - item.quantity;
                            }
                        }
                        await product.save();

                        // 3. Create Inventory Transaction
                        await InventoryTransaction.create({
                            materialId: item.productId,
                            transactionType: 'Dispatch',
                            referenceId: savedRecord._id,
                            referenceModel: 'Dispatch',
                            quantity: item.quantity,
                            unit: item.unit || 'Pieces',
                            ...(locationId ? { locationId } : {}),
                            remarks: `Dispatch: ${savedRecord.dispatchId}`
                        });
                    }
                }
            }
        }

        res.status(201).json(savedRecord);
    } catch (error: any) {
        console.error('Dispatch Create Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update dispatch record
// @route   PUT /api/dispatch/:id
export const updateDispatch = async (req: Request, res: Response) => {
    try {
        const record = await Dispatch.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (record) {
            res.json(record);
        } else {
            res.status(404).json({ message: 'Dispatch record not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete dispatch record
// @route   DELETE /api/dispatch/:id
export const deleteDispatch = async (req: Request, res: Response) => {
    try {
        const record = await Dispatch.findById(req.params.id);
        if (!record) {
            res.status(404).json({ message: 'Dispatch record not found' });
            return;
        }

        // 1. Revert Stock Updates
        let locationId = null;
        if (record.packingId) {
            const packing = await Packing.findById(record.packingId);
            locationId = packing?.outputStorage?.storedAt;
        }

        for (const item of record.items) {
            if (item.productId && item.quantity > 0) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.inventory.currentStock = (product.inventory.currentStock || 0) + item.quantity;
                    if (locationId) {
                        const locEntry = product.inventory.stockLocation.find(
                            (l: any) => l.locationId.toString() === locationId.toString()
                        );
                        if (locEntry) {
                            locEntry.quantity = (locEntry.quantity || 0) + item.quantity;
                        }
                    }
                    await product.save();
                }
            }
        }

        // 2. Delete inventory transactions
        await InventoryTransaction.deleteMany({ referenceId: record._id, referenceModel: 'Dispatch' });

        await Dispatch.findByIdAndDelete(req.params.id);
        res.json({ message: 'Dispatch record deleted and stock reverted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
