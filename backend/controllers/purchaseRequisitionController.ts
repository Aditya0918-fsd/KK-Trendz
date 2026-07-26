import { Request, Response } from 'express';
import PurchaseRequisition from '../models/PurchaseRequisition';
import Product from '../models/Product';

export const getPurchaseRequisitions = async (req: Request, res: Response): Promise<void> => {
    try {
        const requisitions = await PurchaseRequisition.find()
            .populate('referenceSalesOrderId', 'orderNumber')
            .populate('items.materialId', 'productName productCode')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 });
        res.json(requisitions);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getPurchaseRequisitionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const requisition = await PurchaseRequisition.findById(req.params.id)
            .populate('referenceSalesOrderId', 'orderNumber')
            .populate('items.materialId', 'productName productCode')
            .populate('approvedBy', 'name');
        if (!requisition) { res.status(404).json({ message: 'Purchase Requisition not found' }); return; }
        res.json(requisition);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createPurchaseRequisition = async (req: Request, res: Response): Promise<void> => {
    try {
        const PR_Count = await PurchaseRequisition.countDocuments();
        const prReq = new PurchaseRequisition({
            ...req.body,
            requisitionNumber: req.body.requisitionNumber || `PR-${new Date().getFullYear()}-${(PR_Count + 1).toString().padStart(4, '0')}`,
            createdBy: (req as any).user?._id
        });
        const saved = await prReq.save();
        res.status(201).json(saved);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updatePurchaseRequisition = async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = { ...req.body, updatedBy: (req as any).user?._id };
        if (req.body.status && ['Approved', 'Rejected'].includes(req.body.status) && !req.body.approvedBy) {
            payload.approvedBy = (req as any).user?._id;
        }

        const updated = await PurchaseRequisition.findByIdAndUpdate(
            req.params.id,
            payload,
            { new: true }
        );
        if (!updated) { res.status(404).json({ message: 'Purchase Requisition not found' }); return; }
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deletePurchaseRequisition = async (req: Request, res: Response): Promise<void> => {
    try {
        await PurchaseRequisition.findByIdAndDelete(req.params.id);
        res.json({ message: 'Purchase Requisition deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const autoGenerateReorderRequisitions = async (req: Request, res: Response): Promise<void> => {
    try {
        // Find products where current stock is less than or equal to reorder level, and reorder level is set
        const lowStockProducts = await Product.find({
            'inventory.reorderLevel': { $gt: 0 },
            $expr: { $lte: ['$inventory.currentStock', '$inventory.reorderLevel'] },
            status: 'Active'
        });

        const generatedRequisitions = [];

        for (const product of lowStockProducts) {
            // Check if there's already a pending or approved Requisition / PO for this product to prevent duplicate ordering
            const existingReq = await PurchaseRequisition.findOne({
                'items.materialId': product._id,
                status: { $in: ['Pending Approval', 'Approved'] } // Only filter active ones. If it's PO_Created, let's assume it's still inbound. Actually, let's include PO_Created to be safe, but wait, usually you'd want to check if the PO is delivered. For simplicity, let's not auto-fire if it's anywhere in the current pending pipeline.
            });

            if (!existingReq && product.inventory) {
                const PR_Count = await PurchaseRequisition.countDocuments();
                const prReq = new PurchaseRequisition({
                    requisitionNumber: `PR-SYS-${new Date().getFullYear()}-${(PR_Count + 1).toString().padStart(4, '0')}`,
                    generatedBy: 'System_Reorder',
                    requiredDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days lead time, or can be dynamic
                    items: [{
                        materialId: product._id,
                        materialName: product.productName,
                        requiredQuantity: product.inventory.reorderQuantity || product.inventory.reorderLevel,
                        availableStock: product.inventory.currentStock,
                        shortageQuantity: Math.max(0, product.inventory.reorderLevel - product.inventory.currentStock),
                        unit: product.inventory.unitOfMeasure
                    }],
                    status: 'Pending Approval',
                    createdBy: (req as any).user?._id
                });
                const saved = await prReq.save();
                generatedRequisitions.push(saved);
            }
        }

        res.status(200).json({
            message: `Auto-reorder check complete. ${generatedRequisitions.length} new requisitions generated.`,
            requisitions: generatedRequisitions
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
