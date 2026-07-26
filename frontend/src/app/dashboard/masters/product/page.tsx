'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, Edit2, Trash2, Package, FileText, Layers, Shirt,
    Scissors, BoxSelect, Beaker, Archive, IndianRupee, ShieldCheck, CheckCircle2, X, Upload, Camera
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

// ─── Initial Form State ───
const initialFormState = () => ({
    productCode: '',
    productName: '',
    productCategory: 'Fabric',
    productSubCategory: '',
    productDescription: '',
    hsnCode: '',
    sacCode: '',
    specifications: {
        yarn: {
            count: '', ply: 'Single', blendComposition: '', twist: 'S',
            strength: '', evenness: '', imperfections: '', moistureContent: '',
            oilContent: '', packageType: '', packageWeight: ''
        },
        fabric: {
            construction: '', gsm: '', width: '', rollLength: '',
            shrinkagePercentage: '', spiralityPercentage: '', pillingResistance: '',
            color: '', shadeCode: '', finishType: ''
        },
        garment: {
            style: '', sleeveType: '', fit: '', availableSizes: '',
            availableColors: '', fabricComposition: '', washCareInstructions: '',
            season: '', gender: ''
        },
        thread: { type: '', count: '', color: '', lengthPerUnit: '', strength: '' },
        button: { type: '', size: '', holes: '', color: '' },
        packing: { type: '', size: '', thickness: '', material: '', printingDetails: '' }
    },
    inventory: {
        unitOfMeasure: 'Meters',
        reorderLevel: 0,
        reorderQuantity: 0,
        safetyStock: 0,
        currentStock: 0,
        batchTracking: false,
        serialTracking: false,
        expiryTracking: false
    },
    costing: {
        standardCost: 0,
        averageCost: 0
    },
    pricing: [] as any[],
    qualityParameters: [] as any[],
    bom: [] as any[],
    status: 'Active'
});

// ─── Sub‐category options per category ───
const SUB_CATEGORIES: Record<string, string[]> = {
    Yarn: ['Cotton', 'Polyester', 'Blended', 'Specialty'],
    Fabric: ['Knitted', 'Woven', 'Greige', 'Dyed', 'Printed'],
    Garment: ['T-Shirt', 'Shirt', 'Pants', 'Shorts', 'Dresses'],
    Accessory: ['Thread', 'Button', 'Label', 'Zipper', 'Elastic'],
    'Packing Material': ['Poly Bag', 'Carton', 'Sticker', 'Tag'],
    Chemical: ['Dye', 'Auxiliary', 'Finishing Agent']
};

// ─── Tab configurations ───
const BASE_TABS = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'bom', label: 'BOM', icon: Layers },
    { id: 'inventory', label: 'Inventory', icon: Archive },
    { id: 'pricing', label: 'Pricing', icon: IndianRupee },
    { id: 'quality', label: 'Quality', icon: ShieldCheck },
    { id: 'status', label: 'Status', icon: CheckCircle2 },
];

const SPEC_TAB_MAP: Record<string, { id: string; label: string; icon: any }> = {
    Yarn: { id: 'yarn', label: 'Yarn Specs', icon: Layers },
    Fabric: { id: 'fabric', label: 'Fabric Specs', icon: BoxSelect },
    Garment: { id: 'garment', label: 'Garment Specs', icon: Shirt },
    Accessory: { id: 'accessory', label: 'Accessory Specs', icon: Scissors },
    'Packing Material': { id: 'packing', label: 'Packing Specs', icon: Package },
    Chemical: { id: 'chemical', label: 'Chemical Specs', icon: Beaker },
};

export default function ProductMasterPage() {
    const { loading: authLoading } = useAuth();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [subCategoryFilter, setSubCategoryFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState<any>(initialFormState());
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('basic');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Dynamic tabs based on category ───
    const TABS = [
        BASE_TABS[0], // basic
        // Only show BOM for documents categorized as Garment
        ...(formData.productCategory === 'Garment' ? [BASE_TABS[1]] : []),
        ...(SPEC_TAB_MAP[formData.productCategory] ? [SPEC_TAB_MAP[formData.productCategory]] : 
          SPEC_TAB_MAP[formData.productCategory?.charAt(0).toUpperCase() + formData.productCategory?.slice(1).toLowerCase()] ? 
          [SPEC_TAB_MAP[formData.productCategory?.charAt(0).toUpperCase() + formData.productCategory?.slice(1).toLowerCase()]] : []),
        ...BASE_TABS.slice(2) // inventory, pricing, quality, status
    ];

    // Reset active tab if it's no longer available (e.g. category changed)
    useEffect(() => {
        if (!TABS.find(t => t.id === activeTab)) {
            setActiveTab('basic');
        }
    }, [formData.productCategory]);

    const handleCategoryChange = (val: string) => {
        const updates: any = { productCategory: val, productSubCategory: '' };
        
        // Logical defaults based on category
        if (val === 'Garment') {
            updates.inventory = { ...formData.inventory, unitOfMeasure: 'Pieces' };
        } else {
            // Non-garment items should not have BOM data
            updates.bom = [];
            
            if (val === 'Fabric') {
                updates.inventory = { ...formData.inventory, unitOfMeasure: 'Meters' };
            } else if (val === 'Yarn') {
                updates.inventory = { ...formData.inventory, unitOfMeasure: 'Kgs' };
            }
        }
        
        setFormData({ ...formData, ...updates });
    };

    // ─── API ───
    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();

            // Append all fields from formData
            // Note: Since formData is complex, we might need to stringify some parts
            // or append them individually. However, for nested objects, stringifying is easier
            // but the backend needs to parse them. 
            // Better: append the top level fields.

            // Filter out empty BOM items to prevent Mongoose validation or casting (ObjectId) errors
            const cleanedBOM = (formData.bom || []).filter((b: any) => b.materialId && b.materialId.trim() !== '');

            // Deep Clean function to remove empty strings that cause Mongoose Number cast errors
            const cleanData = (obj: any): any => {
                const newObj: any = Array.isArray(obj) ? [] : {};
                Object.keys(obj).forEach(key => {
                    const value = obj[key];
                    if (value === null || value === undefined || value === '') return;
                    
                    if (typeof value === 'object' && !(value instanceof File)) {
                        const cleaned = cleanData(value);
                        // Only add the object if it's not empty or it's an array
                        if (Object.keys(cleaned).length > 0 || Array.isArray(cleaned)) {
                            newObj[key] = cleaned;
                        }
                    } else {
                        newObj[key] = value;
                    }
                });
                return newObj;
            };

            const submissionData = cleanData({ ...formData, bom: cleanedBOM });

            Object.keys(submissionData).forEach(key => {
                if (typeof submissionData[key] === 'object' && submissionData[key] !== null && !(submissionData[key] instanceof File)) {
                    const str = JSON.stringify(submissionData[key]);
                    data.append(key, str);
                    console.log(`Appending ${key}:`, str.substring(0, 50) + '...');
                } else {
                    data.append(key, submissionData[key]);
                    console.log(`Appending ${key}:`, submissionData[key]);
                }
            });
            
            if (selectedImage) {
                console.log('--- NEW IMAGE SELECTED ---', selectedImage.name);
                data.append('image', selectedImage);
            }

            if (editingProduct) {
                await api.put(`/products/${editingProduct._id}`, data);
            } else {
                await api.post('/products', data);
            }
            closeModal();
            fetchProducts();
            showToast(`Product ${editingProduct ? 'updated' : 'created'} successfully`, 'success');
        } catch (error: any) {
            console.error('Error saving product:', error);
            let msg = error?.response?.data?.message || error.message;
            
            // If there are detailed validation errors (from my backend fix)
            const details = error?.response?.data?.details;
            if (details && typeof details === 'object') {
                const errors = Object.keys(details).map(field => {
                    return details[field].message || `${field} is invalid`;
                });
                if (errors.length > 0) {
                    msg = `Validation Error: ${errors.join('; ')}`;
                }
            } else if (msg.includes('E11000')) {
                msg = 'Duplicate Error: A product with this Code already exists!';
            }
            
            showToast(msg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (product: any) => {
        setEditingProduct(product);
        const init = initialFormState();
        setFormData({
            productCode: product.productCode || '',
            productName: product.productName || '',
            productCategory: product.productCategory || 'Fabric',
            productSubCategory: product.productSubCategory || '',
            productDescription: product.productDescription || '',
            hsnCode: product.hsnCode || '',
            sacCode: product.sacCode || '',
            specifications: {
                yarn: { ...init.specifications.yarn, ...(product.specifications?.yarn || {}) },
                fabric: { ...init.specifications.fabric, ...(product.specifications?.fabric || {}) },
                garment: { ...init.specifications.garment, ...(product.specifications?.garment || {}) },
                thread: { ...init.specifications.thread, ...(product.specifications?.thread || {}) },
                button: { ...init.specifications.button, ...(product.specifications?.button || {}) },
                packing: { ...init.specifications.packing, ...(product.specifications?.packing || {}) }
            },
            inventory: {
                unitOfMeasure: product.inventory?.unitOfMeasure || 'Meters',
                reorderLevel: product.inventory?.reorderLevel || 0,
                reorderQuantity: product.inventory?.reorderQuantity || 0,
                safetyStock: product.inventory?.safetyStock || 0,
                currentStock: product.inventory?.currentStock || 0,
                batchTracking: product.inventory?.batchTracking || false,
                serialTracking: product.inventory?.serialTracking || false,
                expiryTracking: product.inventory?.expiryTracking || false
            },
            costing: {
                standardCost: product.costing?.standardCost || 0,
                averageCost: product.costing?.averageCost || 0
            },
            pricing: product.pricing || [],
            qualityParameters: product.qualityParameters || [],
            bom: product.bom || [],
            images: product.images || [],
            status: product.status || 'Active'
        });
        setImagePreview(product.images?.[0]?.url || null);
        setSelectedImage(null);
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    const handleDeleteProduct = async (product: any) => {
        if (!confirm(`Are you sure you want to delete "${product.productName}"?`)) return;
        try {
            await api.delete(`/products/${product._id}`);
            fetchProducts();
            showToast('Product deleted successfully', 'info');
        } catch (error: any) {
            console.error('Error deleting product:', error);
            const msg = error?.response?.data?.message || 'Failed to delete product';
            showToast(msg, 'error');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData(initialFormState());
        setActiveTab('basic');
        setSelectedImage(null);
        setImagePreview(null);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData(initialFormState());
        setActiveTab('basic');
        setSelectedImage(null);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (authLoading) return;
        fetchProducts();
    }, [authLoading]);

    // ─── Automated BOM Retrieval specifically for Garments ───
    useEffect(() => {
        const retrieveOfficialBOM = async () => {
            // If editing a garment and looking at the BOM tab but no materials exist yet
            if (activeTab === 'bom' && editingProduct && formData.productCategory === 'Garment' && formData.bom.length === 0) {
                try {
                    console.log('Retrieving official BOM for garment:', editingProduct.productName);
                    const res = await api.get(`/boms/product/${editingProduct._id}`);
                    if (res.data && res.data.materials && res.data.materials.length > 0) {
                        const materials = res.data.materials.map((m: any) => ({
                            materialId: m.materialId?._id || m.materialId,
                            quantityPerProduct: m.quantityPerProduct || 0,
                            unit: m.unit || '',
                            wastagePercentage: m.wastagePercentage || 0,
                            consumptionDifferencesBySize: m.consumptionDifferencesBySize || []
                        }));
                        
                        setFormData((prev: any) => ({ ...prev, bom: materials }));
                        showToast(`Retrieved ${materials.length} components from official BOM`, 'info');
                    }
                } catch (error) {
                    console.log('No official BOM configuration found for this product.');
                }
            }
        };
        retrieveOfficialBOM();
    }, [activeTab, editingProduct?._id, formData.productCategory]);


    // ─── Helpers ───
    const setSpec = (section: string, field: string, value: any) => {
        setFormData({
            ...formData,
            specifications: {
                ...formData.specifications,
                [section]: { ...formData.specifications[section], [field]: value }
            }
        });
    };
    const setInv = (field: string, value: any) => {
        setFormData({ ...formData, inventory: { ...formData.inventory, [field]: value } });
    };
    const setCost = (field: string, value: any) => {
        setFormData({ ...formData, costing: { ...formData.costing, [field]: value } });
    };

    // ─── Filtering ───
    const filteredProducts = products.filter((p: any) => {
        const matchSearch =
            p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.hsnCode?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = categoryFilter === 'All' || p.productCategory === categoryFilter;
        const matchSubCategory = subCategoryFilter === 'All' || p.productSubCategory === subCategoryFilter;
        return matchSearch && matchCategory && matchSubCategory;
    });

    const selectClass = "w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none";

    return (
        <div className="space-y-6">

            {/* ─── Table Card ─── */}
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 flex items-center gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search by name, code, or HSN..."
                                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl">
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    {['All', 'Yarn', 'Fabric', 'Garment', 'Accessory', 'Packing Material', 'Chemical'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => { setCategoryFilter(c); setSubCategoryFilter('All'); }}
                                            className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${categoryFilter === c ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-500 hover:text-indigo-400'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                                {categoryFilter !== 'All' && SUB_CATEGORIES[categoryFilter] && (
                                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-[8px] font-black p-2 uppercase text-slate-400">Sub:</span>
                                        {['All', ...SUB_CATEGORIES[categoryFilter]].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setSubCategoryFilter(s)}
                                                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${subCategoryFilter === s ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]"
                            onClick={openAddModal}
                        >
                            <Plus className="mr-2 h-4 w-4" /> New Product
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                            <TableRow className="border-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">Product</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Category</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">HSN / SAC</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Stock</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Cost</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6 h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading products...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                            <Package size={40} className="text-slate-300 mb-2" />
                                            <p className="font-bold text-sm text-slate-400">No products found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product: any) => (
                                    <TableRow key={product._id} className="group border-b last:border-0 border-b-slate-50 dark:border-b-slate-800/50">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-16 w-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow">
                                                    {product.images?.[0]?.url ? (
                                                        <img src={product.images[0].url} alt={product.productName} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-8 w-8 m-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 dark:text-white tracking-tight">{product.productName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono italic uppercase">{product.productCode}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="inline-flex items-center w-fit rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 ring-1 ring-indigo-700/10 dark:bg-indigo-900/40 dark:text-indigo-400">
                                                    {product.productCategory}
                                                </span>
                                                {product.productSubCategory && (
                                                    <span className="text-[10px] text-slate-400">{product.productSubCategory}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                                {product.hsnCode || product.sacCode || '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`font-semibold text-sm ${(product.inventory?.currentStock || 0) <= (product.inventory?.reorderLevel || 0) ? 'text-orange-600' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {(product.inventory?.currentStock || 0).toLocaleString()} {product.inventory?.unitOfMeasure}
                                            </div>
                                            {(product.inventory?.currentStock || 0) <= (product.inventory?.reorderLevel || 0) && (
                                                <div className="text-[9px] uppercase font-black text-orange-600">Low Stock</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                ₹{(product.costing?.standardCost || 0).toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${product.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20'}`}>
                                                {product.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600" onClick={() => handleEditClick(product)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteProduct(product)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════
                 ADD / EDIT PRODUCT MODAL
            ═══════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingProduct ? `Edit Product: ${editingProduct.productName}` : 'Add New Product'}
                maxWidth="3xl"
            >
                {/* Tab Navigation */}
                <div className="flex gap-0.5 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">

                        {/* ─── TAB: Basic Info ─── */}
                        {activeTab === 'basic' && (
                            <div className="space-y-4">
                                {/* Product Image Upload Area */}
                                <div className="flex justify-center mb-6">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative h-28 w-28 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-all overflow-hidden group"
                                    >
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Camera className="text-white h-6 w-6" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-500 mb-1" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Product Category *">
                                        <select className={selectClass} value={formData.productCategory} onChange={e => handleCategoryChange(e.target.value)}>
                                            {Object.keys(SUB_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Sub-Category">
                                        <select className={selectClass} value={formData.productSubCategory} onChange={e => setFormData({ ...formData, productSubCategory: e.target.value })}>
                                            <option value="">Select Sub-Category</option>
                                            {(SUB_CATEGORIES[formData.productCategory] || []).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Product Code *">
                                        <Input required placeholder="e.g. YRN-40S-001" className="font-mono uppercase" value={formData.productCode} onChange={e => setFormData({ ...formData, productCode: e.target.value })} />
                                    </FormField>
                                    <FormField label="Product Name *">
                                        <Input required placeholder='e.g. Cotton Yarn 40s' value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} />
                                    </FormField>
                                </div>
                                <FormField label="Product Description">
                                    <textarea className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none min-h-[80px] resize-y" placeholder="Detailed product description..." rows={3} value={formData.productDescription} onChange={e => setFormData({ ...formData, productDescription: e.target.value })} />
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="HSN Code (for GST)">
                                        <Input placeholder="e.g. 5205" value={formData.hsnCode} onChange={e => setFormData({ ...formData, hsnCode: e.target.value })} />
                                    </FormField>
                                    <FormField label="SAC Code (for services)">
                                        <Input placeholder="e.g. 998821" value={formData.sacCode} onChange={e => setFormData({ ...formData, sacCode: e.target.value })} />
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: Yarn Specifications ─── */}
                        {activeTab === 'yarn' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Yarn Specifications</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Count (e.g. 20s, 40s)">
                                        <Input placeholder="40s" value={formData.specifications.yarn.count} onChange={e => setSpec('yarn', 'count', e.target.value)} />
                                    </FormField>
                                    <FormField label="Ply">
                                        <select className={selectClass} value={formData.specifications.yarn.ply} onChange={e => setSpec('yarn', 'ply', e.target.value)}>
                                            <option>Single</option><option>Double</option><option>Triple</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Twist (S/Z)">
                                        <select className={selectClass} value={formData.specifications.yarn.twist} onChange={e => setSpec('yarn', 'twist', e.target.value)}>
                                            <option>S</option><option>Z</option>
                                        </select>
                                    </FormField>
                                </div>
                                <FormField label="Blend Composition">
                                    <Input placeholder="e.g. 100% Cotton, 50:50 Poly-Cotton" value={formData.specifications.yarn.blendComposition} onChange={e => setSpec('yarn', 'blendComposition', e.target.value)} />
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Strength (cN/tex)">
                                        <Input type="number" value={formData.specifications.yarn.strength} onChange={e => setSpec('yarn', 'strength', e.target.value)} />
                                    </FormField>
                                    <FormField label="Evenness (U% or CV%)">
                                        <Input placeholder="e.g. 12.5 CV%" value={formData.specifications.yarn.evenness} onChange={e => setSpec('yarn', 'evenness', e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Imperfections (per km)">
                                        <Input placeholder="e.g. 50" value={formData.specifications.yarn.imperfections} onChange={e => setSpec('yarn', 'imperfections', e.target.value)} />
                                    </FormField>
                                    <FormField label="Moisture Content (%)">
                                        <Input placeholder="e.g. 8.5" value={formData.specifications.yarn.moistureContent} onChange={e => setSpec('yarn', 'moistureContent', e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Oil Content (%)">
                                        <Input placeholder="e.g. 0.5" value={formData.specifications.yarn.oilContent} onChange={e => setSpec('yarn', 'oilContent', e.target.value)} />
                                    </FormField>
                                    <FormField label="Package Type">
                                        <select className={selectClass} value={formData.specifications.yarn.packageType} onChange={e => setSpec('yarn', 'packageType', e.target.value)}>
                                            <option value="">Select</option><option>Cone</option><option>Carton</option><option>Cheese</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Package Weight (kg)">
                                        <Input placeholder="e.g. 2.5" value={formData.specifications.yarn.packageWeight} onChange={e => setSpec('yarn', 'packageWeight', e.target.value)} />
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: Fabric Specifications ─── */}
                        {activeTab === 'fabric' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Fabric Specifications</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Construction">
                                        <select className={selectClass} value={formData.specifications.fabric.construction} onChange={e => setSpec('fabric', 'construction', e.target.value)}>
                                            <option value="">Select</option><option>Single Jersey</option><option>Pique</option><option>Rib</option><option>Interlock</option>
                                        </select>
                                    </FormField>
                                    <FormField label="GSM">
                                        <Input type="number" placeholder="e.g. 180" value={formData.specifications.fabric.gsm} onChange={e => setSpec('fabric', 'gsm', e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Width (inch/cm)">
                                        <Input placeholder="e.g. 72 inch" value={formData.specifications.fabric.width} onChange={e => setSpec('fabric', 'width', e.target.value)} />
                                    </FormField>
                                    <FormField label="Roll Length (mtrs)">
                                        <Input type="number" placeholder="e.g. 25" value={formData.specifications.fabric.rollLength} onChange={e => setSpec('fabric', 'rollLength', e.target.value)} />
                                    </FormField>
                                    <FormField label="Shrinkage %">
                                        <Input placeholder="e.g. 5" value={formData.specifications.fabric.shrinkagePercentage} onChange={e => setSpec('fabric', 'shrinkagePercentage', e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Spirality %">
                                        <Input placeholder="e.g. 3" value={formData.specifications.fabric.spiralityPercentage} onChange={e => setSpec('fabric', 'spiralityPercentage', e.target.value)} />
                                    </FormField>
                                    <FormField label="Pilling Resistance (1-5)">
                                        <select className={selectClass} value={formData.specifications.fabric.pillingResistance} onChange={e => setSpec('fabric', 'pillingResistance', e.target.value)}>
                                            <option value="">Select</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
                                        </select>
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Color">
                                        <Input placeholder="e.g. Navy Blue" value={formData.specifications.fabric.color} onChange={e => setSpec('fabric', 'color', e.target.value)} />
                                    </FormField>
                                    <FormField label="Shade Code">
                                        <Input placeholder="e.g. NB-205" value={formData.specifications.fabric.shadeCode} onChange={e => setSpec('fabric', 'shadeCode', e.target.value)} />
                                    </FormField>
                                    <FormField label="Finish Type">
                                        <select className={selectClass} value={formData.specifications.fabric.finishType} onChange={e => setSpec('fabric', 'finishType', e.target.value)}>
                                            <option value="">Select</option><option>Anti-bacterial</option><option>Bio-polish</option><option>Enzyme wash</option><option>None</option>
                                        </select>
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: Garment Specifications ─── */}
                        {activeTab === 'garment' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Garment Specifications</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Style">
                                        <Input placeholder="e.g. V-Neck" value={formData.specifications.garment.style} onChange={e => setSpec('garment', 'style', e.target.value)} />
                                    </FormField>
                                    <FormField label="Sleeve Type">
                                        <Input placeholder="e.g. Short" value={formData.specifications.garment.sleeveType} onChange={e => setSpec('garment', 'sleeveType', e.target.value)} />
                                    </FormField>
                                    <FormField label="Fit">
                                        <Input placeholder="e.g. Slim" value={formData.specifications.garment.fit} onChange={e => setSpec('garment', 'fit', e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Available Sizes">
                                        <Input placeholder="e.g. S, M, L, XL, XXL" value={formData.specifications.garment.availableSizes} onChange={e => setSpec('garment', 'availableSizes', e.target.value)} />
                                    </FormField>
                                    <FormField label="Available Colors">
                                        <Input placeholder="e.g. Black, White, Navy" value={formData.specifications.garment.availableColors} onChange={e => setSpec('garment', 'availableColors', e.target.value)} />
                                    </FormField>
                                </div>
                                <FormField label="Fabric Composition">
                                    <Input placeholder="e.g. 100% Cotton, 180 GSM Single Jersey" value={formData.specifications.garment.fabricComposition} onChange={e => setSpec('garment', 'fabricComposition', e.target.value)} />
                                </FormField>
                                <FormField label="Wash Care Instructions">
                                    <textarea className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none resize-y" rows={2} placeholder="e.g. Machine wash cold, do not bleach..." value={formData.specifications.garment.washCareInstructions} onChange={e => setSpec('garment', 'washCareInstructions', e.target.value)} />
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Season">
                                        <select className={selectClass} value={formData.specifications.garment.season} onChange={e => setSpec('garment', 'season', e.target.value)}>
                                            <option value="">Select</option><option>Summer</option><option>Winter</option><option>All Season</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Gender">
                                        <select className={selectClass} value={formData.specifications.garment.gender} onChange={e => setSpec('garment', 'gender', e.target.value)}>
                                            <option value="">Select</option><option>Men</option><option>Women</option><option>Unisex</option><option>Kids</option>
                                        </select>
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: Accessory Specifications ─── */}
                        {activeTab === 'accessory' && (
                            <div className="space-y-5">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Accessory Specifications</p>
                                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3 bg-slate-50 dark:bg-slate-800/50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Thread Details</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField label="Type"><Input placeholder="e.g. Polyester" value={formData.specifications.thread.type} onChange={e => setSpec('thread', 'type', e.target.value)} /></FormField>
                                        <FormField label="Count"><Input placeholder="e.g. 40/2" value={formData.specifications.thread.count} onChange={e => setSpec('thread', 'count', e.target.value)} /></FormField>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <FormField label="Color"><Input placeholder="e.g. White" value={formData.specifications.thread.color} onChange={e => setSpec('thread', 'color', e.target.value)} /></FormField>
                                        <FormField label="Length/Unit"><Input placeholder="e.g. 5000m" value={formData.specifications.thread.lengthPerUnit} onChange={e => setSpec('thread', 'lengthPerUnit', e.target.value)} /></FormField>
                                        <FormField label="Strength"><Input placeholder="e.g. High" value={formData.specifications.thread.strength} onChange={e => setSpec('thread', 'strength', e.target.value)} /></FormField>
                                    </div>
                                </div>
                                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3 bg-slate-50 dark:bg-slate-800/50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Button Details</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField label="Type"><select className={selectClass} value={formData.specifications.button.type} onChange={e => setSpec('button', 'type', e.target.value)}><option value="">Select</option><option>Plastic</option><option>Metal</option><option>Pearl</option></select></FormField>
                                        <FormField label="Size (Line)"><Input placeholder="e.g. 20L" value={formData.specifications.button.size} onChange={e => setSpec('button', 'size', e.target.value)} /></FormField>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField label="Holes"><Input placeholder="e.g. 4" value={formData.specifications.button.holes} onChange={e => setSpec('button', 'holes', e.target.value)} /></FormField>
                                        <FormField label="Color"><Input placeholder="e.g. Black" value={formData.specifications.button.color} onChange={e => setSpec('button', 'color', e.target.value)} /></FormField>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: Packing Specifications ─── */}
                        {activeTab === 'packing' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Packing Material Specifications</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Type">
                                        <select className={selectClass} value={formData.specifications.packing.type} onChange={e => setSpec('packing', 'type', e.target.value)}>
                                            <option value="">Select</option><option>Poly Bag</option><option>Carton</option><option>Sticker</option><option>Tag</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Size">
                                        <Input placeholder="e.g. W×L or L×W×H" value={formData.specifications.packing.size} onChange={e => setSpec('packing', 'size', e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Thickness (microns)">
                                        <Input placeholder="e.g. 40" value={formData.specifications.packing.thickness} onChange={e => setSpec('packing', 'thickness', e.target.value)} />
                                    </FormField>
                                    <FormField label="Material">
                                        <Input placeholder="e.g. Paper, Vinyl" value={formData.specifications.packing.material} onChange={e => setSpec('packing', 'material', e.target.value)} />
                                    </FormField>
                                    <FormField label="Printing Details">
                                        <Input placeholder="e.g. 2-color" value={formData.specifications.packing.printingDetails} onChange={e => setSpec('packing', 'printingDetails', e.target.value)} />
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: Chemical (minimal) ─── */}
                        {activeTab === 'chemical' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Chemical Specifications</p>
                                <FormField label="Description / Usage Instructions">
                                    <textarea className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none resize-y" rows={4} placeholder="Describe the chemical, concentration, usage..." value={formData.productDescription} onChange={e => setFormData({ ...formData, productDescription: e.target.value })} />
                                </FormField>
                            </div>
                        )}

                        {/* ─── TAB: BOM (Bill of Materials) ─── */}
                        {activeTab === 'bom' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Bill of Materials (Accessories/Components)</p>
                                    <Button 
                                        type="button" 
                                        onClick={() => setFormData({ ...formData, bom: [...formData.bom, { materialId: '', quantityPerProduct: 0, unit: '', wastagePercentage: 0, consumptionDifferencesBySize: [] }] })}
                                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 h-8 px-4 text-[10px] font-black uppercase rounded-lg"
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add Component
                                    </Button>
                                </div>
                                {formData.bom.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                        <Layers className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No components added yet.</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">If this product needs accessories (like buttons, thread), add them here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formData.bom.map((bItem: any, idx: number) => (
                                            <div key={idx} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-4 relative group transition-all hover:border-indigo-200 dark:hover:border-indigo-800">
                                                <button 
                                                    type="button" 
                                                    onClick={() => { const u = [...formData.bom]; u.splice(idx, 1); setFormData({ ...formData, bom: u }); }}
                                                    className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField label="Material / Accessory">
                                                        <select 
                                                            className={selectClass} 
                                                            value={bItem.materialId} 
                                                            onChange={e => {
                                                                const chosenProd = products.find(p => p._id === e.target.value);
                                                                const u = [...formData.bom]; 
                                                                u[idx].materialId = e.target.value; 
                                                                if (chosenProd?.inventory?.unitOfMeasure) {
                                                                    u[idx].unit = chosenProd.inventory.unitOfMeasure;
                                                                }
                                                                setFormData({ ...formData, bom: u }); 
                                                            }}
                                                        >
                                                            <option value="">Select Material</option>
                                                            {products
                                                                .filter(p => p.productCategory !== 'Garment') // Usually components are accessories/yarn/fabric
                                                                .map(p => (
                                                                    <option key={p._id} value={p._id}>
                                                                        {p.productName} ({p.productCode})
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </FormField>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <FormField label="Qty Per Ptct">
                                                            <Input 
                                                                type="number" 
                                                                step="any"
                                                                value={bItem.quantityPerProduct || ''} 
                                                                onChange={e => { const u = [...formData.bom]; u[idx].quantityPerProduct = Number(e.target.value); setFormData({ ...formData, bom: u }); }} 
                                                            />
                                                        </FormField>
                                                        <FormField label="Unit">
                                                            <Input 
                                                                placeholder="e.g. m, pcs" 
                                                                value={bItem.unit || ''} 
                                                                onChange={e => { const u = [...formData.bom]; u[idx].unit = e.target.value; setFormData({ ...formData, bom: u }); }} 
                                                            />
                                                        </FormField>
                                                        <FormField label="Wastage %">
                                                            <Input 
                                                                type="number" 
                                                                step="any"
                                                                value={bItem.wastagePercentage || ''} 
                                                                onChange={e => { const u = [...formData.bom]; u[idx].wastagePercentage = Number(e.target.value); setFormData({ ...formData, bom: u }); }} 
                                                            />
                                                        </FormField>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── TAB: Inventory Settings ─── */}
                        {activeTab === 'inventory' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Inventory Settings</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Unit of Measure *">
                                        <select className={selectClass} value={formData.inventory.unitOfMeasure} onChange={e => setInv('unitOfMeasure', e.target.value)}>
                                            <option>Kgs</option><option>Meters</option><option>Pieces</option><option>Dozens</option><option>Rolls</option><option>Cones</option><option>Packs</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Current Stock">
                                        <Input type="number" value={formData.inventory.currentStock} onChange={e => setInv('currentStock', Number(e.target.value))} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Reorder Level">
                                        <Input type="number" placeholder="Min stock before reorder" value={formData.inventory.reorderLevel} onChange={e => setInv('reorderLevel', Number(e.target.value))} />
                                    </FormField>
                                    <FormField label="Reorder Quantity">
                                        <Input type="number" placeholder="How much to order" value={formData.inventory.reorderQuantity} onChange={e => setInv('reorderQuantity', Number(e.target.value))} />
                                    </FormField>
                                    <FormField label="Safety Stock">
                                        <Input type="number" placeholder="Buffer stock" value={formData.inventory.safetyStock} onChange={e => setInv('safetyStock', Number(e.target.value))} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Batch Tracking">
                                        <select className={selectClass} value={formData.inventory.batchTracking ? 'Yes' : 'No'} onChange={e => setInv('batchTracking', e.target.value === 'Yes')}>
                                            <option>No</option><option>Yes</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Serial Tracking">
                                        <select className={selectClass} value={formData.inventory.serialTracking ? 'Yes' : 'No'} onChange={e => setInv('serialTracking', e.target.value === 'Yes')}>
                                            <option>No</option><option>Yes</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Expiry/Shelf Life Tracking">
                                        <select className={selectClass} value={formData.inventory.expiryTracking ? 'Yes' : 'No'} onChange={e => setInv('expiryTracking', e.target.value === 'Yes')}>
                                            <option>No</option><option>Yes</option>
                                        </select>
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: Pricing Information ─── */}
                        {activeTab === 'pricing' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Pricing & Costing</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Standard Cost (₹)">
                                        <Input type="number" placeholder="Manufacturing cost" value={formData.costing.standardCost} onChange={e => setCost('standardCost', Number(e.target.value))} />
                                    </FormField>
                                    <FormField label="Average Cost (₹)">
                                        <Input type="number" placeholder="Average purchase cost" value={formData.costing.averageCost} onChange={e => setCost('averageCost', Number(e.target.value))} />
                                    </FormField>
                                </div>

                                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">Price Lists</p>
                                    {formData.pricing.map((p: any, idx: number) => (
                                        <div key={idx} className="p-3 mb-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black uppercase text-indigo-600">Price #{idx + 1}</span>
                                                <button type="button" onClick={() => setFormData({ ...formData, pricing: formData.pricing.filter((_: any, i: number) => i !== idx) })} className="text-rose-500"><X size={14} /></button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <FormField label="Customer Type">
                                                    <select className={selectClass} value={p.partyType} onChange={e => { const u = [...formData.pricing]; u[idx].partyType = e.target.value; setFormData({ ...formData, pricing: u }); }}>
                                                        <option>All</option><option>Retailer</option><option>Wholesaler</option><option>Exporter</option>
                                                    </select>
                                                </FormField>
                                                <FormField label="Selling Price (₹)">
                                                    <Input type="number" value={p.rate} onChange={e => { const u = [...formData.pricing]; u[idx].rate = Number(e.target.value); setFormData({ ...formData, pricing: u }); }} />
                                                </FormField>
                                                <FormField label="Min Order Qty">
                                                    <Input type="number" value={p.minOrderQuantity} onChange={e => { const u = [...formData.pricing]; u[idx].minOrderQuantity = Number(e.target.value); setFormData({ ...formData, pricing: u }); }} />
                                                </FormField>
                                            </div>
                                            <FormField label="Discount (%)">
                                                <Input type="number" value={p.discountAllowed} onChange={e => { const u = [...formData.pricing]; u[idx].discountAllowed = Number(e.target.value); setFormData({ ...formData, pricing: u }); }} />
                                            </FormField>
                                        </div>
                                    ))}
                                    <Button type="button" variant="ghost" className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 font-bold uppercase text-xs tracking-widest" onClick={() => setFormData({ ...formData, pricing: [...formData.pricing, { partyType: 'All', priceList: '', rate: 0, currency: 'INR', discountAllowed: 0, minOrderQuantity: 0 }] })}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Price List
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: Quality Parameters ─── */}
                        {activeTab === 'quality' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Quality Parameters</p>
                                {formData.qualityParameters.map((qp: any, idx: number) => (
                                    <div key={idx} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase text-indigo-600">Parameter #{idx + 1}</span>
                                            <button type="button" onClick={() => setFormData({ ...formData, qualityParameters: formData.qualityParameters.filter((_: any, i: number) => i !== idx) })} className="text-rose-500"><X size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Parameter Name">
                                                <Input placeholder="e.g. GSM, Width, Color Fastness" value={qp.parameter} onChange={e => { const u = [...formData.qualityParameters]; u[idx].parameter = e.target.value; setFormData({ ...formData, qualityParameters: u }); }} />
                                            </FormField>
                                            <FormField label="Standard Value">
                                                <Input placeholder="e.g. 180" value={qp.standardValue} onChange={e => { const u = [...formData.qualityParameters]; u[idx].standardValue = e.target.value; setFormData({ ...formData, qualityParameters: u }); }} />
                                            </FormField>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <FormField label="Tolerance Min (±)">
                                                <Input placeholder="e.g. -5" value={qp.toleranceMin} onChange={e => { const u = [...formData.qualityParameters]; u[idx].toleranceMin = e.target.value; setFormData({ ...formData, qualityParameters: u }); }} />
                                            </FormField>
                                            <FormField label="Tolerance Max (±)">
                                                <Input placeholder="e.g. +5" value={qp.toleranceMax} onChange={e => { const u = [...formData.qualityParameters]; u[idx].toleranceMax = e.target.value; setFormData({ ...formData, qualityParameters: u }); }} />
                                            </FormField>
                                            <FormField label="Unit">
                                                <Input placeholder="e.g. GSM, %, mm" value={qp.unit} onChange={e => { const u = [...formData.qualityParameters]; u[idx].unit = e.target.value; setFormData({ ...formData, qualityParameters: u }); }} />
                                            </FormField>
                                        </div>
                                        <FormField label="Test Method">
                                            <Input placeholder="e.g. ISO 3801, ASTM D3776" value={qp.testMethod} onChange={e => { const u = [...formData.qualityParameters]; u[idx].testMethod = e.target.value; setFormData({ ...formData, qualityParameters: u }); }} />
                                        </FormField>
                                    </div>
                                ))}
                                <Button type="button" variant="ghost" className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 font-bold uppercase text-xs tracking-widest" onClick={() => setFormData({ ...formData, qualityParameters: [...formData.qualityParameters, { parameter: '', standardValue: '', toleranceMin: '', toleranceMax: '', unit: '', testMethod: '' }] })}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Quality Parameter
                                </Button>
                            </div>
                        )}

                        {/* ─── TAB: Status & Activation ─── */}
                        {activeTab === 'status' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Status & Activation</p>
                                <FormField label="Product Status">
                                    <select className={selectClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option>Active</option>
                                        <option>Inactive</option>
                                        <option>Discontinued</option>
                                    </select>
                                </FormField>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
                                    <strong>Note:</strong> Set status to &quot;Active&quot; when the product is ready for purchase and sale. Inactive products won&apos;t appear in transaction dropdowns.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Footer ─── */}
                    <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-2">
                            {TABS.findIndex(t => t.id === activeTab) > 0 && (
                                <Button type="button" variant="ghost" onClick={() => { const idx = TABS.findIndex(t => t.id === activeTab); setActiveTab(TABS[idx - 1].id); }}>← Prev</Button>
                            )}
                            {TABS.findIndex(t => t.id === activeTab) < TABS.length - 1 && (
                                <Button type="button" variant="ghost" onClick={() => { const idx = TABS.findIndex(t => t.id === activeTab); setActiveTab(TABS[idx + 1].id); }}>Next →</Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">
                                {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
