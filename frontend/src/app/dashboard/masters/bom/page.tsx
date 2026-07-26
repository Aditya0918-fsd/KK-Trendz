'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Edit2, Trash2, FileSpreadsheet, Package, RefreshCw, Archive } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

const initialMaterialItem = () => ({
    materialId: '',
    materialName: '',
    quantityPerProduct: '',
    unit: '',
    wastagePercentage: 0,
    consumptionDifferencesBySize: [] as { size: string, quantity: string }[]
});

const initialFormState = () => ({
    bomNumber: '',
    productId: '',
    isActive: true,
    materials: [] as ReturnType<typeof initialMaterialItem>[]
});

export default function BOMPage() {
    const { loading: authLoading } = useAuth();
    const [boms, setBoms] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBOM, setEditingBOM] = useState<any>(null);
    const [formData, setFormData] = useState<ReturnType<typeof initialFormState>>(initialFormState());
    
    const { showToast } = useToast();

    // ─── API Setup ───
    const fetchData = async () => {
        try {
            setLoading(true);
            const [bomsRes, productsRes] = await Promise.all([
                api.get('/boms'),
                api.get('/products') // Need all available products
            ]);
            setBoms(bomsRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load BOM settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) fetchData();
    }, [authLoading]);

    // ─── Actions ───
    const handleProductChange = (productId: string) => {
        // Look for existing active BOM to populate or start fresh
        const product = products.find(p => p._id === productId);
        setFormData({
            ...formData,
            productId,
            bomNumber: formData.bomNumber || `BOM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`
        });
    };

    const handleAddMaterialRow = () => {
        setFormData({
            ...formData,
            materials: [...formData.materials, initialMaterialItem()]
        });
    };

    const handleRemoveMaterialRow = (index: number) => {
        const updated = [...formData.materials];
        updated.splice(index, 1);
        setFormData({ ...formData, materials: updated });
    };

    const handleMaterialChange = (index: number, field: string, value: any) => {
        const updated = [...formData.materials];
        if (field === 'materialId') {
            const selectedProduct = products.find(p => p._id === value);
            updated[index] = { 
                ...updated[index], 
                [field]: value, 
                materialName: selectedProduct?.productName || '',
                unit: selectedProduct?.inventory?.unitOfMeasure || ''
            };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setFormData({ ...formData, materials: updated });
    };

    const handleAddSizeDiff = (materialIndex: number) => {
        const updated = [...formData.materials];
        updated[materialIndex].consumptionDifferencesBySize.push({ size: '', quantity: '' });
        setFormData({ ...formData, materials: updated });
    };

    const handleRemoveSizeDiff = (materialIndex: number, diffIndex: number) => {
        const updated = [...formData.materials];
        updated[materialIndex].consumptionDifferencesBySize.splice(diffIndex, 1);
        setFormData({ ...formData, materials: updated });
    };

    const handleSizeDiffChange = (materialIndex: number, diffIndex: number, field: string, value: any) => {
        const updated = [...formData.materials];
        const diffs = updated[materialIndex].consumptionDifferencesBySize;
        diffs[diffIndex] = { ...diffs[diffIndex], [field]: value };
        setFormData({ ...formData, materials: updated });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.productId) { showToast('Please select a Target Product', 'error'); return; }
        if (formData.materials.length === 0) { showToast('BOM must contain at least one material', 'error'); return; }
        
        // Clean out empty numbers
        const cleanData = {
            ...formData,
            materials: formData.materials.map(m => ({
                ...m,
                quantityPerProduct: Number(m.quantityPerProduct) || 0,
                wastagePercentage: Number(m.wastagePercentage) || 0,
                consumptionDifferencesBySize: m.consumptionDifferencesBySize.map(sd => ({
                    ...sd,
                    quantity: Number(sd.quantity) || 0
                }))
            }))
        };

        setIsSubmitting(true);
        try {
            if (editingBOM) {
                await api.put(`/boms/${editingBOM._id}`, cleanData);
                showToast('BOM updated successfully', 'success');
            } else {
                await api.post('/boms', cleanData);
                showToast('BOM created successfully', 'success');
            }
            closeModal();
            fetchData();
        } catch (error: any) {
            console.error('Error saving BOM:', error);
            showToast(error?.response?.data?.message || 'Failed to save BOM', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (bom: any) => {
        setEditingBOM(bom);
        setFormData({
            bomNumber: bom.bomNumber || '',
            productId: bom.productId?._id || bom.productId || '',
            isActive: bom.isActive,
            materials: bom.materials ? bom.materials.map((m: any) => ({
                materialId: m.materialId?._id || m.materialId || '',
                materialName: m.materialName || '',
                quantityPerProduct: m.quantityPerProduct || '',
                unit: m.unit || '',
                wastagePercentage: m.wastagePercentage || 0,
                consumptionDifferencesBySize: m.consumptionDifferencesBySize || []
            })) : []
        });
        setIsModalOpen(true);
    };

    const handleDeleteBOM = async (bom: any) => {
        if (!confirm(`Are you sure you want to delete BOM ${bom.bomNumber}?`)) return;
        try {
            await api.delete(`/boms/${bom._id}`);
            fetchData();
            showToast('BOM deleted successfully', 'info');
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Failed to delete BOM', 'error');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBOM(null);
        setFormData(initialFormState());
    };

    // ─── Filters & UI constants ───
    const filteredBoms = boms.filter((b: any) => {
        return b.bomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
               b.productId?.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const finishedGoods = products.filter(p => ['Garment'].includes(p.productCategory));
    const rawMaterials = products.filter(p => !['Garment'].includes(p.productCategory));

    const selectClass = "w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none";

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search BOM # or Product Name..."
                                className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]" onClick={() => setIsModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create BOM
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                            <TableRow className="border-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">BOM No.</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Target Product</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Total Materials</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6 h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading BOMs...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredBoms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                            <FileSpreadsheet size={40} className="text-slate-300 mb-2" />
                                            <p className="font-bold text-sm text-slate-400">No BOM configurations found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBoms.map((bom: any) => (
                                    <TableRow key={bom._id} className="group border-b last:border-0 border-b-slate-50 dark:border-b-slate-800/50">
                                        <TableCell className="px-6 py-4">
                                            <div className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-xs">
                                                {bom.bomNumber}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-slate-400" />
                                                <div className="font-bold text-slate-800 dark:text-white">
                                                    {bom.productId?.productName}
                                                    <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-wider">{bom.productId?.productCode}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                <Archive className="h-3 w-3" /> {bom.materials?.length || 0} Items
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${bom.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20'}`}>
                                                {bom.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600" onClick={() => handleEditClick(bom)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteBOM(bom)}>
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
                 CREATE/EDIT MODAL
            ═══════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingBOM ? `Edit BOM: ${formData.bomNumber}` : 'Configure New Bill of Materials'}
                maxWidth="4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <FormField label="Target Product (Finished Good) *">
                            <select 
                                className={selectClass} 
                                value={formData.productId} 
                                onChange={e => handleProductChange(e.target.value)}
                                required
                            >
                                <option value="">Select Finished Garment...</option>
                                {finishedGoods.map(p => (
                                    <option key={p._id} value={p._id}>{p.productName} ({p.productCode})</option>
                                ))}
                            </select>
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="BOM Number">
                                <Input value={formData.bomNumber} onChange={e => setFormData({ ...formData, bomNumber: e.target.value })} placeholder="Auto-generated if empty" />
                            </FormField>
                            <FormField label="Status">
                                <select className={selectClass} value={formData.isActive ? 'Active' : 'Inactive'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'Active' })}>
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </select>
                            </FormField>
                        </div>
                    </div>

                    {/* Materials Loop */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                                <Archive className="h-4 w-4" /> Required Resources (Raw Materials)
                            </h3>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddMaterialRow} className="text-xs font-bold bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 text-indigo-600 h-8">
                                <Plus className="h-3 w-3 mr-1" /> Add Component
                            </Button>
                        </div>
                        
                        {formData.materials.map((material, mIdx) => (
                            <div key={mIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative group">
                                <button type="button" onClick={() => handleRemoveMaterialRow(mIdx)} className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-red-100 text-red-600 border justify-center items-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex">
                                    <Trash2 className="h-3 w-3" />
                                </button>

                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-5">
                                        <FormField label="Material / Accessory *">
                                            <select 
                                                className={selectClass} 
                                                value={material.materialId} 
                                                onChange={e => handleMaterialChange(mIdx, 'materialId', e.target.value)}
                                                required
                                            >
                                                <option value="">Select component...</option>
                                                {rawMaterials.map(rm => (
                                                    <option key={rm._id} value={rm._id}>{rm.productName} ({rm.productCode})</option>
                                                ))}
                                            </select>
                                        </FormField>
                                    </div>
                                    <div className="col-span-3">
                                        <FormField label={`Base Required (${material.unit || 'unit'}) *`}>
                                            <Input type="number" step="0.001" required value={material.quantityPerProduct} onChange={e => handleMaterialChange(mIdx, 'quantityPerProduct', e.target.value)} />
                                        </FormField>
                                    </div>
                                    <div className="col-span-2">
                                        <FormField label="Wastage (%)">
                                            <Input type="number" step="0.1" value={material.wastagePercentage} onChange={e => handleMaterialChange(mIdx, 'wastagePercentage', e.target.value)} />
                                        </FormField>
                                    </div>
                                </div>

                                {/* Size Matrix Toggle */}
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Size-wise Exceptions (Optional)
                                        </p>
                                        <button type="button" onClick={() => handleAddSizeDiff(mIdx)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400">
                                            + Add Size Variance
                                        </button>
                                    </div>
                                    
                                    {material.consumptionDifferencesBySize.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                            {material.consumptionDifferencesBySize.map((diff, dIdx) => (
                                                <div key={dIdx} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1.5 rounded-md">
                                                    <Input placeholder="Size (e.g. XXL)" className="h-7 text-xs px-2 w-16 text-center border-none shadow-none font-bold bg-slate-50" value={diff.size} onChange={e => handleSizeDiffChange(mIdx, dIdx, 'size', e.target.value)} />
                                                    <span className="text-slate-400 text-xs">:</span>
                                                    <Input type="number" step="0.001" placeholder="Qty" className="h-7 text-xs px-2 w-16 flex-1 border-none shadow-none" value={diff.quantity} onChange={e => handleSizeDiffChange(mIdx, dIdx, 'quantity', e.target.value)} />
                                                    <button type="button" onClick={() => handleRemoveSizeDiff(mIdx, dIdx)} className="p-1 text-red-500 opacity-50 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {formData.materials.length === 0 && (
                            <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                <p className="text-xs font-bold text-slate-400 mb-2">No materials added to this BOM yet.</p>
                                <Button type="button" variant="outline" onClick={handleAddMaterialRow} className="text-xs">
                                    Start Adding Configurations
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button type="button" variant="outline" onClick={closeModal} className="h-11 px-6 rounded-xl text-xs font-bold">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]">
                            {isSubmitting ? 'Saving...' : (editingBOM ? 'Update Configuration' : 'Save BOM')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
