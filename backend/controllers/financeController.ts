import { Request, Response } from 'express';
import SalesInvoice from '../models/SalesInvoice';
import PurchaseInvoice from '../models/PurchaseInvoice';
import CreditNote from '../models/CreditNote';
import DebitNote from '../models/DebitNote';
import ProformaInvoice from '../models/ProformaInvoice';
import PaymentReceipt from '../models/PaymentReceipt';
import mongoose from 'mongoose';

// FINANCE DASHBOARD
export const getFinanceDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [salesStats, purchaseStats, outstandingInvoices, overdueInvoices, recentPayments, monthlySalesTrend, gstSummary] = await Promise.all([
            // Sales this month
            SalesInvoice.aggregate([
                { $match: { invoiceDate: { $gte: startOfMonth }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: null, total: { $sum: '$summary.grandTotal' }, count: { $sum: 1 }, paid: { $sum: { $cond: [{ $eq: ['$payment.paymentStatus', 'Paid'] }, '$summary.grandTotal', 0] } } } }
            ]),
            // Purchases this month
            PurchaseInvoice.aggregate([
                { $match: { invoiceDate: { $gte: startOfMonth }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: null, total: { $sum: '$summary.netPayable' }, count: { $sum: 1 } } }
            ]),
            // Outstanding receivables
            SalesInvoice.aggregate([
                { $match: { 'payment.paymentStatus': { $in: ['Pending', 'Partially Paid'] }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: null, total: { $sum: '$summary.grandTotal' }, count: { $sum: 1 } } }
            ]),
            // Overdue invoices
            SalesInvoice.countDocuments({ 'payment.dueDate': { $lt: now }, 'payment.paymentStatus': { $ne: 'Paid' }, status: { $ne: 'Cancelled' } }),
            // Recent payments
            PaymentReceipt.find().sort({ createdAt: -1 }).limit(5).populate('partyId', 'name'),
            // Monthly sales trend (last 6 months)
            SalesInvoice.aggregate([
                { $match: { invoiceDate: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } }, sales: { $sum: '$summary.grandTotal' }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            // GST summary current month
            SalesInvoice.aggregate([
                { $match: { invoiceDate: { $gte: startOfMonth }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: null, cgst: { $sum: '$summary.totalCgst' }, sgst: { $sum: '$summary.totalSgst' }, igst: { $sum: '$summary.totalIgst' }, totalGst: { $sum: '$summary.totalGst' } } }
            ])
        ]);

        res.json({
            salesStats: salesStats[0] || { total: 0, count: 0, paid: 0 },
            purchaseStats: purchaseStats[0] || { total: 0, count: 0 },
            outstanding: outstandingInvoices[0] || { total: 0, count: 0 },
            overdueCount: overdueInvoices,
            recentPayments,
            monthlySalesTrend,
            gstSummary: gstSummary[0] || { cgst: 0, sgst: 0, igst: 0, totalGst: 0 }
        });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

// SALES INVOICES
export const getSalesInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, from, to, page = 1, limit = 20 } = req.query;
        const filter: any = {};
        if (status) filter['payment.paymentStatus'] = status;
        if (from || to) {
            filter.invoiceDate = {};
            if (from) filter.invoiceDate.$gte = new Date(from as string);
            if (to) filter.invoiceDate.$lte = new Date(to as string);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [invoices, total] = await Promise.all([
            SalesInvoice.find(filter).sort({ invoiceDate: -1 }).skip(skip).limit(Number(limit)).populate('customerId', 'name gstin'),
            SalesInvoice.countDocuments(filter)
        ]);
        res.json({ invoices, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const createSalesInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const inv = new SalesInvoice(req.body);
        const saved = await inv.save();
        res.status(201).json(saved);
    } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// PURCHASE INVOICES
export const getPurchaseInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, from, to, page = 1, limit = 20 } = req.query;
        const filter: any = {};
        if (status) filter['payment.paymentStatus'] = status;
        const skip = (Number(page) - 1) * Number(limit);
        const [invoices, total] = await Promise.all([
            PurchaseInvoice.find(filter).sort({ invoiceDate: -1 }).skip(skip).limit(Number(limit)).populate('supplierId', 'name gstin'),
            PurchaseInvoice.countDocuments(filter)
        ]);
        res.json({ invoices, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const createPurchaseInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const inv = new PurchaseInvoice({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const saved = await inv.save();
        res.status(201).json(saved);
    } catch (err: any) { res.status(400).json({ message: err.message }); }
};

export const updatePurchaseInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        const updated = await PurchaseInvoice.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

// CREDIT NOTES
export const getCreditNotes = async (req: Request, res: Response): Promise<void> => {
    try {
        const notes = await CreditNote.find()
            .sort({ createdAt: -1 })
            .populate('customerId', 'partyName name gstin')
            .populate('referenceInvoiceId');
        res.json({ creditNotes: notes });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const createCreditNote = async (req: Request, res: Response): Promise<void> => {
    try {
        const note = new CreditNote({
            ...req.body,
            audit: {
                createdBy: (req as any).user?._id,
                createdAt: new Date()
            }
        });
        const saved = await note.save();

        // Update sales invoice total if adjusted
        if (req.body.status === 'Applied' || req.body.status === 'Generated') {
            await SalesInvoice.findByIdAndUpdate(req.body.referenceInvoiceId, {
                $inc: { 'summary.grandTotal': -req.body.summary.totalCreditNoteValue }
            });
        }

        res.status(201).json(saved);
    } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// DEBIT NOTES
export const getDebitNotes = async (req: Request, res: Response): Promise<void> => {
    try {
        const notes = await DebitNote.find()
            .sort({ createdAt: -1 })
            .populate('supplierId', 'partyName name gstin')
            .populate('referenceInvoiceId');
        res.json({ debitNotes: notes });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const createDebitNote = async (req: Request, res: Response): Promise<void> => {
    try {
        const note = new DebitNote({
            ...req.body,
            audit: {
                createdBy: (req as any).user?._id,
                createdAt: new Date()
            }
        });
        const saved = await note.save();

        // Update purchase invoice total if adjusted immediately
        if (req.body.status === 'Adjusted' || req.body.status === 'Generated') {
            await PurchaseInvoice.findByIdAndUpdate(req.body.referenceInvoiceId, {
                $inc: { 'summary.netPayable': -req.body.summary.totalDebitNoteValue }
            });
        }

        res.status(201).json(saved);
    } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// PROFORMA
export const getProformaInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const list = await ProformaInvoice.find().sort({ createdAt: -1 }).populate('customerId', 'name');
        res.json(list);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const createProformaInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const inv = new ProformaInvoice(req.body);
        await inv.save();
        res.status(201).json(inv);
    } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// RECEIPTS
export const getReceipts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { partyType, page = 1, limit = 20 } = req.query;
        const filter: any = {};
        if (partyType) filter.partyType = partyType;
        const skip = (Number(page) - 1) * Number(limit);
        const [receipts, total] = await Promise.all([
            PaymentReceipt.find(filter).sort({ receiptDate: -1 }).skip(skip).limit(Number(limit)).populate('partyId', 'name'),
            PaymentReceipt.countDocuments(filter)
        ]);
        res.json({ receipts, total });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const createReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
        const receipt = new PaymentReceipt({
            ...req.body,
            receivedBy: (req as any).user?._id
        });
        await receipt.save();

        // Update settled invoices
        const { againstInvoices, partyType } = req.body;
        if (againstInvoices && againstInvoices.length > 0) {
            for (const item of againstInvoices) {
                const Model = partyType === 'Customer' ? SalesInvoice : PurchaseInvoice;
                const invoice = await Model.findById(item.invoiceId);

                if (invoice) {
                    const currentPaid = partyType === 'Customer'
                        ? (invoice.payment?.paidAmount || 0)
                        : (invoice.summary?.paidAmount || 0); // Assuming purchase invoice also has paidAmount

                    const newPaid = currentPaid + item.amountApplied;
                    const total = partyType === 'Customer'
                        ? (invoice.summary.grandTotal)
                        : (invoice.summary.netPayable);

                    const status = newPaid >= total ? 'Paid' : 'Partially Paid';

                    if (partyType === 'Customer') {
                        invoice.payment = {
                            ...invoice.payment,
                            paidAmount: newPaid,
                            paymentStatus: status,
                            lastPaymentDate: new Date()
                        };
                    } else {
                        // For Purchase Invoice
                        invoice.summary.paidAmount = newPaid;
                        invoice.payment.paymentStatus = status;
                        
                        // Also add to payments array for history
                        invoice.payment.payments.push({
                            paymentDate: new Date(),
                            amount: item.amountApplied,
                            mode: req.body.paymentMode || 'Bank Transfer',
                            remarks: `Received via Receipt ${receipt.receiptNumber}`
                        });
                    }
                    await invoice.save();
                }
            }
        }

        res.status(201).json(receipt);
    } catch (err: any) { res.status(400).json({ message: err.message }); }
};

// GSTR-1 REPORT (Outward Supplies)
export const getGSTR1Report = async (req: Request, res: Response): Promise<void> => {
    try {
        const { month, year } = req.query;
        const m = month ? Number(month) - 1 : new Date().getMonth();
        const y = year ? Number(year) : new Date().getFullYear();
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0);

        const [b2b, b2cl, b2cs, cdnr, hsn] = await Promise.all([
            // B2B: Invoices to registered parties
            SalesInvoice.find({
                invoiceDate: { $gte: start, $lte: end },
                status: { $ne: 'Cancelled' }
            }).populate('customerId', 'partyName gstin address'),

            // B2C Large: Inter-state > 2.5L (For demo, using amount filter)
            SalesInvoice.find({
                invoiceDate: { $gte: start, $lte: end },
                'summary.grandTotal': { $gt: 250000 },
                status: { $ne: 'Cancelled' }
            }),

            // B2C Small: Consolidated
            SalesInvoice.aggregate([
                { $match: { invoiceDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: '$placeOfSupply', totalTaxable: { $sum: '$summary.totalTaxable' }, totalTax: { $sum: '$summary.totalGst' } } }
            ]),

            // Credit/Debit Notes
            CreditNote.find({ creditNoteDate: { $gte: start, $lte: end } }).populate('customerId', 'partyName gstin'),

            // HSN Summary
            SalesInvoice.aggregate([
                { $match: { invoiceDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.hsnCode',
                        description: { $first: '$items.description' },
                        uqc: { $first: '$items.unit' },
                        totalQty: { $sum: '$items.quantity' },
                        totalValue: { $sum: '$items.totalValue' },
                        taxableValue: { $sum: '$items.taxableValue' },
                        igst: { $sum: '$summary.totalIgst' }, // Simplified for aggregate
                        cgst: { $sum: '$summary.totalCgst' },
                        sgst: { $sum: '$summary.totalSgst' }
                    }
                }
            ])
        ]);

        res.json({ period: { month: m + 1, year: y }, b2b, b2cl, b2cs, cdnr, hsn });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};

// GSTR-3B REPORT (Summary Return)
export const getGSTR3BReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { month, year } = req.query;
        const m = month ? Number(month) - 1 : new Date().getMonth();
        const y = year ? Number(year) : new Date().getFullYear();
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0);

        const [outward, inwardRC, itc] = await Promise.all([
            // 3.1 Outward Taxable Supplies
            SalesInvoice.aggregate([
                { $match: { invoiceDate: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
                {
                    $group: {
                        _id: null,
                        totalTaxable: { $sum: '$summary.totalTaxable' },
                        igst: { $sum: '$summary.totalIgst' },
                        cgst: { $sum: '$summary.totalCgst' },
                        sgst: { $sum: '$summary.totalSgst' }
                    }
                }
            ]),
            // 3.1(d) Inward Supplies (Reverse Charge)
            PurchaseInvoice.aggregate([
                { $match: { invoiceDate: { $gte: start, $lte: end }, 'summary.reverseCharge': true } },
                {
                    $group: {
                        _id: null,
                        totalTaxable: { $sum: '$summary.taxableAmount' },
                        igst: { $sum: '$summary.gstAmount' } // Assuming IGST for RC
                    }
                }
            ]),
            // 4. Eligible ITC
            PurchaseInvoice.aggregate([
                { $match: { invoiceDate: { $gte: start, $lte: end }, status: 'Approved' } },
                {
                    $group: {
                        _id: null,
                        itcIgst: { $sum: '$summary.gstAmount' }, // Simplified
                        itcCgst: { $sum: 0 },
                        itcSgst: { $sum: 0 }
                    }
                }
            ])
        ]);

        res.json({
            period: { month: m + 1, year: y },
            section3_1: outward[0] || { totalTaxable: 0, igst: 0, cgst: 0, sgst: 0 },
            section3_2: inwardRC[0] || { totalTaxable: 0, igst: 0 },
            section4: itc[0] || { itcIgst: 0, itcCgst: 0, itcSgst: 0 }
        });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
};
