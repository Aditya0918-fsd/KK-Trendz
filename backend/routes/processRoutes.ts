import express from 'express';
import { getProcesses, createProcess, updateProcess, deleteProcess } from '../controllers/processController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getProcesses)
    .post(protect, admin, createProcess);

router.route('/:id')
    .put(protect, admin, updateProcess)
    .delete(protect, admin, deleteProcess);

export default router;
