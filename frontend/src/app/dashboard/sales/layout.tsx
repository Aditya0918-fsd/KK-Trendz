'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { SubNav } from '@/components/SubNav';
import {
    LayoutDashboard,
    Activity,
    FileText,
    ShoppingCart,
    Zap
} from 'lucide-react';

const salesTabs = [
    { label: 'Overview', href: '/dashboard/sales', icon: LayoutDashboard },
    { label: 'Enquiry', href: '/dashboard/sales/enquiry', icon: Activity },
    { label: 'Quotation', href: '/dashboard/sales/quotation', icon: FileText },
    { label: 'Order', href: '/dashboard/sales/order', icon: ShoppingCart },
    { label: 'Allocation', href: '/dashboard/sales/allocation', icon: Zap },
];

export default function SalesLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <SubNav
                    title="Sales &"
                    titleHighlight="Orders"
                    subtitle="Manage the complete sales lifecycle from enquiry to allocation."
                    tabs={salesTabs}
                />
                {children}
            </div>
        </DashboardLayout>
    );
}
