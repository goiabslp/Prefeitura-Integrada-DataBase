import React, { useState, useRef } from 'react';
import { User, Sector, Projeto } from '../../types';
import { createProjeto } from '../../services/projetosService';
import {
    ArrowLeft,
    Send,
    Paperclip,
    AlertCircle,
    Calendar,
    User as UserIcon,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    X,
    FileText,
    Upload,
    LayoutDashboard
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile } from '../../services/storageService';

interface ProjetoFormProps {
    userId: string;
    users: User[];
    sectors: Sector[];
    onSave: () => void;
    onCancel: () => void;
}

interface AttachmentFile {
    file: File;
    preview: string;
    caption: string;
}

const STEPS = [
    { title: 'Informações Gerais', icon: LayoutDashboard },
    { title: 'Descrição Detalhada', icon: FileText },
    { title: 'Anexos', icon: Paperclip },
    { title: 'Encaminhamento', icon: Send },
];

export const ProjetoForm: React.FC<ProjetoFormProps> = ({
    userId,
    users,
    sectors,
    onSave,
    onCancel
}) => {
    const { addNotification } = useNotification();
    const [isSaving, setIsSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [responsibleId, setResponsibleId] = useState('');
    const [initialMessage, setInitialMessage] = useState('');
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    const adminUser = users.find(u => u.role === 'admin');

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};

        if (step === 0) {
            if (!name.trim()) newErrors.name = 'O nome do projeto é obrigatório.';
            if (!responsibleId) newErrors.responsibleId = 'O responsável é obrigatório.';
        }

        if (step === 2) {
            attachments.forEach((att, index) => {
                if (!att.caption.trim()) {
                    newErrors[`caption-${index}`] = 'A legenda é obrigatória.';
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        } else {
            addNotification('Por favor, corrija os erros antes de prosseguir.', 'error');
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newAttachments: AttachmentFile[] = files.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                caption: ''
            }));
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const updateCaption = (index: number, caption: string) => {
        setAttachments(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], caption };
            return updated;
        });
    };

    const handleSave = async () => {
        if (!validateStep(currentStep)) return;

        if (!adminUser) {
            addNotification('Nenhum administrador encontrado no sistema para receber o projeto.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            // Upload attachments
            const uploadedAttachments = [];
            for (const att of attachments) {
                const url = await uploadFile(att.file, 'project_attachments');
                if (url) {
                    uploadedAttachments.push({
                        url,
                        name: att.file.name,
                        caption: att.caption
                    });
                }
            }

            const newProjetoData: Omit<Projeto, 'id' | 'created_at' | 'updated_at'> = {
                name: name.trim(),
                description: description.trim(),
                responsible_id: responsibleId,
                status: 'Aguardando Admin',
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                current_owner_id: adminUser.id,
                current_sector_id: adminUser.sectorId || undefined,
                created_by: userId
            };

            await createProjeto(newProjetoData, initialMessage, uploadedAttachments);

            addNotification('Projeto criado e encaminhado ao Administrador com sucesso!', 'success');
            onSave();
        } catch (error) {
            console.error(error);
            addNotification('Erro ao criar o projeto. Tente novamente.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <LayoutDashboard className="w-4 h-4 text-fuchsia-500" />
                                    Nome do Projeto *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                                    }}
                                    placeholder="Ex: Reforma da Praça Central"
                                    className={`w-full bg-slate-50 border-2 ${errors.name ? 'border-red-300' : 'border-slate-200'} rounded-2xl px-4 py-4 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all font-medium shadow-sm`}
                                />
                                {errors.name && <p className="text-red-500 text-xs font-medium ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-fuchsia-500" />
                                    Responsável *
                                </label>
                                <select
                                    value={responsibleId}
                                    onChange={(e) => {
                                        setResponsibleId(e.target.value);
                                        if (errors.responsibleId) setErrors(prev => ({ ...prev, responsibleId: '' }));
                                    }}
                                    className={`w-full bg-slate-50 border-2 ${errors.responsibleId ? 'border-red-300' : 'border-slate-200'} rounded-2xl px-4 py-4 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all appearance-none font-medium shadow-sm`}
                                >
                                    <option value="">Selecione um responsável...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.jobTitle || 'Sem cargo'})</option>
                                    ))}
                                </select>
                                {errors.responsibleId && <p className="text-red-500 text-xs font-medium ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.responsibleId}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-fuchsia-500" />
                                    Status Inicial
                                </label>
                                <div className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-4 py-4 text-slate-500 font-bold flex items-center justify-between shadow-inner">
                                    Aguardando Admin
                                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter">Automático</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-fuchsia-500" />
                                    Início (Previsto)
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all font-medium shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-fuchsia-500" />
                                    Término (Previsto)
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all font-medium shadow-sm"
                                />
                            </div>
                        </div>
                    </motion.div>
                );
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4 text-fuchsia-500" />
                                Escopo e Objetivos
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descreva detalhadamente o que este projeto pretende alcançar, as etapas principais e qualquer informação relevante para a análise inicial..."
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all min-h-[300px] resize-none font-medium leading-relaxed shadow-sm"
                            />
                            <p className="text-xs text-slate-400 italic">Uma descrição clara ajuda o administrador a tomar decisões mais rápidas.</p>
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Documentos e Imagens</h3>
                                <p className="text-sm text-slate-500 mt-1">Anexe arquivos relevantes e adicione uma legenda obrigatória.</p>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95"
                            >
                                <Upload className="w-4 h-4" />
                                Adicionar Arquivos
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        {attachments.length === 0 ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-4 border-dashed border-slate-100 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-fuchsia-100 hover:text-fuchsia-300 transition-all cursor-pointer bg-slate-50/50"
                            >
                                <div className="p-6 rounded-full bg-white shadow-sm ring-8 ring-slate-50">
                                    <Paperclip className="w-12 h-12" />
                                </div>
                                <p className="font-bold text-lg mt-2">Nenhum arquivo selecionado</p>
                                <p className="text-sm max-w-xs text-center">Clique aqui ou no botão acima para selecionar os anexos do projeto.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {attachments.map((att, index) => (
                                    <div key={index} className="bg-white border-2 border-slate-100 rounded-2xl p-4 flex gap-4 group hover:border-fuchsia-200 transition-all relative shadow-sm">
                                        <div className="w-24 h-24 rounded-xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 relative">
                                            {att.file.type.startsWith('image/') ? (
                                                <img src={att.preview} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <FileText className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-slate-400 truncate max-w-[120px]">{att.file.name}</p>
                                                <button
                                                    onClick={() => removeAttachment(index)}
                                                    className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={att.caption}
                                                    onChange={(e) => updateCaption(index, e.target.value)}
                                                    placeholder="Legenda obrigatória..."
                                                    className={`w-full bg-slate-50 border ${errors[`caption-${index}`] ? 'border-red-300' : 'border-slate-200'} rounded-xl px-3 py-2 text-sm outline-none focus:border-fuchsia-500 focus:bg-white transition-all`}
                                                />
                                                {errors[`caption-${index}`] && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase tracking-tighter">Campo obrigatório</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-blue-50 text-blue-800 p-6 rounded-3xl flex items-start gap-4 border-2 border-blue-100 shadow-sm">
                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                <AlertCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Passo Final: Avaliação do Administrador</h4>
                                <p className="text-sm leading-relaxed opacity-90">
                                    Conforme as normas de fluxo do sistema, cada novo projeto deve passar obrigatoriamente pela triagem inicial de um <strong>Administrador</strong>.
                                    Ele será o responsável por validar as informações e liberar o início das atividades ou solicitar ajustes.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <Send className="w-4 h-4 text-fuchsia-500" />
                                Mensagem de Encaminhamento
                            </label>
                            <textarea
                                value={initialMessage}
                                onChange={(e) => setInitialMessage(e.target.value)}
                                placeholder="Escreva uma mensagem de apresentação para o administrador. Explique o contexto inicial para facilitar a aprovação..."
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-3xl px-6 py-5 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all min-h-[180px] resize-none font-medium leading-relaxed shadow-sm"
                            />
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nome do Projeto</p>
                                <p className="font-bold text-slate-800 truncate">{name || '---'}</p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
                                <p className="font-bold text-slate-800 truncate">{users.find(u => u.id === responsibleId)?.name || '---'}</p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Anexos</p>
                                <p className="font-bold text-slate-800">{attachments.length} arquivo(s)</p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destino</p>
                                <p className="font-bold text-fuchsia-600">Administrador</p>
                            </div>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-50/95 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl border border-slate-100 flex flex-col h-[90vh] overflow-hidden relative">

                {/* Header with Stepper */}
                <div className="p-8 border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-3xl shadow-lg shadow-fuchsia-200">
                                <LayoutDashboard className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Novo Projeto</h1>
                                <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Fluxo de Criação e Validação</p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900 group"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between max-w-3xl mx-auto relative px-4">
                        {/* Progress Line */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0">
                            <motion.div
                                className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                            />
                        </div>

                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep;

                            return (
                                <div key={index} className="flex flex-col items-center gap-3 relative z-10 group cursor-default">
                                    <div
                                        onClick={() => index < currentStep ? setCurrentStep(index) : null}
                                        className={`
                                            w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-md transform
                                            ${isActive ? 'bg-slate-900 text-white scale-110 shadow-lg' :
                                                isCompleted ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white cursor-pointer hover:scale-105' :
                                                    'bg-white text-slate-300 border-2 border-slate-100'}
                                        `}
                                    >
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence mode="wait">
                            <div key={currentStep}>
                                {renderStepContent()}
                            </div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-8 border-t border-slate-50 bg-slate-50/50 backdrop-blur-md sticky bottom-0 z-20 flex items-center justify-between">
                    <button
                        onClick={currentStep === 0 ? onCancel : handleBack}
                        className="flex items-center gap-3 px-8 py-4 font-bold text-slate-500 hover:text-slate-900 hover:bg-white rounded-2xl transition-all group"
                        disabled={isSaving}
                    >
                        {currentStep === 0 ? (
                            <>
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                Cancelar Criação
                            </>
                        ) : (
                            <>
                                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Etapa Anterior
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-4">
                        {currentStep < STEPS.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 group"
                            >
                                Próxima Etapa
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-12 py-4 rounded-2xl font-bold hover:shadow-[0_10px_30px_-10px_rgba(192,38,211,0.5)] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Finalizar e Enviar para Admin
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}} />
        </div>
    );
};
