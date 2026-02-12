import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    ClipboardCheck,
    Database,
    CheckCircle,
    Loader2,
    Sparkles
} from 'lucide-react';

export type ProcessingStage = 'sending' | 'validating' | 'confirming' | 'success';

interface ActionProcessingModalProps {
    isOpen: boolean;
    stage: ProcessingStage;
    title?: string;
}

const stageConfig = {
    sending: {
        label: 'Enviando Pedido',
        description: 'Iniciando transmissão segura dos dados...',
        icon: Send,
        color: 'indigo'
    },
    validating: {
        label: 'Validando Informações',
        description: 'Verificando integridade e permissões...',
        icon: ClipboardCheck,
        color: 'emerald'
    },
    confirming: {
        label: 'Confirmando no Banco',
        description: 'Registrando operação permanentemente...',
        icon: Database,
        color: 'amber'
    },
    success: {
        label: 'Operação Concluída',
        description: 'Tudo pronto! O pedido seguiu para o próximo setor.',
        icon: CheckCircle,
        color: 'emerald'
    }
};

export const ActionProcessingModal: React.FC<ActionProcessingModalProps> = ({
    isOpen,
    stage,
    title = 'Processando Operação'
}) => {
    const [displayText, setDisplayText] = useState('');
    const config = stageConfig[stage];
    const Icon = config.icon;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
            />

            {/* Modal Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/20 overflow-hidden"
            >
                {/* Animated Background Element */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
                    <motion.div
                        className={`h-full bg-gradient-to-r from-${config.color}-400 to-${config.color}-600`}
                        initial={{ width: '0%' }}
                        animate={{
                            width: stage === 'sending' ? '33%' : stage === 'validating' ? '66%' : '100%'
                        }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                </div>

                <div className="p-10 flex flex-col items-center">
                    {/* Main Icon Container */}
                    <div className="relative mb-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={stage}
                                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 1.5, opacity: 0, rotate: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={`w-24 h-24 rounded-3xl bg-${config.color}-50 text-${config.color}-600 flex items-center justify-center shadow-lg shadow-${config.color}-500/10 border border-${config.color}-100`}
                            >
                                <Icon className={`w-10 h-10 ${stage !== 'success' ? 'animate-pulse' : ''}`} />
                            </motion.div>
                        </AnimatePresence>

                        {/* Orbiting Elements */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-4 border border-dashed border-slate-200 rounded-full opacity-50"
                        />

                        <AnimatePresence>
                            {stage !== 'success' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -top-2 -right-2"
                                >
                                    <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100">
                                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Text Content */}
                    <div className="text-center space-y-3">
                        <motion.div
                            key={`title-${stage}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex items-center justify-center gap-2"
                        >
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                {config.label}
                            </h3>
                            {stage === 'success' && <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />}
                        </motion.div>

                        <motion.p
                            key={`desc-${stage}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto"
                        >
                            {config.description}
                        </motion.p>
                    </div>

                    {/* Footer Relaxed Message */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-10 pt-6 border-t border-slate-50 w-full text-center"
                    >
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                            "Relaxa, estamos registrando tudo e repassando ao setor responsável. Quase lá!"
                        </p>
                    </motion.div>
                </div>

                {/* Success Confetti Effect (Conceptual) */}
                {stage === 'success' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-emerald-500/5 to-transparent"
                    />
                )}
            </motion.div>
        </div>
    );
};
