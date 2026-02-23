import React, { useState, useEffect, useRef } from 'react';
import { User, Sector, Projeto, ProjetoHistory, ProjetoStatus } from '../../types';
import { getProjetoById, getProjetoHistory, forwardProjeto, addProjetoMessage } from '../../services/projetosService';
import { ArrowLeft, Send, Paperclip, MessageSquare, CornerUpRight, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../services/supabaseClient';

interface ProjetoDetailsProps {
    projetoId: string;
    userId: string;
    userRole: string;
    currentUserSector?: string;
    users: User[];
    sectors: Sector[];
    onBack: () => void;
}

export const ProjetoDetails: React.FC<ProjetoDetailsProps> = ({
    projetoId,
    userId,
    userRole,
    currentUserSector,
    users,
    sectors,
    onBack
}) => {
    const { addNotification } = useNotification();
    const [projeto, setProjeto] = useState<Projeto | null>(null);
    const [history, setHistory] = useState<ProjetoHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [messageDraft, setMessageDraft] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Forwarding state
    const [showForwardForm, setShowForwardForm] = useState(false);
    const [forwardTargetUser, setForwardTargetUser] = useState('');
    const [forwardTargetSector, setForwardTargetSector] = useState('');
    const [forwardStatus, setForwardStatus] = useState<ProjetoStatus | ''>('');
    const [forwardMessage, setForwardMessage] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        const [proj, hist] = await Promise.all([
            getProjetoById(projetoId),
            getProjetoHistory(projetoId)
        ]);
        setProjeto(proj);
        setHistory(hist);
        setIsLoading(false);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        loadData();
    }, [projetoId]);

    // Realtime changes listener for history and project updates
    useEffect(() => {
        const histChannel = supabase.channel(`public:projeto_history:${projetoId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'projeto_history', filter: `project_id=eq.${projetoId}` },
                (payload) => {
                    const newHist = payload.new as any;
                    setHistory(prev => [...prev, newHist]);
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            ).subscribe();

        const projChannel = supabase.channel(`public:projetos:${projetoId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projetos', filter: `id=eq.${projetoId}` },
                (payload) => {
                    setProjeto(payload.new as Projeto);
                }
            ).subscribe();

        return () => {
            supabase.removeChannel(histChannel);
            supabase.removeChannel(projChannel);
        };
    }, [projetoId]);

    if (isLoading || !projeto) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="w-10 h-10 border-4 border-fuchsia-600 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentOwner = users.find(u => u.id === projeto.current_owner_id);
    const currentSector = sectors.find(s => s.id === projeto.current_sector_id);
    const creator = users.find(u => u.id === projeto.created_by);
    const responsible = users.find(u => u.id === projeto.responsible_id);

    const isCurrentOwner = projeto.current_owner_id === userId;
    const isCurrentSector = projeto.current_sector_id === currentUserSector;
    const canInteract = userRole === 'admin' || isCurrentOwner || isCurrentSector;

    const handleSendMessage = async () => {
        if (!messageDraft.trim()) return;
        setIsSubmitting(true);
        try {
            await addProjetoMessage(projetoId, userId, currentUserSector, messageDraft.trim());
            setMessageDraft('');
            addNotification('Mensagem enviada com sucesso.', 'success');
        } catch (error) {
            addNotification('Erro ao enviar mensagem.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForward = async () => {
        if (!forwardTargetUser && !forwardTargetSector && !forwardStatus) {
            addNotification('Preencha o destino ou novo status.', 'info');
            return;
        }

        setIsSubmitting(true);
        try {
            const finalStatus = forwardStatus ? forwardStatus as ProjetoStatus : undefined;
            await forwardProjeto(
                projetoId,
                userId,
                currentUserSector,
                forwardTargetUser || null,
                forwardTargetSector || null,
                forwardMessage.trim() || 'Projeto movimentado.',
                finalStatus
            );

            setShowForwardForm(false);
            setForwardTargetUser('');
            setForwardTargetSector('');
            setForwardStatus('');
            setForwardMessage('');
            addNotification('Projeto encaminhado com sucesso!', 'success');
        } catch (error) {
            addNotification('Erro ao encaminhar projeto.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fade-in flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
            {/* Left Side: Details & Actions */}
            <div className="w-full md:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2 pb-6 custom-scrollbar">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 font-bold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar aos Projetos
                    </button>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">{projeto.name}</h1>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Atual</p>
                        <div className="inline-flex px-3 py-1.5 rounded-lg text-sm font-bold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                            {projeto.status}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Setor Atual / Posse</p>
                        <div className="text-slate-800 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                            <CornerUpRight className="w-4 h-4 text-slate-400" />
                            {currentOwner?.name ? `${currentOwner.name} (${currentSector?.name || 'Sem setor'})` : (currentSector?.name || 'Qualquer usuário do setor')}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        Informações do Projeto
                    </h3>

                    <div className="space-y-3 pt-2">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável</p>
                            <p className="text-sm font-semibold text-slate-700">{responsible?.name || 'Não definido'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Criador</p>
                            <p className="text-sm font-semibold text-slate-700">{creator?.name || 'Sistema'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Início</p>
                                <p className="text-sm font-semibold text-slate-700">{projeto.start_date ? new Date(projeto.start_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Fim</p>
                                <p className="text-sm font-semibold text-slate-700">{projeto.end_date ? new Date(projeto.end_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição</p>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{projeto.description || 'Sem descrição.'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: History & Chat */}
            <div className="w-full md:w-2/3 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center z-10">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-fuchsia-600" />
                        Histórico e Atualizações
                    </h3>

                    {canInteract && !showForwardForm && (
                        <button
                            onClick={() => setShowForwardForm(true)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                        >
                            <CornerUpRight className="w-4 h-4" />
                            Encaminhar / Finalizar
                        </button>
                    )}
                </div>

                {/* Forwarding Form Overlay */}
                {showForwardForm && (
                    <div className="absolute top-16 left-0 right-0 z-20 bg-white border-b border-slate-200 p-6 shadow-lg animate-slide-up">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-800">Encaminhar Projeto</h4>
                            <button onClick={() => setShowForwardForm(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">Cancelar</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Para Setor</label>
                                <select
                                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                                    value={forwardTargetSector}
                                    onChange={e => setForwardTargetSector(e.target.value)}
                                >
                                    <option value="">-- Manter ou Escolher Setor --</option>
                                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Ou / Para Usuário Específico</label>
                                <select
                                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                                    value={forwardTargetUser}
                                    onChange={e => setForwardTargetUser(e.target.value)}
                                >
                                    <option value="">-- Todos do setor --</option>
                                    {users.filter(u => forwardTargetSector ? u.sectorId === forwardTargetSector : true).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Alterar Status</label>
                                <select
                                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-fuchsia-500"
                                    value={forwardStatus}
                                    onChange={e => setForwardStatus(e.target.value as ProjetoStatus)}
                                >
                                    <option value="">-- Manter Status Atual --</option>
                                    <option value="Em Andamento">Em Andamento</option>
                                    <option value="Concluído">Concluído</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase">Mensagem de Encaminhamento</label>
                            <textarea
                                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-fuchsia-500 resize-none h-20"
                                placeholder="Motivo do encaminhamento ou instruções..."
                                value={forwardMessage}
                                onChange={e => setForwardMessage(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleForward}
                            disabled={isSubmitting}
                            className="bg-fuchsia-600 text-white w-full py-2.5 rounded-xl font-bold hover:bg-fuchsia-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? 'Enviando...' : 'Confirmar Encaminhamento'}
                        </button>
                    </div>
                )}

                {/* History List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                    {history.map((hist, index) => {
                        const isMe = hist.user_id === userId;
                        const actionUser = users.find(u => u.id === hist.user_id);

                        return (
                            <div key={hist.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="text-[10px] text-slate-400 mb-1 font-bold px-1">
                                    {actionUser?.name || 'Sistema'} • {new Date(hist.created_at || '').toLocaleString('pt-BR')}
                                    <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded uppercase">{hist.action}</span>
                                </div>
                                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${isMe ? 'bg-fuchsia-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{hist.message || '(Sem mensagem)'}</p>

                                    {hist.attachments && hist.attachments.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {hist.attachments.map((att, i) => (
                                                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isMe ? 'bg-fuchsia-700/50' : 'bg-slate-50 border border-slate-100'}`}>
                                                    <Paperclip className="w-3 h-3" />
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:opacity-80 truncate max-w-[200px]">{att.name}</a>
                                                    {att.caption && <span className="text-opacity-80 italic opacity-80">- {att.caption}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box */}
                {canInteract && (
                    <div className="bg-white p-4 border-t border-slate-200">
                        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-fuchsia-500 focus-within:ring-2 focus-within:ring-fuchsia-100 transition-all">
                            <button className="p-3 text-slate-400 hover:text-fuchsia-600 transition-colors hover:bg-fuchsia-50 rounded-xl">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <textarea
                                value={messageDraft}
                                onChange={(e) => setMessageDraft(e.target.value)}
                                placeholder="Digite uma nova atualização para o projeto..."
                                className="flex-1 bg-transparent resize-none max-h-32 min-h-[44px] py-3 px-1 text-sm outline-none text-slate-700 custom-scrollbar"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isSubmitting || !messageDraft.trim()}
                                className="p-3 bg-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden md:block"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
                {!canInteract && (
                    <div className="bg-slate-100 p-4 border-t border-slate-200 text-center">
                        <p className="text-sm font-bold text-slate-500 flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Você não tem permissão para interagir ou o projeto não está na sua posse.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
