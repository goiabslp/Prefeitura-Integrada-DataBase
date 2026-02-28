import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface ProcessStepperProps {
    steps: string[];
    currentStep: number;
    onStepClick: (index: number) => void;
    maxCompletedStep?: number;
    filledSteps?: boolean[]; // NEW: To allow graying out completed but empty steps
    compact?: boolean;
}

export const ProcessStepper: React.FC<ProcessStepperProps> = ({
    steps,
    currentStep,
    onStepClick,
    maxCompletedStep = -1,
    filledSteps,
    compact = false
}) => {
    return (
        <div className="w-full overflow-x-auto pb-4 pt-2">
            <div className="flex items-center min-w-max px-2">
                {steps.map((step, index) => {
                    const isCompleted = index <= maxCompletedStep;
                    const isFilled = filledSteps ? !!filledSteps[index] : true; // Default to true if not provided (legacy behavior)
                    const isViewing = index === currentStep;
                    const isInProgress = index === maxCompletedStep + 1;
                    const isClickable = index <= (maxCompletedStep + 1);

                    // Color Logic
                    // Priority: Viewing (Blue) > Completed & Filled (Green) > In Progress (Orange) > Default (Gray)
                    // "Concluidas sem preenchimento" -> Default (Gray)

                    let bgClass = 'bg-white';
                    let borderClass = 'border-slate-200';
                    let textClass = 'text-slate-400';
                    let shadowClass = '';
                    let circleBg = 'bg-slate-100';
                    let circleText = 'text-slate-500';

                    if (isViewing) {
                        bgClass = 'bg-blue-600';
                        borderClass = 'border-blue-600';
                        textClass = 'text-white';
                        shadowClass = 'shadow-lg shadow-blue-500/30';
                        circleBg = 'bg-white';
                        circleText = 'text-blue-600';
                    } else if (isCompleted && isFilled) {
                        bgClass = 'bg-emerald-100';
                        borderClass = 'border-emerald-200';
                        textClass = 'text-emerald-700';
                        circleBg = 'bg-emerald-200';
                        circleText = 'text-emerald-700';
                    } else if (isInProgress) {
                        bgClass = 'bg-orange-50';
                        borderClass = 'border-orange-200';
                        textClass = 'text-orange-700';
                        circleBg = 'bg-orange-100';
                        circleText = 'text-orange-600';
                    } else if (isCompleted && !isFilled) {
                        // Explicitly "Completed but Empty" -> Remain Gray (Default)
                        // logic already falls through to defaults, but commented for clarity
                    }

                    return (
                        <React.Fragment key={index}>
                            {/* Step Item */}
                            <div
                                className={`flex items-center gap-1.5 md:gap-2 ${compact ? 'px-2 py-1.5' : 'px-4 py-2'} rounded-full transition-all border ${bgClass} ${borderClass} ${textClass} ${shadowClass} ${isClickable && !isViewing ? 'cursor-pointer hover:opacity-80' : ''}`}
                                onClick={() => {
                                    if (isClickable) {
                                        onStepClick(index);
                                    }
                                }}
                            >
                                <div className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-full flex items-center justify-center text-[10px] font-bold ${circleBg} ${circleText}`}>
                                    {isCompleted && !isViewing && !isInProgress ? <Check className="w-3 h-3" /> : (index + 1).toString().padStart(2, '0')}
                                </div>
                                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap ${compact ? 'hidden lg:block' : ''}`}>
                                    {step}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className={compact ? 'px-1' : 'px-2'}>
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
