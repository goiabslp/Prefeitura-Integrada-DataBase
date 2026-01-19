import React, { useState } from 'react';
import {
    ArrowLeft, FileText, History, Paperclip, Download, Calendar,
    CheckCircle2, XCircle, Sparkles, PackageCheck, Landmark,
    FileSearch, ShoppingCart, Clock, MessageCircle, User,
    CheckCircle, AlertTriangle, Eye, ShieldCheck, MapPin,
    Building2, Briefcase, FileSignature, DollarSign
} from 'lucide-react';
import { Order, AppState, BlockType, Attachment } from '../types';

interface OrderDetailsScreenProps {
    order: Order;
    onBack: () => void;
    onDownloadPdf: (snapshot: AppState, blockType?: BlockType) => void;
}

type TabType = 'details' | 'history' | 'attachments';

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
    order,
    onBack,
    onDownloadPdf
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const content = order.documentSnapshot?.content;

    // Helper to render History Tab Content
    const renderHistory = () => (
        <div className="relative p-6 px-4 md:px-8 w-full">
            <div className="absolute left-[39px] md:left-[55px] top-6 bottom-6 w-0.5 bg-slate-200/60"></div>
            <div className="space-y-8 relative">
                {order.statusHistory && order.statusHistory.length > 0 ? (
                    [...order.statusHistory].reverse().map((move, idx) => (
                        <div key={idx} className="relative pl-16 md:pl-20 group animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className={`absolute left-4 md:left-8 top-0 w-12 h-12 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${idx === 0
                                ? (move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'bg-rose-50 text-rose-600' : move.statusLabel.includes('Aprova') ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-600 text-white')
                                : 'bg-white text-slate-400 border-slate-100 shadow-sm'
                                }`}>
                                {move.statusLabel.includes('Aprova') ? <CheckCircle2 className="w-5 h-5" /> :
                                    (move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição')) ? <XCircle className="w-5 h-5" /> :
                                        move.statusLabel.includes('Criação') ? <Sparkles className="w-5 h-5" /> :
                                            move.statusLabel.includes('Recebido') ? <PackageCheck className="w-5 h-5" /> :
                                                move.statusLabel.includes('Dotação') ? <Landmark className="w-5 h-5" /> :
                                                    move.statusLabel.includes('Orçamento') ? <FileSearch className="w-5 h-5" /> :
                                                        move.statusLabel.includes('Concluído') ? <CheckCircle className="w-5 h-5" /> :
                                                            move.statusLabel.includes('Realizado') ? <ShoppingCart className="w-5 h-5" /> :
                                                                <Clock className="w-5 h-5" />}
                            </div>
                            <div className={`p-6 rounded-[20px] border transition-all ${idx === 0
                                ? (move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'bg-rose-50/50 border-rose-100' : 'bg-white border-indigo-100 shadow-md shadow-indigo-100/20')
                                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                }`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                    <h4 className={`text-sm font-black uppercase tracking-wider ${idx === 0 ? (move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'text-rose-900' : 'text-indigo-900') : 'text-slate-700'
                                        }`}>
                                        {move.statusLabel}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 self-start md:self-auto">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(move.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {move.justification && (
                                    <div className={`mb-4 p-4 rounded-2xl border flex items-start gap-3 ${move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'bg-rose-100/20 border-rose-200/50 text-rose-800' : 'bg-slate-50 border-slate-200/50 text-slate-600'
                                        }`}>
                                        <div className="mt-0.5"><MessageCircle className="w-3.5 h-3.5 opacity-50" /></div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Observação</p>
                                            <p className="text-xs font-medium leading-relaxed">{move.justification}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                        <User className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">
                                        Responsável: <span className="text-slate-700">{move.userName || 'Sistema'}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-base font-bold text-slate-500">Nenhum histórico</p>
                    </div>
                )}
            </div>
        </div>
    );

    // Helper to render Attachments Tab Content
    const renderAttachments = () => (
        <div className="p-4 md:p-8 w-full">
            {order.attachments && order.attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.attachments.map(att => (
                        <div key={att.id} className="group relative bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform group-hover:bg-indigo-600 group-hover:text-white text-indigo-500">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm truncate mb-1 pr-8" title={att.name}>{att.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                        <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{att.type.split('/')[1] || 'FILE'}</span>
                                        <span>•</span>
                                        <span>{new Date(att.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-100 hover:border-emerald-200 transition-all"
                                title="Visualizar Anexo"
                            >
                                <Eye className="w-4 h-4" />
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Paperclip className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-base font-bold text-slate-500">Nenhum anexo encontrado</p>
                    <p className="text-xs text-slate-400">Este pedido não possui documentos anexados.</p>
                </div>
            )}
        </div>
    );

    // Native UI for Details Tab
    const renderDetails = () => (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in w-full">
            {/* ID & Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm flex flex-col justify-between h-full bg-gradient-to-br from-white to-slate-50/50">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg"><FileText className="w-4 h-4" /></div>
                        <span className="text-[10px] uppercase font-black tracking-widest">Protocolo</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">{content?.protocol || '---'}</div>
                </div>

                <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm flex flex-col justify-between h-full bg-gradient-to-br from-white to-slate-50/50">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><Calendar className="w-4 h-4" /></div>
                        <span className="text-[10px] uppercase font-black tracking-widest">Data</span>
                    </div>
                    <div className="text-xl font-bold text-slate-700">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm flex flex-col justify-between h-full bg-gradient-to-br from-white to-slate-50/50">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><Clock className="w-4 h-4" /></div>
                        <span className="text-[10px] uppercase font-black tracking-widest">Previsão</span>
                    </div>
                    <div className="text-xl font-bold text-slate-700">
                        {order.completionForecast ? new Date(order.completionForecast).toLocaleDateString('pt-BR') : 'Não informada'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Requester & Justification */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    {/* Requester Info */}
                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" /> Solicitante
                            </h3>
                            <span className="px-2 py-1 bg-white border border-slate-100 rounded-md text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável</span>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nome</p>
                                    <p className="font-bold text-slate-800">{content?.requesterName || '---'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> Setor</p>
                                    <p className="font-medium text-slate-700">{content?.requesterSector || '---'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Cargo</p>
                                    <p className="font-medium text-slate-700">{content?.requesterRole || '---'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Justification */}
                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" /> Justificativa
                            </h3>
                        </div>
                        <div className="p-6 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                            {content?.body || 'Nenhuma justificativa fornecida.'}
                        </div>
                        {content?.priority && (content.priority === 'Alta' || content.priority === 'Urgência') && content.priorityJustification && (
                            <div className="px-6 pb-6">
                                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Nota de Prioridade ({content.priority})</p>
                                    <p className="text-xs font-bold text-rose-800/80">{content.priorityJustification}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Items & Signatures */}
                <div className="space-y-6 md:space-y-8">
                    {/* Items List */}
                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-slate-400" /> Itens ({content?.purchaseItems?.length || 0})
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {content?.purchaseItems && content.purchaseItems.length > 0 ? (
                                content.purchaseItems.map((item, i) => (
                                    <div key={i} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm line-clamp-2">{item.name}</p>
                                            <div className="flex gap-3 mt-1 text-[10px] uppercase font-bold text-slate-400">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.quantity} {item.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum item listado</div>
                            )}
                        </div>
                    </div>

                    {/* Signature */}
                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                <FileSignature className="w-4 h-4 text-slate-400" /> Assinaturas
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {content?.digitalSignature?.enabled ? (
                                <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><ShieldCheck className="w-24 h-24 text-emerald-600" /></div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Assinado Digitalmente</p>
                                        <p className="font-bold text-slate-800 text-sm">{content.signatureName || 'Usuário'}</p>
                                        <p className="text-xs text-slate-500 font-medium mb-3">{content.signatureRole}</p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 bg-white border border-emerald-100 rounded text-[9px] font-mono text-emerald-700">IP: {content.digitalSignature.ip}</span>
                                            <span className="px-2 py-1 bg-white border border-emerald-100 rounded text-[9px] font-mono text-emerald-700">{new Date(content.digitalSignature.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-60">
                                    <p className="font-handwriting text-2xl text-slate-600 mb-2 rotate-[-2deg]">{content?.signatureName || 'Assinatura Pendente'}</p>
                                    <div className="w-32 h-px bg-slate-300 mb-1"></div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">{content?.signatureRole || 'Cargo'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in relative z-50">
            {/* Header / Nav */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="w-full px-4 md:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-95 group"
                                title="Voltar para lista"
                            >
                                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="h-8 w-px bg-slate-100 mx-2"></div>
                            <div>
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                        {order.protocol}
                                    </span>
                                    {order.status === 'approved' && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wide flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Aprovado</span>}
                                    {order.status === 'pending' && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wide flex items-center gap-1"><Clock className="w-3 h-3" /> Pendente</span>}
                                    {order.priority === 'Alta' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wide flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alta Prioridade</span>}
                                </div>
                                <h1 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
                                    {order.title || 'Detalhes do Pedido'}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {order.documentSnapshot && (
                                <button
                                    onClick={() => onDownloadPdf(order.documentSnapshot!, 'compras')}
                                    className="hidden md:flex px-5 py-2.5 bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl font-bold text-xs uppercase tracking-wide items-center gap-2 transition-all active:scale-95 shadow-sm"
                                >
                                    <Download className="w-4 h-4" /> Baixar PDF
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs in Header */}
                    <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'details' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-transparent text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            Visão Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-transparent text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            Histórico
                            {order.statusHistory && order.statusHistory.length > 0 && <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{order.statusHistory.length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('attachments')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'attachments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-transparent text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            Anexos
                            {order.attachments && order.attachments.length > 0 && <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === 'attachments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{order.attachments.length}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {activeTab === 'details' && renderDetails()}
                {activeTab === 'history' && renderHistory()}
                {activeTab === 'attachments' && renderAttachments()}
            </div>
        </div>
    );
};
