import express from 'express';
import { getQuotations, createQuotation, updateQuotation, deleteQuotation, acceptQuotation } from '../controllers/purchaseQuotationController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getQuotations)
    .post(protect, createQuotation);

router.route('/:id')
    .put(protect, updateQuotation)
    .delete(protect, admin, deleteQuotation);

router.route('/:id/accept')
    .post(protect, acceptQuotation);

export default router;
