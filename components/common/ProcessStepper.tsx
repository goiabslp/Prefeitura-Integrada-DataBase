import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface ProcessStepperProps {
    steps: string[];
    currentStep: number;
    onStepClick: (index: number) => void;
    maxCompletedStep?: number;
}

export const ProcessStepper: React.FC<ProcessStepperProps> = ({
    steps,
    currentStep,
    onStepClick,
    maxCompletedStep = -1
}) => {
    return (
        <div className="w-full overflow-x-auto pb-4 pt-2">
            <div className="flex items-center min-w-max px-2">
                {steps.map((step, index) => {
                    const isCompleted = index <= maxCompletedStep;
                    const isCurrent = index === currentStep;
                    const isClickable = index <= (maxCompletedStep + 1); // Allow clicking up to the next available step or any previous

                    return (
                        <React.Fragment key={index}>
                            {/* Step Item */}
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${isCurrent
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : isCompleted
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                                        : 'bg-white border-slate-200 text-slate-400'
                                    } ${isClickable && !isCurrent && !isCompleted ? 'cursor-pointer hover:border-blue-300 hover:text-blue-600' : ''}`}
                                onClick={() => {
                                    // Allow navigation if it's a previous step or the immediate next (though usually next is handled by button)
                                    // For now, let's allow clicking any previous step or the current tracked "max" step
                                    if (index <= (maxCompletedStep + 1)) {
                                        onStepClick(index);
                                    }
                                }}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isCurrent
                                    ? 'bg-white text-blue-600'
                                    : isCompleted
                                        ? 'bg-emerald-200 text-emerald-700'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {isCompleted ? <Check className="w-3 h-3" /> : (index + 1).toString().padStart(2, '0')}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                    {step}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="px-2">
                                    <ChevronRight className={`w-4 h-4 ${index < currentStep ? 'text-emerald-400' : 'text-slate-300'}`} />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
