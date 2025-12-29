
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Search, Inbox, Clock, Trash2,
  FileDown, CheckCircle2, XCircle, AlertCircle, Loader2,
  User, ShoppingBag, Eye, X, Lock, ChevronDown, PackageCheck, Truck, ShoppingCart, CheckCircle,
  History, Calendar, UserCheck, ArrowDown, Landmark, MessageCircle, FileSearch, Scale, ClipboardCheck,
  AlertTriangle, MousePointer2, ChevronRight, Check, Sparkles, Upload, FileText, Paperclip, ExternalLink,
  Download, Plus, Network, Trash, Send, Info
} from 'lucide-react';
import { User as UserType, Order, AppState, StatusMovement, Attachment } from '../types';
import { DocumentPreview } from './DocumentPreview';
import { uploadFile } from '../services/storageService';

interface PurchaseManagementScreenProps {
  onBack: () => void;
  currentUser: UserType;
  orders: Order[];
  onDownloadPdf: (snapshot?: AppState) => void;
  onUpdateStatus: (orderId: string, status: Order['status'], justification?: string) => void;
  onUpdatePurchaseStatus?: (orderId: string, purchaseStatus: Order['purchaseStatus'], justification?: string, budgetFileUrl?: string) => void;
  onUpdateCompletionForecast?: (orderId: string, date: string) => void;
  onUpdateAttachments?: (orderId: string, attachments: Attachment[]) => void;
  onDeleteOrder: (id: string) => void;
}

export const PurchaseManagementScreen: React.FC<PurchaseManagementScreenProps> = ({
  onBack,
  currentUser,
  orders,
  onDownloadPdf,
  onUpdateStatus,
  onUpdatePurchaseStatus,
  onUpdateCompletionForecast,
  onUpdateAttachments,
  onDeleteOrder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [statusSelectionOrder, setStatusSelectionOrder] = useState<Order | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const [confirmApprovalOrder, setConfirmApprovalOrder] = useState<Order | null>(null);
  const [budgetUploadOrder, setBudgetUploadOrder] = useState<Order | null>(null);
  const [attachmentManagerOrder, setAttachmentManagerOrder] = useState<Order | null>(null);
  const [budgetPreviewUrl, setBudgetPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Estados para modais de entrada (Substituindo Prompt/Confirm)
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean, orderId: string, reason: string }>({ isOpen: false, orderId: '', reason: '' });
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean, orderId: string, reason: string }>({ isOpen: false, orderId: '', reason: '' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'warning'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const genericAttachmentRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.role === 'admin';
  const isComprasUser = currentUser.role === 'compras';

  const purchaseOrders = orders.filter(order => order.blockType === 'compras');

  const filteredOrders = purchaseOrders.filter(order => {
    const sector = order.documentSnapshot?.content.requesterSector || '';
    const matchesSearch = order.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    if (isComprasUser) {
      const isFinalized = order.status === 'approved' || order.status === 'rejected';
      return matchesSearch && matchesStatus && isFinalized;
    }

    return matchesSearch && matchesStatus;
  });

  const handleDownload = (order: Order) => {
    setDownloadingId(order.id);
    onDownloadPdf(order.documentSnapshot);
    setTimeout(() => setDownloadingId(null), 2000);
  };

  const handleBudgetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && budgetUploadOrder) {
      setIsUploading(true);
      try {
        const publicUrl = await uploadFile(file, 'attachments', `budget_${budgetUploadOrder.id}_${Date.now()}_${file.name}`);
        if (publicUrl) {
          // Preserve current status, just update the file URL
          onUpdatePurchaseStatus?.(
            budgetUploadOrder.id,
            budgetUploadOrder.purchaseStatus || 'recebido',
            'Orçamento anexado ao pedido (Status mantido).',
            publicUrl
          );
          setBudgetUploadOrder(null);
        } else {
          alert('Erro ao fazer upload do arquivo. Verifique se o bucket "attachments" existe.');
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Erro ao enviar arquivo.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleGenericAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && attachmentManagerOrder) {
      setIsUploading(true);
      try {
        const publicUrl = await uploadFile(file, 'attachments', `generic_${attachmentManagerOrder.id}_${Date.now()}_${file.name}`);

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

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Aprovado</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black uppercase tracking-widest"><XCircle className="w-3 h-3" /> Rejeitado</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black uppercase tracking-widest"><Clock className="w-3 h-3 animate-pulse" /> Aguardando Aprovação</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100 text-[10px] font-black uppercase tracking-widest"><AlertCircle className="w-3 h-3" /> Recebido</span>;
    }
  };

  const purchaseStatusMap = {
    recebido: {
      label: 'Pedido Recebido',
      description: 'Demanda aguardando triagem.',
      icon: PackageCheck,
      color: 'indigo'
    },
    coletando_orcamento: {
      label: 'Coletando Orçamento',
      description: 'Pesquisa de mercado ativa.',
      icon: FileSearch,
      color: 'amber'
    },
    aprovacao_orcamento: {
      label: 'Aprovação do Orçamento',
      description: 'Aguardando validação administrativa.',
      icon: Scale,
      color: 'purple'
    },
    coletando_dotacao: {
      label: 'Coletando Dotação',
      description: 'Identificação de reserva orçamentária.',
      icon: Landmark,
      color: 'blue'
    },
    realizado: {
      label: 'Pedido Realizado',
      description: 'Processo de compra concluído.',
      icon: ShoppingCart,
      color: 'emerald'
    },
    concluido: {
      label: 'Concluído',
      description: 'Ciclo completo e atestado.',
      icon: CheckCircle,
      color: 'slate'
    },
    cancelado: {
      label: 'Cancelado',
      description: 'Interrupção definitiva.',
      icon: XCircle,
      color: 'rose'
    },
  };

  const PurchaseStatusSelector = ({ order }: { order: Order }) => {
    const currentStatus = order.purchaseStatus || 'recebido';
    const config = purchaseStatusMap[currentStatus as keyof typeof purchaseStatusMap];
    const isApproved = order.status === 'approved';
    const isLockedForUser = currentStatus === 'aprovacao_orcamento' && !isAdmin;
    const lastMovement = order.statusHistory && order.statusHistory.length > 0
      ? order.statusHistory[order.statusHistory.length - 1]
      : null;

    if (!isApproved) return null;

    return (
      <div className="flex flex-col gap-1.5 items-end">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAttachmentManagerOrder(order)}
            className="p-2 rounded-xl border bg-white text-slate-400 border-slate-200 hover:text-emerald-600 hover:border-emerald-200 transition-all hover:bg-emerald-50/50 relative group"
            title="Gerenciar Anexos"
          >
            <Paperclip className="w-4 h-4" />
            {(order.attachments?.length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                {order.attachments?.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setHistoryOrder(order)}
            className="p-2 rounded-xl border bg-white text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:bg-indigo-50/50"
            title="Ver Histórico de Movimentação"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={() => isComprasUser && !isLockedForUser && setStatusSelectionOrder(order)}
            disabled={isLockedForUser}
            className={`flex items-center justify-between gap-3 px-4 py-2 rounded-xl border transition-all duration-300 group
              ${isComprasUser && !isLockedForUser ? 'cursor-pointer hover:shadow-lg active:scale-95' : 'cursor-default'}
              ${isLockedForUser ? 'bg-purple-50 text-purple-700 border-purple-200 ring-2 ring-purple-500/10 opacity-80' : `bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200`}
            `}
          >
            <div className="flex items-center gap-2">
              <config.icon className={`w-4 h-4 ${isLockedForUser ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
            </div>
            {isLockedForUser ? (
              <Lock className="w-3 h-3 text-purple-400 ml-1" />
            ) : isComprasUser ? (
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
            ) : null}
          </button>
        </div>

        {lastMovement && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight italic bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">
            <UserCheck className="w-3 h-3 text-emerald-500" />
            <span>Ativo por: <span className="text-slate-600 not-italic">{lastMovement.userName}</span></span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/50 backdrop-blur-sm font-sans flex items-center justify-center p-4 md:p-8 overflow-hidden animate-fade-in">
      <div className="w-full max-w-7xl bg-white rounded-[2.5rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden animate-slide-up flex flex-col h-full max-h-[90vh]">

        <div className="p-8 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Voltar ao Menu
              </button>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <Inbox className="w-6 h-6 text-white" />
                </div>
                {isComprasUser ? 'Atendimento de Pedidos' : 'Gestão de Pedidos de Compras'}
              </h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">
                {isComprasUser
                  ? 'Acompanhe e atualize o status de atendimento das requisições autorizadas.'
                  : 'Somente administradores podem aprovar ou rejeitar requisições.'}
              </p>
            </div>

            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 w-fit">
              {['all', 'pending', 'approved', 'rejected']
                .filter(s => !isComprasUser || s !== 'pending')
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white shadow-sm text-emerald-600 border border-emerald-100' : 'text-slate-400 hover:bg-white/50'
                      }`}
                  >
                    {s === 'all' ? 'Todos' : s === 'pending' ? 'Pendentes' : s === 'approved' ? 'Aprovados' : 'Rejeitados'}
                  </button>
                ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 w-full">
            <div className="relative flex-1 group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Protocolo, Setor ou Solicitante..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-slate-50/80 transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm shrink-0">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(order.createdAt).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                        <span className="text-lg font-black text-emerald-600 leading-none">{new Date(order.createdAt).getDate()}</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">
                            {order.protocol}
                          </span>
                          {getStatusBadge(order.status)}
                          {order.documentSnapshot?.content.priority !== 'Normal' && (
                            <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-widest">
                              Prioridade: {order.documentSnapshot?.content.priority}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                            <Network className="w-4 h-4" />
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {order.documentSnapshot?.content.requesterSector || 'Setor não informado'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                          <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {order.userName}</div>
                          <div className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> {(order.documentSnapshot?.content.purchaseItems || []).length} itens</div>
                        </div>

                        {order.status === 'approved' && (
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex flex-col">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Previsão de Conclusão</label>
                              {isComprasUser || isAdmin ? (
                                <div className="flex items-center gap-2">
                                  <div className="relative group/input">
                                    <input
                                      type="date"
                                      value={order.completionForecast || ''}
                                      onChange={(e) => onUpdateCompletionForecast?.(order.id, e.target.value)}
                                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                                    />
                                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none group-focus-within/input:text-emerald-500 transition-colors" />
                                  </div>
                                  {order.completionForecast && (
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded bg-slate-100 ${new Date(order.completionForecast) < new Date() ? 'text-rose-500 bg-rose-50' : 'text-slate-400'}`}>
                                      {new Date(order.completionForecast) < new Date() ? 'Atrasado' : 'No Prazo'}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-xs font-bold text-slate-600">{order.completionForecast ? new Date(order.completionForecast).toLocaleDateString('pt-BR') : 'Aguardando Compras'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm opacity-100 transition-opacity">

                      <PurchaseStatusSelector order={order} />

                      <div className="w-px h-6 bg-slate-200 mx-1"></div>

                      <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAdmin && (
                          <>
                            {order.purchaseStatus === 'aprovacao_orcamento' && (
                              <button
                                onClick={() => setConfirmApprovalOrder(order)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 active:scale-95 group"
                                title="Liberar Pedido (Aprovar Orçamento)"
                              >
                                <ClipboardCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Liberar Fluxo
                              </button>
                            )}

                            <button
                              onClick={() => setConfirmModal({
                                isOpen: true,
                                title: "Aprovar Pedido",
                                message: `Deseja formalizar a aprovação administrativa para o pedido ${order.protocol}?`,
                                type: 'warning',
                                onConfirm: () => {
                                  onUpdateStatus(order.id, 'approved');
                                  setConfirmModal({ ...confirmModal, isOpen: false });
                                }
                              })}
                              className={`p-2 rounded-xl transition-all ${order.status === 'approved' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                              title="Aprovar Pedido"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setRejectionModal({ isOpen: true, orderId: order.id, reason: '' })}
                              className={`p-2 rounded-xl transition-all ${order.status === 'rejected' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                              title="Rejeitar Pedido"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>
                            <button
                              onClick={() => setConfirmModal({
                                isOpen: true,
                                title: "Excluir Pedido",
                                message: "Deseja remover permanentemente este pedido da base de dados?",
                                type: 'danger',
                                onConfirm: () => {
                                  onDeleteOrder(order.id);
                                  setConfirmModal({ ...confirmModal, isOpen: false });
                                }
                              })}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setPreviewOrder(order)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Visualizar Preview"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownload(order)}
                          disabled={downloadingId === order.id}
                          className={`p-2 rounded-xl transition-all ${downloadingId === order.id ? 'text-emerald-400' : 'text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                          title="Baixar PDF Original"
                        >
                          {downloadingId === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <Inbox className="w-16 h-16 opacity-10 mb-4" />
              <p className="text-xl font-bold text-slate-500 tracking-tight">Nenhum pedido encontrado</p>
              <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                {isComprasUser
                  ? 'Somente pedidos que já foram finalizados (Aprovados ou Rejeitados) aparecem para seu perfil.'
                  : 'As requisições de compra aparecerão aqui quando forem enviadas pelos colaboradores.'}
              </p>
            </div>
          )}
        </div>

        {/* MODAL DE REJEIÇÃO */}
        {rejectionModal.isOpen && createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg"><XCircle className="w-6 h-6 text-white" /></div>
                  <div><h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Justificar Rejeição</h3></div>
                </div>
                <button onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Motivo da Rejeição Administrativa</label>
                <textarea
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-rose-500 transition-all resize-none font-medium"
                  placeholder="Descreva o motivo para que o solicitante possa corrigir..."
                />
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Voltar</button>
                <button
                  disabled={!rejectionModal.reason.trim()}
                  onClick={() => {
                    onUpdateStatus(rejectionModal.orderId, 'rejected', rejectionModal.reason);
                    setRejectionModal({ isOpen: false, orderId: '', reason: '' });
                  }}
                  className="px-8 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-xl disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  <XCircle className="w-5 h-5" /> Rejeitar Pedido
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL DE CANCELAMENTO */}
        {cancelModal.isOpen && createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg"><XCircle className="w-6 h-6 text-white" /></div>
                  <div><h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Cancelar Processo</h3></div>
                </div>
                <button onClick={() => setCancelModal({ ...cancelModal, isOpen: false })} className="p-3 hover:bg-white hover:shadow-sm rounded-2xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Motivo do Cancelamento</label>
                <textarea
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-rose-500 transition-all resize-none font-medium"
                  placeholder="Informe o motivo do cancelamento definitivo deste ciclo..."
                />
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setCancelModal({ ...cancelModal, isOpen: false })} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Voltar</button>
                <button
                  disabled={!cancelModal.reason.trim()}
                  onClick={() => {
                    onUpdatePurchaseStatus?.(cancelModal.orderId, 'cancelado', cancelModal.reason);
                    setCancelModal({ isOpen: false, orderId: '', reason: '' });
                  }}
                  className="px-8 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-xl disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  <Trash className="w-5 h-5" /> Cancelar Ciclo
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
                  Confirmar
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

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex gap-4">
            {!isComprasUser && <span>Pendentes: {purchaseOrders.filter(o => o.status === 'pending' || !o.status).length}</span>}
            <span className="text-emerald-500">Aprovados: {purchaseOrders.filter(o => o.status === 'approved').length}</span>
            <span className="text-rose-500">Rejeitados: {purchaseOrders.filter(o => o.status === 'rejected').length}</span>
          </div>
          <span>Atendimento de Compras • Sistema de Rastreabilidade Integrado</span>
        </div>
      </div>

      {/* MODAL DE SELEÇÃO DE STATUS */}
      {statusSelectionOrder && createPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <MousePointer2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Alterar Status</h3>
                  <p className="text-xs font-bold text-indigo-600 font-mono mt-1 tracking-wider">{statusSelectionOrder.protocol}</p>
                </div>
              </div>
              <button onClick={() => setStatusSelectionOrder(null)} className="p-3 hover:bg-white hover:shadow-sm rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(purchaseStatusMap) as Array<keyof typeof purchaseStatusMap>).map((key) => {
                const opt = purchaseStatusMap[key];
                const isSelected = statusSelectionOrder.purchaseStatus === key || (!statusSelectionOrder.purchaseStatus && key === 'recebido');
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'cancelado') {
                        setCancelModal({ isOpen: true, orderId: statusSelectionOrder.id, reason: '' });
                      } else if (key === 'aprovacao_orcamento') {
                        setBudgetUploadOrder(statusSelectionOrder);
                      } else {
                        onUpdatePurchaseStatus?.(statusSelectionOrder.id, key);
                      }
                      setStatusSelectionOrder(null);
                    }}
                    className={`w-full group relative p-5 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${isSelected ? `bg-${opt.color}-50 border-${opt.color}-500 shadow-md ring-4 ring-${opt.color}-500/5` : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${isSelected ? `bg-${opt.color}-600 text-white` : `bg-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50`}`}><opt.icon className="w-6 h-6" /></div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-black uppercase tracking-tight ${isSelected ? `text-${opt.color}-900` : 'text-slate-800'}`}>{opt.label}</h4>
                      <p className={`text-[11px] font-medium leading-tight truncate ${isSelected ? `text-${opt.color}-700/80` : 'text-slate-400'}`}>{opt.description}</p>
                    </div>
                    {isSelected && <div className={`w-6 h-6 rounded-full bg-${opt.color}-600 flex items-center justify-center text-white animate-scale-in`}><Check className="w-3.5 h-3.5 stroke-[3]" /></div>}
                  </button>
                );
              })}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100"><button onClick={() => setStatusSelectionOrder(null)} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg hover:bg-indigo-600 transition-all active:scale-95">Cancelar Operação</button></div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE UPLOAD DE ORÇAMENTO */}
      {budgetUploadOrder && createPortal(
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20"><Upload className="w-6 h-6 text-white" /></div>
                <div><h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Anexar Orçamento</h3><p className="text-xs font-bold text-purple-600 font-mono">{budgetUploadOrder.protocol}</p></div>
              </div>
              <button onClick={() => setBudgetUploadOrder(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8">
              <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`w-full aspect-[16/9] border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all group relative overflow-hidden ${isUploading ? 'bg-slate-50 cursor-wait' : 'hover:border-purple-500 hover:bg-purple-50/50 cursor-pointer'}`}>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleBudgetUpload} disabled={isUploading} />
                {isUploading ? (
                  <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-2" />
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Enviando Arquivo...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner"><FileText className="w-8 h-8" /></div>
                    <div className="text-center"><p className="text-sm font-black text-slate-700 uppercase tracking-widest">Clique para selecionar</p><p className="text-xs text-slate-400 font-medium mt-1">Carregue o arquivo PDF ou Imagem do orçamento coletado.</p></div>
                  </>
                )}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end"><button onClick={() => setBudgetUploadOrder(null)} disabled={isUploading} className="px-8 py-3 bg-white text-slate-500 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all disabled:opacity-50">Voltar</button></div>
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
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Gestão de Anexos</h3>
                  <p className="text-xs font-bold text-emerald-600 font-mono">{attachmentManagerOrder.protocol}</p>
                </div>
              </div>
              <button onClick={() => !isUploading && setAttachmentManagerOrder(null)} disabled={isUploading} className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90 disabled:opacity-50"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
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
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Arquivos anexados aqui ficam permanentemente vinculados ao pedido administrativo para consulta futura.</p>
                </div>
              </div>

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
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setBudgetPreviewUrl(att.url)}
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
                        <button
                          onClick={() => removeAttachment(att.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
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

            <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0"><button onClick={() => setAttachmentManagerOrder(null)} className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-emerald-600 transition-all">Concluir Gerenciamento</button></div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmação de Aprovação de Orçamento */}
      {confirmApprovalOrder && createPortal(
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-slate-100">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/10"><Scale className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">Aprovar Orçamento?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4 mb-6">Deseja confirmar a aprovação do orçamento para o pedido <span className="font-bold text-purple-600">{confirmApprovalOrder.protocol}</span>? Esta ação liberará o status e retornará o processo ao setor de compras para a próxima etapa (Dotação Orçamentária).</p>
              {confirmApprovalOrder.budgetFileUrl && (
                <button onClick={() => setBudgetPreviewUrl(confirmApprovalOrder.budgetFileUrl || null)} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 w-full mb-4 group"><Eye className="w-4 h-4 group-hover:scale-110 transition-transform" /> Visualizar Orçamento Carregado</button>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
              <button onClick={() => { onUpdatePurchaseStatus?.(confirmApprovalOrder.id, 'coletando_dotacao', 'Orçamento Aprovado pelo Administrador'); setConfirmApprovalOrder(null); }} className="w-full py-4 bg-purple-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Confirmar e Liberar</button>
              <button onClick={() => setConfirmApprovalOrder(null)} className="w-full py-4 bg-white text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all">Voltar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE PREVIEW DO ORÇAMENTO (ANEXO) */}
      {budgetPreviewUrl && createPortal(
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="w-full h-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
                <div><h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Visualização de Anexo</h3></div>
              </div>
              <button onClick={() => setBudgetPreviewUrl(null)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"><X className="w-7 h-7" /></button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-200 p-8 flex justify-center">
              {budgetPreviewUrl.startsWith('data:application/pdf') ? (
                <embed src={budgetPreviewUrl} type="application/pdf" width="100%" height="100%" className="rounded-2xl shadow-2xl border border-white/20" />
              ) : (
                <img src={budgetPreviewUrl} alt="Orçamento" className="max-w-full h-auto object-contain rounded-2xl shadow-2xl border border-white/20" />
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center"><button onClick={() => setBudgetPreviewUrl(null)} className="px-12 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:bg-indigo-600 active:scale-95">Fechar Visualização</button></div>
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
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Eye className="w-5 h-5 text-white" /></div><div><h3 className="text-lg font-extrabold text-slate-900">Visualização do Documento</h3><p className="text-xs text-slate-500 font-medium">{previewOrder.protocol} • {previewOrder.documentSnapshot.content.requesterSector || 'Sem Setor'}</p></div></div>
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
