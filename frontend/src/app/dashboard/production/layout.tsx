'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { SubNav } from '@/components/SubNav';
import {
    LayoutDashboard,
    Calendar,
    Scissors,
    Layers,
    Waves,
    CheckCircle
} from 'lucide-react';

const productionTabs = [
    { label: 'Overview', href: '/dashboard/production', icon: LayoutDashboard },
    { label: 'Planning', href: '/dashboard/production/plan', icon: Calendar },
    { label: 'Cutting', href: '/dashboard/production/cutting', icon: Scissors },
    { label: 'Stitching', href: '/dashboard/production/stitching', icon: Layers },
    { label: 'Finishing', href: '/dashboard/production/finishing', icon: Waves },
];

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <SubNav
                    title="Production"
                    titleHighlight="Control"
                    subtitle="Track global manufacturing stages from planning to finishing."
                    tabs={productionTabs}
                />
                {children}
            </div>
        </DashboardLayout>
    );
}
