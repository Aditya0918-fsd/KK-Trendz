'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { SubNav } from '@/components/SubNav';
import { LayoutDashboard, FileCheck, AlertTriangle } from 'lucide-react';

const qcTabs = [
    { label: 'Overview', href: '/dashboard/quality-control', icon: LayoutDashboard },
    { label: 'Inspections', href: '/dashboard/quality-control/inspections', icon: FileCheck },
    { label: 'Defect Analysis', href: '/dashboard/quality-control/defects', icon: AlertTriangle },
];

export default function QualityControlLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <SubNav
                    title="Quality"
                    titleHighlight="Control"
                    subtitle="Advanced quality analytics and inspection lifecycle management."
                    tabs={qcTabs}
                />
                {children}
            </div>
        </DashboardLayout>
    );
}
