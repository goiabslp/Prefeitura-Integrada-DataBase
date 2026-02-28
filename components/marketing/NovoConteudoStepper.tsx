import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { ProcessStepper } from '../common/ProcessStepper';
import { TwoFactorModal } from '../TwoFactorModal';
import { ModernSelect } from '../common/ModernSelect';
import { Loader2, Plus, Trash2, UploadCloud, File, Image as ImageIcon, Camera, Mic, Video, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Sector } from '../../types';

interface NovoConteudoStepperProps {
    onNavigate: (view: string) => void;
    onBack: () => void;
    userId: string;
    userName: string;
    sectors: Sector[];
}

interface ContentItem {
    id: string;
    type: string;
    sector: string;
    date: string;
    time: string;
    location: string;
}

export const NovoConteudoStepper: React.FC<NovoConteudoStepperProps> = ({
    onNavigate,
    onBack,
    userId,
    userName,
    sectors
}) => {
    const STEPS = ['Informações', 'Descrição', 'Conteúdo', 'Anexos', 'Assinatura'];
    const [currentStep, setCurrentStep] = useState(0);
    const [maxCompletedStep, setMaxCompletedStep] = useState(-1);

    // Form State
    const [requesterSector, setRequesterSector] = useState('');
    const [description, setDescription] = useState('');
    const [contents, setContents] = useState<ContentItem[]>([{ id: Date.now().toString(), type: '', sector: '', date: '', time: '', location: '' }]);
    const [files, setFiles] = useState<File[]>([]);

    // Auth & Submit State
    const [userSecret, setUserSecret] = useState<string | null>(null);
    const [userSecret2, setUserSecret2] = useState<string | null>(null);
    const [is2FAOpen, setIs2FAOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load user sector and 2FA secrets
    useEffect(() => {
        const fetchUserData = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('sector, two_factor_secret, two_factor_secret_2')
                .eq('id', userId)
                .single();

            if (data) {
                setRequesterSector(data.sector || '');
                setUserSecret(data.two_factor_secret);
                setUserSecret2(data.two_factor_secret_2);
            }
        };
        fetchUserData();
    }, [userId]);

    const handleNext = () => {
        // Validation per step
        if (currentStep === 0 && !requesterSector) return alert('Setor do solicitante não definido.');
        if (currentStep === 1 && description.trim().length < 10) return alert('A descrição deve ter ao menos 10 caracteres.');
        if (currentStep === 2) {
            const hasInvalidContent = contents.some(c => !c.type || !c.sector || !c.date);
            if (hasInvalidContent) return alert('Preencha os campos obrigatórios de todos os itens de conteúdo (Tipo, Setor e Data).');
        }

        if (currentStep > maxCompletedStep) {
            setMaxCompletedStep(currentStep);
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const addContent = () => {
        setContents([...contents, { id: Date.now().toString(), type: '', sector: '', date: '', time: '', location: '' }]);
    };

    const removeContent = (id: string) => {
        if (contents.length > 1) {
            setContents(contents.filter(c => c.id !== id));
        }
    };

    const updateContent = (id: string, field: keyof ContentItem, value: string) => {
        setContents(contents.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles([...files, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const handleFinalizeClick = () => {
        if (!userSecret && !userSecret2) {
            alert('Você não tem autenticação de dois fatores configurada. Entre em contato com o suporte.');
            // Or allow bypass? Based on requirements: "Validação 2FA obrigatória"
            return;
        }
        setIs2FAOpen(true);
    };

    const submitOrder = async () => {
        setIs2FAOpen(false);
        setSubmitting(true);

        try {
            // 1. Create Request
            const protocol = `MKT-${new Date().getFullYear()}${(Math.random() * 9000 + 1000).toFixed(0)}`;
            const { data: requestDef, error: reqError } = await supabase
                .from('marketing_requests')
                .insert([{
                    protocol,
                    requester_name: userName,
                    requester_sector: requesterSector,
                    description,
                    user_id: userId,
                    status: 'Em Análise',
                    digital_signature: { enabled: true, date: new Date().toISOString() }
                }])
                .select()
                .single();

            if (reqError) throw reqError;

            // 2. Create Contents
            const contentInserts = contents.map(c => ({
                request_id: requestDef.id,
                content_type: c.type,
                content_sector: c.sector,
                event_date: c.date || null,
                event_time: c.time || null,
                event_location: c.location
            }));

            const { error: contentError } = await supabase
                .from('marketing_contents')
                .insert(contentInserts);

            if (contentError) throw contentError;

            // 3. Upload Files
            for (const file of files) {
                const ext = file.name.split('.').pop();
                const path = `${requestDef.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                await supabase.storage.from('marketing_attachments').upload(path, file);
            }

            alert('Solicitação finalizada com sucesso!');
            onNavigate(''); // Go back to dashboard

        } catch (error) {
            console.error("Erro ao enviar pedido:", error);
            alert("Ocorreu um erro ao finalizar o pedido de marketing.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-2.5 flex items-center shadow-sm z-10 shrink-0 gap-3 md:gap-4 overflow-hidden">
                <button
                    onClick={onBack}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-200 shrink-0"
                    title="Sair"
                >
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                <h1 className="text-base md:text-xl font-black text-slate-800 tracking-tight shrink-0 whitespace-nowrap">
                    <span className="hidden sm:inline">Novo Pedido de Marketing</span>
                    <span className="sm:hidden">Novo Pedido</span>
                </h1>

                <div className="flex-1 min-w-0 pr-2">
                    <div className="w-full">
                        <ProcessStepper
                            compact
                            steps={STEPS}
                            currentStep={currentStep}
                            maxCompletedStep={maxCompletedStep}
                            onStepClick={(i) => {
                                if (i <= maxCompletedStep + 1) setCurrentStep(i);
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {currentStep < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={submitting}
                            className="px-4 md:px-6 py-1.5 md:py-2 bg-indigo-600 text-xs md:text-sm text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow shadow-indigo-200 transition-all outline-none whitespace-nowrap"
                        >
                            Próxima Etapa
                        </button>
                    ) : (
                        <button
                            onClick={handleFinalizeClick}
                            disabled={submitting}
                            className="px-4 md:px-6 py-1.5 md:py-2 bg-emerald-600 text-xs md:text-sm text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow shadow-emerald-200 transition-all outline-none flex items-center gap-2 whitespace-nowrap"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : 'Assinar / Enviar'}
                        </button>
                    )}
                </div>
            </header>

            {/* Stepper Content Body */}
            <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col min-h-0">
                <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col flex-1 min-h-0">

                    {currentStep === 0 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-xl font-bold text-slate-800">1. Informações Gerais</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Solicitante</label>
                                    <input type="text" value={userName} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 cursor-not-allowed outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Setor do Solicitante</label>
                                    <input type="text" value={requesterSector} readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 cursor-not-allowed outline-none" placeholder="Aguardando carregamento..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-xl font-bold text-slate-800">2. Descrição da Demanda</h2>
                            <p className="text-sm text-slate-500 mb-4">Descreva detalhadamente qual é a necessidade da sua solicitação de marketing.</p>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full h-48 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow"
                                placeholder="Digite aqui a descrição do pedido..."
                            />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-0">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 md:pb-3 mb-4 shrink-0">
                                <h2 className="text-lg md:text-xl font-bold text-slate-800">3. Conteúdos Necessários</h2>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] md:text-xs text-amber-500 font-bold ${contents.length >= 3 ? 'block' :
                                        contents.length === 2 ? 'block lg:hidden' :
                                            contents.length === 1 ? 'block md:hidden' : 'hidden'
                                        }`}>
                                        Limite visual atingido
                                    </span>
                                    <button
                                        onClick={addContent}
                                        className={`items-center gap-2 px-3 auto py-1.5 md:py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors text-xs md:text-sm ${contents.length >= 3 ? '!hidden' :
                                            contents.length === 2 ? 'hidden lg:flex' :
                                                contents.length === 1 ? 'hidden md:flex' : 'flex'
                                            }`}
                                    >
                                        <Plus className="w-4 h-4" /> Adicionar Item
                                    </button>
                                </div>
                            </div>

                            <div className={`flex-1 overflow-hidden grid gap-3 md:gap-4 content-start ${contents.length === 1 ? 'grid-cols-1' :
                                contents.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
                                }`}>
                                {contents.map((item, index) => (
                                    <div key={item.id} className="p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group flex flex-col gap-3 min-h-0 shrink-0">
                                        <div className="flex items-center justify-between shrink-0">
                                            <h4 className="font-bold text-slate-600 text-sm">Item {index + 1}</h4>
                                            <button
                                                onClick={() => removeContent(item.id)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 hover:bg-white rounded-lg z-10"
                                                title="Remover item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-3 flex-1 min-h-0">
                                            <div>
                                                <ModernSelect
                                                    label="Tipo de Conteúdo *"
                                                    value={item.type}
                                                    onChange={v => updateContent(item.id, 'type', v)}
                                                    options={[
                                                        { value: 'Imagem', label: 'Imagem (Arte)' },
                                                        { value: 'Vídeo', label: 'Vídeo' },
                                                        { value: 'Voz', label: 'Voz/Locução' },
                                                        { value: 'Cobertura', label: 'Cobertura' },
                                                        { value: 'Outros', label: 'Outros' }
                                                    ]}
                                                />
                                            </div>
                                            <div className="relative" style={{ zIndex: 50 - index }}>
                                                <ModernSelect
                                                    label="Setor Alvo *"
                                                    searchable
                                                    value={item.sector}
                                                    onChange={v => updateContent(item.id, 'sector', v)}
                                                    options={sectors.map(s => ({ value: s.name, label: s.name }))}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Data do Evento *</label>
                                                    <input type="date" value={item.date} onChange={e => updateContent(item.id, 'date', e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Hora do Evento</label>
                                                    <input type="time" value={item.time} onChange={e => updateContent(item.id, 'time', e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Local do Evento (Opcional)</label>
                                                <input type="text" value={item.location} onChange={e => updateContent(item.id, 'location', e.target.value)} placeholder="Ex: Praça principal..." className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-0">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 md:pb-4 mb-4 shrink-0">
                                <h2 className="text-lg md:text-xl font-bold text-slate-800">4. Anexos Adicionais</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-colors shrink-0">
                                    <UploadCloud className="w-10 h-10 text-indigo-400 mb-3" />
                                    <h3 className="text-base font-bold text-slate-700 mb-1">Arraste seus arquivos aqui</h3>
                                    <p className="text-xs text-slate-500 mb-4">PDF, Docx, Jpeg, Png ou Mp4 (Max 10MB)</p>

                                    <label className="px-5 py-2 md:px-6 md:py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm">
                                        Selecionar Arquivos
                                        <input type="file" multiple onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>

                                {files.length > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-3 md:p-4 border border-slate-200 shrink-0">
                                        <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Arquivos Selecionados</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {files.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                            {file.type.includes('image') ? <ImageIcon size={16} /> : file.type.includes('video') ? <Video size={16} /> : <File size={16} />}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                                                            <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeFile(idx)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-0">
                            <div className="text-center pb-4 md:pb-6 border-b border-slate-100 max-w-sm w-full mx-auto shrink-0">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600 ring-8 ring-emerald-50 shrink-0">
                                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-2">Quase lá!</h2>
                                <p className="text-xs md:text-sm text-slate-500">Sua solicitação está pronta para ser enviada. Assine digitalmente para finalizar.</p>
                            </div>

                            <div className="bg-amber-50 rounded-xl p-3 md:p-5 border border-amber-200 w-full max-w-sm mx-auto mt-4 shrink-0">
                                <h3 className="text-xs md:text-sm font-bold text-amber-800 mb-1">Atenção ao assinar:</h3>
                                <p className="text-[10px] md:text-xs text-amber-700">O pedido entrará em status <strong>Em Análise</strong> automaticamente e não poderá ser alterado.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* 2FA Modal Integration */}
            <TwoFactorModal
                isOpen={is2FAOpen}
                onClose={() => setIs2FAOpen(false)}
                onConfirm={submitOrder}
                secret={userSecret || ''}
                secret2={userSecret2 || ''}
                signatureName={userName}
            />
        </div>
    );
};
