
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Search, PackageX, FileText, Clock, Trash2,
  FileDown, Calendar, Edit3, TrendingUp, Loader2,
  CheckCircle2, AlertCircle, CalendarCheck, Check, RotateCcw,
  Paperclip, PackageCheck, FileSearch, Scale, Landmark, ShoppingCart, CheckCircle, XCircle,
  Eye, History, X, Lock, User, MessageCircle, Sparkles, Plus, Upload, Download, AlertTriangle, ShieldAlert, Zap, Info, Network, Trash
} from 'lucide-react';
import { User as UserType, Order, AppState, BlockType, Attachment } from '../types';
import { DocumentPreview } from './DocumentPreview';
import { uploadFile } from '../services/storageService';

const HashIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"></line>
    <line x1="4" y1="15" x2="20" y2="15"></line>
    <line x1="10" y1="3" x2="8" y2="21"></line>
    <line x1="16" x2="14" y2="21"></line>
  </svg>
);

interface TrackingScreenProps {
  onBack: () => void;
  currentUser: UserType;
  activeBlock: BlockType | null;
  orders: Order[];
  onDownloadPdf: (snapshot?: AppState) => void;
  onClearAll: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateAttachments?: (orderId: string, attachments: Attachment[]) => void;
  totalCounter: number;
  onUpdatePaymentStatus?: (orderId: string, status: 'pending' | 'paid') => void;
}

export const TrackingScreen: React.FC<TrackingScreenProps> = ({
  onBack,
  currentUser,
  activeBlock,
  orders,
  onDownloadPdf,
  onClearAll,
  onEditOrder,
  onDeleteOrder,
  onUpdateAttachments,
  totalCounter,
  onUpdatePaymentStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const [attachmentManagerOrder, setAttachmentManagerOrder] = useState<Order | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [priorityJustificationOrder, setPriorityJustificationOrder] = useState<Order | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Modais customizados
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'warning'
  });

  const genericAttachmentRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.role === 'admin';
  const isDiarias = activeBlock === 'diarias';
  const isCompras = activeBlock === 'compras';

  const filteredOrders = orders.filter(order => {
    const matchesBlock = order.blockType === activeBlock;
    if (!matchesBlock) return false;

    let hasPermission = false;
    const isPurchasingManager = currentUser.role === 'admin' || currentUser.role === 'compras';

    if (isCompras) {
      if (isPurchasingManager) {
        hasPermission = true;
      } else {
        const orderSector = order.documentSnapshot?.content.requesterSector || '';
        const userSector = currentUser.sector || '';
        hasPermission = userSector !== '' && orderSector.trim().toLowerCase() === userSector.trim().toLowerCase();
      }
    } else {
      hasPermission = isAdmin || currentUser.role === 'licitacao' || order.userId === currentUser.id;
    }

    if (!hasPermission) return false;

    const matchesSearch = order.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.documentSnapshot?.content.requesterSector || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleDownload = (order: Order) => {
    setDownloadingId(order.id);
    onDownloadPdf(order.documentSnapshot);
    setTimeout(() => setDownloadingId(null), 2000);
  };

  const getDepartureDate = (order: Order) => {
    const content = order.documentSnapshot?.content;
    if (!content?.departureDateTime) return '---';
    return new Date(content.departureDateTime).toLocaleDateString('pt-BR');
  };

  const handleGenericAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && attachmentManagerOrder) {
      setIsUploading(true);
      try {
        const publicUrl = await uploadFile(file, 'attachments', `user_upload_${attachmentManagerOrder.id}_${Date.now()}_${file.name}`);

        if (publicUrl) {
          const newAttachment: Attachment = {
            id: Date.now().toString(),
            name: file.name,
            url: publicUrl,
            type: file.type,
            date: new Date().toISOString()
          };
          const updatedList = [...(attachmentManagerOrder.attachments || []), newAttachment];
          onUpdateAttachments?.(attachmentManagerOrder.id, updatedList);
          setAttachmentManagerOrder({ ...attachmentManagerOrder, attachments: updatedList });
        } else {
          alert('Erro ao fazer upload do arquivo.');
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Erro ao enviar arquivo.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeAttachment = (attachmentId: string) => {
    if (attachmentManagerOrder) {
      const updatedList = (attachmentManagerOrder.attachments || []).filter(a => a.id !== attachmentId);
      onUpdateAttachments?.(attachmentManagerOrder.id, updatedList);
      setAttachmentManagerOrder({ ...attachmentManagerOrder, attachments: updatedList });
    }
  };

  const purchaseStatusMap = {
    recebido: { label: 'Pedido Recebido', icon: PackageCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    coletando_orcamento: { label: 'Orçamento', icon: FileSearch, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    aprovacao_orcamento: { label: 'Aprovação', icon: Scale, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    coletando_dotacao: { label: 'Dotação', icon: Landmark, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    realizado: { label: 'Pedido Realizado', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    concluido: { label: 'Concluído', icon: CheckCircle, color: 'text-slate-600 bg-slate-50 border-slate-100' },
    cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  };

  const priorityStyles = {
    'Normal': { icon: Info, color: 'text-slate-500 bg-slate-50 border-slate-200' },
    'Média': { icon: Zap, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    'Alta': { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    'Urgência': { icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/50 backdrop-blur-sm font-sans flex items-center justify-center p-4 md:p-8 overflow-hidden animate-fade-in">
      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden animate-slide-up flex flex-col h-full max-h-[90vh]">

        <div className="p-8 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <button
                onClick={() => {
                  if (activeBlock === 'oficio' && onBack) {
                    onBack();
                  } else {
                    onBack();
                  }
                }}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {activeBlock === 'oficio' ? 'Voltar para Oficios' : 'Voltar ao Menu'}
              </button>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                {activeBlock === 'oficio' ? 'Histórico de Ofícios' : `Histórico: ${activeBlock?.toUpperCase()}`}
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                {isAdmin ? 'Gerenciamento global de registros.' : isCompras ? 'Pedidos de compra autorizados para seu setor.' : 'Seus documentos gerados neste módulo.'}
              </p>
            </div>


          </div>

          <div className="mt-8 flex items-center gap-3 w-full">
            <div className="relative flex-1 group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Setor, Solicitante, Protocolo..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            {isAdmin && filteredOrders.length > 0 && (
              <button
                onClick={() => setConfirmModal({
                  isOpen: true,
                  title: "Limpar Histórico",
                  message: "Deseja realmente apagar TODOS os registros deste bloco? Esta ação removerá os dados permanentemente.",
                  type: 'danger',
                  onConfirm: () => {
                    onClearAll();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                  }
                })}
                className="p-3.5 bg-red-50 text-red-500 border border-red-100 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2 font-bold text-xs uppercase"
              >
                <Trash2 className="w-5 h-5" />
                <span className="hidden lg:inline">Limpar Bloco</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredOrders.length > 0 ? (
            <div className="min-w-full">
              <div className="border-b border-slate-100 bg-slate-50/50 hidden md:grid md:grid-cols-12 gap-4 px-8 py-4 sticky top-0 z-10">
                {isCompras && (
                  <div className="md:col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                    <Calendar className="w-3 h-3" /> Pedido
                  </div>
                )}
                {isCompras && (
                  <div className="md:col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                    Prioridade
                  </div>
                )}
                <div className={`${isCompras ? 'md:col-span-1' : 'md:col-span-2'} text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ${isCompras ? 'justify-center' : 'gap-2'} whitespace-nowrap`}>
                  <HashIcon className="w-3 h-3" /> {isCompras ? 'ID' : 'Protocolo'}
                </div>
                <div className={`${isDiarias ? 'md:col-span-4' : isCompras ? 'md:col-span-3 text-center' : 'md:col-span-6'} text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ${isCompras ? 'justify-center' : 'gap-2'} whitespace-nowrap`}>
                  {isDiarias ? <><FileText className="w-3 h-3" /> Solicitante + Destino</> : isCompras ? <><Network className="w-3 h-3" /> Setor / Solicitante</> : <><FileText className="w-3 h-3" /> Solicitante</>}
                </div>
                {isDiarias && (
                  <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                    <CalendarCheck className="w-3 h-3" /> Saída
                  </div>
                )}
                {isCompras && (
                  <>
                    <div className="md:col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                      <Clock className="w-3 h-3" /> Previsão
                    </div>
                    <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                      <RotateCcw className="w-3 h-3" /> Status
                    </div>
                  </>
                )}
                {!isCompras && (
                  <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                    {isDiarias ? <><RotateCcw className="w-3 h-3" /> Pagamento</> : <><Calendar className="w-3 h-3" /> Criação</>}
                  </div>
                )}
                <div className={`${isCompras ? 'md:col-span-3' : 'md:col-span-2'} text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center whitespace-nowrap`}>Ações</div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const content = order.documentSnapshot?.content;
                  const isPaid = order.paymentStatus === 'paid';
                  const purchaseStatus = order.purchaseStatus || (order.status === 'approved' ? 'recebido' : undefined);
                  const pStatus = purchaseStatus ? purchaseStatusMap[purchaseStatus as keyof typeof purchaseStatusMap] : null;
                  const isOverdue = order.completionForecast && new Date(order.completionForecast) < new Date();

                  const priority = content?.priority || 'Normal';
                  const pStyle = priorityStyles[priority as keyof typeof priorityStyles] || priorityStyles['Normal'];

                  return (
                    <div key={order.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-5 hover:bg-slate-50/80 transition-colors items-center">
                      {isCompras && (
                        <div className="md:col-span-1 flex justify-center">
                          <div className="w-11 h-11 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm shrink-0">
                            <span className="text-[7px] font-black text-slate-400 uppercase">
                              {new Date(order.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace(/ de /g, '/').replace('.', '')}
                            </span>
                            <span className="text-base font-black text-emerald-600 leading-none">{new Date(order.createdAt).getDate()}</span>
                          </div>
                        </div>
                      )}

                      {isCompras && (
                        <div className="md:col-span-1 flex justify-center">
                          {(priority === 'Alta' || priority === 'Urgência') ? (
                            <button
                              onClick={() => setPriorityJustificationOrder(order)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95 cursor-pointer hover:shadow-sm ${pStyle.color}`}
                              title="Clique para ver a justificativa"
                            >
                              <pStyle.icon className="w-2.5 h-2.5" />
                              {priority}
                            </button>
                          ) : (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tight ${pStyle.color}`} title={`Prioridade: ${priority}`}>
                              <pStyle.icon className="w-2.5 h-2.5" />
                              {priority}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`${isCompras ? 'md:col-span-1' : 'md:col-span-2'} flex justify-center`}>
                        <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100/50">
                          {order.protocol}
                        </span>
                      </div>

                      <div className={`${isDiarias ? 'md:col-span-4' : isCompras ? 'md:col-span-3 text-center' : 'md:col-span-6'}`}>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight">
                          {isDiarias ? (content?.requesterName || '---') : isCompras ? (content?.requesterSector || 'Sem Setor') : order.userName}
                        </h3>
                        {isDiarias ? (
                          <p className="text-[10px] text-slate-400 font-medium">
                            {content?.destination || '---'}
                          </p>
                        ) : isCompras ? (
                          <p className="text-[10px] text-slate-400 font-medium">
                            {order.userName}
                          </p>
                        ) : null}
                      </div>

                      {isDiarias && (
                        <div className="md:col-span-2 text-slate-600 text-xs font-bold">
                          {getDepartureDate(order)}
                        </div>
                      )}

                      {isCompras && (
                        <>
                          <div className="md:col-span-1 flex flex-col items-center">
                            {order.completionForecast ? (
                              <>
                                <div className={`w-11 h-11 bg-white rounded-xl border flex flex-col items-center justify-center shadow-sm shrink-0 transition-colors ${isOverdue ? 'border-rose-200 shadow-rose-500/5' : 'border-slate-200'}`}>
                                  <span className="text-[7px] font-black text-slate-400 uppercase">
                                    {new Date(order.completionForecast).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace(/ de /g, '/').replace('.', '')}
                                  </span>
                                  <span className={`text-base font-black leading-none ${isOverdue ? 'text-rose-500' : 'text-indigo-600'}`}>
                                    {new Date(order.completionForecast).getDate()}
                                  </span>
                                </div>
                                <span className={`text-[7px] font-black uppercase px-1 mt-1 rounded w-fit ${isOverdue ? 'text-rose-500 bg-rose-50' : 'text-slate-400 bg-slate-50'}`}>
                                  {isOverdue ? 'Atrasado' : 'No Prazo'}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">---</span>
                            )}
                          </div>
                          <div className="md:col-span-2 flex justify-center">
                            {pStatus ? (
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${pStatus.color}`}>
                                <pStatus.icon className="w-3.5 h-3.5" />
                                {pStatus.label}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase tracking-widest">
                                <Clock className="w-3 h-3 animate-pulse" /> Aguardando Aprovação
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      {isDiarias ? (
                        <div className="md:col-span-2">
                          {isAdmin ? (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => onUpdatePaymentStatus?.(order.id, isPaid ? 'pending' : 'paid')}
                                className={`relative group flex items-center justify-between w-full max-w-[120px] px-3 py-2 rounded-xl border transition-all duration-300 active:scale-95 ${isPaid
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-500/10'
                                  : 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-emerald-500/10'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-pulse" />}
                                  <span className="text-[10px] font-black uppercase tracking-widest">
                                    {isPaid ? 'Pago' : 'Pendente'}
                                  </span>
                                </div>
                                <div className="hidden group-hover:block transition-all ml-1">
                                  <Edit3 className="w-3 h-3 opacity-40" />
                                </div>
                              </button>
                              {isPaid && order.paymentDate && (
                                <span className="text-[9px] font-bold text-emerald-500 ml-2 flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" />
                                  {new Date(order.paymentDate).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border w-fit ${isPaid
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5'
                                : 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-emerald-500/5'
                                }`}>
                                {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                {isPaid ? 'Pago' : 'Pendente'}
                              </div>
                              {isPaid && order.paymentDate && (
                                <span className="text-[9px] font-bold text-emerald-500 ml-3">
                                  Data: {new Date(order.paymentDate).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : !isCompras ? (
                        <div className="md:col-span-2 flex items-center gap-2 text-slate-500 text-xs font-medium">
                          <Clock className="w-3 h-3 opacity-40" />
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      ) : null}

                      <div className={`${isCompras ? 'md:col-span-3' : 'md:col-span-2'} flex items-center justify-center gap-1`}>
                        {isCompras && (
                          <>
                            <button
                              onClick={() => setAttachmentManagerOrder(order)}
                              className="p-2 rounded-xl border bg-white text-slate-400 border-slate-200 hover:text-emerald-600 hover:border-emerald-200 transition-all hover:bg-emerald-50/50 relative group"
                              title="Gerenciar Anexos"
                            >
                              <Paperclip className="w-5 h-5" />
                              {(order.attachments?.length || 0) > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                                  {order.attachments?.length}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => setPreviewOrder(order)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Visualizar Pedido"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setHistoryOrder(order)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                              title="Histórico de Movimentação"
                            >
                              <History className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        <button onClick={() => onEditOrder(order)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Editar"><Edit3 className="w-5 h-5" /></button>
                        <button
                          onClick={() => handleDownload(order)}
                          disabled={downloadingId === order.id}
                          className={`p-2 rounded-xl transition-all ${downloadingId === order.id ? 'text-indigo-400 bg-indigo-50' : 'text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                          title="Download PDF"
                        >
                          {downloadingId === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => setConfirmModal({
                            isOpen: true,
                            title: "Excluir Registro",
                            message: `Deseja realmente remover o registro "${order.protocol}" do histórico?`,
                            type: 'danger',
                            onConfirm: () => {
                              onDeleteOrder(order.id);
                              setConfirmModal({ ...confirmModal, isOpen: false });
                            }
                          })}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
              <PackageX className="w-12 h-12 opacity-30 mb-4" />
              <p className="text-lg font-bold text-slate-500">Histórico Vazio</p>
              <p className="text-sm text-slate-400 mt-1 text-center">Nenhum registro encontrado para seu setor ou módulo.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Exibindo {filteredOrders.length} registros</span>
          <span>Sistema de Gestão Pública v1.2.0</span>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO PERSONALIZADO */}
      {confirmModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-white/20">
            <div className="p-8 text-center">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${confirmModal.type === 'danger' ? 'bg-rose-50 text-rose-600 shadow-rose-500/10' :
                'bg-indigo-50 text-indigo-600 shadow-indigo-500/10'
                }`}>
                {confirmModal.type === 'danger' ? <Trash className="w-10 h-10" /> : <Info className="w-10 h-10" />}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">{confirmModal.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">{confirmModal.message}</p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
              <button
                onClick={confirmModal.onConfirm}
                className={`w-full py-4 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-[0.98] ${confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' :
                  'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
              >
                Confirmar Ação
              </button>
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="w-full py-4 bg-white text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE JUSTIFICATIVA DE PRIORIDADE */}
      {priorityJustificationOrder && createPortal(
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${priorityJustificationOrder.documentSnapshot?.content.priority === 'Urgência' ? 'bg-rose-600 shadow-rose-600/20' : 'bg-amber-600 shadow-amber-600/20'}`}>
                  {priorityJustificationOrder.documentSnapshot?.content.priority === 'Urgência' ? <ShieldAlert className="w-6 h-6 text-white" /> : <AlertTriangle className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Justificativa de Prioridade</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{priorityJustificationOrder.documentSnapshot?.content.priority}</p>
                </div>
              </div>
              <button onClick={() => setPriorityJustificationOrder(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8">
              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 relative">
                <MessageCircle className="absolute -top-3 -right-3 w-10 h-10 text-slate-200" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Motivo Informado:</p>
                <p className="text-base text-slate-700 font-medium leading-relaxed italic">
                  "{priorityJustificationOrder.documentSnapshot?.content.priorityJustification || 'Nenhuma justificativa específica foi informada para este pedido.'}"
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <Info className="w-5 h-5 text-indigo-600 shrink-0" />
                <p className="text-[10px] text-indigo-700 font-bold leading-tight">Pedidos com prioridade elevada são sinalizados automaticamente para o setor de compras visando agilizar o processo de aquisição.</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
              <button onClick={() => setPriorityJustificationOrder(null)} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-600 transition-all">Fechar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE GERENCIAMENTO DE ANEXOS */}
      {attachmentManagerOrder && createPortal(
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up max-h-[85vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <Paperclip className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Meus Anexos</h3>
                  <p className="text-xs font-bold text-emerald-600 font-mono">{attachmentManagerOrder.protocol}</p>
                </div>
              </div>
              <button onClick={() => setAttachmentManagerOrder(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              {(attachmentManagerOrder.userId === currentUser.id || isAdmin) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div
                    onClick={() => !isUploading && genericAttachmentRef.current?.click()}
                    className={`aspect-video border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden ${isUploading ? 'bg-slate-50 cursor-wait' : 'hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer group'}`}
                  >
                    <input type="file" ref={genericAttachmentRef} className="hidden" onChange={handleGenericAttachmentUpload} disabled={isUploading} />
                    {isUploading ? (
                      <div className="flex flex-col items-center animate-pulse">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Enviando...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner"><Plus className="w-6 h-6" /></div>
                        <div className="text-center px-4"><p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Novo Anexo</p></div>
                      </>
                    )}
                  </div>

                  <div className="bg-slate-50/50 border border-slate-200 rounded-[2rem] p-6 flex flex-col justify-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Informação</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Você pode anexar documentos complementares para auxiliar na análise do seu pedido.</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Arquivos Vinculados ({(attachmentManagerOrder.attachments || []).length})</h4>

                {(attachmentManagerOrder.attachments || []).length > 0 ? (
                  (attachmentManagerOrder.attachments || []).map((att) => (
                    <div key={att.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          {att.type.includes('pdf') ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-bold text-slate-800 truncate pr-4">{att.name}</h5>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(att.date).toLocaleDateString('pt-BR')} • {att.type.split('/')[1]?.toUpperCase() || 'ARQUIVO'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAttachmentPreviewUrl(att.url)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Visualizar"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <a
                          href={att.url}
                          download={att.name}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Download"
                        >
                          <Download className="w-4.5 h-4.5" />
                        </a>
                        {(attachmentManagerOrder.userId === currentUser.id || isAdmin) && (
                          <button
                            onClick={() => removeAttachment(att.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Paperclip className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhum anexo encontrado</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0"><button onClick={() => setAttachmentManagerOrder(null)} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-emerald-600 transition-all">Concluir</button></div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE PREVIEW DO ANEXO */}
      {attachmentPreviewUrl && createPortal(
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="w-full h-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
                <div><h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Visualização de Anexo</h3></div>
              </div>
              <button onClick={() => setAttachmentPreviewUrl(null)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X className="w-7 h-7" /></button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-200 p-8 flex justify-center">
              {attachmentPreviewUrl.startsWith('data:application/pdf') ? (
                <embed src={attachmentPreviewUrl} type="application/pdf" width="100%" height="100%" className="rounded-2xl shadow-2xl border border-white/20" />
              ) : (
                <img src={attachmentPreviewUrl} alt="Anexo" className="max-w-full h-auto object-contain rounded-2xl shadow-2xl border border-white/20" />
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center"><button onClick={() => setAttachmentPreviewUrl(null)} className="px-12 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:bg-indigo-600 active:scale-95">Fechar Visualização</button></div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Auditoria de Histórico */}
      {historyOrder && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up max-h-[85vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20"><History className="w-6 h-6 text-white" /></div>
                <div><h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Auditoria de Movimentação</h3><p className="text-xs font-bold text-indigo-600 font-mono">{historyOrder.protocol} • {historyOrder.title}</p></div>
              </div>
              <button onClick={() => setHistoryOrder(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-gradient-to-b from-indigo-500 via-indigo-200 to-slate-100 rounded-full"></div>
                <div className="space-y-10">
                  {historyOrder.statusHistory && historyOrder.statusHistory.length > 0 ? (
                    [...historyOrder.statusHistory].reverse().map((move, idx) => (
                      <div key={idx} className="relative pl-14 group animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className={`absolute left-0 top-0 w-10 h-10 rounded-2xl border-4 border-white shadow-md flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${idx === 0 ? (move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'bg-rose-600' : 'bg-indigo-600') + ' text-white ring-4 ring-indigo-100' : 'bg-white text-indigo-500 border-indigo-100'}`}>
                          {move.statusLabel.includes('Aprova') ? <CheckCircle2 className="w-5 h-5" /> : (move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição')) ? <XCircle className="w-5 h-5" /> : move.statusLabel.includes('Criação') ? <Sparkles className="w-5 h-5" /> : move.statusLabel.includes('Recebido') ? <PackageCheck className="w-5 h-5" /> : move.statusLabel.includes('Dotação') ? <Landmark className="w-5 h-5" /> : move.statusLabel.includes('Orçamento') ? <FileSearch className="w-5 h-5" /> : move.statusLabel.includes('Concluído') ? <CheckCircle className="w-5 h-5" /> : move.statusLabel.includes('Realizado') ? <ShoppingCart className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div className={`p-6 rounded-[2rem] border transition-all ${idx === 0 ? (move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'bg-rose-50/50 border-rose-100' : 'bg-indigo-50/50 border-indigo-100') + ' shadow-sm' : 'bg-white border-slate-100'}`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3"><h4 className={`text-sm font-black uppercase tracking-wider ${idx === 0 ? (move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'text-rose-900' : 'text-indigo-900') : 'text-slate-800'}`}>{move.statusLabel}</h4><div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 text-[10px] font-bold text-slate-500 shadow-sm"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> {new Date(move.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
                          {move.justification && <div className={`mb-4 p-4 rounded-2xl border flex items-start gap-3 ${move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'bg-rose-100/50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}><MessageCircle className="w-4 h-4 shrink-0 mt-0.5 opacity-60" /><div className="space-y-1"><p className="text-[8px] font-black uppercase tracking-widest opacity-60">Motivo informado:</p><p className="text-xs font-bold leading-relaxed">{move.justification}</p></div></div>}
                          <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-lg ${move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'} flex items-center justify-center`}><User className="w-3.5 h-3.5" /></div><p className="text-xs font-black text-slate-600">Responsável: <span className={`${move.statusLabel.includes('Cancela') || move.statusLabel.includes('Rejeição') ? 'text-rose-600' : 'text-indigo-600'} ml-1`}>{move.userName}</span></p></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200"><Clock className="w-10 h-10 text-slate-300" /></div><div><p className="text-lg font-black text-slate-400 uppercase tracking-tighter">Nenhum histórico</p><p className="text-sm text-slate-400 font-medium">Este pedido ainda não possui movimentações registradas.</p></div></div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center"><button onClick={() => setHistoryOrder(null)} className="px-8 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-indigo-600 transition-all active:scale-95">Fechar Auditoria</button></div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Preview do Documento Principal */}
      {previewOrder && previewOrder.documentSnapshot && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full h-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-slide-up">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Eye className="w-5 h-5 text-white" /></div><div><h3 className="text-lg font-extrabold text-slate-900">Visualização do Documento</h3><p className="text-xs text-slate-500 font-medium">{previewOrder.protocol} • {previewOrder.title}</p></div></div>
              <div className="flex items-center gap-3"><button onClick={() => handleDownload(previewOrder)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"><FileDown className="w-4 h-4" /> Download PDF</button><button onClick={() => setPreviewOrder(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"><X className="w-6 h-6" /></button></div>
            </div>
            <div className="flex-1 overflow-hidden relative bg-slate-200/50"><div className="h-full overflow-y-auto custom-scrollbar p-8"><div className="flex justify-center"><DocumentPreview state={previewOrder.documentSnapshot} mode="admin" blockType="compras" /></div></div><div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-slate-900/90 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl border border-white/10 pointer-events-none flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Modo de Visualização Protegido</div></div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
