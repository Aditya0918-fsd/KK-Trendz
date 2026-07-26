'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    Package, ArrowUpRight, ArrowDownLeft, Filter, Search,
    RefreshCw, Download, AlertTriangle, Box, Layers,
    History, MoreHorizontal, TrendingUp, TrendingDown
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/lib/api';

export default function InventoryPage() {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Mock Data for fallback
    const mockInventory = [
        { _id: 'P001', product: { name: 'Interlock 220 GSM', category: 'Fabric', unit: 'KG' }, openingStock: 1200, received: 500, issued: 300, closingStock: 1400, minLevel: 1000 },
        { _id: 'P002', product: { name: 'Rib 1x1 180 GSM', category: 'Fabric', unit: 'KG' }, openingStock: 450, received: 200, issued: 50, closingStock: 600, minLevel: 500 },
        { _id: 'P003', product: { name: 'Polyester Thread 40/2', category: 'Trim', unit: 'CONE' }, openingStock: 2500, received: 0, issued: 400, closingStock: 2100, minLevel: 500 },
        { _id: 'P004', product: { name: 'Nylon Buttons 11mm', category: 'Trim', unit: 'PCS' }, openingStock: 12000, received: 5000, issued: 8000, closingStock: 9000, minLevel: 10000 },
        { _id: 'P005', product: { name: 'Woven Labels Main', category: 'Labels', unit: 'PCS' }, openingStock: 800, received: 1000, issued: 200, closingStock: 1600, minLevel: 500 },
    ];

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/inventory');
            setInventory(res.data.length > 0 ? res.data : mockInventory);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setInventory(mockInventory);
        } finally {
            setLoading(false);
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.product.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header \& Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">
                            Inventory <span className="text-cyan-500">Analytics</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mt-1">Real-time resource tracking and lifecycle management</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Scan SKU or Search..."
                                className="pl-10 w-64 h-10 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-10 border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl gap-2 active:scale-95 transition-all">
                            <Filter size={14} />
                            Filter
                        </Button>
                        <Button onClick={fetchInventory} className="h-10 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl active:rotate-180 transition-all duration-500">
                            <RefreshCw size={16} />
                        </Button>
                    </div>
                </div>

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500 group-hover:scale-110 transition-transform duration-300">
                                <Box size={24} />
                            </div>
                            <span className="flex items-center text-[10px] font-black text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded-full">+12% Vol.</span>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total SKU Volume</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white font-montserrat tracking-tight italic">
                            {inventory.length} <span className="text-xs uppercase text-slate-400 not-italic tracking-normal">Active Products</span>
                        </h3>
                    </Card>

                    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 group-hover:scale-110 transition-transform duration-300">
                                <AlertTriangle size={24} />
                            </div>
                            <span className="flex items-center text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full animate-pulse">Critical</span>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Low Stock Protocol</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white font-montserrat tracking-tight italic">
                            {inventory.filter(i => i.closingStock < i.minLevel).length} <span className="text-xs uppercase text-slate-400 not-italic tracking-normal">SKUs Below Lvl</span>
                        </h3>
                    </Card>

                    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                                <ArrowUpRight size={24} />
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">Last 24h</span>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Receipt Velocity</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white font-montserrat tracking-tight italic">
                            +4,280 <span className="text-xs uppercase text-slate-400 not-italic tracking-normal">Units Inward</span>
                        </h3>
                    </Card>

                    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform duration-300">
                                <ArrowDownLeft size={24} />
                            </div>
                            <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">System Load</span>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Issue Velocity</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white font-montserrat tracking-tight italic">
                            -2,150 <span className="text-xs uppercase text-slate-400 not-italic tracking-normal">Units Outward</span>
                        </h3>
                    </Card>
                </div>

                {/* Inventory Matrix */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                    <div className="p-6 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Global Stock Matrix</CardTitle>
                            <CardDescription className="text-[9px] uppercase font-bold text-slate-400">Holistic view of all system resources and raw materials</CardDescription>
                        </div>
                        <Button variant="ghost" className="text-slate-400 hover:text-cyan-500">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                                <TableRow>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest">SKU Identity</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-center">Protocol</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-center">Opening</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-center text-cyan-600">Inward</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-center text-amber-600">Outward</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-center bg-slate-100/50 dark:bg-slate-800/50">Available Stock</TableHead>
                                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInventory.map((item, i) => (
                                    <TableRow key={i} className="group border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                                    <Layers size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase text-slate-800 dark:text-white">{item.product.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.product.category} • {item._id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{item.product.unit}</span>
                                        </TableCell>
                                        <TableCell className="text-center text-[11px] font-bold text-slate-500">{item.openingStock.toLocaleString()}</TableCell>
                                        <TableCell className="text-center text-[11px] font-black text-cyan-600">+{item.received.toLocaleString()}</TableCell>
                                        <TableCell className="text-center text-[11px] font-black text-amber-600">-{item.issued.toLocaleString()}</TableCell>
                                        <TableCell className="text-center bg-slate-100/30 dark:bg-slate-800/20">
                                            <p className="text-[12px] font-black text-slate-800 dark:text-white">{item.closingStock.toLocaleString()}</p>
                                            <div className="mt-1 w-20 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${item.closingStock < item.minLevel ? 'bg-rose-500' : 'bg-cyan-500'}`}
                                                    style={{ width: `${Math.min((item.closingStock / (item.minLevel * 2)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.closingStock < item.minLevel ? (
                                                <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase rounded-lg border border-rose-500/20">Refill Reqd</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-[10px] font-black uppercase rounded-lg border border-cyan-500/20">In Range</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Secondary Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                    <History size={18} />
                                </div>
                                <div>
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest">Transaction Feed</CardTitle>
                                    <CardDescription className="text-[9px] uppercase font-bold text-slate-400">Recent stock movements and audit trails</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest">Full Audit Log</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="space-y-0">
                                {[
                                    { type: 'IN', title: 'Fabric Receipt - PO#882', time: '14 mins ago', qty: '+500 KG', user: 'Ram K.' },
                                    { type: 'OUT', title: 'Cutting Issue - Batch#22', time: '1 hr ago', qty: '-120 KG', user: 'Sita S.' },
                                    { type: 'IN', title: 'Rib Return - Surplus', time: '3 hrs ago', qty: '+15 KG', user: 'Amit O.' },
                                    { type: 'OUT', title: 'Packing Dispatch - Inv#004', time: '5 hrs ago', qty: '-2,400 PCS', user: 'Vikram S.' },
                                ].map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${log.type === 'IN' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {log.type === 'IN' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase text-slate-800 dark:text-white group-hover:text-cyan-500 transition-colors">{log.title}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{log.time} • Issued by {log.user}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-black ${log.type === 'IN' ? 'text-cyan-500' : 'text-amber-500'}`}>{log.qty}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest">Stock Aging Hotspots</CardTitle>
                                    <CardDescription className="text-[9px] uppercase font-bold text-slate-400">Identification of fast-moving vs stagnant items</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest">Optimization Plan</Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {[
                                { label: 'Fast Moving (In Use)', value: 65, color: '#06b6d4' },
                                { label: 'Stagnant (> 30 Days)', value: 24, color: '#f43f5e' },
                                { label: 'Awaiting QC', value: 11, color: '#f59e0b' },
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <span className="text-slate-500">{stat.label}</span>
                                        <span className="text-slate-800 dark:text-white">{stat.value}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${stat.value}%`, backgroundColor: stat.color }} />
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                                <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                                <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-widest">
                                    Strategic Warning: 3 SKU groups showing stagnation beyond threshold. Review procurement logic.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
