import express from 'express';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employeeController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getEmployees)
    .post(protect, admin, createEmployee);

router.route('/:id')
    .put(protect, admin, updateEmployee)
    .delete(protect, admin, deleteEmployee);

export default router;
