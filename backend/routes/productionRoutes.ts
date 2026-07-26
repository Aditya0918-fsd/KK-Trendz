import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    createProductionPlan,
    getProductionPlans,
    getProductionPlanById,
    updateProductionPlan,
    deleteProductionPlan,
    createCuttingProduction,
    getCuttingProductions,
    getCuttingProductionById,
    updateCuttingProduction,
    deleteCuttingProduction,
    createStitchingProduction,
    getStitchingProductions,
    getStitchingProductionById,
    updateStitchingProduction,
    deleteStitchingProduction,
    createFinishingProduction,
    getFinishingProductions,
    getFinishingProductionById,
    updateFinishingProduction,
    deleteFinishingProduction,
    createProductionJobCard,
    getProductionJobCards,
    getProductionJobCardById,
    updateProductionJobCard,
    deleteProductionJobCard,
    getProductionStats,
} from '../controllers/productionController';

const router = express.Router();
router.use(protect);

// Stats (dashboard)
router.get('/stats', getProductionStats);

// Plans
router.route('/plans').post(createProductionPlan).get(getProductionPlans);
router.route('/plans/:id').get(getProductionPlanById).put(updateProductionPlan).delete(deleteProductionPlan);

// Cutting
router.route('/cutting').post(createCuttingProduction).get(getCuttingProductions);
router.route('/cutting/:id').get(getCuttingProductionById).put(updateCuttingProduction).delete(deleteCuttingProduction);

// Stitching
router.route('/stitching').post(createStitchingProduction).get(getStitchingProductions);
router.route('/stitching/:id').get(getStitchingProductionById).put(updateStitchingProduction).delete(deleteStitchingProduction);

// Finishing
router.route('/finishing').post(createFinishingProduction).get(getFinishingProductions);
router.route('/finishing/:id').get(getFinishingProductionById).put(updateFinishingProduction).delete(deleteFinishingProduction);

// Job Cards
router.route('/job-cards').post(createProductionJobCard).get(getProductionJobCards);
router.route('/job-cards/:id').get(getProductionJobCardById).put(updateProductionJobCard).delete(deleteProductionJobCard);

export default router;
