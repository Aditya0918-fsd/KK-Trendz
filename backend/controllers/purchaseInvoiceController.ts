import { Request, Response } from 'express';
import PurchaseInvoice from '../models/PurchaseInvoice';
import Product from '../models/Product';

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoices = await PurchaseInvoice.find()
            .populate('supplierId poId grnId items.productId createdBy')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoice = await PurchaseInvoice.findById(req.params.id)
            .populate('supplierId poId grnId items.productId');
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        res.json(invoice);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoiceData = { ...req.body };

        // Handle file upload if present
        if (req.file) {
            const file = req.file as any;
            invoiceData.grnImage = file.path || file.secure_url || file.url;
        }

        // Parse JSON fields from multipart/form-data
        ['items', 'summary', 'payment'].forEach(field => {
            if (typeof invoiceData[field] === 'string') {
                try {
                    invoiceData[field] = JSON.parse(invoiceData[field]);
                } catch (e) {
                    console.log(`Failed to parse ${field}:`, e);
                }
            }
        });

        const invoice = new PurchaseInvoice({
            ...invoiceData,
            createdBy: (req as any).user?._id
        });
        const savedInvoice = await invoice.save();

        // Update Product Last Purchase Rate from Invoice (Final Commercial Rate)
        if (invoiceData.items && Array.isArray(invoiceData.items)) {
            for (const item of invoiceData.items) {
                if (item.productId && item.rate > 0) {
                    await Product.findByIdAndUpdate(item.productId, {
                        $set: { 'costing.lastPurchaseRate': item.rate }
                    });
                }
            }
        }

        res.status(201).json(savedInvoice);
    } catch (error: any) {
        console.error('--- CREATE INVOICE CRASH ---');
        console.error(error);
        res.status(500).json({ 
            message: error.message || 'Server Error', 
            details: error.stack,
            body: req.body 
        });
    }
};

export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedInvoice = await PurchaseInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedInvoice);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        const updated = await PurchaseInvoice.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        await PurchaseInvoice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Invoice deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

import PaymentReceipt from '../models/PaymentReceipt';

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoice = await PurchaseInvoice.findById(req.params.id).populate('supplierId');
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }

        const { amount, mode, referenceNo, remarks, paymentDate } = req.body;
        const paidAmount = Number(amount);

        // Handle file upload for receipt image
        let receiptImageUrl = '';
        if (req.file) {
            const file = req.file as any;
            receiptImageUrl = file.path || file.secure_url || file.url;
        }

        // Push the new payment entry into Invoice history
        invoice.payment.payments.push({
            paymentDate: paymentDate || new Date(),
            amount: paidAmount,
            mode,
            referenceNo,
            remarks,
            receiptImage: receiptImageUrl
        });

        // Update summary.paidAmount and handle paymentStatus logic
        const totalPaid = invoice.payment.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        invoice.summary.paidAmount = totalPaid;
        const netPayable = invoice.summary.netPayable;

        if (totalPaid >= netPayable) {
            invoice.payment.paymentStatus = 'Paid';
        } else if (totalPaid > 0) {
            invoice.payment.paymentStatus = 'Partially Paid';
        } else {
            invoice.payment.paymentStatus = 'Pending';
        }

        await invoice.save();

        // Create a separate PaymentReceipt record for financial ledgers
        const receiptNumber = `RCP-PUR-${Date.now()}`;
        const newReceipt = new PaymentReceipt({
            receiptNumber,
            receiptDate: paymentDate || new Date(),
            partyId: invoice.supplierId?._id || invoice.supplierId,
            partyType: 'Supplier',
            partyName: (invoice.supplierId as any)?.partyName || 'N/A',
            paymentMode: mode,
            amount: paidAmount,
            receiptImage: receiptImageUrl,
            bankDetails: {
                transactionReference: referenceNo,
                transactionDate: paymentDate || new Date()
            },
            againstInvoices: [{
                invoiceId: invoice._id,
                invoiceType: 'Purchase',
                invoiceNumber: invoice.invoiceNumber,
                invoiceDate: invoice.invoiceDate,
                invoiceAmount: netPayable,
                dueDate: invoice.payment.dueDate,
                amountApplied: paidAmount,
                balanceAfter: Math.max(0, netPayable - totalPaid)
            }],
            status: 'Verified',
            receivedBy: (req as any).user?._id
        });

        await newReceipt.save();

        res.json(invoice);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

