'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { SubNav } from '@/components/SubNav';
import {
    LayoutDashboard,
    Building2,
    Users2,
    Package,
    UserSquare2,
    MapPin,
    Settings2,
    FileSpreadsheet
} from 'lucide-react';

const masterTabs = [
    { label: 'Overview', href: '/dashboard/masters', icon: LayoutDashboard },
    { label: 'Company', href: '/dashboard/masters/company', icon: Building2 },
    { label: 'Party', href: '/dashboard/masters/party', icon: Users2 },
    { label: 'Product', href: '/dashboard/masters/product', icon: Package },
    { label: 'Employee', href: '/dashboard/masters/employee', icon: UserSquare2 },
    { label: 'Location', href: '/dashboard/masters/location', icon: MapPin },
];

export default function MastersLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <SubNav
                    title="Master"
                    titleHighlight="Data"
                    subtitle="Configure system-wide parameters and categories."
                    tabs={masterTabs}
                />
                {children}
            </div>
        </DashboardLayout>
    );
}
