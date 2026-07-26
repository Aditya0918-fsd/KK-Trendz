import express from 'express';
import {
    getQualityControls,
    getQualityControlById,
    createQualityControl,
    updateQualityControl,
    deleteQualityControl
} from '../controllers/qualityControlController';

const router = express.Router();

router.route('/')
    .get(getQualityControls)
    .post(createQualityControl);

router.route('/:id')
    .get(getQualityControlById)
    .put(updateQualityControl)
    .delete(deleteQualityControl);

export default router;
