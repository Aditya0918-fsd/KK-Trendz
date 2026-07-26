import express from 'express';
import { login, getProfile, initAdmin } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/init-admin', initAdmin);


export default router;
