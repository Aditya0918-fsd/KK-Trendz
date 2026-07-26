import express from 'express';
import { getGRNs, createGRN, updateGRN, deleteGRN, downloadGRN } from '../controllers/grnController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getGRNs)
    .post(protect, createGRN);

router.get('/:id/download', protect, downloadGRN);

router.route('/:id')
    .put(protect, updateGRN)
    .delete(protect, admin, deleteGRN);

export default router;
