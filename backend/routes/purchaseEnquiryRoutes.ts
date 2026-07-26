import express from 'express';
import { getEnquiries, createEnquiry, updateEnquiry, deleteEnquiry, sendEnquiry, getEnquiryComparison } from '../controllers/purchaseEnquiryController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getEnquiries)
    .post(protect, createEnquiry);

router.route('/:id')
    .put(protect, updateEnquiry)
    .delete(protect, admin, deleteEnquiry);

router.route('/:id/send')
    .post(protect, sendEnquiry);

router.route('/:id/comparison')
    .get(protect, getEnquiryComparison);

export default router;
