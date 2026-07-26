'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { SubNav } from '@/components/SubNav';
import {
    LayoutDashboard,
    ClipboardList,
    FileText,
    ShoppingCart,
    Truck,
    Receipt,
    FileWarning
} from 'lucide-react';

const procurementTabs = [
    { label: 'Overview', href: '/dashboard/procurement', icon: LayoutDashboard },
    { label: 'Requisitions', href: '/dashboard/procurement/requisitions', icon: FileWarning },
    { label: 'Enquiry', href: '/dashboard/procurement/enquiry', icon: ClipboardList },
    { label: 'Quotation', href: '/dashboard/procurement/quotation', icon: FileText },
    { label: 'Orders', href: '/dashboard/procurement/order', icon: ShoppingCart },
    { label: 'GRN', href: '/dashboard/procurement/grn', icon: Truck },
    { label: 'Invoices', href: '/dashboard/procurement/invoice', icon: Receipt },
];

export default function ProcurementLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <SubNav
                    title="Procurement"
                    titleHighlight="Sourcing"
                    subtitle="Manage your supply chain from enquiry to invoice."
                    tabs={procurementTabs}
                />
                {children}
            </div>
        </DashboardLayout>
    );
}
