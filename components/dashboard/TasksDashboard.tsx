import React, { useMemo, useState } from 'react';
import { Activity, X, FileText, ShoppingCart, Wallet, Gavel, CalendarRange, Droplet, Clock, AlertCircle, CheckCircle2, User, Globe } from 'lucide-react';
import { Order, UserRole, BlockType } from '../../types';

interface TasksDashboardProps {
    orders: Order[];
    userRole: UserRole;
    userName: string;
    userId: string;
    onViewOrder: (order: Order) => void;
    onViewAll: (type: BlockType) => void;
    onClose?: () => void;
}

export const TasksDashboard: React.FC<TasksDashboardProps> = ({
    orders,
    userRole,
    userId,
    onViewOrder,
    onViewAll,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'personal' | 'general'>('personal');

    const filteredTasks = useMemo(() => {
        return orders.filter(order => {
            // Filter by Status (only active tasks usually, or all?) 
            // Let's show everything for now or maybe exclude 'completed'?
            // Assuming 'pending' | 'in_progress' | 'awaiting_approval' are main "tasks".
            const isActive = ['pending', 'in_progress', 'awaiting_approval', 'approved'].includes(order.status);
            if (!isActive) return false;

            if (activeTab === 'personal') {
                return order.assigned_user_id === userId || order.userId === userId;
            } else {
                return order.is_public === true;
            }
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [orders, activeTab, userId]);

    const getIcon = (type: BlockType) => {
        switch (type) {
            case 'oficio': return FileText;
            case 'compras': return ShoppingCart;
            case 'diarias': return Wallet;
            case 'licitacao': return Gavel;
            case 'agendamento': return CalendarRange;
            case 'abastecimento': return Droplet;
            default: return Activity;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'approved': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'awaiting_approval': return 'text-purple-600 bg-purple-50 border-purple-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'in_progress': return 'Em Andamento';
            case 'approved': return 'Aprovado';
            case 'awaiting_approval': return 'Aguardando Aprovação';
            default: return status;
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden relative">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/50">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-600" />
                        Tarefas
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Central de Atividades</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors ml-1"
                        title="Fechar"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="px-8 pt-6 pb-2 shrink-0">
                <div className="flex p-1 bg-slate-100 rounded-xl relative">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all z-10 ${activeTab === 'personal'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Minhas Tarefas
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all z-10 ${activeTab === 'general'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        Geral
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 opacity-60">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-center max-w-[200px]">Nenhuma tarefa encontrada neste filtro.</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => {
                        const Icon = getIcon(task.blockType);
                        return (
                            <button
                                key={task.id}
                                onClick={() => onViewOrder(task)}
                                className="w-full text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all group group/card"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${task.blockType === 'licitacao' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                                                {task.protocol || 'SEM PROTOCOLO'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                                <Clock className="w-3 h-3" />
                                                {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight mb-2 group-hover/card:text-indigo-700 transition-colors">
                                            {task.title}
                                        </h4>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${getStatusColor(task.status)}`}>
                                                {getStatusLabel(task.status)}
                                            </span>
                                            {task.userId === userId && (
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                    Você
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Footer Background Decoration */}
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </div>
    );
};
