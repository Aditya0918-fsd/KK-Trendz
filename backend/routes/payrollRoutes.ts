import express from 'express';
import { processAttendance, processAttendanceWeekly, uploadEmployeeAttendance, getPayrolls, getAttendance, getHolidays, createHoliday, getPayrollSettings, updatePayrollSettings } from '../controllers/payrollController';
import { getSalaryPayments, createSalaryPayment, deleteSalaryPayment, getSalaryBalance, getEmployeeLedger, getAllBalances } from '../controllers/salaryPaymentController';
import { protect, admin } from '../middleware/authMiddleware';
import multer from 'multer';
import { upload as cloudinaryUpload } from '../config/cloudinary';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

router.post('/process-attendance', protect, admin, upload.single('file'), processAttendance);
router.post('/process-attendance-weekly', protect, admin, upload.single('file'), processAttendanceWeekly);
router.post('/upload-employee-attendance', protect, admin, upload.single('file'), uploadEmployeeAttendance);
router.get('/', protect, admin, getPayrolls);
router.get('/attendance', protect, admin, getAttendance);
router.get('/holidays', protect, admin, getHolidays);
router.post('/holidays', protect, admin, createHoliday);
router.get('/settings', protect, admin, getPayrollSettings);
router.post('/settings', protect, admin, updatePayrollSettings);

// Salary Payments
router.get('/salary-payments', protect, admin, getSalaryPayments);
router.post('/salary-payments', protect, admin, createSalaryPayment);
router.delete('/salary-payments/:id', protect, admin, deleteSalaryPayment);
router.get('/salary-balance/:employeeId', protect, admin, getSalaryBalance);
router.get('/employee-ledger/:employeeId', protect, admin, getEmployeeLedger);
router.get('/balances', protect, admin, getAllBalances);
router.post('/upload-salary-screenshot', protect, admin, cloudinaryUpload.single('file'), (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        res.json({ url: req.file.path });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
