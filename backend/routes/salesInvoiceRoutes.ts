import express from 'express';
import {
    getSalesInvoices,
    getSalesInvoiceById,
    createSalesInvoice,
    updateSalesInvoice,
    deleteSalesInvoice
} from '../controllers/salesInvoiceController';

const router = express.Router();

router.route('/')
    .get(getSalesInvoices)
    .post(createSalesInvoice);

router.route('/:id')
    .get(getSalesInvoiceById)
    .put(updateSalesInvoice)
    .delete(deleteSalesInvoice);

export default router;
