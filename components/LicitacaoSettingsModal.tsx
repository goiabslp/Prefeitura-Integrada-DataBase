import React, { useEffect, useState } from 'react';
import { X, Save, Calendar, FileText, Hash, Tag, ChevronDown } from 'lucide-react';
import { AppState } from '../types';

interface LicitacaoSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    state: AppState;
    currentUser?: { name: string; sector: string; type?: string; role?: string }; // Added type/role
    persons: { id: string; name: string; sectorId?: string; jobId?: string; }[];
    sectors: { id: string; name: string; }[];
    onUpdate: (updates: Partial<AppState['content']>) => void;
    onCancel?: () => void; // Added onCancel prop
}

const useSmartPosition = (isOpen: boolean, ref: React.RefObject<HTMLDivElement>) => {
    const [position, setPosition] = useState<'bottom' | 'top'>('bottom');

    useEffect(() => {
        if (isOpen && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            // If space below is less than 280px (approx max-h-60 + padding) AND space above is larger
            if (spaceBelow < 280 && spaceAbove > spaceBelow) {
                setPosition('top');
            } else {
                setPosition('bottom');
            }
        }
    }, [isOpen]);

    return position;
};

export const LicitacaoSettingsModal: React.FC<LicitacaoSettingsModalProps> = ({
    isOpen,
    onClose,
    state,
    nextProtocolNumber,
    currentUser,
    persons = [],
    sectors = [],
    onUpdate,
    onCancel
}) => {
    const isLicitationUser = currentUser?.type === 'licitacao' || currentUser?.role === 'licitacao';
    // Solicitante is always unlocked (as per request "Apenas a opção: 'Solicitante' desbloqueada" implies others are locked by default unless user is special)
    // "Somente usuarios do tipo: "Licitação" poderão editar os dados dos outros campos"
    const canEditOtherFields = isLicitationUser;

    const [formData, setFormData] = useState({
        title: '',
        protocol: '',
        processType: '',
        completionForecast: '',
        requesterName: '',
        requesterSector: ''
    });
    const [openProcessType, setOpenProcessType] = useState(false);
    const [openRequester, setOpenRequester] = useState(false);
    const [openCompletionForecast, setOpenCompletionForecast] = useState(false);

    const processTypeRef = React.useRef<HTMLDivElement>(null);
    const requesterRef = React.useRef<HTMLDivElement>(null);
    const completionRef = React.useRef<HTMLDivElement>(null);

    const processTypePos = useSmartPosition(openProcessType, processTypeRef);
    const requesterPos = useSmartPosition(openRequester, requesterRef);
    const completionPos = useSmartPosition(openCompletionForecast, completionRef);

    useEffect(() => {
        if (isOpen) {
            // Auto-suggest protocol if empty
            let suggestProtocol = state.content.protocol || '';
            if (!suggestProtocol && nextProtocolNumber) {
                // Only auto-suggest if editable or if it's a new process we might still want to show suggestion even if read-only? 
                // Actually if it's read-only for non-licitacao, maybe we shouldn't auto-fill? 
                // User said "Apenas a opção: 'Solicitante' desbloqueada", implying others are visible but locked. 
                // We should probably still auto-fill for display purposes.
                const currentYear = new Date().getFullYear();
                suggestProtocol = `Nº ${nextProtocolNumber.toString().padStart(3, '0')}/${currentYear}`;
            }

            // Auto-suggest requester if empty (from currentUser)
            let suggestRequesterName = state.content.requesterName || '';
            let suggestRequesterSector = state.content.requesterSector || '';

            if (!suggestRequesterName && currentUser?.name) {
                suggestRequesterName = currentUser.name;
            }
            // For requesterSector, we might need to find the sector name from the current user's sector ID if provided, or just use what's passed
            // currentUser.sector is likely the name strings based on previous code usage
            if (!suggestRequesterSector && currentUser?.sector) {
                suggestRequesterSector = currentUser.sector;
            }

            setFormData({
                title: state.content.title || '',
                protocol: suggestProtocol,
                processType: state.content.processType || '',
                completionForecast: state.content.completionForecast || '',
                requesterName: suggestRequesterName,
                requesterSector: suggestRequesterSector
            });
        }
    }, [isOpen, state.content, nextProtocolNumber, currentUser]);

    const handleSave = () => {
        onUpdate({
            title: formData.title,
            protocol: formData.protocol,
            processType: formData.processType,
            completionForecast: formData.completionForecast,
            requesterName: formData.requesterName,
            requesterSector: formData.requesterSector
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Hash className="w-5 h-5" />
                        </div>
                        Configurações do Processo
                    </h3>
                    <button
                        onClick={onCancel || onClose}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Cancelar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Objeto */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Objeto do Processo
                        </label>
                        <textarea
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            readOnly={!canEditOtherFields}
                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 min-h-[80px] resize-none ${!canEditOtherFields ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
                            placeholder="Descreva o objeto do processo..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Protocolo */}
                        <div className="space-y-2 md:col-span-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5" />
                                Número do Processo
                            </label>
                            <input
                                type="text"
                                value={formData.protocol}
                                onChange={e => setFormData(prev => ({ ...prev, protocol: e.target.value }))}
                                readOnly={!canEditOtherFields}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300 ${!canEditOtherFields ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
                                placeholder="000/2024"
                            />
                        </div>

                        {/* Tipo */}
                        <div className="space-y-2 md:col-span-8">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                Tipo de Processo
                            </label>
                            <div className="relative" ref={processTypeRef}>
                                <button
                                    type="button"
                                    onClick={() => canEditOtherFields && setOpenProcessType(!openProcessType)}
                                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-left flex items-center justify-between transition-all ${openProcessType ? 'border-blue-400 ring-4 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                                        } ${!canEditOtherFields ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
                                >
                                    <span className={formData.processType ? 'text-slate-800' : 'text-slate-400'}>
                                        {formData.processType || 'Selecione o tipo...'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openProcessType ? 'rotate-180' : ''}`} />
                                </button>

                                {openProcessType && canEditOtherFields && (
                                    <div className={`absolute z-50 w-full bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-fade-in-down max-h-60 overflow-y-auto custom-scrollbar ${processTypePos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                        {['Pregão', 'Concorrência', 'Dispensa', 'Inexigibilidade', 'Concurso', 'Leilão'].map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, processType: option }));
                                                    setOpenProcessType(false);
                                                }}
                                                className={`w-full px-4 py-3 text-sm text-left transition-colors font-medium flex items-center justify-between ${formData.processType === option ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                            >
                                                {option}
                                                {formData.processType === option && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Solicitante */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                Solicitante
                            </label>
                            <div className="relative" ref={requesterRef}>
                                <button
                                    type="button"
                                    onClick={() => setOpenRequester(!openRequester)}
                                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-left flex items-center justify-between transition-all ${openRequester ? 'border-blue-400 ring-4 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <span className={formData.requesterName ? 'text-slate-800' : 'text-slate-400'}>
                                        {formData.requesterName || 'Selecione o solicitante...'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openRequester ? 'rotate-180' : ''}`} />
                                </button>

                                {openRequester && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setOpenRequester(false)}
                                        />
                                        <div className={`absolute z-50 w-full bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-fade-in-down max-h-60 overflow-y-auto custom-scrollbar ${requesterPos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                            {persons.map((person) => (
                                                <button
                                                    key={person.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const sector = sectors.find(s => s.id === person.sectorId);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            requesterName: person.name,
                                                            requesterSector: sector ? sector.name : prev.requesterSector
                                                        }));
                                                        setOpenRequester(false);
                                                    }}
                                                    className={`w-full px-4 py-3 text-sm text-left transition-colors font-medium flex items-center justify-between ${formData.requesterName === person.name ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                                >
                                                    {person.name}
                                                    {formData.requesterName === person.name && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                </button>
                                            ))}
                                            {persons.length === 0 && (
                                                <div className="px-4 py-3 text-sm text-slate-400 text-center">Nenhuma pessoa cadastrada</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Setor Solicitante */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                Setor Solicitante
                            </label>
                            <input
                                type="text"
                                value={formData.requesterSector}
                                readOnly
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 outline-none cursor-not-allowed transition-all placeholder:text-slate-400"
                                placeholder="Setor do solicitante"
                            />
                        </div>
                    </div>

                    {/* Previsão */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Previsão de Conclusão e Vigência
                        </label>
                        <div className="relative" ref={completionRef}>
                            <button
                                type="button"
                                onClick={() => canEditOtherFields && setOpenCompletionForecast(!openCompletionForecast)}
                                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-left flex items-center justify-between transition-all ${openCompletionForecast ? 'border-blue-400 ring-4 ring-blue-100' : 'border-slate-200 hover:border-slate-300'} ${!canEditOtherFields ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
                            >
                                <span className={formData.completionForecast ? 'text-slate-800' : 'text-slate-400'}>
                                    {formData.completionForecast || 'Selecione a previsão...'}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openCompletionForecast ? 'rotate-180' : ''}`} />
                            </button>

                            {openCompletionForecast && canEditOtherFields && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOpenCompletionForecast(false)}
                                    />
                                    <div className={`absolute z-50 w-full bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-fade-in-down max-h-60 overflow-y-auto custom-scrollbar ${completionPos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                                        {['01 Dia', '02 Dias', '03 Dias', '05 Dias', '07 Dias', '10 Dias', '15 Dias', '30 Dias', '45 Dias', '60 Dias'].map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, completionForecast: option }));
                                                    setOpenCompletionForecast(false);
                                                }}
                                                className={`w-full px-4 py-3 text-sm text-left transition-colors font-medium flex items-center justify-between ${formData.completionForecast === option ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                            >
                                                {option}
                                                {formData.completionForecast === option && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel || onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                    >
                        <Save className="w-4 h-4" />
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};
