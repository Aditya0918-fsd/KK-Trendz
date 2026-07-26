'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import {
    Users, Settings, Shield, Lock, Edit3,
    Plus, Database, Cpu, Bell, Globe, ChevronRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

const ERP_MODULES = [
    'Dashboard', 'Master Data', 'Procurement', 'Job Work',
    'Production', 'Quality Control', 'Logistics', 'Sales & Orders',
    'Inventory', 'Reports', 'Settings'
];

function defaultPerms(level: string, mod: string) {
    return {
        module: mod,
        canView: true,
        canCreate: level === 'Full' || level === 'Edit',
        canEdit: level === 'Full' || level === 'Edit',
        canDelete: level === 'Full',
        canApprove: level === 'Full',
    };
}

export default function SettingsPage() {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([
                { _id: 'u1', userId: 'USR0001', username: 'admin.kk', email: 'admin@kktraders.com', role: 'Admin', status: 'Active', permissions: ERP_MODULES.map(m => defaultPerms('Full', m)) },
                { _id: 'u2', userId: 'USR0002', username: 'prakash.s', email: 'prakash@kktraders.com', role: 'Supervisor', status: 'Active', permissions: ERP_MODULES.map(m => defaultPerms('Edit', m)) },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getPermLevel = (user: any, mod: string): string => {
        const perm = user?.permissions?.find((p: any) => p.module === mod);
        if (!perm) return 'None';
        if (perm.canDelete) return 'Full';
        if (perm.canEdit) return 'Edit';
        return 'View';
    };

    const setPermLevel = (mod: string, level: string) => {
        if (!selectedUser) return;
        const cloned = { ...selectedUser, permissions: [...(selectedUser.permissions || [])] };
        const idx = cloned.permissions.findIndex((p: any) => p.module === mod);
        const newPerm = defaultPerms(level, mod);
        if (idx >= 0) cloned.permissions[idx] = newPerm;
        else cloned.permissions.push(newPerm);
        setSelectedUser(cloned);
    };

    const savePermissions = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await api.put(`/users/${selectedUser._id}/permissions`, { permissions: selectedUser.permissions });
            setUsers(prev => prev.map(u => u._id === selectedUser._id ? selectedUser : u));
        } catch (error) {
            console.error('Failed to save permissions:', error);
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (userId: string) => {
        try {
            const res = await api.put(`/users/${userId}/toggle-status`, {});
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: res.data.status } : u));
            if (selectedUser?._id === userId) setSelectedUser((p: any) => ({ ...p, status: res.data.status }));
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">
                            Control <span className="text-cyan-500">Center</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">
                            System Administration & ERP Permission Matrix
                        </p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users size={14} />
                            Users & Permissions
                        </button>
                        <button
                            onClick={() => setActiveTab('system')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'system' ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Cpu size={14} />
                            System
                        </button>
                    </div>
                </div>

                {/* ── USERS & PERMISSIONS TAB ── */}
                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* User List */}
                        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Operator Registry</CardTitle>
                                    <CardDescription className="text-[9px] uppercase font-bold text-slate-400">Manage active ERP users — click a row to configure access</CardDescription>
                                </div>
                                <Button className="bg-cyan-500 hover:bg-cyan-600 text-[10px] font-black uppercase tracking-widest h-8 px-4 rounded-lg gap-2">
                                    <Plus size={14} />
                                    New User
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                                            <TableRow>
                                                <TableHead className="text-[9px] font-black uppercase tracking-widest">Identity</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase tracking-widest">Role</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase tracking-widest">Status</TableHead>
                                                <TableHead className="text-[9px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-12 text-[10px] font-black uppercase text-slate-400">
                                                        Loading users...
                                                    </TableCell>
                                                </TableRow>
                                            ) : users.map((u) => (
                                                <TableRow
                                                    key={u._id}
                                                    className={`group border-b border-slate-50 dark:border-slate-800 transition-colors cursor-pointer ${selectedUser?._id === u._id ? 'bg-cyan-50/50 dark:bg-cyan-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}
                                                    onClick={() => setSelectedUser(u)}
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-black text-xs ${selectedUser?._id === u._id ? 'bg-cyan-500 text-white' : 'bg-cyan-500/10 text-cyan-500'}`}>
                                                                {(u.username?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black uppercase text-slate-800 dark:text-white">{u.username}</p>
                                                                <p className="text-\[11px\] font-medium text-slate-500 dark:text-slate-300 mt-0.5">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${u.role === 'Admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                            {u.role}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleStatus(u._id); }}
                                                            className="flex items-center gap-2 group/status"
                                                        >
                                                            <div className={`h-1.5 w-1.5 rounded-full transition-colors ${u.status === 'Active' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-400'}`} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover/status:text-cyan-500 transition-colors">{u.status}</span>
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <button className="p-2 hover:text-cyan-500 transition-colors">
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Permission Panel */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={16} className="text-cyan-500" />
                                    ERP Access Matrix
                                </CardTitle>
                                <CardDescription className="text-[9px] uppercase font-bold text-slate-400">
                                    {selectedUser ? `Editing: ${selectedUser.username}` : 'Select a user to manage access'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                {!selectedUser ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                                        <Lock size={32} className="text-slate-300" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Awaiting Identity Selection</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Module Access</p>
                                                <div className="flex gap-2 text-[8px] font-black uppercase text-slate-400">
                                                    <span className="text-cyan-500">V</span>=View
                                                    <span className="text-indigo-500">E</span>=Edit
                                                    <span className="text-amber-500">F</span>=Full
                                                </div>
                                            </div>
                                            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                                                {ERP_MODULES.map((mod) => {
                                                    const lvl = getPermLevel(selectedUser, mod);
                                                    return (
                                                        <div key={mod} className="flex items-center justify-between gap-3">
                                                            <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 flex-1">{mod}</span>
                                                            <div className="flex gap-1">
                                                                {(['View', 'Edit', 'Full'] as const).map((perm) => (
                                                                    <button
                                                                        key={perm}
                                                                        onClick={() => setPermLevel(mod, lvl === perm ? 'None' : perm)}
                                                                        className={`w-8 h-6 rounded text-[8px] font-black uppercase transition-all border ${lvl === perm
                                                                            ? perm === 'View' ? 'bg-cyan-500 text-white border-cyan-500'
                                                                                : perm === 'Edit' ? 'bg-indigo-500 text-white border-indigo-500'
                                                                                    : 'bg-amber-500 text-white border-amber-500'
                                                                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-400'
                                                                            }`}
                                                                    >
                                                                        {perm[0]}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={savePermissions}
                                            disabled={saving}
                                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-[10px] font-black uppercase tracking-[0.2em] py-5 h-auto rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-60"
                                        >
                                            {saving ? 'Saving...' : 'Apply Permission Changes'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── SYSTEM TAB ── */}
                {activeTab === 'system' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Globe size={24} /></div>
                                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">Cluster 01</span>
                                </div>
                                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Infrastructure</h3>
                                <p className="text-xl font-black italic tracking-tight">KK Trendz <span className="text-cyan-500">CLOUD</span></p>
                                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-\[11px\] font-medium text-slate-500 dark:text-slate-300 mt-0.5 uppercase">
                                    <span>Version 2.4.0 (Stable)</span>
                                    <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-cyan-500" /> Online</span>
                                </div>
                            </Card>

                            <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><Database size={24} /></div>
                                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">Storage</span>
                                </div>
                                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Database Load</h3>
                                <p className="text-xl font-black italic tracking-tight uppercase">842 GB <span className="text-rose-500">/ 1 TB</span></p>
                                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 w-[84%] rounded-full" />
                                </div>
                            </Card>

                            <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Bell size={24} /></div>
                                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">Priority</span>
                                </div>
                                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Alert Logic</h3>
                                <p className="text-xl font-black italic tracking-tight uppercase">Smart <span className="text-amber-500">Active</span></p>
                                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between text-\[11px\] font-medium text-slate-500 dark:text-slate-300 mt-0.5 uppercase italic">
                                    <span>AI Engine: Enabled</span>
                                    <span className="text-amber-500">14 Pending</span>
                                </div>
                            </Card>
                        </div>

                        {/* Global Settings */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Global ERP Parameters
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { key: 'companyName', val: 'KK Trendz EXPORTS', desc: 'Default entity for documentation', cat: 'Entity' },
                                    { key: 'fiscalPeriod', val: 'APR–MAR (Standard)', desc: 'Financial calculation window', cat: 'Financial' },
                                    { key: 'taxIdentifier', val: '27AAACK0000A1Z5', desc: 'GST/VAT unique mapping', cat: 'Regulatory' },
                                    { key: 'isoCode', val: 'ISO 9001:2015', desc: 'Compliance tracking level', cat: 'Quality' },
                                    { key: 'defaultCurrency', val: 'INR (₹)', desc: 'Primary transactional metric', cat: 'Financial' },
                                    { key: 'timeZone', val: 'IST (UTC+5:30)', desc: 'System log alignment sync', cat: 'System' },
                                ].map((s, i) => (
                                    <Card key={i} className="p-5 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 group hover:border-cyan-500/50 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500">{s.cat}</span>
                                            <Edit3 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{s.key}</p>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight italic">{s.val}</h4>
                                        <p className="text-[9px] font-bold text-slate-500 mt-2 italic leading-relaxed">{s.desc}</p>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
