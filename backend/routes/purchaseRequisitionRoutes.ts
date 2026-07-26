import express from 'express';
import {
    getPurchaseRequisitions,
    getPurchaseRequisitionById,
    createPurchaseRequisition,
    updatePurchaseRequisition,
    deletePurchaseRequisition,
    autoGenerateReorderRequisitions
} from '../controllers/purchaseRequisitionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getPurchaseRequisitions);
router.post('/auto-reorder', autoGenerateReorderRequisitions);
router.get('/:id', getPurchaseRequisitionById);
router.post('/', createPurchaseRequisition);
router.put('/:id', updatePurchaseRequisition);
router.delete('/:id', deletePurchaseRequisition);

export default router;
