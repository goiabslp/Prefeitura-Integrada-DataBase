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
    LayoutDashboard,
    Plus,
    Target,
    ClipboardList,
    Clock,
    CheckCircle
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
    { title: 'Descrição', icon: FileText },
    { title: 'Objetivos', icon: Target },
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
    const [objectives, setObjectives] = useState<{
        id: string;
        name: string;
        responsible: string;
        details: string;
        status: 'Não Iniciado' | 'Em Andamento' | 'Concluído';
    }[]>([]);

    // Objective Modal State
    const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
    const [newObjective, setNewObjective] = useState({
        name: '',
        responsible: '',
        details: ''
    });

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
                created_by: userId,
                objectives: objectives as any // TypeScript might need cast if types don't match perfectly
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
                        className="flex flex-col h-full"
                    >
                        <div className="space-y-4 flex flex-col h-full">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 flex-shrink-0">
                                <FileText className="w-4 h-4 text-fuchsia-500" />
                                Descrição do Projeto
                            </label>
                            <div className="flex-1 relative min-h-[400px]">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descreva detalhadamente o que este projeto pretende alcançar, as etapas principais e qualquer informação relevante para a análise inicial..."
                                    className="absolute inset-0 w-full h-full bg-slate-50 border-2 border-slate-200 rounded-3xl px-6 py-5 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all resize-none font-medium leading-relaxed shadow-sm custom-scrollbar"
                                />
                            </div>
                            <p className="text-xs text-slate-400 italic flex-shrink-0">Uma descrição clara ajuda o administrador a tomar decisões mais rápidas.</p>
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col h-full space-y-6"
                    >
                        <div className="flex items-center justify-between flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Objetivos do Projeto</h3>
                                <p className="text-sm text-slate-500 font-medium">Defina metas claras e responsáveis para o sucesso da execução.</p>
                            </div>
                            <button
                                onClick={() => setIsObjectiveModalOpen(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-6 py-3 rounded-2xl text-sm font-black hover:shadow-lg hover:shadow-fuchsia-200 transition-all active:scale-95 group"
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                Adicionar Objetivo
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden bg-slate-50/50 rounded-[32px] border-2 border-slate-100 p-4">
                            {objectives.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-60">
                                    <div className="p-8 bg-white rounded-full shadow-sm">
                                        <Target className="w-16 h-16" />
                                    </div>
                                    <p className="font-bold text-lg">Nenhum objetivo definido</p>
                                    <p className="text-sm max-w-xs text-center">Clique no botão acima para começar a estruturar os objetivos deste projeto.</p>
                                </div>
                            ) : (
                                <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-1.5">
                                    {objectives.map((obj) => (
                                        <div key={obj.id} className="bg-white border border-slate-100 p-2.5 px-5 rounded-xl shadow-sm hover:border-fuchsia-200 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-fuchsia-100/50 flex items-center justify-center text-fuchsia-500 flex-shrink-0">
                                                    <ClipboardList className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-black text-slate-800 text-sm truncate leading-tight">{obj.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none mt-1">
                                                        <span className="opacity-50">Respon:</span>
                                                        <span className="text-slate-600 truncate max-w-[150px]">{obj.responsible}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${obj.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600' :
                                                    obj.status === 'Em Andamento' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {obj.status === 'Concluído' && <CheckCircle className="w-2.5 h-2.5" />}
                                                    {obj.status === 'Em Andamento' && <Clock className="w-2.5 h-2.5" />}
                                                    {obj.status === 'Não Iniciado' && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                                                    {obj.status}
                                                </div>

                                                <button
                                                    onClick={() => setObjectives(prev => prev.filter(o => o.id !== obj.id))}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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
            case 4:
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
        <div className="w-full min-h-screen bg-slate-50/50 flex flex-col items-center py-8 px-4 animate-fade-in">
            {/* Form Container */}
            <div className="w-full max-w-7xl bg-white rounded-[40px] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col min-h-[85vh] overflow-hidden relative">

                {/* Compact Header: Back Button + Title + Stepper on same line */}
                <div className="px-8 py-6 border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        {/* Botão Voltar */}
                        <button
                            onClick={onCancel}
                            className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-bold uppercase tracking-widest group text-xs p-2 hover:bg-slate-50 rounded-xl -ml-2"
                            title="Voltar para Projetos"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Voltar</span>
                        </button>

                        <div className="h-8 w-px bg-slate-100 hidden md:block"></div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-2xl shadow-lg shadow-fuchsia-100">
                                <LayoutDashboard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">Novo Projeto</h1>
                                <p className="text-slate-400 font-bold uppercase text-[8px] tracking-[0.2em] leading-none">Criação & Validação</p>
                            </div>
                        </div>
                    </div>

                    {/* Stepper on the same line */}
                    <div className="flex-1 flex items-center justify-center max-w-3xl relative px-4">
                        {/* Progress Line */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0 mx-4" style={{ width: 'calc(100% - 32px)' }}>
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
                                <div key={index} className="flex-1 flex flex-col items-center relative z-10 group">
                                    <div
                                        onClick={() => index < currentStep ? setCurrentStep(index) : null}
                                        className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm transform
                                            ${isActive ? 'bg-slate-900 text-white scale-110 shadow-md' :
                                                isCompleted ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white cursor-pointer hover:scale-105' :
                                                    'bg-white text-slate-300 border border-slate-100'}
                                        `}
                                    >
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <span className={`absolute -bottom-4 text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-500 ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Content Area - Maximized */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
                    <div className="max-w-5xl mx-auto h-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* EXTERNAL FOOTER: Navigation Buttons Outside the Form Container */}
            <div className="w-full max-w-7xl mt-6 flex items-center justify-between px-4 z-20 pb-12">
                <button
                    onClick={currentStep === 0 ? onCancel : handleBack}
                    className="flex items-center gap-3 px-8 py-4 font-bold text-slate-500 hover:text-slate-900 bg-white/50 hover:bg-white rounded-2xl transition-all group backdrop-blur-sm shadow-sm"
                    disabled={isSaving}
                >
                    {currentStep === 0 ? (
                        <>
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            Cancelar
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
                            className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 group shadow-lg"
                        >
                            Próxima Etapa
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-12 py-5 rounded-2xl font-bold hover:shadow-[0_20px_40px_-10px_rgba(192,38,211,0.5)] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Finalizar e Enviar
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Objective Modal */}
            <AnimatePresence>
                {isObjectiveModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsObjectiveModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-fuchsia-100 text-fuchsia-600 rounded-2xl">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Novo Objetivo</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Adicionar meta ao roteiro</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsObjectiveModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Objetivo</label>
                                    <input
                                        type="text"
                                        value={newObjective.name}
                                        onChange={(e) => setNewObjective({ ...newObjective, name: e.target.value })}
                                        placeholder="Ex: Definir planta arquitetônica"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Responsável pela execução</label>
                                    <input
                                        type="text"
                                        value={newObjective.responsible}
                                        onChange={(e) => setNewObjective({ ...newObjective, responsible: e.target.value })}
                                        placeholder="Ex: Nome da Pessoa ou Setor"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Detalhamento do objetivo</label>
                                    <textarea
                                        value={newObjective.details}
                                        onChange={(e) => setNewObjective({ ...newObjective, details: e.target.value })}
                                        placeholder="Descreva as ações necessárias para concluir este objetivo..."
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-4 text-slate-700 outline-none focus:border-fuchsia-500 focus:bg-white transition-all min-h-[140px] resize-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="p-8 pt-0 flex gap-4">
                                <button
                                    onClick={() => setIsObjectiveModalOpen(false)}
                                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={!newObjective.name || !newObjective.responsible}
                                    onClick={() => {
                                        setObjectives(prev => [...prev, {
                                            id: crypto.randomUUID(),
                                            name: newObjective.name,
                                            responsible: newObjective.responsible,
                                            details: newObjective.details,
                                            status: 'Não Iniciado'
                                        }]);
                                        setNewObjective({ name: '', responsible: '', details: '' });
                                        setIsObjectiveModalOpen(false);
                                    }}
                                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Adicionar à Lista
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
