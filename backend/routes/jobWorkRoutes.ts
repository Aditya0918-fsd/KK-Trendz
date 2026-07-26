import express from 'express';
import {
    getJWOs, createJWO, updateJWO, deleteJWO,
    getMaterialIssues, createMaterialIssue, updateMaterialIssue, deleteMaterialIssue,
    getJobWorkReceipts, createJobWorkReceipt, updateJobWorkReceipt, deleteJobWorkReceipt
} from '../controllers/jobWorkController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// JWO Routes
router.route('/orders')
    .get(protect, getJWOs)
    .post(protect, createJWO);

router.route('/orders/:id')
    .put(protect, updateJWO)
    .patch(protect, updateJWO)
    .delete(protect, deleteJWO);

// Material Issue Routes
router.route('/issues')
    .get(protect, getMaterialIssues)
    .post(protect, createMaterialIssue);

router.route('/issues/:id')
    .put(protect, updateMaterialIssue)
    .delete(protect, deleteMaterialIssue);

// Job Work Receipt Routes
router.route('/receipts')
    .get(protect, getJobWorkReceipts)
    .post(protect, createJobWorkReceipt);

router.route('/receipts/:id')
    .put(protect, updateJobWorkReceipt)
    .delete(protect, deleteJobWorkReceipt);

export default router;
