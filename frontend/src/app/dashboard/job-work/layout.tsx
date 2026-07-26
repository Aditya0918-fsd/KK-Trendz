'use client';

import { SubNav } from '@/components/SubNav';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
    LayoutDashboard,
    ClipboardList,
    Truck,
    CheckCircle2,
    FileText,
    Receipt,
    Package
} from 'lucide-react';

export default function JobWorkLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tabs = [
        {
            label: 'Overview',
            href: '/dashboard/job-work',
            icon: LayoutDashboard
        },
        {
            label: 'Job Orders',
            href: '/dashboard/job-work/order',
            icon: ClipboardList
        },
        {
            label: 'Material Issue',
            href: '/dashboard/job-work/issue',
            icon: Truck
        },
        {
            label: 'Job Work Receipt',
            href: '/dashboard/job-work/receipt',
            icon: CheckCircle2
        },
        {
            label: 'Goods Receipt',
            href: '/dashboard/procurement/grn',
            icon: Package
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <SubNav
                    title="Job Work"
                    subtitle="Manage outside production & processing"
                    tabs={tabs}
                />
                <main>{children}</main>
            </div>
        </DashboardLayout>
    );
}
