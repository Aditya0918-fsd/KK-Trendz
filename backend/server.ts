import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, './.env') });

import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import companyRoutes from './routes/companyRoutes';
import partyRoutes from './routes/partyRoutes';
import employeeRoutes from './routes/employeeRoutes';
import locationRoutes from './routes/locationRoutes';
import processRoutes from './routes/processRoutes';
import purchaseEnquiryRoutes from './routes/purchaseEnquiryRoutes';
import purchaseQuotationRoutes from './routes/purchaseQuotationRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import grnRoutes from './routes/grnRoutes';
import purchaseInvoiceRoutes from './routes/purchaseInvoiceRoutes';
import jobWorkRoutes from './routes/jobWorkRoutes';
import salesEnquiryRoutes from './routes/salesEnquiryRoutes';
import salesQuotationRoutes from './routes/salesQuotationRoutes';
import salesOrderRoutes from './routes/salesOrderRoutes';
import orderAllocationRoutes from './routes/orderAllocationRoutes';
import productionRoutes from './routes/productionRoutes';
import qualityControlRoutes from './routes/qualityControlRoutes';
import packingRoutes from './routes/packingRoutes';
import dispatchRoutes from './routes/dispatchRoutes';
import salesInvoiceRoutes from './routes/salesInvoiceRoutes';
import reportRoutes from './routes/reportRoutes';
import userRoutes from './routes/userRoutes';
import financeRoutes from './routes/financeRoutes';
import payrollRoutes from './routes/payrollRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import bomRoutes from './routes/bomRoutes';
import purchaseRequisitionRoutes from './routes/purchaseRequisitionRoutes';

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, 'uploads/temp');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? [(process.env.FRONTEND_URL || '').replace(/\/$/, '')]
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://172.16.0.2:3000', 'http://192.168.254.191:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/purchase-enquiries', purchaseEnquiryRoutes);
app.use('/api/purchase-quotations', purchaseQuotationRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/grns', grnRoutes);
app.use('/api/purchase-invoices', purchaseInvoiceRoutes);
app.use('/api/job-work', jobWorkRoutes);
app.use('/api/sales-enquiries', salesEnquiryRoutes);
app.use('/api/sales-quotations', salesQuotationRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/order-allocations', orderAllocationRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality-control', qualityControlRoutes);
app.use('/api/packing', packingRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/sales-invoices', salesInvoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/purchase-requisitions', purchaseRequisitionRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to KK Trendz API' });
});

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('--- Global Error Handler ---');
    console.error('Error Message:', err.message);
    console.error('Stack Trace:', err.stack);
    console.error('---------------------------');
    
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected error occurred on the server',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
// Trigger restart 2

