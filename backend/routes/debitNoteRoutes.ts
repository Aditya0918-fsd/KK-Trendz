import express from 'express';
import { getDebitNotes, createDebitNote, updateDebitNoteStatus } from '../controllers/debitNoteController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getDebitNotes)
    .post(protect, createDebitNote);

router.route('/:id/status')
    .patch(protect, updateDebitNoteStatus);

export default router;
