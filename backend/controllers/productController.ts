import { Request, Response } from 'express';
import Product from '../models/Product';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await Product.find().populate('createdBy updatedBy inventory.stockLocation.locationId');
        res.json(products);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Creating product with data:', req.body);
        console.log('File upload:', req.file);
        const productData = { ...req.body };

        // Parse stringified JSON fields from FormData
        const jsonFields = ['specifications', 'inventory', 'pricing', 'qualityParameters', 'costing', 'images', 'bom'];
        jsonFields.forEach(field => {
            if (typeof productData[field] === 'string') {
                try {
                    productData[field] = JSON.parse(productData[field]);
                } catch (e) {
                    console.log(`Failed to parse ${field}:`, e);
                }
            }
        });
        console.log('Final productData for Mongoose:', JSON.stringify(productData, null, 2));

        // Handle image upload from multer
        if (req.file) {
            const file = req.file as any;
            const imageUrl = file.path || file.secure_url || file.url;
            console.log('Image URL extracted:', imageUrl);
            
            if (imageUrl) {
                productData.images = [{
                    url: imageUrl,
                    isDefault: true,
                    caption: productData.productName || 'Product Image'
                }];
            } else {
                console.error('No URL found in req.file object:', file);
            }
        }

        const product = new Product({
            ...productData,
            createdBy: (req as any).user?._id
        });
        const savedProduct = await product.save();
        console.log('Saved product:', savedProduct);
        res.status(201).json(savedProduct);
    } catch (error: any) {
        console.error('--- CREATE PRODUCT ERROR ---');
        console.error('Message:', error.message);
        if (error.errors) {
            console.error('Validation Errors:', Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`).join(', '));
        }
        res.status(400).json({ message: error.message, details: error.errors });
    }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Updating product with data:', req.body);
        console.log('File upload (update):', req.file);
        const productData = { ...req.body };

        // Parse stringified JSON fields from FormData
        const jsonFields = ['specifications', 'inventory', 'pricing', 'qualityParameters', 'costing', 'images', 'bom'];
        jsonFields.forEach(field => {
            if (typeof productData[field] === 'string') {
                try {
                    productData[field] = JSON.parse(productData[field]);
                } catch (e) {
                    console.log(`Failed to parse ${field}:`, e);
                }
            }
        });

        // Handle image upload from multer
        if (req.file) {
            const file = req.file as any;
            const imageUrl = file.path || file.secure_url || file.url;
            console.log('Update Image URL extracted:', imageUrl);

            if (imageUrl) {
                productData.images = [{
                    url: imageUrl,
                    isDefault: true,
                    caption: productData.productName || 'Product Image'
                }];
            } else {
                console.error('No URL found in req.file (update):', file);
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
            ...productData,
            updatedBy: (req as any).user?._id
        }, { new: true });
        console.log('Updated product:', updatedProduct);
        res.json(updatedProduct);
    } catch (error: any) {
        console.error('Update Product Error:', error);
        res.status(400).json({ message: error.message, details: error.errors });
    }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
