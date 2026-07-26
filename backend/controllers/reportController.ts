import { Request, Response } from 'express';
import StitchingProduction from '../models/StitchingProduction';
import CuttingProduction from '../models/CuttingProduction';
import FinishingProduction from '../models/FinishingProduction';
import SalesOrder from '../models/SalesOrder';
import InventoryTransaction from '../models/InventoryTransaction';
import QualityControl from '../models/QualityControl';
// Models needed for new reports
import Dispatch from '../models/Dispatch';
import SalesInvoice from '../models/SalesInvoice';

// ... existing code needs to stay, dropping right at the end instead

// 8.1 Production Dashboard Query
export const getProductionReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date } = req.query;
        const searchDate = date ? new Date(date as string) : new Date();
        searchDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(searchDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const [cuttings, stitchings, finishings] = await Promise.all([
            CuttingProduction.aggregate([
                { $match: { cuttingDate: { $gte: searchDate, $lt: nextDate } } },
                { $group: { _id: "$shift", total: { $sum: "$outputStorage.totalPieces" }, count: { $sum: 1 } } }
            ]),
            StitchingProduction.aggregate([
                { $match: { stitchingDate: { $gte: searchDate, $lt: nextDate } } },
                { $group: { _id: "$shift", total: { $sum: "$productionSummary.totalOutput" }, efficiency: { $avg: "$productionSummary.efficiency" }, count: { $sum: 1 } } }
            ]),
            FinishingProduction.aggregate([
                { $match: { finishingDate: { $gte: searchDate, $lt: nextDate } } },
                { $group: { _id: "$shift", total: { $sum: "$ironing.outputQuantity" }, count: { $sum: 1 } } }
            ])
        ]);

        const shifts = ["Day", "Night"];
        const report = shifts.map(shift => {
            const c = cuttings.find(r => r._id === shift);
            const s = stitchings.find(r => r._id === shift);
            const f = finishings.find(r => r._id === shift);
            return {
                shift,
                cuttingOutput: c?.total || 0,
                stitchingOutput: s?.total || 0,
                finishingOutput: f?.total || 0,
                efficiency: s ? Math.round(s.efficiency) : 0,
                totalBatches: (c?.count || 0) + (s?.count || 0) + (f?.count || 0)
            };
        });

        res.json(report);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 8.2 Order Status Tracking
export const getOrderStatusReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderNumber } = req.query;
        if (!orderNumber) {
            res.status(400).json({ message: "Order number is required" });
            return;
        }

        const report = await SalesOrder.aggregate([
            {
                $match: {
                    orderNumber: orderNumber as string
                }
            },
            {
                $project: {
                    orderNumber: 1,
                    customerId: 1,
                    orderDate: 1,
                    deliveryDate: 1,
                    status: 1,

                    // Fabric Status (8.2 Implementation)
                    fabricStatus: {
                        $map: {
                            input: "$fabricSourcing",
                            as: "fabric",
                            in: {
                                productId: "$$fabric.productId",
                                required: "$$fabric.requiredQuantity",
                                sourced: {
                                    $sum: "$$fabric.sourcingPlan.receivedQuantity"
                                },
                                status: {
                                    $switch: {
                                        branches: [
                                            {
                                                case: { $eq: [{ $sum: "$$fabric.sourcingPlan.receivedQuantity" }, "$$fabric.requiredQuantity"] },
                                                then: "Completed"
                                            },
                                            {
                                                case: { $gt: [{ $sum: "$$fabric.sourcingPlan.receivedQuantity" }, 0] },
                                                then: "Partially Received"
                                            }
                                        ],
                                        default: "Pending"
                                    }
                                }
                            }
                        }
                    },

                    // Production Status
                    productionStatus: {
                        cutting: {
                            completed: { $sum: "$items.productionStatus.cuttingCompleted" },
                            total: { $sum: "$items.orderQuantity" }
                        },
                        stitching: {
                            completed: { $sum: "$items.productionStatus.stitchingCompleted" },
                            total: { $sum: "$items.orderQuantity" }
                        },
                        finishing: {
                            completed: { $sum: "$items.productionStatus.finishingCompleted" },
                            total: { $sum: "$items.orderQuantity" }
                        },
                        packing: {
                            completed: { $sum: "$items.productionStatus.packingCompleted" },
                            total: { $sum: "$items.orderQuantity" }
                        }
                    }
                }
            }
        ]);
        res.json(report[0] || null);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 8.2.1 Order Pipeline (List of all active orders)
export const getOrderPipelineReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const report = await SalesOrder.aggregate([
            {
                $match: {
                    status: { $in: ["Confirmed", "In Production", "Submitted", "Draft"] }
                }
            },
            {
                $project: {
                    orderNumber: 1,
                    customerOrderNo: 1,
                    customerId: 1,
                    orderDate: 1,
                    deliveryDate: 1,
                    status: 1,
                    totalQuantity: "$summary.totalQuantity",
                    cuttingProgress: {
                        $cond: [
                            { $gt: [{ $sum: "$items.orderQuantity" }, 0] },
                            { $divide: [{ $sum: "$items.productionStatus.cuttingCompleted" }, { $sum: "$items.orderQuantity" }] },
                            0
                        ]
                    },
                    stitchingProgress: {
                        $cond: [
                            { $gt: [{ $sum: "$items.orderQuantity" }, 0] },
                            { $divide: [{ $sum: "$items.productionStatus.stitchingCompleted" }, { $sum: "$items.orderQuantity" }] },
                            0
                        ]
                    },
                    finishingProgress: {
                        $cond: [
                            { $gt: [{ $sum: "$items.orderQuantity" }, 0] },
                            { $divide: [{ $sum: "$items.productionStatus.finishingCompleted" }, { $sum: "$items.orderQuantity" }] },
                            0
                        ]
                    },
                    packingProgress: {
                        $cond: [
                            { $gt: [{ $sum: "$items.orderQuantity" }, 0] },
                            { $divide: [{ $sum: "$items.productionStatus.packingCompleted" }, { $sum: "$items.orderQuantity" }] },
                            0
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "parties",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $project: {
                    orderNumber: 1,
                    customerOrderNo: 1,
                    customerName: "$customer.partyName",
                    orderDate: 1,
                    deliveryDate: 1,
                    status: 1,
                    totalQuantity: 1,
                    cuttingProgress: { $multiply: ["$cuttingProgress", 100] },
                    stitchingProgress: { $multiply: ["$stitchingProgress", 100] },
                    finishingProgress: { $multiply: ["$finishingProgress", 100] },
                    packingProgress: { $multiply: ["$packingProgress", 100] }
                }
            },
            { $sort: { deliveryDate: 1 } }
        ]);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 8.3 Inventory Report
export const getInventoryReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate } = req.query;
        const periodStart = startDate
            ? new Date(startDate as string)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        // Step 1: Opening stock = all movements BEFORE periodStart
        const openingAgg = await InventoryTransaction.aggregate([
            { $match: { createdAt: { $lt: periodStart } } },
            {
                $group: {
                    _id: '$materialId',
                    openingStock: {
                        $sum: {
                            $cond: [
                                { $in: ['$transactionType', ['Receipt', 'Opening', 'JobWorkReturn']] },
                                '$quantity',
                                { $multiply: ['$quantity', -1] } // Issue / Dispatch / JobWorkIssue subtract
                            ]
                        }
                    }
                }
            }
        ]);

        const openingMap: Record<string, number> = {};
        openingAgg.forEach((o: any) => {
            openingMap[o._id.toString()] = Math.max(0, o.openingStock);
        });

        // Step 2: Period movements (on or after periodStart)
        const periodAgg = await InventoryTransaction.aggregate([
            { $match: { createdAt: { $gte: periodStart } } },
            {
                $group: {
                    _id: '$materialId',
                    received: {
                        $sum: {
                            $cond: [
                                { $in: ['$transactionType', ['Receipt', 'JobWorkReturn']] },
                                '$quantity', 0
                            ]
                        }
                    },
                    issued: {
                        $sum: {
                            $cond: [
                                { $in: ['$transactionType', ['Issue', 'Dispatch', 'JobWorkIssue']] },
                                '$quantity', 0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    productId: '$_id',
                    received: 1,
                    issued: 1,
                    'product.productName': 1,
                    'product.productCode': 1,
                    'product.inventory.unitOfMeasure': 1,
                    'product.inventory.reorderLevel': 1,
                    'product.inventory.currentStock': 1,
                }
            }
        ]);

        // Step 3: Merge opening into period results
        const report = periodAgg.map((item: any) => {
            const openingStock = openingMap[item.productId?.toString()] || 0;
            const received = item.received || 0;
            const issued = item.issued || 0;
            const closingStock = openingStock + received - issued;
            return {
                productId: item.productId,
                product: {
                    name: item.product?.productName || 'Unknown',
                    code: item.product?.productCode || '',
                    unit: item.product?.inventory?.unitOfMeasure || '—',
                    reorderLevel: item.product?.inventory?.reorderLevel || 0,
                    currentStock: item.product?.inventory?.currentStock || 0
                },
                openingStock,
                received,
                issued,
                closingStock
            };
        });

        res.json(report);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 8.4 Quality Report
export const getQualityReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const report = await QualityControl.aggregate([
            {
                $unwind: "$rejectionAnalysis"
            },
            {
                $group: {
                    _id: "$rejectionAnalysis.defectType",
                    totalQuantity: { $sum: "$rejectionAnalysis.quantity" },
                    averagePercentage: { $avg: "$rejectionAnalysis.percentage" },
                    occurrences: { $sum: 1 }
                }
            },
            {
                $sort: { totalQuantity: -1 }
            }
        ]);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 10.1 Production Efficiency Trend (Monthly)
export const getProductionEfficiencyTrend = async (req: Request, res: Response): Promise<void> => {
    try {
        const { month } = req.query; // format: YYYY-MM
        const startDate = month ? new Date(`${month}-01`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

        const report = await StitchingProduction.aggregate([
            {
                $match: {
                    stitchingDate: { $gte: startDate, $lte: endDate },
                    status: "Completed"
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$stitchingDate" } }
                    },
                    avgEfficiency: { $avg: "$productionSummary.efficiency" },
                    totalOutput: { $sum: "$productionSummary.totalOutput" },
                    totalDefects: { $sum: "$productionSummary.totalDefects" }
                }
            },
            {
                $sort: { "_id": 1 }
            },
            {
                $project: {
                    date: "$_id.date",
                    efficiency: { $round: ["$avgEfficiency", 2] },
                    output: 1,
                    defects: 1,
                    _id: 0
                }
            }
        ]);
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 10.1 DAILY REPORTS
export const getDailyReports = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date as string) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        // Production metrics (Aggregate from all stages)
        const [cutting, stitching, finishing] = await Promise.all([
            CuttingProduction.aggregate([
                { $match: { cuttingDate: { $gte: targetDate, $lt: nextDate } } },
                { $group: { _id: null, total: { $sum: "$outputStorage.totalPieces" } } }
            ]),
            StitchingProduction.aggregate([
                { $match: { stitchingDate: { $gte: targetDate, $lt: nextDate } } },
                { $group: { _id: null, output: { $sum: "$productionSummary.totalOutput" }, defects: { $sum: "$productionSummary.totalDefects" } } }
            ]),
            FinishingProduction.aggregate([
                { $match: { finishingDate: { $gte: targetDate, $lt: nextDate } } },
                { $group: { _id: null, output: { $sum: "$ironing.outputQuantity" }, defects: { $sum: { $add: ["$ironing.defects", "$threadCutting.defects"] } } } }
            ])
        ]);

        const productionMetrics = {
            cuttingOutput: cutting[0]?.total || 0,
            stitchingOutput: stitching[0]?.output || 0,
            finishingOutput: finishing[0]?.output || 0,
            totalDefects: (stitching[0]?.defects || 0) + (finishing[0]?.defects || 0)
        };

        // Quality metrics
        const quality = await QualityControl.aggregate([
            { $match: { checkingDate: { $gte: targetDate, $lt: nextDate } } },
            {
                $group: {
                    _id: null,
                    totalChecked: { $sum: "$summary.totalChecked" },
                    passed: { $sum: "$summary.totalPassed" },
                    rejected: { $sum: "$summary.totalRejected" }
                }
            }
        ]);

        // Dispatch metrics
        const dispatches = await Dispatch.find({
            dispatchDate: { $gte: targetDate, $lt: nextDate }
        }).populate('orderId');

        res.json({
            date: targetDate,
            production: productionMetrics,
            quality: quality[0] || { totalChecked: 0, passed: 0, rejected: 0 },
            dispatches
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// 10.2 WEEKLY / MONTHLY REPORTS (Sales Report)
export const getMonthlySalesReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { month, year } = req.query;
        const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
        const currentMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();

        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        const summary = await SalesInvoice.aggregate([
            {
                $match: {
                    invoiceDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalValue: { $sum: "$summary.grandTotal" },
                    avgValue: { $avg: "$summary.grandTotal" }
                }
            }
        ]);

        const customerWise = await SalesInvoice.aggregate([
            {
                $match: {
                    invoiceDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: "parties",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $group: {
                    _id: "$customerId",
                    customerName: { $first: "$customer.partyName" },
                    totalValue: { $sum: "$summary.grandTotal" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalValue: -1 } }
        ]);

        res.json({
            period: `${currentMonth + 1}/${currentYear}`,
            summary: summary[0] || { totalOrders: 0, totalValue: 0, avgValue: 0 },
            customerWise
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
