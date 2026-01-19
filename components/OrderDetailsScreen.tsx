import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
    const [showJustification, setShowJustification] = useState(false);
    const content = order.documentSnapshot?.content;

    // Helper to render History Tab Content
    const renderHistory = () => (
        <div className="relative p-4 w-full">
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
        <div className="p-4 w-full">
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

    // Helper for Justification Modal
    const renderJustificationModal = () => (
        showJustification && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative animate-scale-up border border-white/20">
                    <button
                        onClick={() => setShowJustification(false)}
                        className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-800"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col h-full max-h-[80vh]">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100/50">
                                <FileText className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Justificativa do Pedido</h3>
                                <p className="text-sm font-bold text-slate-400">Detalhamento completo da solicitação ({order.protocol})</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 text-base leading-loose font-medium whitespace-pre-wrap shadow-sm">
                                {content?.body || 'Nenhuma justificativa fornecida.'}
                            </div>

                            {content?.priority && (content.priority === 'Alta' || content.priority === 'Urgência') && content.priorityJustification && (
                                <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl">
                                    <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Prioridade: {content.priority}
                                    </p>
                                    <p className="text-sm font-bold text-rose-900 leading-relaxed">{content.priorityJustification}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowJustification(false)}
                                className="px-8 py-3 bg-slate-900 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                            >
                                Fechar Leitura
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )
    );

    // Native UI for Details Tab
    const renderDetails = () => (
        <div className="p-4 space-y-4 animate-fade-in w-full">
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

            {/* Main Content Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Main Column: ITEMS (Visual Highlight) */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8 order-2 lg:order-1">
                    {/* Items List */}
                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
                        <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><ShoppingCart className="w-5 h-5" /></div>
                                Itens Solicitados <span className="text-slate-400 font-medium ml-1 text-xs normal-case">({content?.purchaseItems?.length || 0} itens)</span>
                            </h3>
                            <div className="h-8 px-4 flex items-center justify-center bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                                Lista Completa
                            </div>
                        </div>
                        <div className="flex-1 p-0">
                            {content?.purchaseItems && content.purchaseItems.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {content.purchaseItems.map((item, i) => (
                                        <div key={i} className="p-6 hover:bg-slate-50 transition-colors flex items-center gap-6 group">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{item.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] uppercase font-bold text-slate-500 border border-slate-200">{item.brand || 'Marca n/a'}</span>
                                                    {item.details && <span className="text-slate-400 text-xs truncate max-w-[300px]">({item.details})</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Quantidade</p>
                                                <div className="inline-flex items-center px-4 py-1.5 bg-slate-100 text-slate-700 font-mono font-bold rounded-lg border border-slate-200 text-sm">
                                                    {item.quantity} <span className="text-slate-400 ml-1 text-xs">{item.unit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                                    <ShoppingCart className="w-16 h-16 opacity-20 mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-60">Nenhum item listado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secondary Column: Sidebar Info */}
                <div className="space-y-6 md:space-y-6 lg:order-2">
                    {/* Requester Info */}
                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" /> Solicitante
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nome Responsável</p>
                                    <p className="font-bold text-slate-800 text-base">{content?.requesterName || '---'}</p>
                                    <p className="text-xs font-medium text-slate-500">{content?.requesterRole}</p>
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Setor</span>
                                    <span className="font-bold text-slate-700 text-xs">{content?.requesterSector || '---'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Justification Button Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[24px] p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => setShowJustification(true)}>
                        <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform duration-700"><FileText className="w-32 h-32" /></div>
                        <div className="relative z-10">
                            <h3 className="font-black uppercase tracking-wider text-sm mb-2 opacity-90">Precisa ver detalhes?</h3>
                            <p className="text-indigo-100 text-xs font-medium mb-6 leading-relaxed max-w-[80%]">
                                Consulte a justificativa completa e notas de prioridade deste pedido.
                            </p>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-black text-xs uppercase tracking-wide rounded-xl shadow-lg hover:bg-indigo-50 transition-colors">
                                <MessageCircle className="w-4 h-4" /> Ler Justificativa
                            </button>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                <FileSignature className="w-4 h-4 text-slate-400" /> Assinaturas
                            </h3>
                        </div>
                        <div className="p-6">
                            {content?.digitalSignature?.enabled ? (
                                <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5 relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col gap-1">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Assinado Digitalmente</p>
                                        <p className="font-bold text-slate-800 text-sm">{content.signatureName || 'Usuário'}</p>
                                        <p className="text-xs text-slate-500 font-medium mb-3">{content.signatureRole}</p>
                                        <div className="flex flex-wrap gap-2 text-[8px] font-mono text-emerald-700 opacity-80">
                                            <span>IP: {content.digitalSignature.ip}</span> • <span>{new Date(content.digitalSignature.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-60">
                                    <p className="font-handwriting text-2xl text-slate-600 mb-2 rotate-[-2deg]">{content?.signatureName || 'Pendente'}</p>
                                    <div className="w-20 h-px bg-slate-300 mb-1"></div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">{content?.signatureRole || 'Cargo'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {renderJustificationModal()}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col animate-fade-in z-[100]">
            {/* Header / Nav */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="w-full px-4 py-4">
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
