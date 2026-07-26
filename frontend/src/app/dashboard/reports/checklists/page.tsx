'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import {
    CheckSquare, CircleDashed, CheckCircle2, Factory,
    ShieldCheck, PackageOpen, Wallet, Activity, Thermometer,
    Printer, Copy, Archive
} from 'lucide-react';
import { useState } from 'react';

const checklistData = {
    production: [
        { id: 1, text: "Check today's production plan", checked: true },
        { id: 2, text: "Verify material availability", checked: true },
        { id: 3, text: "Assign operators to machines", checked: true },
        { id: 4, text: "Conduct line setup check", checked: false },
        { id: 5, text: "Monitor production throughout day", checked: false },
        { id: 6, text: "Check quality at each stage", checked: false },
        { id: 7, text: "Record production data", checked: false },
        { id: 8, text: "Record defects and issues", checked: false },
        { id: 9, text: "Report end-of-day figures", checked: false },
        { id: 10, text: "Plan for next day", checked: false },
    ],
    quality: [
        { id: 11, text: "Check incoming materials", checked: true },
        { id: 12, text: "Monitor inline quality", checked: true },
        { id: 13, text: "Conduct final inspection", checked: false },
        { id: 14, text: "Record all defects", checked: false },
        { id: 15, text: "Segregate rejects", checked: false },
        { id: 16, text: "Update quality reports", checked: false },
        { id: 17, text: "Address major issues", checked: false },
        { id: 18, text: "Prepare quality certificates", checked: false },
    ],
    storekeeper: [
        { id: 19, text: "Verify all receipts (GRN)", checked: true },
        { id: 20, text: "Verify all issues (material issue)", checked: true },
        { id: 21, text: "Update stock in system", checked: false },
        { id: 22, text: "Conduct cycle count (random items)", checked: false },
        { id: 23, text: "Check reorder levels", checked: false },
        { id: 24, text: "Organize storage bins", checked: false },
        { id: 25, text: "Prepare for next day's issues", checked: false },
    ],
    accounts: [
        { id: 26, text: "Process purchase invoices", checked: true },
        { id: 27, text: "Generate sales invoices", checked: true },
        { id: 28, text: "Record payments received", checked: true },
        { id: 29, text: "Record payments made", checked: false },
        { id: 30, text: "Update accounts", checked: false },
        { id: 31, text: "Follow up on overdue payments", checked: false },
        { id: 32, text: "Prepare daily cash position", checked: false },
    ]
};

export default function ChecklistsTracker() {
    const [checklists, setChecklists] = useState(checklistData);

    const toggleItem = (category: keyof typeof checklistData, itemId: number) => {
        setChecklists(prev => ({
            ...prev,
            [category]: prev[category].map(item =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
            )
        }));
    };

    const getProgress = (categoryItems: typeof checklistData.production) => {
        const completed = categoryItems.filter(i => i.checked).length;
        return Math.round((completed / categoryItems.length) * 100);
    };

    const ChecklistSection = ({
        title,
        icon: Icon,
        items,
        category,
        colorClass
    }: {
        title: string,
        icon: any,
        items: typeof checklistData.production,
        category: keyof typeof checklistData,
        colorClass: string
    }) => {
        const progress = getProgress(items);

        return (
            <Card className="shadow-lg border-2 border-slate-100 hover:border-slate-200 transition-colors">
                <div className={`h-2 w-full ${colorClass.replace('text-', 'bg-')}`}></div>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${colorClass}`}>
                                <Icon size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-widest text-slate-800">{title}</h2>
                                <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mt-1">
                                    <Activity size={12} /> Daily Pulse
                                </p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xl font-black ${colorClass}`}>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${colorClass.replace('text-', 'bg-')} transition-all duration-500`}
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => toggleItem(category, item.id)}
                                className={`w-full flex items-center gap-4 p-3 rounded-lg border text-left transition-all ${item.checked
                                    ? 'bg-slate-50 border-slate-200 shadow-inner'
                                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
                                    }`}
                            >
                                <div className={`flex-shrink-0 transition-all duration-300 scale-110 ${item.checked ? colorClass : 'text-slate-300'}`}>
                                    {item.checked ? <CheckSquare size={20} strokeWidth={2.5} /> : <CircleDashed size={20} />}
                                </div>
                                <span className={`text-sm font-bold tracking-wide transition-colors ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'
                                    }`}>
                                    {index + 1}. {item.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b pb-6 text-slate-800 gap-4">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                            CHECKLISTS <span className="text-indigo-500">OPERATIONS</span>
                        </h1>
                        <p className="text-sm font-black tracking-widest uppercase text-slate-500 mb-2">COMPLETE TEXTILE ERP WORKFLOW</p>
                        <p className="text-[10px] font-medium tracking-widest uppercase text-slate-400 max-w-xl leading-relaxed">
                            This complete process manual covers every step of your Textile ERP system from master data setup to final dispatch and invoicing.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="h-10 w-10 border border-slate-200 rounded flex items-center justify-center hover:bg-slate-50 transition-colors">
                            <Printer size={16} className="text-slate-500" />
                        </button>
                        <button className="h-10 w-10 border border-slate-200 rounded flex items-center justify-center hover:bg-slate-50 transition-colors">
                            <Copy size={16} className="text-slate-500" />
                        </button>
                        <button className="h-10 px-4 flex items-center gap-2 border border-indigo-200 bg-indigo-50 text-indigo-600 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-indigo-100 transition-colors">
                            <Archive size={14} /> End of Shift Save
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <ChecklistSection
                        title="Production Supervisor"
                        icon={Factory}
                        items={checklists.production}
                        category="production"
                        colorClass="text-blue-600"
                    />

                    <ChecklistSection
                        title="Quality Supervisor"
                        icon={ShieldCheck}
                        items={checklists.quality}
                        category="quality"
                        colorClass="text-emerald-600"
                    />

                    <ChecklistSection
                        title="Store Keeper"
                        icon={PackageOpen}
                        items={checklists.storekeeper}
                        category="storekeeper"
                        colorClass="text-amber-600"
                    />

                    <ChecklistSection
                        title="Accounts"
                        icon={Wallet}
                        items={checklists.accounts}
                        category="accounts"
                        colorClass="text-purple-600"
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
