import React, { useState, useMemo } from 'react';
import { ComprasStepper, StepStatus } from './ComprasStepper';
import { AppState, ContentData, DocumentConfig, Signature, Person, Sector, Job } from '../../types';
import { ComprasForm } from '../forms/ComprasForm';
import { ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ComprasStepWizardProps {
    state: AppState;
    content: ContentData;
    docConfig: DocumentConfig;
    allowedSignatures: Signature[];
    handleUpdate: (section: keyof AppState, key: string, value: any) => void;
    onUpdate: (newState: AppState) => void;
    persons: Person[];
    sectors: Sector[];
    jobs: Job[];
    onFinish: () => Promise<boolean | void>;
    onBack?: () => void;
}

export const ComprasStepWizard: React.FC<ComprasStepWizardProps> = ({
    state, content, docConfig, allowedSignatures, handleUpdate, onUpdate, persons, sectors, jobs, onFinish, onBack
}) => {
    const [currentStep, setCurrentStep] = useState(1);

    // --- Status Calculation Logic ---
    const stepsStatus = useMemo(() => {
        const statuses: Record<number, StepStatus> = {};

        // Helper to check validity
        const s1Valid = !!(content.title && content.requesterName && content.priority);
        const s2Valid = !!(content.purchaseItems && content.purchaseItems.length > 0);
        const s3Valid = !!(content.body && content.body.length > 0);
        const s4Valid = true; // Optional (Anexos)
        const s5Valid = !!(content.signatureName); // Assinar

        // Helper to check "started" (partial) - simple check if ANY field is filled
        const s1Started = !!(content.title || content.requesterName || content.priority);
        const s2Started = false; // Hard to be "partial" on items list, either have items or not
        const s3Started = !!(content.body && content.body.length > 0);
        const s5Started = false;

        const getStatus = (id: number, isValid: boolean, isStarted: boolean): StepStatus => {
            if (currentStep === id) return 'current';
            if (isValid) return 'completed';
            if (isStarted) return 'in_progress';
            return 'empty';
        };

        statuses[1] = getStatus(1, s1Valid, s1Started);
        statuses[2] = getStatus(2, s2Valid, s2Started);
        statuses[3] = getStatus(3, s3Valid, s3Started);
        statuses[4] = currentStep === 4 ? 'current' : (content.attachments && content.attachments.length > 0 ? 'completed' : 'empty'); // Anexos: Green if has files, else empty
        statuses[5] = getStatus(5, s5Valid, s5Started);

        return statuses;
    }, [content, currentStep]);

    // Check Global Completion for "Finalizar" button
    const isAllMandatoryCompleted = useMemo(() => {
        return !!(
            content.title && content.requesterName && content.priority && // Step 1
            content.purchaseItems && content.purchaseItems.length > 0 && // Step 2
            content.body && // Step 3
            content.signatureName // Step 5
        );
    }, [content]);


    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 5));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateStep = (step: number): boolean => {
        if (step === 1) {
            if (!content.title) { alert('Informe a Finalidade do Pedido'); return false; }
            if (!content.requesterName) { alert('Selecione o Solicitante'); return false; }
        }
        if (step === 2) {
            if (!content.purchaseItems || content.purchaseItems.length === 0) {
                alert('Adicione pelo menos um item à lista');
                return false;
            }
        }
        if (step === 3) {
            if (!content.body) { alert('Preencha a Justificativa'); return false; }
        }
        return true;
    };

    const handleStepClick = (step: number) => {
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* NEW HEADER LAYOUT: Back Button | Stepper | Action Button */}
            <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-1 flex items-center gap-6 shadow-sm min-h-[50px]">

                {/* 1. Voltar (Padrão) */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 group px-3 py-2 text-slate-400 hover:text-slate-900 transition-all font-black uppercase tracking-tighter text-[11px]"
                    title="Voltar para Compras"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Voltar</span>
                </button>

                {/* 2. Stepper */}
                <div className="flex-1 flex justify-center">
                    <div className="w-full max-w-3xl">
                        <ComprasStepper currentStep={currentStep} stepsStatus={stepsStatus} onStepClick={handleStepClick} />
                    </div>
                </div>

                {/* 3. Botão de Ação (Avançar/Finalizar) */}
                <div className="min-w-[140px] flex justify-end">
                    {/* Hide Button in Step 5 (Assinar) - Form handles it */}
                    {currentStep !== 5 && (
                        !isAllMandatoryCompleted ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-sm"
                            >
                                Avançar
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={onFinish}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-sm animate-pulse"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Finalizar
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* CONTENT AREA - Expanded (No pb-32 anymore) */}
            <div className={`flex-1 ${currentStep === 5 ? 'overflow-hidden flex flex-col justify-center' : 'overflow-y-auto'} p-4 md:p-8 bg-slate-50 relative`}>
                <div className={`max-w-5xl mx-auto ${currentStep === 5 ? 'w-full h-full flex flex-col justify-center' : 'space-y-8'} animate-fade-in`}>

                    {/* Main Form handles all steps now */}
                    <ComprasForm
                        state={state}
                        content={content}
                        docConfig={docConfig}
                        allowedSignatures={allowedSignatures}
                        handleUpdate={handleUpdate}
                        onUpdate={onUpdate}
                        persons={persons}
                        sectors={sectors}
                        jobs={jobs}
                        currentStep={currentStep}
                        onFinish={onFinish}
                        canFinish={isAllMandatoryCompleted}
                    />

                </div>
            </div>
        </div>
    );
};

// Simple Header Helper
const ComHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500">{subtitle}</p>
    </div>
);

// Icon import for Step 3 placeholder
import { DollarSign } from 'lucide-react';
