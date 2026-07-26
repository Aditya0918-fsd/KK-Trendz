'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Plus, Search, Edit2, Trash2, MapPin, Box, User2, AlignLeft, Shield, CheckCircle2, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Modal, FormField } from '@/components/ui/Modal';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/Toast';

// ─── Initial Form State ───
const initialFormState = () => ({
    locationCode: '',
    locationName: '',
    locationType: 'Raw Material Store',
    department: '',
    area: 0,
    address: {
        building: '',
        floor: '',
        zone: ''
    },
    inchargeId: '',
    alternateIncharge: '',
    authorizedPersons: [] as string[],
    capacity: {
        total: 0,
        utilized: 0,
        available: 0,
        unit: 'Pcs'
    },
    storage: [] as any[],
    environment: {
        temperature: '',
        humidity: '',
        monitoring: false
    },
    status: 'Active'
});

// ─── Tab definitions ───
const TABS = [
    { id: 'basic', label: 'Basic Info', icon: AlignLeft },
    { id: 'physical', label: 'Physical Location', icon: MapPin },
    { id: 'incharge', label: 'Incharge & Access', icon: User2 },
    { id: 'capacity', label: 'Capacity', icon: Box },
    { id: 'storage', label: 'Bin & Rack Setup', icon: AlignLeft },
    { id: 'activation', label: 'Activation', icon: CheckCircle2 }
];

const LOCATION_TYPES = [
    'Raw Material Store',
    'WIP Store',
    'Finished Goods Store',
    'Rejected Goods Store',
    'Quarantine Area'
];

export default function LocationMasterPage() {
    const { loading: authLoading } = useAuth();
    const [locations, setLocations] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [formData, setFormData] = useState<any>(initialFormState());
    const [activeTab, setActiveTab] = useState('basic');
    const { showToast } = useToast();

    // ─── API Fetchers ───
    const fetchLocations = async () => {
        try {
            const res = await api.get('/locations');
            setLocations(res.data);
        } catch (error) {
            console.error('Error fetching locations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    // ─── Handlers ───
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Auto-calculate available capacity
            const cap = formData.capacity;
            const available = (cap.total || 0) - (cap.utilized || 0);

            const payload = {
                ...formData,
                capacity: { ...cap, available },
                inchargeId: formData.inchargeId || undefined,
                alternateIncharge: formData.alternateIncharge || undefined
            };

            await (editingLocation ? api.put(`/locations/${editingLocation._id}`, payload) : api.post('/locations', payload));
            closeModal();
            showToast(editingLocation ? 'Location updated successfully' : 'Location created successfully', 'success');
            fetchLocations();
        } catch (error: any) {
            console.error('Error saving location:', error);
            showToast(error.response?.data?.message || 'Failed to save location', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (loc: any) => {
        setEditingLocation(loc);
        setFormData({
            locationCode: loc.locationCode || '',
            locationName: loc.locationName || '',
            locationType: loc.locationType || 'Raw Material Store',
            department: loc.department || '',
            area: loc.area || 0,
            address: {
                building: loc.address?.building || '',
                floor: loc.address?.floor || '',
                zone: loc.address?.zone || ''
            },
            inchargeId: loc.inchargeId?._id || loc.inchargeId || '',
            alternateIncharge: loc.alternateIncharge?._id || loc.alternateIncharge || '',
            authorizedPersons: (loc.authorizedPersons || []).map((emp: any) => emp._id || emp),
            capacity: {
                total: loc.capacity?.total || 0,
                utilized: loc.capacity?.utilized || 0,
                available: loc.capacity?.available || 0,
                unit: loc.capacity?.unit || 'Pcs'
            },
            storage: loc.storage || [],
            environment: {
                temperature: loc.environment?.temperature || '',
                humidity: loc.environment?.humidity || '',
                monitoring: loc.environment?.monitoring || false
            },
            status: loc.status || 'Active'
        });
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    const handleDeleteLocation = async (loc: any) => {
        if (!window.confirm(`Are you sure you want to delete "${loc.locationName}"?`)) return;
        try {
            await api.delete(`/locations/${loc._id}`);
            showToast('Location deleted successfully', 'success');
            fetchLocations();
        } catch (error: any) {
            console.error('Error deleting location:', error);
            showToast(error.response?.data?.message || 'Failed to delete location', 'error');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLocation(null);
        setFormData(initialFormState());
        setActiveTab('basic');
    };

    const openAddModal = () => {
        setEditingLocation(null);
        setFormData(initialFormState());
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (authLoading) return;
        fetchLocations();
        fetchEmployees();
    }, [authLoading]);

    // ─── Nested State Setters ───
    const setAddress = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, address: { ...prev.address, [field]: value } }));
    const setCapacity = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, capacity: { ...prev.capacity, [field]: value } }));
    const setEnv = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, environment: { ...prev.environment, [field]: value } }));

    const handleAuthPersonToggle = (empId: string) => {
        setFormData((prev: any) => {
            const current = [...prev.authorizedPersons];
            if (current.includes(empId)) return { ...prev, authorizedPersons: current.filter(id => id !== empId) };
            else return { ...prev, authorizedPersons: [...current, empId] };
        });
    };

    // ─── Derived UI values ───
    const availableCapacity = (formData.capacity.total || 0) - (formData.capacity.utilized || 0);

    const filteredLocations = locations.filter((l: any) => {
        const searchMatch = l.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.locationCode?.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch = typeFilter === 'All' || l.locationType === typeFilter;
        return searchMatch && typeMatch;
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
                                    placeholder="Search by name or code..."
                                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
                                {['All', ...LOCATION_TYPES].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(type)}
                                        className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${typeFilter === type ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        {type.split(' ')[0]} {/* Shorthand like Raw, WIP */}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[11px]" onClick={openAddModal}>
                            <Plus className="mr-2 h-4 w-4" /> Add Location
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                            <TableRow className="border-none">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">Location Details</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Type & Dept</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Capacity</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Incharge</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6 h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading locations...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLocations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                            <MapPin size={40} className="text-slate-300 mb-2" />
                                            <p className="font-bold text-sm text-slate-400">No locations found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLocations.map((loc: any) => (
                                    <TableRow key={loc._id} className="group border-b last:border-0 border-b-slate-50 dark:border-b-slate-800/50">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 dark:text-white tracking-tight">{loc.locationName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono italic uppercase">{loc.locationCode}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="inline-flex items-center w-fit rounded-md bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-900/40 dark:text-indigo-400">
                                                    {loc.locationType}
                                                </span>
                                                <div className="text-xs text-slate-500 font-medium">{loc.department || '—'}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1.5 w-full max-w-[120px]">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-600 dark:text-slate-400">{loc.capacity?.utilized || 0}</span>
                                                    <span className="text-slate-400">/ {loc.capacity?.total || 0} {loc.capacity?.unit}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                                                    <div
                                                        className={`h-full ${((loc.capacity?.utilized / loc.capacity?.total) * 100) > 85 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${Math.min(((loc.capacity?.utilized || 0) / (loc.capacity?.total || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <User2 className="mr-2 h-4 w-4 text-slate-400" />
                                                {loc.inchargeId?.employeeName || <span className="text-slate-400 italic font-normal">Unassigned</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${loc.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20'}`}>
                                                {loc.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600" onClick={() => handleEditClick(loc)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDeleteLocation(loc)}>
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
                 ADD / EDIT MODAL
            ═══════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingLocation ? `Edit: ${editingLocation.locationName}` : 'Add New Location/Store'}
            >
                {/* Tab Navigation */}
                <div className="flex gap-0.5 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="h-[400px] overflow-y-auto pr-1 space-y-4">

                        {/* ─── TAB 1: Basic Information ─── */}
                        {activeTab === 'basic' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Basic Info</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Location Code *">
                                        <Input required placeholder="e.g. RM-01" className="font-mono uppercase" value={formData.locationCode} onChange={e => setFormData((prev: any) => ({ ...prev, locationCode: e.target.value }))} />
                                    </FormField>
                                    <FormField label="Location Name *">
                                        <Input required placeholder="e.g. Raw Material Store - Yarn" value={formData.locationName} onChange={e => setFormData((prev: any) => ({ ...prev, locationName: e.target.value }))} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Location Type">
                                        <select className={selectClass} value={formData.locationType} onChange={e => setFormData((prev: any) => ({ ...prev, locationType: e.target.value }))}>
                                            {LOCATION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Department Group">
                                        <Input placeholder="e.g. Stores, Manufacturing" value={formData.department} onChange={e => setFormData((prev: any) => ({ ...prev, department: e.target.value }))} />
                                    </FormField>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 2: Physical Location ─── */}
                        {activeTab === 'physical' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Physical Location</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Building / Block">
                                        <Input placeholder="e.g. Block A" value={formData.address.building} onChange={e => setAddress('building', e.target.value)} />
                                    </FormField>
                                    <FormField label="Floor">
                                        <Input placeholder="e.g. Ground Floor" value={formData.address.floor} onChange={e => setAddress('floor', e.target.value)} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Zone / Wing">
                                        <Input placeholder="e.g. North Wing" value={formData.address.zone} onChange={e => setAddress('zone', e.target.value)} />
                                    </FormField>
                                    <FormField label="Area (Sq. Ft.)">
                                        <Input type="number" placeholder="e.g. 1500" value={formData.area} onChange={e => setFormData((prev: any) => ({ ...prev, area: Number(e.target.value) }))} />
                                    </FormField>
                                </div>

                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 pt-3 border-t border-slate-100 dark:border-slate-800">Environmental Needs</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField label="Temperature">
                                        <Input placeholder="e.g. 20-25°C" value={formData.environment.temperature} onChange={e => setEnv('temperature', e.target.value)} />
                                    </FormField>
                                    <FormField label="Humidity">
                                        <Input placeholder="e.g. 50-60%" value={formData.environment.humidity} onChange={e => setEnv('humidity', e.target.value)} />
                                    </FormField>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 h-10 w-full bg-slate-50 dark:bg-slate-800 px-3 rounded-md">
                                            <input type="checkbox" checked={formData.environment.monitoring} onChange={e => setEnv('monitoring', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-600 border-slate-300 h-4 w-4" />
                                            Active Monitoring Reqd
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 3: Incharge Assignment ─── */}
                        {activeTab === 'incharge' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Incharge Assignment</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Store Incharge (Primary)">
                                        <select className={selectClass} value={formData.inchargeId} onChange={e => setFormData((prev: any) => ({ ...prev, inchargeId: e.target.value }))}>
                                            <option value="">Select Employee</option>
                                            {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName} ({e.employeeCode})</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Alternate Incharge (Leaves)">
                                        <select className={selectClass} value={formData.alternateIncharge} onChange={e => setFormData((prev: any) => ({ ...prev, alternateIncharge: e.target.value }))}>
                                            <option value="">Select Employee</option>
                                            {employees.map(e => <option key={e._id} value={e._id}>{e.employeeName} ({e.employeeCode})</option>)}
                                        </select>
                                    </FormField>
                                </div>

                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 pt-3 border-t border-slate-100 dark:border-slate-800">Access Control (Authorized Setup)</p>
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50 max-h-48 overflow-y-auto w-full">
                                    {employees.length === 0 ? <p className="text-xs text-slate-500">No employees available</p> : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {employees.map(e => (
                                                <label key={e._id} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.authorizedPersons.includes(e._id)}
                                                        onChange={() => handleAuthPersonToggle(e._id)}
                                                        className="rounded text-indigo-600 focus:ring-indigo-600 border-slate-300 h-3.5 w-3.5"
                                                    />
                                                    <span className="text-slate-700 dark:text-slate-300 text-xs">{e.employeeName} <span className="opacity-50">({e.employeeCode})</span></span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 4: Capacity Planning ─── */}
                        {activeTab === 'capacity' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Capacity Planning</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Unit of Measurement">
                                        <select className={selectClass} value={formData.capacity.unit} onChange={e => setCapacity('unit', e.target.value)}>
                                            <option>Pcs</option><option>Kgs</option><option>Meters</option><option>Rolls</option><option>Boxes</option><option>Pallets</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Total Storage Capacity">
                                        <Input type="number" placeholder="e.g. 5000" value={formData.capacity.total} onChange={e => setCapacity('total', Number(e.target.value))} />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Current Utilized Capacity">
                                        <Input type="number" placeholder="e.g. 1500" value={formData.capacity.utilized} onChange={e => setCapacity('utilized', Number(e.target.value))} />
                                    </FormField>
                                    <FormField label="Available Capacity (Auto-calculated)">
                                        <div className="flex h-10 items-center px-3 rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/40 text-sm font-black text-indigo-700 dark:text-indigo-400">
                                            {availableCapacity} {formData.capacity.unit}
                                        </div>
                                    </FormField>
                                </div>
                                <div className="p-3 mt-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs text-slate-500 border border-slate-100 dark:border-slate-800">
                                    <strong>Utilization:</strong> {((formData.capacity.utilized || 0) / (formData.capacity.total || 1) * 100).toFixed(1)}% full
                                    <div className="w-full h-2 mt-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                                        <div
                                            className="h-full bg-indigo-500"
                                            style={{ width: `${Math.min(((formData.capacity.utilized || 0) / (formData.capacity.total || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 5: Bin / Rack Setup ─── */}
                        {activeTab === 'storage' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Bin / Rack Structure</p>
                                <p className="text-xs text-slate-500 mb-4">Define granular storage locations (Aisle - Rack - Bin) for precise inventory placement.</p>

                                {formData.storage.map((bin: any, idx: number) => (
                                    <div key={idx} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3 relative">
                                        <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, storage: prev.storage.filter((_: any, i: number) => i !== idx) }))} className="absolute right-3 top-3 text-rose-500 hover:bg-rose-50 p-1 rounded"><X size={14} /></button>
                                        <div className="grid grid-cols-3 gap-3">
                                            <FormField label="Aisle/Row Number">
                                                <Input placeholder="e.g. A-01" value={bin.rowNumber} onChange={e => { const u = [...formData.storage]; u[idx].rowNumber = e.target.value; setFormData((prev: any) => ({ ...prev, storage: u })); }} />
                                            </FormField>
                                            <FormField label="Rack Number">
                                                <Input placeholder="e.g. R1" value={bin.rackNumber} onChange={e => { const u = [...formData.storage]; u[idx].rackNumber = e.target.value; setFormData((prev: any) => ({ ...prev, storage: u })); }} />
                                            </FormField>
                                            <FormField label="Bin Number">
                                                <Input placeholder="e.g. B12" value={bin.binNumber} onChange={e => { const u = [...formData.storage]; u[idx].binNumber = e.target.value; setFormData((prev: any) => ({ ...prev, storage: u })); }} />
                                            </FormField>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField label="Bin Capacity">
                                                <div className="relative">
                                                    <Input type="number" placeholder="50" value={bin.capacity} onChange={e => { const u = [...formData.storage]; u[idx].capacity = Number(e.target.value); setFormData((prev: any) => ({ ...prev, storage: u })); }} />
                                                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{formData.capacity.unit}</span>
                                                </div>
                                            </FormField>
                                            <FormField label="Assigned Product Type">
                                                <Input placeholder="e.g. Cotton Yarn 40s" value={bin.productType} onChange={e => { const u = [...formData.storage]; u[idx].productType = e.target.value; setFormData((prev: any) => ({ ...prev, storage: u })); }} />
                                            </FormField>
                                        </div>
                                        <div className="bg-white border rounded px-2 py-1 inline-block text-[10px] font-mono text-indigo-700 border-indigo-200 shadow-sm dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400">
                                            ID: {(bin.rowNumber || '#')} - {(bin.rackNumber || '#')} - {(bin.binNumber || '#')}
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="ghost" className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 font-bold uppercase text-xs tracking-widest" onClick={() => setFormData((prev: any) => ({ ...prev, storage: [...prev.storage, { binNumber: '', rowNumber: '', rackNumber: '', capacity: 0, currentStock: 0, productType: '' }] }))}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Storage Bin
                                </Button>
                            </div>
                        )}

                        {/* ─── TAB 6: Activation ─── */}
                        {activeTab === 'activation' && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Activation & Status</p>
                                <FormField label="Location Status">
                                    <select className={selectClass} value={formData.status} onChange={e => setFormData((prev: any) => ({ ...prev, status: e.target.value }))}>
                                        <option>Active</option><option>Maintenance</option><option>Inactive</option>
                                    </select>
                                </FormField>
                                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 mt-4 space-y-2">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Verification Checklist</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <CheckCircle2 className={`h-4 w-4 ${formData.locationCode ? 'text-emerald-500' : 'text-slate-300'}`} />
                                        {formData.locationCode ? 'Basic info provided' : 'Basic info missing'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <CheckCircle2 className={`h-4 w-4 ${(formData.inchargeId || formData.alternateIncharge) ? 'text-emerald-500' : 'text-slate-300'}`} />
                                        {(formData.inchargeId || formData.alternateIncharge) ? 'Incharge configured' : 'No incharge assigned'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <CheckCircle2 className={`h-4 w-4 ${formData.capacity.total > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                                        {formData.capacity.total > 0 ? 'Capacity mapped' : 'Capacity not set'}
                                    </div>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
                                    <strong>Ready to use:</strong> Ensure all details are accurate before activating. An Active location is immediately available for stock movement, GRN, and material issuance.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Footer Navigation ─── */}
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
                                {isSubmitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Save Location'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
