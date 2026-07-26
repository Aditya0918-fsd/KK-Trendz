'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, ArrowLeft, Printer, Download,
    FileText, Scissors, User, Calendar, Trash2,
    Image as ImageIcon, MoreHorizontal, Layout, CheckCircle2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { Modal, FormField } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Select } from '@/components/ui/Select';

export default function ProductionJobCardPage() {
    const { loading: authLoading } = useAuth();
    const [jobCards, setJobCards] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedJobCard, setSelectedJobCard] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { showToast } = useToast();

    const printRef = useRef(null);

    // Form State
    const getInitialFormData = () => ({
        jobCardNumber: `JC-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        orderId: '',
        productId: '',
        styleNo: '',
        brand: '',
        gender: '',
        sizeRange: '',
        printType: 'NO PRINT',
        garmentImage: '',
        fabricSwatch: '',
        patternNo: '',
        planning: {
            ratio: '1:1:1:1',
            sizes: [
                { size: '2-3YRS', quantity: 0 },
                { size: '3-4YRS', quantity: 0 },
                { size: '5-6YRS', quantity: 0 },
                { size: '7-8YRS', quantity: 0 }
            ],
            totalQuantity: 0,
            fabricLotNo: '',
            bodyFabric: ''
        },
        fabricStatus: {
            ordered: 0,
            received: [{ quantity: 0, date: new Date() }],
            totalReceived: 0
        },
        cuttingQuantity: [
            { shade: 'A', sizes: [{ size: '2-3YRS', quantity: 0 }, { size: '3-4YRS', quantity: 0 }, { size: '5-6YRS', quantity: 0 }, { size: '7-8YRS', quantity: 0 }] },
            { shade: 'B', sizes: [{ size: '2-3YRS', quantity: 0 }, { size: '3-4YRS', quantity: 0 }, { size: '5-6YRS', quantity: 0 }, { size: '7-8YRS', quantity: 0 }] },
            { shade: 'C', sizes: [{ size: '2-3YRS', quantity: 0 }, { size: '3-4YRS', quantity: 0 }, { size: '5-6YRS', quantity: 0 }, { size: '7-8YRS', quantity: 0 }] }
        ],
        consumptionDetails: {
            drawingWeight: 0,
            pcs: 0,
            consumption: 0
        },
        logistics: {
            cuttingPlant: 'GANGANAGAR',
            otherLocation: 'DONNAGAR',
            styleCategory: 'Essential',
            layeringPerson: '',
            drawingMaster: '',
            cuttingMaster: ''
        }
    });

    const [formData, setFormData] = useState(getInitialFormData());

    const fetchJobCards = async () => {
        try {
            const res = await api.get('/production/job-cards');
            setJobCards(res.data);
        } catch (error) {
            console.error('Error fetching job cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [ordRes, prodRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/products')
            ]);
            setOrders(ordRes.data);
            setProducts(prodRes.data);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        fetchJobCards();
        fetchDropdownData();
    }, [authLoading]);

    const handleAddJobCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const totalPlanned = formData.planning.sizes.reduce((acc, s) => acc + s.quantity, 0);
            const payload = { ...formData, planning: { ...formData.planning, totalQuantity: totalPlanned } };

            await api.post('/production/job-cards', payload);
            setIsAddModalOpen(false);
            setFormData(getInitialFormData()); // Reset form to generate a new JC Number for next time
            showToast('Job Card Created Successfully', 'success');
            fetchJobCards();
        } catch (error: any) {
            console.error('Error adding job card:', error);
            showToast(error.response?.data?.message || error.message || 'Error occurred', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const openPreview = (jc: any) => {
        setSelectedJobCard(jc);
        setIsPreviewOpen(true);
    };

    const handleDelete = async (jc: any) => {
        if (!confirm(`Delete Job Card ${jc.jobCardNumber}? This cannot be undone.`)) return;
        setActionLoading(jc._id);
        try {
            await api.delete(`/production/job-cards/${jc._id}`);
            showToast('Job card deleted', 'success');
            fetchJobCards();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to delete', 'error');
        } finally { setActionLoading(null); }
    };

    const handleAdvanceStatus = async (jc: any) => {
        const statusMap: Record<string, string> = { Draft: 'Approved', Approved: 'Closed' };
        const nextStatus = statusMap[jc.status];
        if (!nextStatus) return;
        setActionLoading(jc._id);
        try {
            await api.put(`/production/job-cards/${jc._id}`, { status: nextStatus });
            showToast(`Job card ${nextStatus.toLowerCase()}`, 'success');
            fetchJobCards();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update', 'error');
        } finally { setActionLoading(null); }
    };

    const filtered = jobCards.filter(jc =>
        !search ||
        jc.jobCardNumber?.toLowerCase().includes(search.toLowerCase()) ||
        jc.styleNo?.toLowerCase().includes(search.toLowerCase()) ||
        jc.brand?.toLowerCase().includes(search.toLowerCase()) ||
        jc.gender?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/production">
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 border border-slate-100"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Production Job Cards</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Style-wise planning and cutting sheets</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[11px] tracking-widest h-10 px-6 shadow-none"
                >
                    <Plus className="h-4 w-4 mr-2" /> New Job Card
                </Button>
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-center print:hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4">
                    <div className="relative flex-1 text-left">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search by card #, style, or brand..." className="pl-10 h-10 text-sm border-slate-200" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900">
                            <TableRow>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Card #</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Style Info</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-left">Brand</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Quantity</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center px-4">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 font-medium text-center">Scanning records...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="py-10 text-slate-500 font-medium text-center">
                                    {search ? `No results for "${search}"` : 'No Job Cards found. Create one to start production planning.'}
                                </TableCell></TableRow>
                            ) : (
                                filtered.map(jc => (
                                    <TableRow key={jc._id} className="font-medium text-center border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-indigo-50/20">
                                        <TableCell>
                                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{jc.jobCardNumber}</p>
                                        </TableCell>
                                        <TableCell className="text-left py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">{jc.styleNo}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{jc.gender} | {jc.sizeRange}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left font-black text-xs text-slate-700 uppercase">
                                            {jc.brand}
                                        </TableCell>
                                        <TableCell className="text-right px-6 font-bold">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-white">{jc.planning?.totalQuantity || 0} Pcs</span>
                                                <span className="text-[8px] text-indigo-500 font-black uppercase tracking-tighter">Total Planned</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                jc.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                jc.status === 'Closed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                'bg-amber-100 text-amber-700 border-amber-200'
                                            } border shadow-sm`}>
                                                {jc.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openPreview(jc)} className="h-8 w-8 p-0 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="Print Preview">
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                {jc.status !== 'Closed' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleAdvanceStatus(jc)} disabled={actionLoading === jc._id} className="h-7 px-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-md">
                                                        {jc.status === 'Draft' ? 'Approve' : 'Close'}
                                                    </Button>
                                                )}
                                                {jc.status === 'Draft' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(jc)} disabled={actionLoading === jc._id} className="h-8 w-8 p-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full" title="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Preview Modal for Job Card */}
            <Modal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title="Job Card Print Preview"
                maxWidth="4xl"
            >
                <div className="flex justify-end mb-4 gap-2 print:hidden">
                    <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}><Trash2 className="h-4 w-4 mr-2" /> Close</Button>
                    <Button size="sm" onClick={handlePrint} className="bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px]"><Printer className="h-4 w-4 mr-2" /> Print Sheet</Button>
                </div>

                {/* ── PRINT COMPONENT (Mimics Image) ── */}
                <div ref={printRef} className="p-8 bg-white text-slate-900 border font-sans text-[12px] leading-tight print:p-0 print:border-none print:m-0 print:fixed print:inset-0 print:z-50 print:bg-white print:overflow-visible">
                    <div className="border-[2px] border-slate-900">
                        {/* Header Section */}
                        <div className="grid grid-cols-12 border-b-[2px] border-slate-900">
                            <div className="col-span-12 p-2 relative text-center border-b-[1.5px] border-slate-900 font-black text-lg uppercase tracking-[3px]">
                                K K TRENDZ
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] tracking-normal font-bold">
                                    JC#: <span className="text-indigo-600 font-black">{selectedJobCard?.jobCardNumber}</span>
                                </span>
                            </div>
                            <div className="col-span-5 border-r-[1.5px] border-slate-900">
                                <div className="grid grid-cols-2 border-b">
                                    <div className="p-1 font-black border-r uppercase bg-slate-50">Date</div><div className="p-1 pl-3 font-bold">{selectedJobCard ? format(new Date(selectedJobCard.date), 'dd-MM-yyyy') : ''}</div>
                                </div>
                                <div className="grid grid-cols-2 border-b">
                                    <div className="p-1 font-black border-r uppercase bg-slate-50 flex items-center text-[10px]">Order / Prod</div>
                                    <div className="p-1 pl-3 font-bold text-[9px] truncate flex items-center">
                                        {selectedJobCard ? (orders.find(o => o._id === (selectedJobCard.orderId?._id || selectedJobCard.orderId))?.orderNumber || selectedJobCard.orderId?.orderNumber || 'N/A') : 'N/A'} - {selectedJobCard ? (products.find(p => p._id === (selectedJobCard.productId?._id || selectedJobCard.productId))?.productName || selectedJobCard.productId?.productName || 'N/A') : 'N/A'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 border-b">
                                    <div className="p-1 font-black border-r uppercase bg-slate-50">Brand</div><div className="p-1 pl-3 font-bold">{selectedJobCard?.brand}</div>
                                </div>
                                <div className="grid grid-cols-2 border-b">
                                    <div className="p-1 font-black border-r uppercase bg-slate-50">Style no.</div><div className="p-1 pl-3 font-bold">{selectedJobCard?.styleNo}</div>
                                </div>
                                <div className="grid grid-cols-2 border-b">
                                    <div className="p-1 font-black border-r uppercase bg-slate-50">Gender</div><div className="p-1 pl-3 font-bold uppercase">{selectedJobCard?.gender}</div>
                                </div>
                                <div className="grid grid-cols-2 border-b">
                                    <div className="p-1 font-black border-r uppercase bg-slate-50">Size</div><div className="p-1 pl-3 font-bold">{selectedJobCard?.sizeRange}</div>
                                </div>
                                <div className="grid grid-cols-2">
                                    <div className="p-1 font-black border-r uppercase bg-slate-50">Print</div><div className="p-1 pl-3 font-bold">{selectedJobCard?.printType}</div>
                                </div>
                            </div>
                            <div className="col-span-3 border-r-[1.5px] border-slate-900 flex flex-col items-center justify-center p-1">
                                {selectedJobCard?.garmentImage ? (
                                    <div className="h-32 w-full flex items-center justify-center mb-1 border-dashed border border-slate-300" style={{ backgroundImage: `url(${selectedJobCard.garmentImage})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}></div>
                                ) : (
                                    <div className="h-32 w-full bg-slate-100 flex items-center justify-center mb-1 text-slate-400 font-bold uppercase text-[9px] border-dashed border border-slate-300">
                                        <ImageIcon className="h-6 w-6 opacity-20" />
                                    </div>
                                )}
                                <span className="text-[10px] font-black uppercase text-slate-500">Garment Image</span>
                            </div>
                            <div className="col-span-4 flex flex-col items-center justify-center p-4">
                                {selectedJobCard?.fabricSwatch ? (
                                    <div className="h-full w-full border-[1.5px] border-slate-400 bg-slate-50" style={{ backgroundImage: `url(${selectedJobCard.fabricSwatch})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                ) : (
                                    <div className="h-full w-full border-[1.5px] border-slate-400 flex items-center justify-center text-slate-600 font-black uppercase bg-slate-50 text-center text-xs">Fabric Swatch</div>
                                )}
                            </div>
                        </div>

                        {/* Style Category Row */}
                        <div className="bg-slate-50 p-1 text-center font-black uppercase text-sm border-b-[2px] border-slate-900 tracking-widest">{selectedJobCard?.gender}</div>

                        {/* Ratio & Planning Table */}
                        <table className="w-full border-collapse border-b-[2px] border-slate-900">
                            <tbody>
                                <tr className="border-b">
                                    <td rowSpan={3} className="border-r w-24 p-2 text-center font-black uppercase bg-slate-50">Style No</td>
                                    <td className="border-r p-1 px-4 font-bold">{selectedJobCard?.styleNo}</td>
                                    {selectedJobCard?.planning.sizes.map((s: any, idx: number) => (
                                        <td key={idx} className="border-r w-16 p-1 text-center font-black bg-slate-100">{s.size}</td>
                                    ))}
                                    <td className="w-16 p-1 text-center font-black bg-slate-900 text-white">Total</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="border-r p-1 px-4 font-black uppercase">Ratio</td>
                                    {selectedJobCard?.planning.ratio.split(':').map((r: string, idx: number) => (
                                        <td key={idx} className="border-r p-1 text-center font-bold">{r}</td>
                                    ))}
                                    <td className="p-1 text-center font-black">{selectedJobCard?.planning.ratio.split(':').reduce((a: number, b: string) => a + Number(b), 0)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="border-r p-1 px-4 font-black uppercase">Target Qty</td>
                                    {selectedJobCard?.planning.sizes.map((s: any, idx: number) => (
                                        <td key={idx} className="border-r p-1 text-center font-bold">{s.quantity}</td>
                                    ))}
                                    <td className="p-1 text-center font-black">{selectedJobCard?.planning.totalQuantity}</td>
                                </tr>
                                <tr>
                                    <td className="border-r p-2 text-center font-black uppercase bg-slate-50">Body 1</td>
                                    <td colSpan={10} className="p-2 font-bold italic tracking-tight text-indigo-700">{selectedJobCard?.planning.bodyFabric || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Pattern Master Section */}
                        <div className="grid grid-cols-12 border-b-[2px] border-slate-900">
                            <div className="col-span-6 border-r border-slate-900 flex flex-col">
                                <div className="bg-yellow-400 p-1 text-center font-black border-b-[1.5px] border-slate-900">PATTERN : {selectedJobCard?.patternNo || 'N/A'}</div>
                                <div className="p-1 font-bold italic text-center py-2">Cross check the pattern with pattern master.</div>
                            </div>
                            <div className="col-span-6">
                                <div className="grid grid-cols-2 border-b">
                                    <div className="p-1 font-black border-r bg-slate-50 text-center uppercase">Fabric Ordered</div>
                                    <div className="p-1 font-black text-center uppercase">Fabric Received</div>
                                </div>
                                <div className="grid grid-cols-2">
                                    <div className="p-1 font-black text-center text-lg">{selectedJobCard?.fabricStatus.ordered}</div>
                                    <div className="p-1 font-black text-center text-lg">{selectedJobCard?.fabricStatus.totalReceived}</div>
                                </div>
                            </div>
                        </div>

                        {/* Cutting Quantity Table */}
                        <div className="p-1 text-center font-black uppercase bg-slate-100 border-b-[1.5px] border-slate-900 tracking-widest">Cutting Quantity</div>
                        <table className="w-full border-collapse border-b-[2px] border-slate-900">
                            <thead>
                                <tr className="bg-slate-50 border-b">
                                    <th className="border-r p-1 font-black uppercase w-24">STYLE</th>
                                    <th className="border-r p-1 font-black uppercase w-16">SHADE</th>
                                    {selectedJobCard?.planning.sizes.map((s: any, idx: number) => (
                                        <th key={idx} className="border-r p-1 font-black uppercase">{s.size}</th>
                                    ))}
                                    <th className="p-1 font-black uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedJobCard?.cuttingQuantity.map((row: any, rIdx: number) => (
                                    <tr key={rIdx} className="border-b">
                                        {rIdx === 0 && <td rowSpan={selectedJobCard.cuttingQuantity.length} className="border-r p-1 text-center font-bold">{selectedJobCard.styleNo}</td>}
                                        <td className="border-r p-1 text-center font-black">{row.shade}</td>
                                        {row.sizes.map((s: any, sIdx: number) => (
                                            <td key={sIdx} className="border-r p-1 text-center font-medium italic">{s.quantity || ''}</td>
                                        ))}
                                        <td className="p-1 text-center font-black">{row.sizes.reduce((a: number, b: any) => a + (b.quantity || 0), 0)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 font-black">
                                    <td colSpan={2} className="border-r p-1 text-center">TOTAL</td>
                                    {selectedJobCard?.planning.sizes.map((s: any, idx: number) => (
                                        <td key={idx} className="border-r p-1 text-center">{selectedJobCard.cuttingQuantity.reduce((acc: number, row: any) => acc + (row.sizes[idx]?.quantity || 0), 0)}</td>
                                    ))}
                                    <td className="p-1 text-center">{selectedJobCard?.cuttingQuantity.reduce((acc: number, row: any) => acc + row.sizes.reduce((a: number, b: any) => a + (b.quantity || 0), 0), 0)}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Fabric Consumption Details */}
                        <div className="p-1 text-center font-black uppercase bg-slate-100 border-b-[1.5px] border-slate-900 tracking-widest">Fabric Consumption Details</div>
                        <div className="grid grid-cols-3 border-b-[2px] border-slate-900">
                            <div className="p-2 border-r"><span className="font-black">Drawing Weight:</span> <span className="ml-2 font-bold">{selectedJobCard?.consumptionDetails.drawingWeight}</span></div>
                            <div className="p-2 border-r"><span className="font-black">Pcs:</span> <span className="ml-2 font-bold">{selectedJobCard?.consumptionDetails.pcs}</span></div>
                            <div className="p-2 "><span className="font-black">Consumption:</span> <span className="ml-2 font-bold">{selectedJobCard?.consumptionDetails.consumption}</span></div>
                        </div>

                        {/* Footer Locations */}
                        <div className="grid grid-cols-2 border-b-[1.5px] border-slate-900 font-black uppercase text-center bg-slate-50 text-[10px]">
                            <div className="p-1 border-r truncate">CUTTING PLANT: {selectedJobCard?.logistics?.cuttingPlant || 'GANGANAGAR'}</div>
                            <div className="p-1 truncate">{selectedJobCard?.logistics?.otherLocation || 'DONNAGAR'}</div>
                        </div>
                        <div className="grid grid-cols-1 border-b-[2px] border-slate-900 p-1 text-center">
                            <span className="font-black uppercase">STYLE CATEGORY:</span> <span className="ml-2 font-bold uppercase">{selectedJobCard?.logistics?.styleCategory}</span>
                        </div>

                        {/* Signature Area */}
                        <div className="grid grid-cols-3 text-center py-6">
                            <div className="flex flex-col gap-8">
                                <div className="w-3/4 mx-auto border-b border-slate-400 h-8"></div>
                                <span className="font-black uppercase text-[10px]">Layering Person</span>
                            </div>
                            <div className="flex flex-col gap-8 border-x border-slate-100">
                                <div className="w-3/4 mx-auto border-b border-slate-400 h-8"></div>
                                <span className="font-black uppercase text-[10px]">Drawing Master</span>
                            </div>
                            <div className="flex flex-col gap-8">
                                <div className="w-3/4 mx-auto border-b border-slate-400 h-8"></div>
                                <span className="font-black uppercase text-[10px]">Cutting Master</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Create Job Card Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Design New Production Job Card"
                maxWidth="5xl"
            >
                <form onSubmit={handleAddJobCard} className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border dark:border-slate-800">
                        <FormField label="Card Number"><Input value={formData.jobCardNumber} readOnly className="bg-slate-100 dark:bg-slate-800" /></FormField>
                        <FormField label="Date"><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></FormField>
                        <FormField label="Sales Order">
                            <Select 
                                value={formData.orderId} 
                                onChange={(val) => {
                                    const selectedOrder = orders.find(o => o._id === val);
                                    let updates: any = { orderId: val };
                                    
                                    if (selectedOrder && selectedOrder.items && selectedOrder.items.length > 0) {
                                        const firstItem = selectedOrder.items[0];
                                        const prodId = typeof firstItem.productId === 'object' ? firstItem.productId._id : firstItem.productId;
                                        updates.productId = prodId;
                                        updates.styleNo = firstItem.specifications?.style || firstItem.productName;
                                        updates.brand = firstItem.specifications?.brand || '';
                                        updates.planning = { 
                                            ...formData.planning, 
                                            totalQuantity: firstItem.orderQuantity,
                                            bodyFabric: firstItem.specifications?.fabric || ''
                                        };
                                        updates.consumptionDetails = {
                                            ...formData.consumptionDetails,
                                            pcs: firstItem.orderQuantity
                                        };
                                    }
                                    
                                    setFormData({ ...formData, ...updates });
                                }}
                                placeholder="Order"
                                options={orders.map(o => ({ value: o._id, label: o.orderNumber }))}
                            />
                        </FormField>
                        <FormField label="Product (Base)">
                            <Select 
                                value={formData.productId} 
                                onChange={(val) => {
                                    const selectedOrder = orders.find(o => o._id === formData.orderId);
                                    let updates: any = { productId: val };
                                    
                                    if (selectedOrder && selectedOrder.items) {
                                        const item = selectedOrder.items.find((it: any) => (typeof it.productId === 'object' ? it.productId._id : it.productId) === val);
                                        if (item) {
                                            updates.styleNo = item.specifications?.style || item.productName;
                                            updates.planning = { ...formData.planning, totalQuantity: item.orderQuantity };
                                            updates.consumptionDetails = { ...formData.consumptionDetails, pcs: item.orderQuantity };
                                        }
                                    }
                                    
                                    setFormData({ ...formData, ...updates });
                                }}
                                placeholder="Product"
                                options={(() => {
                                    const selectedOrder = orders.find(o => o._id === formData.orderId);
                                    if (selectedOrder && selectedOrder.items) {
                                        return selectedOrder.items.map((it: any) => ({
                                            value: typeof it.productId === 'object' ? it.productId._id : it.productId,
                                            label: it.productName
                                        }));
                                    }
                                    return products.map(p => ({ value: p._id, label: p.productName }));
                                })()}
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-b pb-1">Style Master Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Brand"><Input placeholder="EASYBUY" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} /></FormField>
                                <FormField label="Style #"><Input placeholder="ESSKK208BX" value={formData.styleNo} onChange={(e) => setFormData({ ...formData, styleNo: e.target.value })} /></FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Gender"><Input placeholder="BOY'S TROUSER" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} /></FormField>
                                <FormField label="Size Range"><Input placeholder="2-8YRS" value={formData.sizeRange} onChange={(e) => setFormData({ ...formData, sizeRange: e.target.value })} /></FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Pattern #"><Input placeholder="ESSKK133BX" value={formData.patternNo} onChange={(e) => setFormData({ ...formData, patternNo: e.target.value })} /></FormField>
                                <FormField label="Print Type"><Input placeholder="NO PRINT" value={formData.printType} onChange={(e) => setFormData({ ...formData, printType: e.target.value })} /></FormField>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Garment Image">
                                    <Input type="file" accept="image/*" className="text-xs file:bg-indigo-50 dark:file:bg-indigo-900/30 file:border-0 file:rounded-md file:px-2 file:py-1 file:text-indigo-600 dark:file:text-indigo-400 file:font-bold hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setFormData({ ...formData, garmentImage: reader.result as string });
                                            reader.readAsDataURL(file);
                                        }
                                    }} />
                                </FormField>
                                <FormField label="Fabric Swatch">
                                    <Input type="file" accept="image/*" className="text-xs file:bg-indigo-50 dark:file:bg-indigo-900/30 file:border-0 file:rounded-md file:px-2 file:py-1 file:text-indigo-600 dark:file:text-indigo-400 file:font-bold hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setFormData({ ...formData, fabricSwatch: reader.result as string });
                                            reader.readAsDataURL(file);
                                        }
                                    }} />
                                </FormField>
                            </div>
                        </div>

                        <div className="space-y-4 col-span-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-b pb-1">Size Wise Planning & Ratio</h4>
                            <div className="grid grid-cols-6 gap-2">
                                <FormField label="Ratio Pattern" className="col-span-2"><Input placeholder="1:1:1:1" value={formData.planning.ratio} onChange={(e) => setFormData({ ...formData, planning: { ...formData.planning, ratio: e.target.value } })} /></FormField>
                                <div className="col-span-4 flex items-end gap-2 text-[10px] font-bold text-slate-400 mb-2">
                                    Ratio should match the number of active size columns below.
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-md border border-indigo-100 dark:border-indigo-900/30">
                                {formData.planning.sizes.map((s, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <p className="text-[10px] font-black text-indigo-700">{s.size}</p>
                                        <Input type="number" placeholder="Target" value={s.quantity} onChange={(e) => {
                                            const newSizes = [...formData.planning.sizes];
                                            newSizes[idx].quantity = Number(e.target.value);
                                            setFormData({ ...formData, planning: { ...formData.planning, sizes: newSizes } });
                                        }} />
                                    </div>
                                ))}
                            </div>
                            <FormField label="Fabric Mapping (Body 1 Details)"><Input placeholder="Evergreen - Loop Knit - Black - 220gsm" value={formData.planning.bodyFabric} onChange={(e) => setFormData({ ...formData, planning: { ...formData.planning, bodyFabric: e.target.value } })} /></FormField>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-4 border-t">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Fabric Status</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Ordered"><Input type="number" value={formData.fabricStatus.ordered} onChange={(e) => setFormData({ ...formData, fabricStatus: { ...formData.fabricStatus, ordered: Number(e.target.value) } })} /></FormField>
                                <FormField label="Received (Total)"><Input type="number" value={formData.fabricStatus.totalReceived} onChange={(e) => setFormData({ ...formData, fabricStatus: { ...formData.fabricStatus, totalReceived: Number(e.target.value) } })} /></FormField>
                            </div>
                        </div>
                        <div className="space-y-4 col-span-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Consumption Details</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Drawing Weight"><Input type="number" step="0.001" value={formData.consumptionDetails.drawingWeight} onChange={(e) => setFormData({ ...formData, consumptionDetails: { ...formData.consumptionDetails, drawingWeight: Number(e.target.value) } })} /></FormField>
                                <FormField label="Planned Pcs"><Input type="number" value={formData.consumptionDetails.pcs} onChange={(e) => setFormData({ ...formData, consumptionDetails: { ...formData.consumptionDetails, pcs: Number(e.target.value) } })} /></FormField>
                                <FormField label="Net Consumption"><Input type="number" step="0.001" value={formData.consumptionDetails.consumption} onChange={(e) => setFormData({ ...formData, consumptionDetails: { ...formData.consumptionDetails, consumption: Number(e.target.value) } })} /></FormField>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="col-span-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b pb-1">Logistics & Additional Details</h4>
                        </div>
                        <FormField label="Cutting Plant"><Input placeholder="GANGANAGAR" value={formData.logistics.cuttingPlant} onChange={(e) => setFormData({ ...formData, logistics: { ...formData.logistics, cuttingPlant: e.target.value } })} /></FormField>
                        <FormField label="Other Location"><Input placeholder="DONNAGAR" value={formData.logistics.otherLocation} onChange={(e) => setFormData({ ...formData, logistics: { ...formData.logistics, otherLocation: e.target.value } })} /></FormField>
                        <FormField label="Style Category"><Input placeholder="Essential" value={formData.logistics.styleCategory} onChange={(e) => setFormData({ ...formData, logistics: { ...formData.logistics, styleCategory: e.target.value } })} /></FormField>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[11px] tracking-widest h-11 px-10 shadow-lg shadow-indigo-100"
                        >
                            {isSubmitting ? 'Generating...' : 'Finalize & Approve Job Card'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
