import React from 'react';
import { FileText, Package, CheckCircle2, DollarSign, MessageSquare, Paperclip, ShieldCheck } from 'lucide-react';

export type StepStatus = 'completed' | 'in_progress' | 'empty' | 'current';

interface ComprasStepperProps {
    currentStep: number;
    stepsStatus: Record<number, StepStatus>;
    onStepClick?: (step: number) => void;
}

export const ComprasStepper: React.FC<ComprasStepperProps> = ({ currentStep, stepsStatus, onStepClick }) => {
    const steps = [
        { id: 1, label: 'Detalhes', icon: FileText },
        { id: 2, label: 'Itens', icon: Package },
        { id: 3, label: 'Justificativa', icon: MessageSquare },
        { id: 4, label: 'Anexos', icon: Paperclip },
        { id: 5, label: 'Assinar', icon: ShieldCheck },
    ];

    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-between w-full relative">

                {/* Connecting Line Background (Grey) */}
                {/* Removed as individual line segments are used for more precise control */}

                {steps.map((step, index) => {
                    const status = stepsStatus[step.id] || 'empty';
                    const Icon = step.icon;
                    const isLast = index === steps.length - 1;

                    // Styles based on status
                    let circleClass = 'bg-white border-2 border-slate-200 text-slate-300';
                    let labelClass = 'text-slate-400';

                    if (status === 'completed') {
                        circleClass = 'bg-emerald-500 border-emerald-500 text-white';
                        labelClass = 'text-emerald-600 font-bold';
                    } else if (status === 'in_progress') {
                        circleClass = 'bg-amber-500 border-amber-500 text-white';
                        labelClass = 'text-amber-500 font-bold';
                    } else if (status === 'current') {
                        circleClass = 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'; // Azul para atual
                        labelClass = 'text-blue-600 font-bold';
                    }

                    // Line coloring (segment after this step)
                    // If this step is completed or current (and acting as passed), color the line?
                    // Usually line fills up to CURRENT step.
                    // But if Step 1 is done, Step 2 is done, line 1-2 should be green.
                    // If Step 1 is done, Step 2 is in progress, line 1-2 is green?
                    // Let's create a custom line segment for each gap.

                    return (
                        <React.Fragment key={step.id}>
                            <div
                                onClick={() => onStepClick && onStepClick(step.id)}
                                className={`flex flex-col items-center gap-2 relative z-10 cursor-pointer group px-2 bg-white rounded-xl transition-all duration-300 ${status === 'current' ? 'scale-110' : 'hover:scale-105'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${circleClass}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider transition-colors ${labelClass}`}>
                                    {step.label}
                                </span>
                            </div>

                            {/* Connecting Line Segment to next step */}
                            {!isLast && (
                                <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-slate-100 relative -z-10">
                                    <div
                                        className={`h-full transition-all duration-500 ${
                                            // Fill line if THIS step is completed
                                            status === 'completed' ? 'bg-emerald-500' :
                                                // Or if current is > this step (implies passed)
                                                currentStep > step.id ? 'bg-emerald-500' : 'bg-transparent'
                                            }`}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
