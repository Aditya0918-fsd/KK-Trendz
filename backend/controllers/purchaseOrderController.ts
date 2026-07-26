import { Request, Response } from 'express';
import { format } from 'date-fns';
import PurchaseOrder from '../models/PurchaseOrder';
import PurchaseQuotation from '../models/PurchaseQuotation';
import { sendEmail } from '../utils/mail';
import { generatePurchaseOrderPDF } from '../utils/pdfGenerator';

export const getPurchaseOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const pos = await PurchaseOrder.find()
            .populate('supplierId items.productId approval.approvedBy createdBy')
            .sort({ createdAt: -1 });
        res.json(pos);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = new PurchaseOrder({
            ...req.body,
            createdBy: (req as any).user?._id
        });
        const savedPo = await po.save();

        // If created from a quotation, update quotation status
        if (req.body.quotationId) {
            await PurchaseQuotation.findByIdAndUpdate(req.body.quotationId, { status: 'Accepted' });
        }

        res.status(201).json(savedPo);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updatePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const updatedPo = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedPo);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deletePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        await PurchaseOrder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Purchase Order deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const submitForApproval = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = await PurchaseOrder.findByIdAndUpdate(
            req.params.id,
            { status: 'Pending Approval' },
            { new: true }
        );
        res.json(po);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const approvePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) {
            res.status(404).json({ message: 'Purchase Order not found' });
            return;
        }

        po.status = 'Approved';
        const currentApproval = po.approval || {};
        po.approval = {
            required: currentApproval.required ?? true,
            approvedBy: (req as any).user?._id,
            approvedDate: new Date(),
            remarks: (req.body && req.body.remarks) ? req.body.remarks : 'Approved'
        };

        const savedPo = await po.save({ validateBeforeSave: false }); // Bypass validation for older records if needed
        res.json(savedPo);
    } catch (error: any) {
        console.error('Approval Error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

export const rejectPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) {
            res.status(404).json({ message: 'Purchase Order not found' });
            return;
        }

        po.status = 'Rejected';
        const currentApproval = po.approval || {};
        po.approval = {
            required: currentApproval.required ?? true,
            remarks: (req.body && req.body.remarks) ? req.body.remarks : 'Rejected'
        };

        const savedPo = await po.save({ validateBeforeSave: false });
        res.json(savedPo);
    } catch (error: any) {
        console.error('Rejection Error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

export const sendPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = await PurchaseOrder.findById(req.params.id).populate('supplierId items.productId');
        if (!po) {
            res.status(404).json({ message: 'Purchase Order not found' });
            return;
        }

        const supplier: any = po.supplierId;
        const primaryContact = supplier.contacts.find((c: any) => c.isPrimary) || supplier.contacts[0];

        if (!primaryContact || !primaryContact.email) {
            res.status(400).json({ message: 'Supplier has no primary contact email' });
            return;
        }

        const pdfBuffer = await generatePurchaseOrderPDF(po);

        const html = `
            <h3>Purchase Order: ${po.poNumber}</h3>
            <p>Dear ${supplier.partyName},</p>
            <p>Please find attached the Purchase Order ${po.poNumber}.</p>
            <p>Expected Delivery: ${format(new Date(po.expectedDelivery), 'dd-MMM-yyyy')}</p>
            <br/>
            <p>Best Regards,</p>
            <p>KK Trendz</p>
        `;

        await sendEmail(
            primaryContact.email,
            `Purchase Order: ${po.poNumber}`,
            html,
            [{
                filename: `PO_${po.poNumber}.pdf`,
                content: pdfBuffer
            }]
        );

        po.status = 'Ordered';
        await po.save();

        res.json({ success: true, message: 'PO sent to supplier' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const downloadPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const po = await PurchaseOrder.findById(req.params.id).populate('supplierId items.productId');
        if (!po) {
            res.status(404).json({ message: 'Purchase Order not found' });
            return;
        }

        const pdfBuffer = await generatePurchaseOrderPDF(po);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=PO_${po.poNumber}.pdf`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('PO Download Error:', error);
        res.status(500).json({ message: error.message });
    }
};

