import { Request, Response } from 'express';
import GRN from '../models/GRN';
import MaterialIssue from '../models/MaterialIssue';
import OrderAllocation from '../models/OrderAllocation';
import Product from '../models/Product';
import mongoose from 'mongoose';

export const getStockAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = req.params.productId as string;
        const prodObjectId = new mongoose.Types.ObjectId(productId);

        // 1. Fetch all GRNs for this product
        const grns = await GRN.find({
            'items.productId': prodObjectId,
            status: 'Completed'
        });

        // 2. Fetch all Material Issues for this product
        const issues = await MaterialIssue.find({
            'items.materialId': prodObjectId
        });

        // 3. Fetch all Order Allocations for this product
        const allocations = await OrderAllocation.find({
            'fabricAllocation.productId': prodObjectId
        });

        // Structure to hold available stock by batch and roll
        const stockData: any[] = [];

        grns.forEach(grn => {
            grn.items.forEach(item => {
                if (item.productId.toString() === productId) {
                    const batchNum = item.batchNumber || 'N/A';

                    if (item.fabricRolls && item.fabricRolls.length > 0) {
                        // Handle Roll-wise tracking
                        item.fabricRolls.forEach(roll => {
                            let availableWeight = roll.weight;

                            // Deduct issues
                            issues.forEach(issue => {
                                issue.items.forEach(issueItem => {
                                    if (issueItem.materialId.toString() === productId &&
                                        issueItem.batchNumber === batchNum &&
                                        issueItem.rollNumbers?.includes(roll.rollNumber)) {
                                        availableWeight -= issueItem.quantity;
                                    }
                                });
                            });

                            // Deduct other allocations
                            allocations.forEach(alloc => {
                                alloc.fabricAllocation.forEach(fa => {
                                    if (fa.productId.toString() === productId) {
                                        fa.allocatedFrom.forEach(source => {
                                            if (source.batchNumber === batchNum &&
                                                source.rollNumbers?.includes(roll.rollNumber)) {
                                                availableWeight -= source.allocatedQuantity;
                                            }
                                        });
                                    }
                                });
                            });

                            if (availableWeight > 0.01) {
                                stockData.push({
                                    type: 'Roll',
                                    sourceId: grn._id,
                                    batchNumber: batchNum,
                                    rollNumber: roll.rollNumber,
                                    quantity: availableWeight,
                                    unit: 'Kgs',
                                    location: item.storageLocation,
                                    shade: roll.shade,
                                    gsm: roll.gsm,
                                    width: roll.width
                                });
                            }
                        });
                    } else {
                        // Handle Batch-wise tracking (for non-fabric or where rolls aren't used)
                        let availableQty = item.acceptedQuantity;

                        // Deduct issues
                        issues.forEach(issue => {
                            issue.items.forEach(issueItem => {
                                if (issueItem.materialId.toString() === productId && issueItem.batchNumber === batchNum) {
                                    availableQty -= issueItem.quantity;
                                }
                            });
                        });

                        // Deduct other allocations
                        allocations.forEach(alloc => {
                            alloc.fabricAllocation.forEach(fa => {
                                if (fa.productId.toString() === productId) {
                                    fa.allocatedFrom.forEach(source => {
                                        if (source.batchNumber === batchNum && (!source.rollNumbers || source.rollNumbers.length === 0)) {
                                            availableQty -= source.allocatedQuantity;
                                        }
                                    });
                                }
                            });
                            // Also check accessories allocation
                            alloc.accessoriesAllocation.forEach(aa => {
                                // If productId matches accessoryType or we have a more robust way
                                // For now focusing on products
                            });
                        });

                        if (availableQty > 0.01) {
                            stockData.push({
                                type: 'Batch',
                                sourceId: grn._id,
                                batchNumber: batchNum,
                                quantity: availableQty,
                                unit: item.unit,
                                location: item.storageLocation
                            });
                        }
                    }
                }
            });
        });

        res.json(stockData);
    } catch (error: any) {
        console.error('Error fetching stock availability:', error);
        res.status(500).json({ message: error.message });
    }
};
