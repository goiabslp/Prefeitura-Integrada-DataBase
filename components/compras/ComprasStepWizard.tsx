import React, { useState, useMemo } from 'react';
import { ComprasStepper, StepStatus } from './ComprasStepper';
import { AppState, ContentData, DocumentConfig, Signature, Person, Sector, Job } from '../../types';
import { ComprasForm } from '../forms/ComprasForm';
import { ChevronRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { User } from '../../types';

interface ComprasStepWizardProps {
    state: AppState;
    content: ContentData;
    docConfig: DocumentConfig;
    allowedSignatures: Signature[];
    handleUpdate: (section: keyof AppState, key: string, value: any) => void;
    onUpdate: React.Dispatch<React.SetStateAction<AppState>>;
    persons: Person[];
    sectors: Sector[];
    jobs: Job[];
    onFinish: () => Promise<boolean | void>;
    onBack?: () => void;
    isLoading?: boolean;
    currentUser: User;
}

export const ComprasStepWizard: React.FC<ComprasStepWizardProps> = ({
    state, content, docConfig, allowedSignatures, handleUpdate, onUpdate, persons, sectors, jobs, onFinish, onBack, isLoading = false, currentUser
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [showAccountWarning, setShowAccountWarning] = useState(false);

    // --- Status Calculation Logic ---
    const stepsStatus = useMemo(() => {
        const statuses: Record<number, StepStatus> = {};

        // Helper to check validity
        const s1Valid = !!(content.title && content.requesterName && content.priority);
        const s2Valid = !!(content.purchaseItems && content.purchaseItems.length > 0);
        const s3Valid = !!(content.body && content.body.length > 0);
        const s4Valid = true; // Optional (Anexos)
        const s5Valid = !!(content.selectedAccount); // Conta - used for status, but not mandatory to advance
        const s6Valid = !!(content.signatureName); // Assinar

        // Helper to check "started" (partial) - simple check if ANY field is filled
        const s1Started = !!(content.title || content.requesterName || content.priority);
        const s2Started = false; // Hard to be "partial" on items list, either have items or not
        const s3Started = !!(content.body && content.body.length > 0);
        const s5Started = !!(content.selectedAccount);
        const s6Started = false;

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
        statuses[6] = getStatus(6, s6Valid, s6Started);

        return statuses;
    }, [content, currentStep]);

    // Check Global Completion for "Finalizar" button
    const isAllMandatoryCompleted = useMemo(() => {
        return !!(
            content.title && content.requesterName && content.priority && // Step 1
            content.purchaseItems && content.purchaseItems.length > 0 && // Step 2
            content.body && // Step 3
            // Step 5 removed from mandatory
            content.signatureName // Step 6
        );
    }, [content]);


    const nextStep = () => {
        if (currentStep === 5 && !content.selectedAccount) {
            setShowAccountWarning(true);
            return;
        }

        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 6));
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
        if (isLoading) return;
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
                    disabled={isLoading}
                    className={`flex items-center gap-2 group px-3 py-2 transition-all font-black uppercase tracking-tighter text-[11px] ${isLoading ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-900'}`}
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
                    {/* Hide Button in Step 6 (Assinar) - Form handles it */}
                    {currentStep !== 6 && (
                        !isAllMandatoryCompleted ? (
                            <button
                                onClick={nextStep}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Avançar
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={onFinish}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-sm animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {isLoading ? 'Salvando...' : 'Finalizar'}
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className={`flex-1 ${currentStep === 6 ? 'overflow-hidden flex flex-col justify-center' : 'overflow-y-auto'} p-4 md:p-8 bg-slate-50 relative`}>
                <div className={`max-w-7xl mx-auto ${currentStep === 6 ? 'w-full h-full flex flex-col justify-center' : 'space-y-8'} animate-fade-in`}>
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
                        currentUser={currentUser}
                        currentStep={currentStep}
                        onFinish={onFinish}
                        canFinish={isAllMandatoryCompleted}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* ACCOUNT WARNING MODAL */}
            {showAccountWarning && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in flex flex-col p-10 border border-slate-100">
                        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <DollarSign className="w-10 h-10 text-amber-500" />
                        </div>

                        <div className="text-center space-y-4 mb-10">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Seleção de Conta</h3>
                            <div className="space-y-4 text-slate-500 font-medium leading-relaxed">
                                <p>
                                    Informar a conta é um passo essencial para agilizar e organizar a distribuição dos recursos.
                                </p>
                                <p className="text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    A solicitação será registrada normalmente, porém será necessário informar a conta posteriormente para que o pedido seja efetivamente realizado.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowAccountWarning(false);
                                    setCurrentStep(6);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                            >
                                Confirmar e Continuar
                            </button>
                            <button
                                onClick={() => setShowAccountWarning(false)}
                                className="w-full py-4 bg-white text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all border border-transparent"
                            >
                                Voltar para selecionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
