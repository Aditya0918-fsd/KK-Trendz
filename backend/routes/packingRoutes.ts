import express from 'express';
import {
    getPackings,
    getPackingById,
    createPacking,
    updatePacking,
    deletePacking
} from '../controllers/packingController';

const router = express.Router();

router.route('/')
    .get(getPackings)
    .post(createPacking);

router.route('/:id')
    .get(getPackingById)
    .put(updatePacking)
    .delete(deletePacking);

export default router;
