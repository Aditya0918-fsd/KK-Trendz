import { Request, Response } from 'express';
import JobWorkOrder from '../models/JobWorkOrder';
import MaterialIssue from '../models/MaterialIssue';
import JobWorkReceipt from '../models/JobWorkReceipt';
import Product from '../models/Product';
import InventoryTransaction from '../models/InventoryTransaction';

// --- Job Work Order Controllers ---

export const getJWOs = async (req: Request, res: Response): Promise<void> => {
    try {
        const jwos = await JobWorkOrder.find()
            .populate('jobWorkerId createdBy inputMaterials.materialId')
            .sort({ createdAt: -1 });
        res.json(jwos);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createJWO = async (req: Request, res: Response): Promise<void> => {
    try {
        const jwo = new JobWorkOrder({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const savedJwo = await jwo.save();
        res.status(201).json(savedJwo);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateJWO = async (req: Request, res: Response): Promise<void> => {
    try {
        const jwo = await JobWorkOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!jwo) {
            res.status(404).json({ message: 'Job Work Order not found' });
            return;
        }
        res.json(jwo);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteJWO = async (req: Request, res: Response): Promise<void> => {
    try {
        // Check if issues exist for this order
        const issueExists = await MaterialIssue.findOne({ jwoId: req.params.id });
        if (issueExists) {
            res.status(400).json({ message: 'Cannot delete Order. Material Issue already exists.' });
            return;
        }

        const jwo = await JobWorkOrder.findByIdAndDelete(req.params.id);
        if (!jwo) {
            res.status(404).json({ message: 'Job Work Order not found' });
            return;
        }
        res.json({ message: 'Job Work Order deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Material Issue Controllers ---

export const getMaterialIssues = async (req: Request, res: Response): Promise<void> => {
    try {
        const issues = await MaterialIssue.find()
            .populate('jwoId issuedBy items.materialId items.fromLocation')
            .sort({ createdAt: -1 });
        res.json(issues);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createMaterialIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const issue = new MaterialIssue({
            ...req.body,
            issuedBy: (req as any).user?._id
        });
        const savedIssue = await issue.save();

        // 1. Update JWO status to 'Issued'
        await JobWorkOrder.findByIdAndUpdate(req.body.jwoId, { status: 'Issued' });

        // 2. Reduce Stock from Location
        for (const item of req.body.items) {
            if (item.materialId && item.quantity > 0) {
                const product = await Product.findById(item.materialId);
                if (product) {
                    product.inventory.currentStock -= item.quantity;
                    if (item.fromLocation) {
                        const locIndex = product.inventory.stockLocation.findIndex(
                            (l: any) => l.locationId.toString() === item.fromLocation.toString()
                        );
                        if (locIndex !== -1) {
                            product.inventory.stockLocation[locIndex].quantity -= item.quantity;
                        }
                    }
                    await product.save();

                    // 3. Create Inventory Transaction
                    await InventoryTransaction.create({
                        materialId: item.materialId,
                        transactionType: 'JobWorkIssue',
                        referenceId: savedIssue._id,
                        referenceModel: 'MaterialIssue',
                        quantity: item.quantity,
                        unit: item.unit,
                        locationId: item.fromLocation,
                        batchNumber: item.batchNumber,
                        remarks: `Material Issue: ${savedIssue.issueNumber}`
                    });
                }
            }
        }

        res.status(201).json(savedIssue);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateMaterialIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const issue = await MaterialIssue.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!issue) {
            res.status(404).json({ message: 'Material Issue not found' });
            return;
        }
        res.json(issue);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteMaterialIssue = async (req: Request, res: Response): Promise<void> => {
    try {
        const issue = await MaterialIssue.findById(req.params.id);
        if (!issue) {
            res.status(404).json({ message: 'Material Issue not found' });
            return;
        }

        // Check if receipts exist for this JWO (using issue.jwoId)
        const receiptExists = await JobWorkReceipt.findOne({ jwoId: issue.jwoId });
        if (receiptExists) {
            res.status(400).json({ message: 'Cannot delete Issue. Receipt already exists for this JWO.' });
            return;
        }

        // Revert Stock
        for (const item of issue.items) {
            if (item.materialId && item.quantity > 0) {
                const product = await Product.findById(item.materialId);
                if (product) {
                    product.inventory.currentStock += item.quantity;
                    if (item.fromLocation) {
                        const locIndex = product.inventory.stockLocation.findIndex(
                            (l: any) => l.locationId.toString() === item.fromLocation.toString()
                        );
                        if (locIndex !== -1) {
                            product.inventory.stockLocation[locIndex].quantity += item.quantity;
                        }
                    }
                    await product.save();
                }
            }
        }

        // 2. Delete associated inventory transactions
        await InventoryTransaction.deleteMany({ referenceId: issue._id, referenceModel: 'MaterialIssue' });

        // Update JWO status back to 'Created'
        await JobWorkOrder.findByIdAndUpdate(issue.jwoId, { status: 'Created' });

        await MaterialIssue.findByIdAndDelete(req.params.id);
        res.json({ message: 'Material Issue deleted and stock reverted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Job Work Receipt Controllers ---

export const getJobWorkReceipts = async (req: Request, res: Response): Promise<void> => {
    try {
        const receipts = await JobWorkReceipt.find()
            .populate('jwoId issueId jobWorkerId receivedBy outputMaterials.materialId outputMaterials.storageLocation')
            .sort({ createdAt: -1 });
        res.json(receipts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createJobWorkReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
        const receipt = new JobWorkReceipt({
            ...req.body,
            receivedBy: (req as any).user?._id
        });
        const savedReceipt = await receipt.save();

        // 1. Update JWO status to 'Received'
        await JobWorkOrder.findByIdAndUpdate(req.body.jwoId, { status: 'Received' });

        // 2. Update Product Inventory
        for (const material of req.body.outputMaterials) {
            if (material.materialId && material.acceptedQuantity > 0) {
                const product = await Product.findById(material.materialId);
                if (product) {
                    product.inventory.currentStock += material.acceptedQuantity;
                    if (material.storageLocation) {
                        const existingLoc = product.inventory.stockLocation.find(
                            (l: any) => l.locationId.toString() === material.storageLocation.toString()
                        );
                        if (existingLoc) {
                            existingLoc.quantity += material.acceptedQuantity;
                        } else {
                            product.inventory.stockLocation.push({
                                locationId: material.storageLocation,
                                quantity: material.acceptedQuantity,
                                binNumber: material.binNumber || ''
                            });
                        }
                    }
                    await product.save();

                    // 3. Create Inventory Transaction
                    await InventoryTransaction.create({
                        materialId: material.materialId,
                        transactionType: 'JobWorkReturn',
                        referenceId: savedReceipt._id,
                        referenceModel: 'JobWorkReceipt',
                        quantity: material.acceptedQuantity,
                        unit: material.unit || 'Kgs',
                        locationId: material.storageLocation,
                        remarks: `JobWork Receipt: ${savedReceipt.receiptNo}`
                    });
                }
            }
        }

        res.status(201).json(savedReceipt);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateJobWorkReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
        const receipt = await JobWorkReceipt.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!receipt) {
            res.status(404).json({ message: 'Receipt not found' });
            return;
        }
        res.json(receipt);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteJobWorkReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
        const receipt = await JobWorkReceipt.findById(req.params.id);
        if (!receipt) {
            res.status(404).json({ message: 'Receipt not found' });
            return;
        }

        // Revert Stock (Subtract what was added)
        for (const material of receipt.outputMaterials) {
            if (material.materialId && material.acceptedQuantity > 0) {
                const product = await Product.findById(material.materialId);
                if (product) {
                    product.inventory.currentStock -= material.acceptedQuantity;
                    if (material.storageLocation) {
                        const existingLoc = product.inventory.stockLocation.find(
                            (l: any) => l.locationId.toString() === material.storageLocation.toString()
                        );
                        if (existingLoc) {
                            existingLoc.quantity -= material.acceptedQuantity;
                        }
                    }
                    await product.save();
                }
            }
        }

        // 2. Delete associated inventory transactions
        await InventoryTransaction.deleteMany({ referenceId: receipt._id, referenceModel: 'JobWorkReceipt' });

        // Update JWO status back to 'Issued'
        await JobWorkOrder.findByIdAndUpdate(receipt.jwoId, { status: 'Issued' });

        await JobWorkReceipt.findByIdAndDelete(req.params.id);
        res.json({ message: 'Receipt deleted and stock adjusted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
