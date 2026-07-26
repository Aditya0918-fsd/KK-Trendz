import { Request, Response } from 'express';
import SalesOrder from '../models/SalesOrder';
import SalesQuotation from '../models/SalesQuotation';
import Product from '../models/Product';
import PurchaseRequisition from '../models/PurchaseRequisition';

export const getSalesOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const orders = await SalesOrder.find()
            .populate('customerId', 'partyName')
            .populate('quotationId', 'quotationNumber')
            .populate('items.productId', 'productName')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSalesOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
        const order = await SalesOrder.findById(req.params.id)
            .populate('customerId', 'partyName')
            .populate('items.productId', 'productName');
        if (!order) { res.status(404).json({ message: 'Sales Order not found' }); return; }
        res.json(order);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createSalesOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const order = new SalesOrder({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const saved = await order.save();

        // Mark linked quotation as Accepted
        if (req.body.quotationId) {
            await SalesQuotation.findByIdAndUpdate(req.body.quotationId, { status: 'Accepted' });
        }

        // --- AUTOMATIC MATERIAL REQUIREMENT CALCULATION ---
        try {
            const shortageItems: any[] = [];
            
            for (const item of saved.items) {
                const productWithBom = await Product.findById(item.productId);
                if (productWithBom && productWithBom.bom && productWithBom.bom.length > 0) {
                    for (const material of productWithBom.bom) {
                        let computedQuantity = 0;
                        
                        // Check for size-wise consumption
                        if (material.consumptionDifferencesBySize && material.consumptionDifferencesBySize.length > 0 && item.sizeBreakup && item.sizeBreakup.length > 0) {
                            for (const sizeInfo of item.sizeBreakup) {
                                const sizeDiff = material.consumptionDifferencesBySize.find((c: any) => c.size === sizeInfo.size);
                                const perPiece = sizeDiff ? sizeDiff.quantity : material.quantityPerProduct;
                                computedQuantity += (perPiece * sizeInfo.quantity);
                            }
                        } else {
                            computedQuantity = material.quantityPerProduct * item.orderQuantity;
                        }

                        // Apply wastage percentage
                        const totalRequired = computedQuantity * (1 + (material.wastagePercentage || 0) / 100);

                        // Check current inventory for material
                        const matProduct = await Product.findById(material.materialId);
                        if (matProduct) {
                            const availableStock = matProduct.inventory?.currentStock || 0;
                            
                            // If shortage exists, record it
                            if (totalRequired > availableStock) {
                                // Accumulate similar materials
                                const existingShortage = shortageItems.find(s => s.materialId.toString() === material.materialId.toString());
                                
                                if (existingShortage) {
                                    existingShortage.requiredQuantity += totalRequired;
                                    existingShortage.shortageQuantity = existingShortage.requiredQuantity - availableStock;
                                } else {
                                    shortageItems.push({
                                        materialId: material.materialId,
                                        materialName: matProduct.productName,
                                        requiredQuantity: totalRequired,
                                        availableStock: availableStock,
                                        shortageQuantity: totalRequired - availableStock,
                                        unit: matProduct.inventory?.unitOfMeasure || material.unit
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // Generate Purchase Requisition if shortage exists
            if (shortageItems.length > 0) {
                const PR_Count = await PurchaseRequisition.countDocuments();
                const prReq = new PurchaseRequisition({
                    requisitionNumber: `PR-SYS-${new Date().getFullYear()}-${(PR_Count + 1).toString().padStart(4, '0')}`,
                    generatedBy: 'System_Shortage',
                    referenceSalesOrderId: saved._id,
                    requiredDeliveryDate: saved.deliveryDate, 
                    items: shortageItems,
                    status: 'Pending Approval',
                    createdBy: (req as any).user?._id
                });
                await prReq.save();
                console.log(`System generated Purchase Requisition ${prReq.requisitionNumber} from Sales Order Shortage`);
            }

        } catch (autoErr) {
            console.error("Error during automatic BOM calculation & PR generation: ", autoErr);
        }
        // ------------------------------------------------

        res.status(201).json(saved);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateSalesOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const updated = await SalesOrder.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedBy: (req as any).user?._id },
            { new: true }
        );
        if (!updated) { res.status(404).json({ message: 'Sales Order not found' }); return; }
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteSalesOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        await SalesOrder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sales Order deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
