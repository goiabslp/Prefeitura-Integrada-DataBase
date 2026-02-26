import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowLeft, FileText, History, Paperclip, Download, Calendar,
    CheckCircle2, XCircle, Sparkles, PackageCheck, Landmark,
    FileSearch, ShoppingCart, Clock, MessageCircle, User,
    CheckCircle, AlertTriangle, Eye, ShieldCheck, MapPin,
    Building2, Briefcase, FileSignature, DollarSign, Fingerprint
} from 'lucide-react';
import { Order, AppState, BlockType, Attachment, InventoryCategory } from '../types';
import { addToInventory, savePurchaseOrder } from '../services/comprasService';

const HashIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="9" x2="20" y2="9"></line>
        <line x1="4" y1="15" x2="20" y2="15"></line>
        <line x1="10" y1="3" x2="8" y2="21"></line>
        <line x1="16" x2="14" y2="21"></line>
    </svg>
);

interface OrderDetailsScreenProps {
    order: Order;
    onBack: () => void;
    onDownloadPdf: (snapshot: AppState, blockType?: BlockType) => void;
}

type TabType = 'overview' | 'items' | 'justification' | 'history' | 'attachments' | 'signature';

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
    order,
    onBack,
    onDownloadPdf
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [targetItemIndex, setTargetItemIndex] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | ''>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const content = order.documentSnapshot?.content;

    const handleMarkAsUntendered = (index: number) => {
        setTargetItemIndex(index);
        setIsCategoryModalOpen(true);
    };

    const confirmUntendered = async () => {
        if (targetItemIndex === null || !selectedCategory || !content?.purchaseItems) return;
        setIsProcessing(true);
        try {
            const item = content.purchaseItems[targetItemIndex];

            // 1. Add to Inventory
            await addToInventory({
                name: item.name,
                brand: item.brand,
                details: item.details,
                quantity: item.quantity,
                unit: item.unit,
                category: selectedCategory as InventoryCategory,
                is_tendered: false,
                original_order_protocol: order.protocol,
                original_item_id: item.id
            });

            // 2. Update Order content locally
            const updatedItems = [...content.purchaseItems];
            updatedItems[targetItemIndex] = {
                ...item,
                isTendered: false,
                category: selectedCategory as InventoryCategory
            };

            // 3. Save Order
            const updatedOrder: Order = {
                ...order,
                documentSnapshot: {
                    ...order.documentSnapshot!,
                    content: {
                        ...order.documentSnapshot!.content,
                        purchaseItems: updatedItems
                    }
                }
            };

            await savePurchaseOrder(updatedOrder);

            setIsCategoryModalOpen(false);
            setTargetItemIndex(null);
            setSelectedCategory('');
        } catch (error) {
            console.error("Error marking item as untendered:", error);
            alert('Ocorreu um erro ao processar o item. Tente novamente.');
        } finally {
            setIsProcessing(false);
        }
    };


    // Helper to render History Tab Content
    const renderHistory = () => (
        <div className="relative p-4 w-full">
            <div className="absolute left-[39px] desktop:left-[55px] top-6 bottom-6 w-0.5 bg-slate-200/60"></div>
            <div className="space-y-8 relative">
                {order.statusHistory && order.statusHistory.length > 0 ? (
                    [...order.statusHistory].reverse().map((move, idx) => (
                        <div key={idx} className="relative pl-16 desktop:pl-20 group animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className={`absolute left-4 desktop:left-8 top-0 w-12 h-12 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${idx === 0
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
                                <div className="flex flex-col desktop:flex-row desktop:items-center justify-between gap-2 mb-3">
                                    <h4 className={`text-sm font-black uppercase tracking-wider ${idx === 0 ? (move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'text-rose-900' : 'text-indigo-900') : 'text-slate-700'
                                        }`}>
                                        {move.statusLabel}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 self-start desktop:self-auto">
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

    // Helper to render Signature Tab Content
    const renderSignature = () => {
        const signatureName = content?.signatureName || content?.requesterName || 'Não identificado';
        const signatureRole = content?.signatureRole || content?.requesterRole || 'Cargo não informado';
        const signatureSector = content?.signatureSector || content?.requesterSector || 'Setor não informado';
        const signatureDate = order.createdAt; // Assuming creation date is the signature date for the initial request
        const signatureHash = order.id.replace(/-/g, '').toUpperCase().slice(0, 16);

        return (
            <div className="p-4 desktop:p-8 w-full animate-fade-in">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden relative group">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-50/50 rounded-tr-full -ml-12 -mb-12 transition-transform group-hover:scale-110"></div>

                        <div className="relative p-8 desktop:p-12 flex flex-col items-center text-center">
                            {/* Validation Badge */}
                            <div className="mb-8 relative">
                                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                <div className="relative w-24 h-24 bg-indigo-600 rounded-3xl rotate-12 flex items-center justify-center shadow-xl shadow-indigo-200">
                                    <ShieldCheck className="w-12 h-12 text-white -rotate-12" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>

                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Assinatura Digital Validada</h3>
                            <div className="w-12 h-1 bg-indigo-100 rounded-full mb-8"></div>

                            {/* Signature Content */}
                            <div className="space-y-1 mb-10">
                                <p className="text-3xl desktop:text-4xl font-black text-slate-800 tracking-tight italic font-serif">
                                    {signatureName}
                                </p>
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                    <span className="text-xs font-bold uppercase tracking-widest">{signatureRole}</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <span className="text-xs font-bold uppercase tracking-widest">{signatureSector}</span>
                                </div>
                            </div>

                            {/* Footer Metadata */}
                            <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4 w-full pt-8 border-t border-slate-50">
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Data e Hora do Registro</span>
                                    <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-slate-600">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                        {new Date(signatureDate).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Chave de Autenticidade (Hash)</span>
                                    <div className="flex items-center justify-center gap-2 font-mono text-[10px] font-bold text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-50">
                                        <Fingerprint className="w-3.5 h-3.5" />
                                        {signatureHash}
                                    </div>
                                </div>
                            </div>

                            {/* Verification Label */}
                            <div className="mt-8 flex items-center gap-3 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-fade-in">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Documento Assinado Digitalmente</span>
                            </div>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-[10px] text-slate-400 font-medium px-8 leading-relaxed">
                        Esta assinatura é vinculada à conta autenticada do sistema e protegida por mútla autenticação de fatores (MFA),
                        garantindo a irretratabilidade e integridade deste documento conforme os padrões de segurança institucional.
                    </p>
                </div>
            </div>
        );
    };

    // Helper to render Attachments Tab Content
    const renderAttachments = () => (
        <div className="p-4 w-full">
            {order.attachments && order.attachments.length > 0 ? (
                <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
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
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50">
                        <Paperclip className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-lg font-black text-slate-800 uppercase tracking-widest mb-1">Sem anexos vinculados</p>
                    <p className="text-xs text-slate-400 font-medium">Nenhum arquivo digital foi anexado a este processo.</p>
                </div>
            )}
        </div>
    );

    const renderOverview = () => (
        <div className="p-4 desktop:p-6 w-full animate-fade-in overflow-hidden">
            <div className="max-w-5xl mx-auto space-y-4">
                {/* Main Info Block: Title only */}
                <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm border-l-4 border-l-indigo-500 overflow-hidden">
                    <div className="p-5 desktop:p-6">
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1.5 block">Objeto / Título do Pedido</span>
                        <h2 className="text-xl desktop:text-2xl font-black text-slate-800 leading-tight">
                            {order.title || 'Detalhes do Pedido'}
                        </h2>
                    </div>
                </div>

                {/* Status & Protocol Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 group hover:border-indigo-200 transition-all">
                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                            <HashIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-1">Protocolo Interno</span>
                            <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase">
                                {order.protocol}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 group hover:border-indigo-200 transition-all">
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-1">Situação do Processo</span>
                            {order.status === 'approved' && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wide flex items-center gap-1.5 w-fit"><CheckCircle2 className="w-3 h-3" /> Aprovado</span>}
                            {order.status === 'pending' && <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wide flex items-center gap-1.5 w-fit"><Clock className="w-3 h-3" /> Pendente</span>}
                            {order.status === 'rejected' && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 uppercase tracking-wide flex items-center gap-1.5 w-fit"><XCircle className="w-3 h-3" /> Rejeitado</span>}
                        </div>
                    </div>
                </div>

                {/* Secondary Info Block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Solicitante */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 group hover:border-indigo-200 transition-all">
                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Solicitante</span>
                            <div className="text-sm font-black text-slate-800 truncate">{content?.requesterName || '---'}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{content?.requesterRole || 'Cargo não informado'}</div>
                        </div>
                    </div>

                    {/* Setor */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 group hover:border-indigo-200 transition-all">
                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Setor</span>
                            <div className="text-sm font-black text-slate-800 truncate">{content?.requesterSector || '---'}</div>
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3 group hover:border-emerald-200 transition-all">
                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Abertura</span>
                                <div className="text-sm font-black text-slate-800">
                                    {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Previsão</span>
                                <div className="text-sm font-black text-slate-800">
                                    {order.completionForecast ? new Date(order.completionForecast).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '---'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Discreet Validation Footer */}
                <div className="flex items-center justify-between px-4 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Verificação de Integridade Digital Ativa</span>
                    </div>
                    <span className="text-[8px] font-mono font-bold text-slate-400 tracking-tighter uppercase font-mono">ID-{order.id.slice(-8).toUpperCase()}</span>
                </div>
            </div>
        </div>
    );

    // Helper to render Items Tab Content
    const renderItems = () => (
        <div className="p-8 w-full animate-fade-in">
            <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex items-center justify-between mb-4 px-4">
                    <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-emerald-500" />
                        Relatório Técnico de Itens solicitados
                    </h3>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Total: {content?.purchaseItems?.length || 0} Itens
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">#</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Item / Descrição</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Marca/Modelo</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Quantidade</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {content?.purchaseItems?.map((item, idx) => (
                                    <tr key={idx} className={`group hover:bg-slate-50/50 transition-colors ${item.isTendered === false ? 'bg-rose-50/30' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shadow-sm">
                                                {idx + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{item.name}</span>
                                                {item.details && <span className="text-xs text-slate-400 font-medium">{item.details}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-tight">
                                                {item.brand || 'Original'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold rounded-lg border border-indigo-100 text-xs">
                                                {item.quantity} <span className="text-[10px] opacity-60 ml-1">{item.unit}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {item.isTendered === false ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100 text-[9px] font-black uppercase tracking-widest">
                                                    Não Licitado
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleMarkAsUntendered(idx)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Marcar como não licitado"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    // Helper to render Justification Tab Content
    const renderJustification = () => (
        <div className="p-8 w-full animate-fade-in">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 pointer-events-none">
                        <MessageCircle className="w-64 h-64" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-8">
                            <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Justificativa Técnica</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Finalidade e Motivação do Processo</p>
                            </div>
                        </div>

                        <div className="prose prose-slate max-w-none">
                            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 text-slate-700 text-lg leading-relaxed font-medium whitespace-pre-wrap shadow-inner italic">
                                "{content?.body || 'Nenhuma justificativa textual detalhada foi inserida para este pedido.'}"
                            </div>
                        </div>

                        {content?.priorityJustification && (
                            <div className="mt-10 p-8 bg-rose-50/70 border-2 border-dashed border-rose-200 rounded-3xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-lg font-black text-rose-900 uppercase tracking-tight">Motivação de Prioridade ({content.priority})</h4>
                                </div>
                                <p className="text-rose-800 font-bold leading-relaxed ml-2">{content.priorityJustification}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCategoryModal = () => (
        isCategoryModalOpen && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative animate-scale-up border border-white/20">
                    <button
                        onClick={() => setIsCategoryModalOpen(false)}
                        className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-800"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>

                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-4 shadow-sm">
                            <PackageCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">Marcar Não Licitado</h3>
                        <p className="text-sm text-slate-500 font-medium">Selecione a categoria para este item</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as InventoryCategory)}
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none"
                            >
                                <option value="">Selecione...</option>
                                <option value="Construção">Construção</option>
                                <option value="Limpeza">Limpeza</option>
                                <option value="Alimentação">Alimentação</option>
                                <option value="Material de Uso">Material de Uso</option>
                                <option value="Ferramentas">Ferramentas</option>
                                <option value="Serviços">Serviços</option>
                            </select>
                        </div>

                        <button
                            onClick={confirmUntendered}
                            disabled={!selectedCategory || isProcessing}
                            className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${!selectedCategory || isProcessing
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20 active:scale-95'
                                }`}
                        >
                            {isProcessing ? (
                                <><Clock className="w-4 h-4 animate-spin" /> Processando...</>
                            ) : (
                                <><CheckCircle2 className="w-4 h-4" /> Confirmar</>
                            )}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )
    );

    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-full animate-fade-in">
            {/* Header / Nav */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm shrink-0">
                <div className="w-full px-6 py-2">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Voltar */}
                        <div className="flex-1 flex justify-start">
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-bold uppercase tracking-widest group text-[10px] hover:bg-slate-50 p-2 rounded-xl"
                                title="Voltar"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                                <span className="hidden lg:inline">Voltar</span>
                            </button>
                        </div>

                        {/* Center: Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-1">
                            {[
                                { id: 'overview', label: 'Visão Geral', icon: FileText },
                                { id: 'items', label: 'Itens', icon: ShoppingCart },
                                { id: 'justification', label: 'Justificativa', icon: MessageCircle },
                                { id: 'history', label: 'Histórico', icon: History, count: order.statusHistory?.length },
                                { id: 'attachments', label: 'Anexos', icon: Paperclip, count: order.attachments?.length },
                                { id: 'signature', label: 'Assinatura', icon: FileSignature }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 active:scale-95 ${activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                        }`}
                                >
                                    <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className={`px-1 rounded text-[7px] font-mono font-black border ${activeTab === tab.id ? 'bg-white/20 border-white/20 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Right: PDF Button */}
                        <div className="flex-1 flex justify-end">
                            {order.documentSnapshot && (
                                <button
                                    onClick={() => onDownloadPdf(order.documentSnapshot!, 'compras')}
                                    className="px-3 py-1.5 bg-white text-indigo-600 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg font-bold text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                >
                                    <Download className="w-3 h-3" /> <span className="hidden lg:inline">PDF</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <div className="h-full w-full">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'items' && renderItems()}
                    {activeTab === 'justification' && renderJustification()}
                    {activeTab === 'history' && renderHistory()}
                    {activeTab === 'attachments' && renderAttachments()}
                    {activeTab === 'signature' && renderSignature()}
                </div>
            </div>
            {renderCategoryModal()}
        </div>
    );
};
