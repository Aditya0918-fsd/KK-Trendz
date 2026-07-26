import express from 'express';
import {
    getSalesQuotations,
    getSalesQuotationById,
    createSalesQuotation,
    updateSalesQuotation,
    deleteSalesQuotation
} from '../controllers/salesQuotationController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getSalesQuotations)
    .post(protect, createSalesQuotation);

router.route('/:id')
    .get(protect, getSalesQuotationById)
    .put(protect, updateSalesQuotation)
    .patch(protect, updateSalesQuotation)
    .delete(protect, admin, deleteSalesQuotation);

export default router;
