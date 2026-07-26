import express from 'express';
import {
    getProductionReport,
    getOrderStatusReport,
    getInventoryReport,
    getQualityReport,
    getProductionEfficiencyTrend,
    getDailyReports,
    getMonthlySalesReport,
    getOrderPipelineReport
} from '../controllers/reportController';
const router = express.Router();

router.get('/production', getProductionReport);
router.get('/order-status', getOrderStatusReport);
router.get('/inventory', getInventoryReport);
router.get('/quality', getQualityReport);
router.get('/efficiency-trend', getProductionEfficiencyTrend);
router.get('/daily', getDailyReports);
router.get('/monthly-sales', getMonthlySalesReport);
router.get('/order-pipeline', getOrderPipelineReport);

export default router;
