import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowLeft, FileText, History, Paperclip, Download, Calendar,
    CheckCircle2, XCircle, Sparkles, PackageCheck, Landmark,
    FileSearch, ShoppingCart, Clock, MessageCircle, User,
    CheckCircle, AlertTriangle, Eye, ShieldCheck, MapPin,
    Building2, Briefcase, FileSignature, DollarSign
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

type TabType = 'overview' | 'items' | 'justification' | 'history' | 'attachments';

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

    // Helper to render Overview Tab Content
    const renderOverview = () => (
        <div className="p-8 w-full animate-fade-in">
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Protocolo */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2 group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-3 text-slate-400">
                            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><HashIcon className="w-5 h-5" /></div>
                            <span className="text-xs uppercase font-black tracking-widest">Protocolo do Pedido</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight font-mono ml-12">{order.protocol || '---'}</div>
                    </div>

                    {/* Data */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2 group hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-3 text-slate-400">
                            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Calendar className="w-5 h-5" /></div>
                            <span className="text-xs uppercase font-black tracking-widest">Data de Criação</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 ml-12">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    {/* Previsão */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2 group hover:border-amber-200 transition-all">
                        <div className="flex items-center gap-3 text-slate-400">
                            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors"><Clock className="w-5 h-5" /></div>
                            <span className="text-xs uppercase font-black tracking-widest">Previsão de Entrega</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 ml-12">
                            {order.completionForecast ? new Date(order.completionForecast).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                        </div>
                    </div>

                    {/* Solicitante */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2 group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-3 text-slate-400">
                            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><User className="w-5 h-5" /></div>
                            <span className="text-xs uppercase font-black tracking-widest">Solicitante</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 ml-12">{content?.requesterName || '---'}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-12">{content?.requesterRole || 'Cargo não informado'}</div>
                    </div>

                    {/* Setor */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2 group hover:border-indigo-200 transition-all md:col-span-2">
                        <div className="flex items-center gap-3 text-slate-400">
                            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Building2 className="w-5 h-5" /></div>
                            <span className="text-xs uppercase font-black tracking-widest">Secretaria / Setor Responsável</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 ml-12">{content?.requesterSector || '---'}</div>
                    </div>
                </div>

                {/* Signatures (Small compact footer in overview) */}
                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Validação Digital Ativa</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-300">ID: {order.id.slice(-12).toUpperCase()}</span>
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
                                <h1 className="text-xl desktop:text-2xl font-black text-slate-800 leading-tight">
                                    {order.title || 'Detalhes do Pedido'}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {order.documentSnapshot && (
                                <button
                                    onClick={() => onDownloadPdf(order.documentSnapshot!, 'compras')}
                                    className="hidden desktop:flex px-5 py-2.5 bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl font-bold text-xs uppercase tracking-wide items-center gap-2 transition-all active:scale-95 shadow-sm"
                                >
                                    <Download className="w-4 h-4" /> Baixar PDF
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs in Header */}
                    <div className="flex items-center gap-1.5 mt-8 overflow-x-auto no-scrollbar scroll-smooth pb-1">
                        {[
                            { id: 'overview', label: 'Visão Geral', icon: FileText },
                            { id: 'items', label: 'Itens', icon: ShoppingCart },
                            { id: 'justification', label: 'Justificativa', icon: MessageCircle },
                            { id: 'history', label: 'Histórico', icon: History, count: order.statusHistory?.length },
                            { id: 'attachments', label: 'Anexos', icon: Paperclip, count: order.attachments?.length }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5 shrink-0 active:scale-95 ${activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'
                                    : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-600'
                                    }`}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`} />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-black border ${activeTab === tab.id ? 'bg-white/20 border-white/20 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
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
                </div>
            </div>
            {renderCategoryModal()}
        </div>
    );
};
