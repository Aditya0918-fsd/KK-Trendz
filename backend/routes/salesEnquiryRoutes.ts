import express from 'express';
import {
    getSalesEnquiries,
    getSalesEnquiryById,
    createSalesEnquiry,
    updateSalesEnquiry,
    deleteSalesEnquiry
} from '../controllers/salesEnquiryController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getSalesEnquiries)
    .post(protect, createSalesEnquiry);

router.route('/:id')
    .get(protect, getSalesEnquiryById)
    .put(protect, updateSalesEnquiry)
    .patch(protect, updateSalesEnquiry)
    .delete(protect, admin, deleteSalesEnquiry);

export default router;
