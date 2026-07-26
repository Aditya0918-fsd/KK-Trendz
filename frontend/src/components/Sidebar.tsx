'use client';

import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Database,
    Truck,
    Activity,
    ShieldCheck,
    Receipt,
    TrendingUp,
    TrendingDown,
    FilePlus,
    CreditCard,
    BarChart3,
    Box,
    ChevronDown,
    ClipboardList,
    CheckCircle2,
    Scissors,
    Zap,
    Sparkles,
    Factory,
    Wrench
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    {
        icon: FileText,
        label: 'Reports',
        href: '/dashboard/reports',
        children: [
            { label: 'Overview', href: '/dashboard/reports', icon: LayoutDashboard },
            { label: 'Order Pipeline', href: '/dashboard/reports?tab=orders', icon: ShoppingCart },
            { label: 'Daily Operations', href: '/dashboard/reports/daily', icon: Activity },
            { label: 'Monthly Sales', href: '/dashboard/reports/monthly-sales', icon: TrendingUp },
            { label: 'Sales Report', href: '/dashboard/reports/sales', icon: TrendingUp },
            { label: 'Purchase Report', href: '/dashboard/reports/purchase', icon: Package },
            { label: 'Financial Report', href: '/dashboard/reports/financial', icon: Activity },
            { label: 'Inventory Report', href: '/dashboard/reports/inventory', icon: Package },
            { label: 'Checklists', href: '/dashboard/reports/checklists', icon: ClipboardList },
            { label: 'GST Returns', href: '/dashboard/reports/gst/gstr1', icon: BarChart3 }
        ]
    },
    { icon: Database, label: 'Master Data', href: '/dashboard/masters' },
    { icon: ShoppingCart, label: 'Sales and Order', href: '/dashboard/sales' },
    { icon: Truck, label: 'Procurement', href: '/dashboard/procurement' },
    { icon: Wrench, label: 'Job Work', href: '/dashboard/job-work' },

    { icon: ShieldCheck, label: 'Quality Control', href: '/dashboard/quality-control' },
    {
        icon: Activity,
        label: 'Production',
        href: '/dashboard/production',
        children: [
            { label: 'PRODUCTION PLANNING', href: '/dashboard/production/plan', icon: ClipboardList },
            { label: 'PRODUCTION JOB CARD', href: '/dashboard/production/job-card', icon: FilePlus },
            { label: 'CUTTING SECTION PROCESS', href: '/dashboard/production/cutting', icon: Scissors },
            { label: 'STITCHING SECTION PROCESS', href: '/dashboard/production/stitching', icon: Zap },
            { label: 'FINISHING PROCESS (Thread Cutting & Ironing)', href: '/dashboard/production/finishing', icon: Sparkles }
        ]
    },
    {
        icon: Package,
        label: 'Logistics and Dispatch',
        href: '/dashboard/logistics',
        children: [
            { label: 'Overview', href: '/dashboard/logistics/overview', icon: LayoutDashboard },
            { label: 'Packing Logistics', href: '/dashboard/logistics/packing', icon: Box },
            { label: 'Dispatch Controls', href: '/dashboard/logistics/dispatch', icon: Truck }
        ]
    },
    {
        label: 'Finance and Billing',
        icon: Receipt,
        href: '/dashboard/finance',
        children: [
            { label: 'Overview', href: '/dashboard/finance', icon: LayoutDashboard },
            { label: 'Sales Invoices', href: '/dashboard/finance/sales-invoices', icon: TrendingUp },
            { label: 'Purchase Invoices', href: '/dashboard/finance/purchase-invoices', icon: TrendingDown },
            { label: 'Credit Notes', href: '/dashboard/finance/credit-notes', icon: FileText },
            { label: 'Debit Notes', href: '/dashboard/finance/debit-notes', icon: FileText },
            { label: 'Proforma', href: '/dashboard/finance/proforma', icon: FilePlus },
            { label: 'Payments', href: '/dashboard/finance/receipts', icon: CreditCard },
            {
                label: 'GST Returns',
                href: '/dashboard/reports/gst',
                icon: BarChart3,
                children: [
                    { label: 'GSTR-1 (Sales)', href: '/dashboard/reports/gst/gstr1', icon: FilePlus },
                    { label: 'GSTR-3B (Summary)', href: '/dashboard/reports/gst/gstr3b', icon: Activity },
                ]
            }
        ]
    },
    { label: 'Attendance & Pay role', icon: Users, href: '/dashboard/hr' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];


interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    useEffect(() => {
        menuItems.forEach(item => {
            if (item.children && item.href && pathname.startsWith(item.href) && !openMenus.includes(item.label)) {
                setOpenMenus(prev => [...prev, item.label]);
            }
        });
    }, [pathname]);

    const toggleMenu = (label: string) => {
        setOpenMenus(prev =>
            prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
        );
    };

    const handleLogout = async () => {
        logout();
    };

    return (
        <aside
            className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/80 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Header */}
            <div className={`relative flex h-20 items-center border-b border-slate-200/60 px-4 dark:border-slate-800/60 ${collapsed ? 'justify-center' : 'justify-start'}`}>
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-transform duration-300">
                            <span className="text-xl font-black tracking-tighter">KK</span>
                        </div>
                        <span className="text-lg font-black tracking-tight text-gradient">KK Trendz</span>
                    </div>
                )}
                {collapsed && (
                    <button
                        onClick={onToggleCollapse}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white shadow-lg shadow-indigo-500/30 transition-transform hover:scale-110"
                    >
                        <span className="text-xl font-black tracking-tighter">KK</span>
                    </button>
                )}
                {!collapsed && (
                    <button
                        onClick={onToggleCollapse}
                        className="absolute right-2 rounded-xl p-2 hover:bg-indigo-50/80 text-slate-500 dark:text-slate-400 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-4 custom-scrollbar">
                {menuItems.map((item: any) => {
                    const Icon = item.icon;
                    const hasChildren = item.children && item.children.length > 0;
                    const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href);
                    const isOpen = openMenus.includes(item.label);

                    if (hasChildren && !collapsed) {
                        return (
                            <div key={item.label} className="space-y-1">
                                <button
                                    onClick={() => toggleMenu(item.label)}
                                    className={`group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                                        <Icon size={18} className={`shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                                        <span className="truncate whitespace-nowrap flex-1 text-left">{item.label}</span>
                                    </div>
                                    <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isOpen && (
                                    <div className="ml-4 space-y-1 border-l border-slate-100 pl-2 dark:border-slate-800">
                                        {item.children.map((child: any) => (
                                            <SidebarNavItem key={child.label || child.href} item={child} pathname={pathname} depth={1} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return <SidebarNavItem key={item.label || item.href} item={item} pathname={pathname} collapsed={collapsed} />;
                })}
            </nav>
            {/* Logout */}
            <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-[11px] font-black uppercase tracking-wider text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10"
                >
                    <LogOut size={18} className="mr-3" />
                    {!collapsed && <span>Sign Out</span>}
                </Button>
            </div>
        </aside>
    );
}

function SidebarNavItem({ item, pathname, collapsed = false, depth = 0 }: { item: any; pathname: string; collapsed?: boolean; depth?: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);

    useEffect(() => {
        if (hasChildren && pathname.startsWith(item.href)) {
            setIsOpen(true);
        }
    }, [pathname, item.href, hasChildren]);

    if (hasChildren && !collapsed) {
        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-[10px] font-bold tracking-tight transition-all ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                        {Icon && <Icon size={depth === 0 ? 18 : 13} className="shrink-0" />}
                        <span className="truncate whitespace-nowrap flex-1 text-left">{item.label}</span>
                    </div>
                    <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className="ml-4 space-y-1 border-l border-slate-100 pl-2 dark:border-slate-800">
                        {item.children.map((child: any) => (
                            <SidebarNavItem key={child.label || child.href} item={child} pathname={pathname} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-200 ${depth === 0 ? 'text-[11px] font-black uppercase tracking-wider' : 'text-[10px] font-bold tracking-tight'} ${isActive
                ? 'bg-linear-to-r from-violet-600/15 via-indigo-600/15 to-pink-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold shadow-sm border border-indigo-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300'
                } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}
        >
            {Icon && <Icon size={depth === 0 ? 18 : 13} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'} />}
            {!collapsed && <span>{item.label}</span>}
            {isActive && !collapsed && depth === 0 && (
                <div className="absolute left-0 h-6 w-1 rounded-r-full bg-linear-to-b from-violet-600 to-indigo-600 shadow-[0_0_12px_rgba(124,58,237,0.6)]" />
            )}
        </Link>
    );
}
