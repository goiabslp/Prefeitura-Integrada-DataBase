import React from 'react';
import { X, Clock, User, FileText, Info, CheckCircle2, AlertCircle, Hash, Calendar, ArrowRight, Activity, Send, ShoppingCart, Wallet, Gavel } from 'lucide-react';
import { Order, BlockType } from '../../types';

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Order | null;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, task }) => {
    if (!task || !isOpen) return null;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Pendente', color: 'amber', icon: Clock };
            case 'in_progress': return { label: 'Em Andamento', color: 'blue', icon: Activity };
            case 'approved': return { label: 'Aprovado', color: 'emerald', icon: CheckCircle2 };
            case 'awaiting_approval': return { label: 'Em Aprovação', color: 'purple', icon: AlertCircle };
            case 'completed': return { label: 'Concluído', color: 'slate', icon: CheckCircle2 };
            default: return { label: status, color: 'slate', icon: Info };
        }
    };

    const getModuleConfig = (type: BlockType) => {
        switch (type) {
            case 'oficio': return { name: "Ofícios", color: 'indigo', icon: FileText };
            case 'compras': return { name: "Compras", color: 'emerald', icon: ShoppingCart };
            case 'diarias': return { name: "Diárias", color: 'amber', icon: Wallet };
            case 'licitacao': return { name: "Licitação", color: 'blue', icon: Gavel };
            default: return { name: "Tarefas", color: 'pink', icon: Activity };
        }
    };

    const status = getStatusStyles(task.status);
    const module = getModuleConfig(task.blockType);
    const StatusIcon = status.icon;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl bg-${module.color}-500 text-white shadow-lg shadow-${module.color}-500/20`}>
                            <module.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Detalhes da Tarefa</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{task.protocol || 'SEM PROTOCOLO'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all active:scale-95 border border-transparent hover:border-slate-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    {/* Title and Status Row */}
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 font-black text-[10px] uppercase tracking-widest bg-${status.color}-50 text-${status.color}-600 border-${status.color}-100`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                            </span>
                            <span className="px-4 py-1.5 rounded-full border-2 border-slate-100 bg-slate-50 font-black text-[10px] text-slate-500 uppercase tracking-widest">
                                {module.name}
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">
                            {task.title}
                        </h3>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Criado por</p>
                                <p className="text-sm font-bold text-slate-700">{task.userName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Data de Criação</p>
                                <p className="text-sm font-bold text-slate-700">{new Date(task.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                <Send className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Atribuído para</p>
                                <p className="text-sm font-bold text-slate-700">{task.assigned_user_id || 'Não atribuído'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-800">
                            <Info className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Descrição da Atividade</h4>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[100px]">
                            <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {task.description || 'Nenhuma descrição detalhada fornecida para esta tarefa.'}
                            </p>
                        </div>
                    </div>

                    {/* Status History / Timeline (Optional Placeholder) */}
                    {task.statusHistory && task.statusHistory.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-800">
                                <Activity className="w-4 h-4 text-pink-500" />
                                <h4 className="text-xs font-black uppercase tracking-widest">Histórico de Status</h4>
                            </div>
                            <div className="space-y-4 ml-2 border-l-2 border-slate-100 pl-6 py-2">
                                {task.statusHistory.map((history, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-slate-200" />
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{history.statusLabel}</span>
                                                <span className="text-[10px] font-medium text-slate-400">{new Date(history.date).toLocaleDateString('pt-BR')} {new Date(history.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável: {history.userName}</p>
                                            {history.justification && (
                                                <p className="text-[11px] font-medium text-slate-500 mt-1 italic italic">"{history.justification}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-95"
                    >
                        Fechar Visualização
                    </button>
                </div>
            </div>
        </div>
    );
};

