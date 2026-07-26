'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Plus, Trash2, Save, X, Search,
    FilePlus, Calculator, User, List,
    Percent, Package, AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export default function NewProformaInvoice() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const { showToast } = useToast();

    const [form, setForm] = useState<any>({
        proformaNumber: `PI/${Math.floor(Math.random() * 9000) + 1000}`,
        date: new Date().toISOString().split('T')[0],
        customerId: null,
        customerName: '',
        items: [{
            description: '',
            quantity: 1,
            unit: 'PCS',
            rate: 0,
            gstRate: 12,
            taxableValue: 0,
            gstAmount: 0,
            totalValue: 0
        }],
        summary: {
            totalTaxableValue: 0,
            totalGst: 0,
            totalAmount: 0
        },
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft'
    });

    useEffect(() => {
        api.get('/parties').then(r => setCustomers(r.data)).catch(() => { });
    }, []);

    const calculateItem = (item: any) => {
        const taxableValue = item.quantity * item.rate;
        const gstAmount = (taxableValue * item.gstRate) / 100;
        return { ...item, taxableValue, gstAmount, totalValue: taxableValue + gstAmount };
    };

    const updateTotals = (items: any[]) => {
        const totalTaxable = items.reduce((sum, i) => sum + i.taxableValue, 0);
        const totalGst = items.reduce((sum, i) => sum + i.gstAmount, 0);
        setForm({
            ...form,
            items,
            summary: {
                totalTaxableValue: totalTaxable,
                totalGst,
                totalAmount: totalTaxable + totalGst
            }
        });
    };

    const handleItemChange = (i: number, f: string, v: any) => {
        const items = [...form.items];
        items[i] = calculateItem({ ...items[i], [f]: v });
        updateTotals(items);
    };

    const selectCust = (c: any) => {
        setForm({ ...form, customerId: c._id, customerName: c.name });
        setShowResults(false);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/finance/proforma', form);
            router.push('/dashboard/finance/proforma');
            showToast('Proforma invoice created successfully!', 'success');
        } catch (err: any) {
            console.error('Error saving proforma:', err);
            const msg = err?.response?.data?.message || 'Failed to save proforma.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
                <div className="flex justify-between items-center py-4 border-b">
                    <div>
                        <h1 className="text-xl font-black italic uppercase text-slate-800 flex items-center gap-2">
                            <FilePlus className="text-amber-500" /> New <span className="text-amber-500">Proforma Invoice</span>
                        </h1>
                        <p className="text-[9px] font-black uppercase text-slate-400 mt-1">Quotation Document • Pre-Billing</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => router.back()} className="text-[10px] uppercase font-black tracking-widest text-slate-400">Cancel</Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] uppercase font-black px-8 shadow-lg shadow-amber-100">
                            {loading ? 'Creating...' : 'Create Proforma'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 border-slate-200 overflow-visible">
                        <CardHeader className="py-3 bg-slate-50 border-b">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><User size={14} /> Party Detail</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="relative">
                                <Label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Customer Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-400"
                                        placeholder="TYPE CUSTOMER NAME..."
                                        value={form.customerName}
                                        onChange={(e) => { setForm({ ...form, customerName: e.target.value }); setShowResults(true); }}
                                        onFocus={() => setShowResults(true)}
                                    />
                                </div>
                                {showResults && customers.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-xl overflow-hidden">
                                        {customers.filter(c => c.name.toLowerCase().includes(form.customerName.toLowerCase())).map(c => (
                                            <div key={c._id} onClick={() => selectCust(c)} className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0 border-slate-50">
                                                <p className="text-[11px] font-black uppercase">{c.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Items List</span>
                                    <button type="button" onClick={() => updateTotals([...form.items, { description: '', quantity: 1, unit: 'PCS', rate: 0, gstRate: 12, taxableValue: 0, gstAmount: 0, totalValue: 0 }])} className="text-[9px] font-black uppercase text-amber-600 border border-amber-200 px-3 py-1 rounded-full"><Plus size={10} className="inline mr-1" /> Add Item</button>
                                </div>
                                <div className="space-y-3">
                                    {form.items.map((item: any, i: number) => (
                                        <div key={i} className="grid grid-cols-12 gap-3 items-end border-b border-slate-50 pb-3">
                                            <div className="col-span-5"><Input className="h-9 text-[11px] font-bold" placeholder="Material Description" value={item.description} onChange={(e) => handleItemChange(i, 'description', e.target.value)} /></div>
                                            <div className="col-span-2"><Input type="number" className="h-9 text-[11px] font-bold" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(i, 'quantity', Number(e.target.value))} /></div>
                                            <div className="col-span-2"><Input type="number" className="h-9 text-[11px] font-bold" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(i, 'rate', Number(e.target.value))} /></div>
                                            <div className="col-span-2 text-right text-[11px] font-black text-slate-800">₹{item.totalValue.toLocaleString()}</div>
                                            <div className="col-span-1 text-right"><button type="button" onClick={() => updateTotals(form.items.filter((_: any, idx: number) => idx !== i))} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="border-slate-200">
                            <CardHeader className="py-3 bg-slate-50 border-b">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500"><List size={14} className="inline mr-1" /> Proforma Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase text-slate-400">Proforma No</Label>
                                    <Input className="h-9 text-[11px] font-black uppercase" value={form.proformaNumber} onChange={(e) => setForm({ ...form, proformaNumber: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[8px] font-black uppercase text-slate-400">Issue Date</Label>
                                        <Input type="date" className="h-9 text-[10px] font-bold" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[8px] font-black uppercase text-slate-400">Valid Till</Label>
                                        <Input type="date" className="h-9 text-[10px] font-bold" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-dashed space-y-3">
                                    <div className="flex justify-between text-[11px] font-bold uppercase text-slate-500"><span>Taxable Total</span><span>₹{form.summary.totalTaxableValue.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-[11px] font-bold uppercase text-slate-500"><span>Estimated GST</span><span>₹{form.summary.totalGst.toLocaleString()}</span></div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-[10px] font-black uppercase text-slate-800">Total Proforma Value</span>
                                        <span className="text-xl font-black text-amber-600">₹{form.summary.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                            <AlertCircle className="text-amber-500" size={16} />
                            <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">Proforma is a non-tax document. Use this for quotations only.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
