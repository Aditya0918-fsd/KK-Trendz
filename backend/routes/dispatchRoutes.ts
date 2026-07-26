import express from 'express';
import {
    getDispatches,
    getDispatchById,
    createDispatch,
    updateDispatch,
    deleteDispatch
} from '../controllers/dispatchController';

const router = express.Router();

router.route('/')
    .get(getDispatches)
    .post(createDispatch);

router.route('/:id')
    .get(getDispatchById)
    .put(updateDispatch)
    .delete(deleteDispatch);

export default router;
