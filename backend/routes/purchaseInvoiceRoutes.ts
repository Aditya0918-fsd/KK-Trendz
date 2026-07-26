import express from 'express';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, getInvoiceById, updateStatus, recordPayment } from '../controllers/purchaseInvoiceController';
import { protect, admin } from '../middleware/authMiddleware';

import { upload } from '../config/cloudinary';

const router = express.Router();

router.route('/')
    .get(protect, getInvoices)
    .post(protect, upload.single('grnImage'), createInvoice);

router.route('/:id')
    .get(protect, getInvoiceById)
    .put(protect, updateInvoice)
    .delete(protect, admin, deleteInvoice);

router.route('/:id/status')
    .patch(protect, updateStatus);

router.route('/:id/payment')
    .patch(protect, upload.single('paymentReceipt'), recordPayment);

export default router;

