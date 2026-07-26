import { Request, Response } from 'express';
import GRN from '../models/GRN';
import PurchaseOrder from '../models/PurchaseOrder';
import Product from '../models/Product';
import InventoryTransaction from '../models/InventoryTransaction';
import { generateGrnPDF } from '../utils/pdfGenerator';

export const getGRNs = async (req: Request, res: Response): Promise<void> => {
    try {
        const grns = await GRN.find()
            .populate('supplierId poId items.productId items.storageLocation receivedBy checkedBy')
            .sort({ createdAt: -1 });
        res.json(grns);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createGRN = async (req: Request, res: Response): Promise<void> => {
    try {
        const grnData = {
            ...req.body,
            receivedBy: (req as any).user?._id
        };
        const grn = new GRN(grnData);
        const savedGrn = await grn.save();

        // 1. Update Linked Purchase Order and collect rates for products
        let po: any = null;
        if (req.body.poId) {
            po = await PurchaseOrder.findById(req.body.poId);
            if (po) {
                let allItemsCompleted = true;
                for (const grnItem of req.body.items) {
                    if (grnItem.poItemId) {
                        const poItem = po.items.id(grnItem.poItemId);
                        if (poItem) {
                            poItem.receivedQuantity = (poItem.receivedQuantity || 0) + (grnItem.acceptedQuantity || 0);
                            poItem.pendingQuantity = Math.max(0, poItem.orderQuantity - poItem.receivedQuantity);
                            if (poItem.pendingQuantity > 0) allItemsCompleted = false;
                        }
                    }
                }
                // Check all items in PO to see if the whole order is completed
                po.items.forEach((item: any) => { if (item.pendingQuantity > 0) allItemsCompleted = false; });
                po.status = allItemsCompleted ? 'Completed' : 'Partially Received';
                await po.save();
            }
        }

        // 2. Update Product Inventory & Costing
        for (const grnItem of req.body.items) {
            if (grnItem.productId && grnItem.acceptedQuantity > 0) {
                const product = await Product.findById(grnItem.productId);
                if (product) {
                    // Update current stock
                    product.inventory.currentStock = (product.inventory.currentStock || 0) + grnItem.acceptedQuantity;

                    // Update location-wise stock
                    if (grnItem.storageLocation) {
                        const locationId = grnItem.storageLocation;
                        const existingLoc = product.inventory.stockLocation.find(
                            (l: any) => l.locationId.toString() === locationId.toString()
                        );

                        if (existingLoc) {
                            existingLoc.quantity = (existingLoc.quantity || 0) + grnItem.acceptedQuantity;
                        } else {
                            product.inventory.stockLocation.push({
                                locationId: locationId as any,
                                quantity: grnItem.acceptedQuantity,
                                binNumber: grnItem.binNumber || ''
                            });
                        }
                    }

                    // Update Last Purchase Rate from the linked PO
                    if (po) {
                        const poItem = po.items.find((i: any) => i.productId.toString() === grnItem.productId.toString());
                        if (poItem) {
                            product.costing.lastPurchaseRate = poItem.rate;
                        }
                    }

                    await product.save();

                    // 3. Create Inventory Transaction
                    await InventoryTransaction.create({
                        materialId: grnItem.productId,
                        transactionType: req.body.receiptType === 'JobWork Return' ? 'JobWorkReturn' : 'Receipt',
                        referenceId: savedGrn._id,
                        referenceModel: 'GRN',
                        quantity: grnItem.acceptedQuantity,
                        unit: grnItem.unit,
                        ...(grnItem.storageLocation ? { locationId: grnItem.storageLocation } : {}),
                        batchNumber: grnItem.batchNumber,
                        remarks: `GRN: ${savedGrn.grnNumber}`
                    });
                }
            }
        }

        res.status(201).json(savedGrn);
    } catch (error: any) {
        console.error('GRN Create Error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const updateGRN = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedGrn = await GRN.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedGrn);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteGRN = async (req: Request, res: Response): Promise<void> => {
    try {
        const grn = await GRN.findById(req.params.id);
        if (!grn) {
            res.status(404).json({ message: 'GRN not found' });
            return;
        }

        // 1. Revert Stock
        for (const item of grn.items) {
            if (item.productId && item.acceptedQuantity > 0) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.inventory.currentStock -= item.acceptedQuantity;
                    if (item.storageLocation) {
                        const locIndex = product.inventory.stockLocation.findIndex(
                            (l: any) => l.locationId.toString() === item.storageLocation.toString()
                        );
                        if (locIndex !== -1) {
                            product.inventory.stockLocation[locIndex].quantity -= item.acceptedQuantity;
                        }
                    }
                    await product.save();

                }
            }
        }

        // 2. Revert PO Received Quantities
        if (grn.poId) {
            const po = await PurchaseOrder.findById(grn.poId);
            if (po) {
                for (const item of grn.items) {
                    if (item.poItemId) {
                        const poItem = po.items.id(item.poItemId);
                        if (poItem) {
                            poItem.receivedQuantity -= item.acceptedQuantity;
                            poItem.pendingQuantity = Math.max(0, poItem.orderQuantity - poItem.receivedQuantity);
                        }
                    }
                }
                const hasPendingItems = po.items.some((item: any) => item.pendingQuantity > 0);
                const hasReceivedItems = po.items.some((item: any) => item.receivedQuantity > 0);
                
                if (hasReceivedItems) {
                    po.status = hasPendingItems ? 'Partially Received' : 'Completed';
                } else {
                    po.status = 'Ordered';
                }
                await po.save();
            }
        }

        // 3. Delete associated inventory transactions
        await InventoryTransaction.deleteMany({ referenceId: grn._id, referenceModel: 'GRN' });

        await GRN.findByIdAndDelete(req.params.id);
        res.json({ message: 'GRN deleted and stock reverted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const downloadGRN = async (req: Request, res: Response): Promise<void> => {
    try {
        const grn = await GRN.findById(req.params.id)
            .populate('supplierId poId items.productId items.storageLocation receivedBy checkedBy');

        if (!grn) {
            res.status(404).json({ message: 'GRN not found' });
            return;
        }

        const pdfBuffer = await generateGrnPDF(grn);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=GRN_${grn.grnNumber}.pdf`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: error.message });
    }
};
