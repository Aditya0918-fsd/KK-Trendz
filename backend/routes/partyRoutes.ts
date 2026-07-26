import express from 'express';
import { getParties, createParty, updateParty, deleteParty } from '../controllers/partyController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getParties)
    .post(protect, createParty);

router.route('/:id')
    .put(protect, updateParty)
    .delete(protect, admin, deleteParty);

export default router;
