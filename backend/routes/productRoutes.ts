import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { protect, admin } from '../middleware/authMiddleware';
import { upload } from '../config/cloudinary';

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(protect, admin, upload.single('image'), createProduct);

router.route('/:id')
    .put(protect, upload.single('image'), updateProduct)
    .delete(protect, admin, deleteProduct);

export default router;
