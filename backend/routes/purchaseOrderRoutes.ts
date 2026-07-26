import express from 'express';
import {
    getPurchaseOrders,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    submitForApproval,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    sendPurchaseOrder,
    downloadPurchaseOrder
} from '../controllers/purchaseOrderController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:id/download', protect, downloadPurchaseOrder);


router.route('/')
    .get(protect, getPurchaseOrders)
    .post(protect, createPurchaseOrder);

router.route('/:id')
    .put(protect, updatePurchaseOrder)
    .delete(protect, admin, deletePurchaseOrder);

router.put('/:id/submit', protect, submitForApproval);
router.put('/:id/approve', protect, admin, approvePurchaseOrder);
router.put('/:id/reject', protect, admin, rejectPurchaseOrder);
router.post('/:id/send', protect, sendPurchaseOrder);

export default router;
