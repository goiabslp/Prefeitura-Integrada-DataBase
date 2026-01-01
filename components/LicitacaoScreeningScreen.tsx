import React, { useState } from 'react';
import {
    ArrowLeft, Search, PackageX, FileText, CheckCircle2,
    RotateCcw, Network, Edit3, Trash2, Eye, Filter, Inbox
} from 'lucide-react';
import { Order, User, BlockType } from '../types';

interface LicitacaoScreeningScreenProps {
    onBack: () => void;
    currentUser: User;
    orders: Order[];
    onEditOrder: (order: Order) => void;
    onDeleteOrder: (id: string) => void;
    onUpdateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
}

export const LicitacaoScreeningScreen: React.FC<LicitacaoScreeningScreenProps> = ({
    onBack,
    currentUser,
    orders,
    onEditOrder,
    onDeleteOrder,
    onUpdateOrderStatus
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'awaiting_approval'>('awaiting_approval');

    // Filter for LICITACAO block only (redundant if passed pre-filtered, but safe)
    // And search logic
    const filteredOrders = orders.filter(order => {
        if (order.blockType !== 'licitacao') return false;

        const matchesSearch = order.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.requestingSector || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.userName || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen w-full bg-slate-100/50 backdrop-blur-sm font-sans flex items-center justify-center p-4 md:p-8 overflow-hidden animate-fade-in">
            <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden animate-slide-up flex flex-col h-full max-h-[90vh]">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 shrink-0 bg-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Voltar ao Menu
                            </button>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/30">
                                    <Inbox className="w-6 h-6 text-white" />
                                </div>
                                Triagem de Processos
                            </h2>
                            <p className="text-slate-500 text-sm mt-1 font-medium">
                                Área administrativa para gestão e acompanhamento de processos licitatórios.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-3 w-full">
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por Protocolo, Objeto, Setor..."
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-200">
                            {[
                                { id: 'all', label: 'Todos' },
                                { id: 'pending', label: 'Em Andamento' },
                                { id: 'completed', label: 'Concluídos' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setStatusFilter(filter.id as any)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${statusFilter === filter.id
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {filteredOrders.length > 0 ? (
                        <div className="min-w-full">
                            <div className="border-b border-slate-100 bg-slate-50/50 hidden md:grid md:grid-cols-12 gap-4 px-8 py-4 sticky top-0 z-10">
                                <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                                    <FileText className="w-3 h-3" /> Protocolo
                                </div>
                                <div className="md:col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                                    <FileText className="w-3 h-3" /> Objeto / Título
                                </div>
                                <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                                    <Network className="w-3 h-3" /> Setor Solicitante
                                </div>
                                <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                                    <CheckCircle2 className="w-3 h-3" /> Etapa Atual
                                </div>
                                <div className="md:col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                                    <RotateCcw className="w-3 h-3" /> Status
                                </div>
                                <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center whitespace-nowrap">
                                    Ações
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {filteredOrders.map((order) => (
                                    <div key={order.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-5 hover:bg-slate-50/80 transition-colors items-center group">
                                        <div className="md:col-span-2 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 font-bold text-xs">
                                                LIC
                                            </div>
                                            <span className="font-mono text-xs font-bold text-slate-700">
                                                {order.protocol}
                                            </span>
                                        </div>

                                        <div className="md:col-span-3 text-xs font-bold text-slate-700 truncate" title={order.title}>
                                            {order.title || 'Sem Título'}
                                        </div>

                                        <div className="md:col-span-2 text-xs font-medium text-slate-600">
                                            {order.requestingSector || order.documentSnapshot?.content.requesterSector || '---'}
                                        </div>

                                        <div className="md:col-span-2 flex justify-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black uppercase tracking-widest">
                                                {order.stage || 'Início'}
                                            </span>
                                        </div>

                                        <div className="md:col-span-1 flex justify-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    order.status === 'awaiting_approval' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                                                        order.status === 'approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                            'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {order.status === 'completed' ? 'Concluído' :
                                                    order.status === 'awaiting_approval' ? 'Aprovação' :
                                                        order.status === 'approved' ? 'Aprovado' :
                                                            order.status === 'pending' ? 'Ativo' : order.status}
                                            </span>
                                        </div>

                                        <div className="md:col-span-2 flex items-center justify-center gap-1 opacity-100 transition-opacity">
                                            {order.status === 'awaiting_approval' ? (
                                                <>
                                                    <button
                                                        onClick={() => onUpdateOrderStatus(order.id, 'approved')}
                                                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors shadow-sm shadow-emerald-500/20"
                                                        title="Aprovar Processo"
                                                    >
                                                        Aprovar
                                                    </button>
                                                    <button
                                                        onClick={() => onUpdateOrderStatus(order.id, 'rejected')}
                                                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Rejeitar"
                                                    >
                                                        <PackageX className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => onEditOrder(order)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Acessar / Editar"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
                                                    </button>

                                                    <button
                                                        onClick={() => onDeleteOrder(order.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
                            <PackageX className="w-12 h-12 opacity-30 mb-4" />
                            <p className="text-lg font-bold text-slate-500">Nenhum processo encontrado</p>
                            <p className="text-sm text-slate-400 mt-1 text-center">Não existem registros correspondentes aos filtros atuais.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Exibindo {filteredOrders.length} registros</span>
                    <span>Sistema de Gestão Pública v1.2.0</span>
                </div>
            </div>
        </div>
    );
};
