import React, { useMemo } from 'react';
import { Clock, AlertCircle, CheckCircle2, FileText, ArrowRight, Activity, Calendar, X } from 'lucide-react';
import { Order, UserRole, BlockType } from '../../types';

interface TasksDashboardProps {
    orders: Order[];
    userRole: UserRole;
    userName: string;
    onViewOrder: (order: Order) => void;
    onViewAll: (type: BlockType) => void;
    onClose?: () => void;
}

export const TasksDashboard: React.FC<TasksDashboardProps> = ({ orders, userRole, userName, onViewOrder, onViewAll, onClose }) => {

    // Derive Pending Tasks from Orders
    const pendingTasks = useMemo(() => {
        // PER USER REQUEST: Clear tasks for now, keep functionality only.
        return [];
        /* Original logic preserved for reference:
        return orders.filter(o => {
            if (o.status === 'pending' || o.status === 'awaiting_approval') return true;
            return false;
        }).slice(0, 5);
        */
    }, [orders]);

    const stats = useMemo(() => {
        // PER USER REQUEST: Zero stats for now.
        return {
            pending: 0,
            urgent: 0,
            approval: 0
        };
    }, [orders]);

    return (
        <div className="w-full h-full flex flex-col bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden relative">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/50 flex items-center justify-between shrink-0 bg-white/30">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        Suas Tarefas
                    </h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Visão geral de pendências e ações prioritárias</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-2 shadow-sm">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-bold text-amber-700">{stats.pending} Pendentes</span>
                        </div>
                        {(stats.urgent > 0) && (
                            <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2 shadow-sm animate-pulse-subtle">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span className="text-xs font-bold text-rose-700">{stats.urgent} Urgentes</span>
                            </div>
                        )}
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors ml-1"
                            title="Fechar Tarefas"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                {pendingTasks.length > 0 ? (
                    pendingTasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => onViewOrder(task)}
                            className="group relative p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer flex items-center gap-4"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner 
                                ${task.blockType === 'oficio' ? 'bg-indigo-50 text-indigo-600' :
                                    task.blockType === 'compras' ? 'bg-emerald-50 text-emerald-600' :
                                        task.blockType === 'licitacao' ? 'bg-blue-50 text-blue-600' :
                                            'bg-slate-50 text-slate-600'
                                }`
                            }>
                                <FileText className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {task.blockType?.toUpperCase() || 'DOCUMENTO'} • {task.protocol || 'S/N'}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
                                    {task.title || 'Sem Título'}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                    {task.status === 'pending' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Pendente</span>}
                                    {task.status === 'awaiting_approval' && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Aprovação</span>}
                                    {task.documentSnapshot?.content?.priority === 'Urgência' && (
                                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Urgente
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-8 h-8 text-green-500/50" />
                        </div>
                        <h4 className="text-slate-900 font-bold mb-1">Tudo em dia!</h4>
                        <p className="text-sm text-slate-500 max-w-[200px]">Você não tem tarefas pendentes no momento.</p>
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-white/50 bg-white/30 shrink-0">
                <button
                    onClick={() => onViewAll('oficio')} // Default to Oficio history for "See All" for now
                    className="w-full py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                    Ver Todo o Histórico <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
