import express from 'express';
import { getStockAvailability } from '../controllers/inventoryController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/stock/:productId', protect, getStockAvailability);

export default router;
