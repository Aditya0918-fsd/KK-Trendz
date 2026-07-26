import express from 'express';
import {
    getOrderAllocations,
    getOrderAllocationById,
    createOrderAllocation,
    updateOrderAllocation,
    deleteOrderAllocation
} from '../controllers/orderAllocationController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getOrderAllocations)
    .post(protect, createOrderAllocation);

router.route('/:id')
    .get(protect, getOrderAllocationById)
    .put(protect, updateOrderAllocation)
    .delete(protect, admin, deleteOrderAllocation);

export default router;
