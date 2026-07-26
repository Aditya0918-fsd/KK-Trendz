import express from 'express';
import { getBOMs, getBOMById, getBOMByProductId, createBOM, updateBOM, deleteBOM } from '../controllers/bomController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getBOMs);
router.get('/:id', getBOMById);
router.get('/product/:productId', getBOMByProductId);
router.post('/', createBOM);
router.put('/:id', updateBOM);
router.delete('/:id', deleteBOM);

export default router;
