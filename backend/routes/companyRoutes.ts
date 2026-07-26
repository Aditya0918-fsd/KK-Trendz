import express from 'express';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../controllers/companyController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getCompanies)
    .post(protect, createCompany);

router.route('/:id')
    .put(protect, updateCompany)
    .delete(protect, admin, deleteCompany);

export default router;
