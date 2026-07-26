'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/Modal';
import {
    CheckCircle2, Circle, ArrowLeft, ArrowRight,
    Package, Boxes, Printer, Barcode, Scale,
    Palmtree, Store, CheckCircle
} from 'lucide-react';
import api from '@/lib/api';

const steps = [
    { id: 1, name: 'Receive Checked Garments', icon: Package },
    { id: 2, name: 'Prepare Materials', icon: Boxes },
    { id: 3, name: 'Individual Packing', icon: Package },
    { id: 4, name: 'Sort by Size/Color', icon: Boxes },
    { id: 5, name: 'Carton Packing', icon: Package },
    { id: 6, name: 'Carton Labeling', icon: Printer },
    { id: 7, name: 'Barcode Labeling', icon: Barcode },
    { id: 8, name: 'Packing List', icon: Printer },
    { id: 9, name: 'Weighing', icon: Scale },
    { id: 10, name: 'Palletizing', icon: Palmtree },
    { id: 11, name: 'Storage', icon: Store },
    { id: 12, name: 'Completion', icon: CheckCircle },
];

interface PackingWizardProps {
    onClose: () => void;
    onComplete: () => void;
    initialData?: any;
}

export default function PackingWizard({ onClose, onComplete, initialData }: PackingWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialData || {
        orderId: '',
        supervisorId: '',
        batchNumber: '',
        shift: 'Morning',
        inputBundles: [],
        packingMaterials: [],
        packingDetails: [],
        palletDetails: [],
        status: 'In Progress'
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Step 1: Receive Checked Garments</h3>
                        <p className="text-sm text-slate-500">Verify quantities and record receipt of checked garment bundles.</p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Bundle Verification Checklist</p>
                            <div className="space-y-2">
                                {['Bundles from checking arrive', 'Verify quantities', 'Record receipt'].map(check => (
                                    <div key={check} className="flex items-center gap-2">
                                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                                        <span className="text-sm font-medium">{check}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Step 2: Prepare Packing Materials</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {['Poly bags', 'Cartons', 'Stickers', 'Price tags', 'Size stickers', 'Barcode stickers'].map(material => (
                                <div key={material} className="p-3 border rounded-lg bg-white flex items-center justify-between">
                                    <span className="text-sm font-bold uppercase">{material}</span>
                                    <input type="checkbox" className="h-5 w-5" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Step 6: Carton Labeling</h3>
                        <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-4">
                            <Printer className="h-12 w-12 text-slate-300" />
                            <p className="text-center text-sm font-medium">Generate and print carton stickers with Order#, Customer, Carton#, Weight, and Dimensions.</p>
                            <Button variant="outline" className="font-bold uppercase text-[10px] tracking-widest">
                                Preview Label
                            </Button>
                        </div>
                    </div>
                );
            case 9:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Step 9: Weighing</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <FormField label="Gross Weight (kg)">
                                <Input type="number" placeholder="0.00" className="font-bold" />
                            </FormField>
                            <FormField label="Net Weight (kg)">
                                <Input type="number" placeholder="0.00" className="font-bold" />
                            </FormField>
                        </div>
                    </div>
                );
            case 10:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Step 10: Palletizing</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <FormField label="Cartons per Pallet" className="flex-1">
                                    <Input type="number" defaultValue={8} />
                                </FormField>
                                <div className="flex items-end h-10 pb-2">
                                    <label className="flex items-center gap-2 text-sm font-bold">
                                        <input type="checkbox" className="h-4 w-4" /> Wrap with Film
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                const StepIcon = steps[currentStep - 1].icon;
                return (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <StepIcon className="h-16 w-16 mb-4" />
                        <p className="font-bold uppercase tracking-widest text-sm">{steps[currentStep - 1].name}</p>
                        <p className="text-xs mt-2 italic">Feature coming soon in full implementation.</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-[70vh]">
            {/* Step Indicator */}
            <div className="px-6 py-4 border-b flex justify-between overflow-x-auto no-scrollbar gap-8">
                {steps.map((step) => (
                    <div
                        key={step.id}
                        className={`flex flex-col items-center min-w-[80px] transition-all cursor-pointer ${currentStep === step.id ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-70'
                            }`}
                        onClick={() => setCurrentStep(step.id)}
                    >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 ${currentStep >= step.id ? 'bg-indigo-600 text-white' : 'bg-slate-200'
                            }`}>
                            {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : (() => {
                                const StepIconIndicator = step.icon;
                                return <StepIconIndicator className="h-4 w-4" />;
                            })()}
                        </div>
                        <p className="text-[9px] font-black uppercase text-center leading-tight whitespace-nowrap">{step.name}</p>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                <Card className="max-w-2xl mx-auto shadow-none border-slate-200 bg-white/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        {renderStepContent()}
                    </CardContent>
                </Card>
            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-6 border-t bg-slate-50/80 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={currentStep === 1 ? onClose : prevStep}
                    className="font-bold uppercase text-[11px] tracking-widest"
                >
                    {currentStep === 1 ? 'Cancel' : 'Previous Step'}
                </Button>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {currentStep} of {steps.length}</span>
                    <Button
                        onClick={currentStep === steps.length ? onComplete : nextStep}
                        className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[11px] tracking-widest px-8"
                    >
                        {currentStep === steps.length ? 'Finalize Packing' : 'Next Step'}
                        {currentStep !== steps.length && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
