'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { SubNav } from '@/components/SubNav';
import { Package, Truck, ReceiptText, LayoutDashboard } from 'lucide-react';

const navItems = [
    { label: 'Overview', href: '/dashboard/logistics/overview', icon: LayoutDashboard },
    { label: 'Packing', href: '/dashboard/logistics/packing', icon: Package },
    { label: 'Dispatch', href: '/dashboard/logistics/dispatch', icon: Truck },
    { label: 'Sales Invoices', href: '/dashboard/logistics/invoices', icon: ReceiptText },
];

export default function LogisticsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <SubNav
                    title="Logistics"
                    titleHighlight="Center"
                    subtitle="Integrated Packing, Dispatch & Revenue Compliance Hub."
                    tabs={navItems}
                />
                {children}
            </div>
        </DashboardLayout>
    );
}
