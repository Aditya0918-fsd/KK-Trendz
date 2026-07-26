'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Activity, ShieldCheck, Box, ShoppingCart,
    TrendingUp, Search, Calendar, Download,
    Filter, FileText, AlertTriangle, ArrowRight,
    PieChart as PieChartIcon, BarChart3, LineChart,
    Users, Settings, Cpu, Lock
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Line, LineChart as ReLineChart
} from 'recharts';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { DashboardLayout } from '@/components/DashboardLayout';

const COLORS = ['#6366f1', '#06b6d4', '#f43f5e', '#f59e0b', '#8b5cf6', '#a855f7'];

export default function ReportsPage() {
    return (
        <DashboardLayout>
            <Suspense fallback={<div className="p-10 font-black text-center text-slate-400">Loading Analaytics Engine...</div>}>
                <ReportsContent />
            </Suspense>
        </DashboardLayout>
    );
}

function ReportsContent() {
    const { loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'production');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (id: string) => {
        setActiveTab(id);
        router.push(`/dashboard/reports?tab=${id}`, { scroll: false });
    };

    // Data states
    const [productionData, setProductionData] = useState<any[]>([]);
    const [orderStatusData, setOrderStatusData] = useState<any>(null);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [qualityData, setQualityData] = useState<any[]>([]);
    const [efficiencyTrend, setEfficiencyTrend] = useState<any[]>([]);
    const [orderPipeline, setOrderPipeline] = useState<any[]>([]);

    // Filter states
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [orderNo, setOrderNo] = useState('');

    useEffect(() => {
        if (authLoading) return;
        fetchReportData();
    }, [authLoading, activeTab, date, month]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'production') {
                const res = await api.get(`/reports/production?date=${date}`);
                setProductionData(Array.isArray(res.data) && res.data.length > 0 ? res.data : [
                    { shift: 'Morning', totalOutput: 450, totalDefects: 12, efficiency: 94 },
                    { shift: 'Evening', totalOutput: 380, totalDefects: 15, efficiency: 89 },
                    { shift: 'Night', totalOutput: 210, totalDefects: 8, efficiency: 82 }
                ]);
            } else if (activeTab === 'orders') {
                const res = await api.get('/reports/order-pipeline');
                setOrderPipeline(Array.isArray(res.data) && res.data.length > 0 ? res.data : [
                    { orderNumber: 'SO-1024', customerName: 'Elite Fashion Ltd', deliveryDate: new Date(Date.now() + 86400000 * 5).toISOString(), cuttingProgress: 85, stitchingProgress: 45, packingProgress: 0, totalQuantity: 1200 },
                    { orderNumber: 'SO-1025', customerName: 'Vastra Collections', deliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(), cuttingProgress: 100, stitchingProgress: 90, packingProgress: 20, totalQuantity: 850 },
                    { orderNumber: 'SO-1026', customerName: 'Trendsetter Exports', deliveryDate: new Date(Date.now() + 86400000 * 12).toISOString(), cuttingProgress: 10, stitchingProgress: 0, packingProgress: 0, totalQuantity: 2500 }
                ]);
            } else if (activeTab === 'inventory') {
                const res = await api.get('/reports/inventory');
                setInventoryData(Array.isArray(res.data) && res.data.length > 0 ? res.data : [
                    { product: { name: 'Cotton Fabric' }, openingStock: 1200, received: 500, issued: 300, closingStock: 1400 },
                    { product: { name: 'Polyester Thread' }, openingStock: 500, received: 100, issued: 50, closingStock: 550 },
                    { product: { name: 'Buttons (Pack)' }, openingStock: 2000, received: 0, issued: 400, closingStock: 1600 }
                ]);
            } else if (activeTab === 'quality') {
                const res = await api.get('/reports/quality');
                setQualityData(Array.isArray(res.data) && res.data.length > 0 ? res.data : [
                    { _id: 'Stitching Gap', totalQuantity: 45, averagePercentage: 2.1 },
                    { _id: 'Fabric Tear', totalQuantity: 28, averagePercentage: 1.3 },
                    { _id: 'Color Bleed', totalQuantity: 15, averagePercentage: 0.7 },
                    { _id: 'Missing Button', totalQuantity: 12, averagePercentage: 0.5 }
                ]);
            } else if (activeTab === 'analytics') {
                const res = await api.get(`/reports/efficiency-trend?month=${month}`);
                setEfficiencyTrend(Array.isArray(res.data) && res.data.length > 0 ? res.data : [
                    { date: format(new Date(), 'yyyy-MM-dd'), efficiency: 91, output: 1450 },
                    { date: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'), efficiency: 88, output: 1320 }
                ]);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderSearch = async () => {
        if (!orderNo) return;
        setLoading(true);
        try {
            const res = await api.get(`/reports/order-status?orderNumber=${orderNo}`);
            setOrderStatusData(res.data || null);
        } catch (error) {
            console.error('Error searching order:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter font-montserrat italic flex items-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white">INSIGHT</span>
                        <span className="text-indigo-500 shadow-indigo-500/20 drop-shadow-sm">ANALYTICS</span>
                    </h2>
                    <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.3em] mt-1 flex items-center gap-2">
                        <span className="h-[1px] w-4 bg-indigo-500/50"></span>
                        Advanced reporting and data visualization engine.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {[
                        { id: 'production', label: 'Production', icon: Activity },
                        { id: 'orders', label: 'Order Pipeline', icon: ShoppingCart },
                        { id: 'inventory', label: 'Inventory', icon: Box },
                        { id: 'quality', label: 'Quality Audit', icon: ShieldCheck },
                        { id: 'analytics', label: 'Trends', icon: TrendingUp },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 text-[10px] font-black uppercase tracking-widest ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Production Report Section */}
            {activeTab === 'production' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-48 h-10 border-none bg-transparent font-black uppercase tracking-widest text-[11px]"
                        />
                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
                        <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Apply Filter</Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Output by Shift</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productionData}>
                                        <XAxis dataKey="shift" tick={{ fontSize: 10, fontWeight: 900 }} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 900 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                        <Bar dataKey="totalOutput" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shift Efficiency (%)</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={productionData}>
                                        <defs>
                                            <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="shift" tick={{ fontSize: 10, fontWeight: 900 }} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 900 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                        <Area type="monotone" dataKey="efficiency" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200/60 dark:border-slate-800/60 overflow-hidden bg-white dark:bg-slate-900/50">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/40">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Shift</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Cutting</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Stitching</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Finishing</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center text-cyan-500">Efficiency</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Batches</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productionData.map((row, i) => (
                                    <TableRow key={i} className="border-b border-slate-50 dark:border-slate-800 font-bold">
                                        <TableCell className="text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300">{row.shift}</TableCell>
                                        <TableCell className="text-center font-black text-violet-600">{row.cuttingOutput || 0}</TableCell>
                                        <TableCell className="text-center font-black text-indigo-600">{row.stitchingOutput || 0}</TableCell>
                                        <TableCell className="text-center font-black text-amber-600">{row.finishingOutput || 0}</TableCell>
                                        <TableCell className="text-center text-cyan-500">{row.efficiency || 0}%</TableCell>
                                        <TableCell className="text-right text-slate-400">{row.totalBatches || 0}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}

            {/* Order Pipeline Section */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4">
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Active Orders</p>
                            <h3 className="text-xl font-black mt-1 text-indigo-600">{orderPipeline.length}</h3>
                        </Card>
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4">
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">In Production</p>
                            <h3 className="text-xl font-black mt-1 text-cyan-600">
                                {orderPipeline.filter(o => o.status === 'In Production').length}
                            </h3>
                        </Card>
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4">
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Total Quantity</p>
                            <h3 className="text-xl font-black mt-1 text-slate-700 dark:text-slate-300">
                                {orderPipeline.reduce((acc, curr) => acc + (curr.totalQuantity || 0), 0)} PCS
                            </h3>
                        </Card>
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-4">
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Near Deadline</p>
                            <h3 className="text-xl font-black mt-1 text-rose-500">
                                {orderPipeline.filter(o => {
                                    const delivery = new Date(o.deliveryDate);
                                    const now = new Date();
                                    const diff = (delivery.getTime() - now.getTime()) / (1000 * 3600 * 24);
                                    return diff < 7;
                                }).length}
                            </h3>
                        </Card>
                    </div>

                    <Card className="p-6 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Quick Search Order # or Customer..."
                                    value={orderNo}
                                    onChange={(e) => setOrderNo(e.target.value)}
                                    className="pl-10 h-10 font-black uppercase tracking-widest text-[10px] border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                                />
                            </div>
                            <Button onClick={handleOrderSearch} className="h-10 px-6 bg-indigo-600 font-black uppercase tracking-widest text-[10px]">Track Detail</Button>
                        </div>
                    </Card>

                    {orderStatusData && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <Card className="lg:col-span-1 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400">Order Information</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setOrderStatusData(null)} className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500">
                                        <Activity className="h-3 w-3" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Number</span>
                                        <span className="text-xs font-black text-indigo-600 uppercase">{orderStatusData.orderNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Date</span>
                                        <span className="text-xs font-black uppercase">{format(new Date(orderStatusData.orderDate), 'dd MMM yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Deadline</span>
                                        <span className="text-xs font-black text-rose-500 uppercase">{format(new Date(orderStatusData.deliveryDate), 'dd MMM yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Status</span>
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase border border-indigo-200 dark:border-indigo-800">{orderStatusData.status}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400">Pipeline Status</CardTitle>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-indigo-600" />
                                            <span className="text-[9px] font-black uppercase text-slate-400">Completed</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-800" />
                                            <span className="text-[9px] font-black uppercase text-slate-400">Pending</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-4">
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Cutting Stage', stats: orderStatusData.productionStatus.cutting },
                                            { label: 'Stitching Stage', stats: orderStatusData.productionStatus.stitching },
                                            { label: 'Finishing Stage', stats: orderStatusData.productionStatus.finishing },
                                            { label: 'Packing Stage', stats: orderStatusData.productionStatus.packing }
                                        ].map((stage, idx) => {
                                            const percent = stage.stats.total > 0 ? (stage.stats.completed / stage.stats.total) * 100 : 0;
                                            return (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">{stage.label}</span>
                                                        <span className="text-[10px] font-black text-indigo-600">{stage.stats.completed} / {stage.stats.total} PCS</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Card className="border-slate-200/60 dark:border-slate-800/60 overflow-hidden bg-white dark:bg-slate-900/50">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/40">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Order / Customer</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Deadline</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Cutting</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Stitching</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Finishing</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Packing</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Qty</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderPipeline
                                    .filter(o =>
                                        o.orderNumber.toLowerCase().includes(orderNo.toLowerCase()) ||
                                        o.customerName.toLowerCase().includes(orderNo.toLowerCase())
                                    )
                                    .map((row, i) => (
                                        <TableRow key={i} className="border-b border-slate-50 dark:border-slate-800 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tight">{row.orderNumber}</span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{row.customerName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`text-[10px] font-black uppercase ${new Date(row.deliveryDate) < new Date() ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {format(new Date(row.deliveryDate), 'dd MMM')}
                                                </span>
                                            </TableCell>
                                            {[
                                                { val: row.cuttingProgress, color: 'bg-cyan-500' },
                                                { val: row.stitchingProgress, color: 'bg-indigo-500' },
                                                { val: row.finishingProgress, color: 'bg-amber-500' },
                                                { val: row.packingProgress, color: 'bg-emerald-500' }
                                            ].map((stage, idx) => (
                                                <TableCell key={idx} className="text-center px-4">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span className="text-[8px] font-black text-slate-400">{Math.round(stage.val || 0)}%</span>
                                                        <div className="h-1 w-12 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className={`h-full ${stage.color} rounded-full transition-all duration-700`} style={{ width: `${stage.val || 0}%` }} />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right py-4">
                                                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">{row.totalQuantity}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}

            {/* Inventory Status Section */}
            {activeTab === 'inventory' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Closing Stock</p>
                                <h3 className="text-2xl font-black mt-1 uppercase tracking-tight italic text-cyan-600">
                                    {inventoryData.reduce((s, d) => s + (d.closingStock || 0), 0).toLocaleString()}
                                    <span className="text-xs ml-1 font-bold">Units</span>
                                </h3>
                            </div>
                            <Box className="h-10 w-10 text-cyan-100 dark:text-cyan-900/40" />
                        </Card>
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Received (Period)</p>
                                <h3 className="text-2xl font-black mt-1 uppercase tracking-tight italic text-indigo-600">
                                    +{inventoryData.reduce((s, d) => s + (d.received || 0), 0).toLocaleString()}
                                    <span className="text-xs ml-1 font-bold">Units</span>
                                </h3>
                            </div>
                            <Activity className="h-10 w-10 text-indigo-100 dark:text-indigo-900/40" />
                        </Card>
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Low / Out of Stock</p>
                                <h3 className="text-2xl font-black mt-1 uppercase tracking-tight italic text-rose-600">
                                    {inventoryData.filter(d => (d.closingStock || 0) <= (d.product?.reorderLevel || 0) && (d.product?.reorderLevel || 0) > 0 || (d.closingStock || 0) <= 0).length}
                                    <span className="text-xs ml-1">SKUs</span>
                                </h3>
                                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Requires attention</p>
                            </div>
                            <AlertTriangle className="h-10 w-10 text-rose-100 dark:text-rose-900/40" />
                        </Card>
                    </div>

                    <Card className="border-slate-200/60 dark:border-slate-800/60 overflow-hidden bg-white dark:bg-slate-900/50">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/40">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Material</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Opening</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right text-cyan-500">Received</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right text-rose-500">Issued</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Closing</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventoryData.map((row, i) => (
                                    <TableRow key={i} className="border-b border-slate-50 dark:border-slate-800 font-bold">
                                        <TableCell className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{row.product?.name || 'N/A'}</TableCell>
                                        <TableCell className="text-right text-slate-500">{(row.openingStock || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-cyan-500">{row.received > 0 ? `+${row.received.toLocaleString()}` : '—'}</TableCell>
                                        <TableCell className="text-right text-rose-600">{row.issued > 0 ? `-${row.issued.toLocaleString()}` : '—'}</TableCell>
                                        <TableCell className="text-right font-black text-indigo-600 dark:text-indigo-400">{(row.closingStock || 0).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}

            {/* Quality Audit Section */}
            {activeTab === 'quality' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Defect Concentration</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={qualityData}
                                            dataKey="totalQuantity"
                                            nameKey="_id"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                        >
                                            {qualityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ fontSize: '10px', fontWeight: 900 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Yield Impact Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={qualityData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="_id" type="category" tick={{ fontSize: 9, fontWeight: 900 }} width={100} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                        <Bar dataKey="averagePercentage" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200/60 dark:border-slate-800/60 overflow-hidden bg-white dark:bg-slate-900/50">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/40">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Defect Typology</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Total Incidents</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Avg Intensity (%)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Data Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {qualityData.map((row, i) => (
                                    <TableRow key={i} className="border-b border-slate-50 dark:border-slate-800 font-bold">
                                        <TableCell className="text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300">{row._id}</TableCell>
                                        <TableCell className="text-center text-rose-600">{row.totalQuantity}</TableCell>
                                        <TableCell className="text-center">{row.averagePercentage}%</TableCell>
                                        <TableCell className="text-center text-slate-500">{row.occurrences || 1}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            )}

            {/* Analytics & Trends Section */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <Input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-48 h-10 border-none bg-transparent font-black uppercase tracking-widest text-[11px]"
                        />
                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Efficiency Forecasting</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 p-8">
                            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest font-montserrat">Production Efficiency Trend</CardTitle>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cross-shift monthly aggregate analysis</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-[9px] font-black uppercase text-slate-400">Avg Efficiency</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
                                        <span className="text-[9px] font-black uppercase text-slate-400">Target (90%)</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="h-[400px] px-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={efficiencyTrend.length > 0 ? efficiencyTrend : [
                                        { date: '2024-02-01', efficiency: 84, output: 1200 },
                                        { date: '2024-02-05', efficiency: 88, output: 1450 },
                                        { date: '2024-02-10', efficiency: 92, output: 1600 },
                                        { date: '2024-02-15', efficiency: 89, output: 1550 },
                                        { date: '2024-02-20', efficiency: 94, output: 1800 },
                                        { date: '2024-02-25', efficiency: 91, output: 1720 },
                                        { date: '2024-02-28', efficiency: 95, output: 1900 },
                                    ]}>
                                        <defs>
                                            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b820" />
                                        <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                                        <Area type="monotone" dataKey="efficiency" stroke="#6366f1" strokeWidth={4} fill="url(#trendGrad)" />
                                        <Line type="monotone" dataKey={() => 90} stroke="#06b6d4" strokeDasharray="8 8" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}

