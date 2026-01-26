import React, { useMemo, useState } from 'react';
import { Activity, X, FileText, ShoppingCart, Wallet, Gavel, CalendarRange, Droplet, Clock, CheckCircle2, User, Globe, Inbox, Send, Hash, ChevronRight } from 'lucide-react';
import { Order, UserRole, BlockType } from '../../types';
import { TaskDetailsModal } from './TaskDetailsModal';

interface TasksDashboardProps {
    orders: Order[];
    userRole: UserRole;
    userName: string;
    userId: string;
    onViewOrder: (order: Order) => void;
    onViewAll: (type: BlockType) => void;
    onClose?: () => void;
    fullScreen?: boolean;
}

export const TasksDashboard: React.FC<TasksDashboardProps> = ({
    orders,
    userId,
    onViewOrder,
    onClose,
    fullScreen = false
}) => {
    const [activeTab, setActiveTab] = useState<'received' | 'created' | 'all'>('received');
    const [selectedTask, setSelectedTask] = useState<Order | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const stats = useMemo(() => {
        const received = orders.filter(o => o.assigned_user_id === userId).length;
        const created = orders.filter(o => o.userId === userId).length;
        return { received, created, total: received + created };
    }, [orders, userId]);

    const filteredTasks = useMemo(() => {
        return orders.filter(order => {
            const isTask = order.blockType === 'tarefas' || ['pending', 'in_progress', 'awaiting_approval'].includes(order.status);
            if (!isTask) return false;

            if (activeTab === 'received') return order.assigned_user_id === userId;
            if (activeTab === 'created') return order.userId === userId;
            // 'all' includes both received and created
            return order.assigned_user_id === userId || order.userId === userId;
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

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Pendente', color: 'amber' };
            case 'in_progress': return { label: 'Em Andamento', color: 'blue' };
            case 'approved': return { label: 'Aprovado', color: 'emerald' };
            case 'awaiting_approval': return { label: 'Em Aprovação', color: 'purple' };
            case 'completed': return { label: 'Concluído', color: 'slate' };
            default: return { label: status, color: 'slate' };
        }
    };

    return (
        <div className={`w-full h-full flex flex-col bg-slate-50 ${fullScreen ? '' : 'border border-white/60 rounded-[2.5rem] shadow-2xl shadow-slate-200/50'} overflow-hidden relative transition-all duration-500`}>
            {/* Header Area */}
            <div className="px-6 md:px-12 py-4 shrink-0 relative bg-white border-b border-slate-100">
                <div className="flex items-center justify-between relative z-10 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-pink-500 rounded-xl shadow-lg shadow-pink-500/20 text-white">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Atividades</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Gestão e Monitoramento</p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95 shadow-sm border border-transparent hover:border-slate-200"
                            title="Fechar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Tabs / Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mt-4 max-w-2xl mx-auto">
                    {[
                        { label: 'Recebidas', value: stats.received, icon: Inbox, color: 'blue', tab: 'received' },
                        { label: 'Criadas', value: stats.created, icon: Send, color: 'indigo', tab: 'created' },
                        { label: 'Todas', value: stats.total, icon: Hash, color: 'pink', tab: 'all' }
                    ].map((s) => (
                        <button
                            key={s.tab}
                            onClick={() => setActiveTab(s.tab as any)}
                            className={`p-2.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group/stat ${activeTab === s.tab
                                ? `bg-white border-${s.color}-200 shadow-lg shadow-${s.color}-500/5 scale-[1.02]`
                                : 'bg-white/40 border-slate-100 hover:bg-white hover:border-slate-200 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover/stat:scale-110 shrink-0 ${activeTab === s.tab ? `bg-${s.color}-500 text-white` : `bg-${s.color}-50 text-${s.color}-600`
                                    }`}>
                                    <s.icon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`text-base font-black leading-none ${activeTab === s.tab ? 'text-slate-900' : 'text-slate-700'}`}>{s.value}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">{s.label}</span>
                                </div>
                            </div>
                            {activeTab === s.tab && (
                                <div className={`absolute -right-1 -bottom-1 w-12 h-12 bg-${s.color}-500/5 rounded-full blur-xl`} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 pb-6">
                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-inner-lg overflow-hidden flex flex-col max-w-7xl mx-auto w-full">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {filteredTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-8 animate-fade-in py-20">
                                <div className="w-32 h-32 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center relative">
                                    <Activity className="w-16 h-16 text-slate-200" />
                                    <div className="absolute inset-0 bg-indigo-500/5 rounded-full animate-ping" />
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-2xl font-black text-slate-800">Tudo limpo por aqui!</h3>
                                    <p className="text-sm font-bold text-slate-400 max-w-[280px] mx-auto leading-relaxed">Não encontramos nenhuma tarefa pendente neste filtro. Aproveite o tempo livre!</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredTasks.map((task, idx) => {
                                    const Icon = getIcon(task.blockType);
                                    const status = getStatusStyles(task.status);
                                    return (
                                        <button
                                            key={task.id}
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setIsDetailsModalOpen(true);
                                            }}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                            className="w-full group/card flex items-center gap-5 bg-white hover:bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom-4"
                                        >
                                            <div className={`p-5 rounded-2xl transition-transform group-hover/card:rotate-3 shadow-lg ${task.blockType === 'licitacao' ? 'bg-blue-600 shadow-blue-500/20 text-white' :
                                                task.blockType === 'compras' ? 'bg-emerald-600 shadow-emerald-500/20 text-white' :
                                                    'bg-indigo-600 shadow-indigo-500/20 text-white'
                                                }`}>
                                                <Icon className="w-7 h-7" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{task.protocol || 'SEM PROTOCOLO'}</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(task.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <h4 className="text-lg font-black text-slate-800 truncate group-hover/card:text-indigo-600 transition-colors uppercase tracking-tight">
                                                    {task.title}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-4">
                                                    <span className={`text-[10px] px-4 py-1.5 rounded-full border-2 font-black uppercase tracking-widest ${status.color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                        status.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            status.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                                'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {status.label}
                                                    </span>
                                                    {task.userId === userId && (
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">CRIADA POR MIM</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="hidden sm:flex w-12 h-12 rounded-full bg-slate-50 items-center justify-center opacity-0 group-hover/card:opacity-100 group-hover/card:translate-x-0 -translate-x-4 transition-all shadow-md">
                                                <ChevronRight className="w-6 h-6 text-indigo-600" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/5 blur-[150px] rounded-full pointer-events-none -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none -ml-48 -mb-48" />

            {/* Task Details Modal */}
            <TaskDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                task={selectedTask}
            />
        </div>
    );
};
