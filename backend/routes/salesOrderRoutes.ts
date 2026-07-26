import express from 'express';
import {
    getSalesOrders,
    getSalesOrderById,
    createSalesOrder,
    updateSalesOrder,
    deleteSalesOrder
} from '../controllers/salesOrderController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getSalesOrders)
    .post(protect, createSalesOrder);

router.route('/:id')
    .get(protect, getSalesOrderById)
    .put(protect, updateSalesOrder)
    .patch(protect, updateSalesOrder)
    .delete(protect, admin, deleteSalesOrder);

export default router;
