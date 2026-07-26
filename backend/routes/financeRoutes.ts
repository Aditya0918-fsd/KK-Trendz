import express from 'express';
import {
    getFinanceDashboard,
    getSalesInvoices,
    getPurchaseInvoices,
    getCreditNotes,
    getDebitNotes,
    getProformaInvoices,
    getReceipts,
    createSalesInvoice,
    createPurchaseInvoice,
    createCreditNote,
    createDebitNote,
    createProformaInvoice,
    createReceipt,
    updatePurchaseInvoiceStatus,
    getGSTR1Report,
    getGSTR3BReport
} from '../controllers/financeController';

const router = express.Router();

// Dashboard
router.get('/dashboard', getFinanceDashboard);

// Sales Invoices
router.get('/sales-invoices', getSalesInvoices);
router.post('/sales-invoices', createSalesInvoice);

// Purchase Invoices
router.get('/purchase-invoices', getPurchaseInvoices);
router.post('/purchase-invoices', createPurchaseInvoice);
router.patch('/purchase-invoices/:id/status', updatePurchaseInvoiceStatus);

// Credit Notes
router.get('/credit-notes', getCreditNotes);
router.post('/credit-notes', createCreditNote);

// Debit Notes
router.get('/debit-notes', getDebitNotes);
router.post('/debit-notes', createDebitNote);

// Proforma
router.get('/proforma', getProformaInvoices);
router.post('/proforma', createProformaInvoice);

// Receipts
router.get('/receipts', getReceipts);
router.post('/receipts', createReceipt);

// GST Report
router.get('/gst-report', getGSTR1Report);
router.get('/gst-report/gstr1', getGSTR1Report);
router.get('/gst-report/gstr3b', getGSTR3BReport);

export default router;
