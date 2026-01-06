
import React from 'react';
import { FileDown, ArrowLeft, Edit3, Loader2, FileCheck, Send, Eye, EyeOff, X } from 'lucide-react';

interface FinalizedActionBarProps {
  onDownload: () => void;
  onBack: () => void;
  onEdit: () => void;
  onSend?: () => void;
  isDownloading: boolean;
  documentTitle: string;
  onToggleDigitalSignature?: () => void;
  isDigitalSignatureVisible?: boolean;
  hasDigitalSignature?: boolean;
  viewOnly?: boolean;
}

export const FinalizedActionBar: React.FC<FinalizedActionBarProps> = ({
  onDownload,
  onBack,
  onEdit,
  onSend,
  isDownloading,
  documentTitle,
  showSendButton = false,
  onToggleDigitalSignature,
  isDigitalSignatureVisible = true,
  hasDigitalSignature = false,
  viewOnly = false
}) => {
  return (
    <>
      {/* Botão Enviar Pedido no Lado Oposto (Esquerdo) - Apenas se habilitado e NÃO for visualização */}
      {showSendButton && onSend && !viewOnly && (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[100] animate-fade-in">
          <button
            onClick={onSend}
            className="group bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.3)] p-4 flex flex-col items-center gap-2 w-20 md:w-24 transition-all hover:scale-105 active:scale-95"
            title="Enviar Pedido Administrativo"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-1 group-hover:rotate-12 transition-transform">
              <Send className="w-6 h-6 text-white" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Enviar<br />Pedido</span>

            {/* Indicador de pulso para ação principal */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full animate-ping opacity-75"></span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full"></span>
          </button>
        </div>
      )}

      {/* Barra de Ações Padrão (Direito) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 flex flex-col items-center gap-4 w-20 md:w-24">

          {/* Status Icon - Hide in ViewOnly */}
          {!viewOnly && (
            <div className="flex flex-col items-center mb-2 pb-4 border-b border-white/10 w-full">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
                <FileCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center leading-tight">Pronto</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 w-full">
            {/* Sair/Voltar/Fechar */}
            <button
              onClick={onBack}
              className="flex flex-col items-center justify-center gap-1 w-full p-2 text-slate-400 hover:text-white transition-all group"
              title={viewOnly ? "Fechar Visualização" : "Sair para o Menu"}
            >
              <div className="p-2 rounded-2xl group-hover:bg-white/5 transition-colors">
                {viewOnly ? <X className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">{viewOnly ? 'Fechar' : 'Sair'}</span>
            </button>

            {/* Editing Actions - Hide in ViewOnly */}
            {!viewOnly && (
              <>
                {/* Editar */}
                <button
                  onClick={onEdit}
                  className="flex flex-col items-center justify-center gap-1 w-full p-2 text-slate-400 hover:text-white transition-all group"
                  title="Editar Documento"
                >
                  <div className="p-2 rounded-2xl group-hover:bg-white/5 transition-colors">
                    <Edit3 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest">Editar</span>
                </button>

                {/* Toggle Assinatura Digital */}
                {hasDigitalSignature && onToggleDigitalSignature && (
                  <button
                    onClick={onToggleDigitalSignature}
                    className="flex flex-col items-center justify-center gap-1 w-full p-2 text-slate-400 hover:text-white transition-all group"
                    title={isDigitalSignatureVisible ? "Ocultar Assinatura Digital" : "Mostrar Assinatura Digital"}
                  >
                    <div className="p-2 rounded-2xl group-hover:bg-white/5 transition-colors">
                      {isDigitalSignatureVisible ? (
                        <EyeOff className="w-5 h-5 text-rose-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <span className="text-[6px] font-black uppercase tracking-widest text-center leading-none">
                      {isDigitalSignatureVisible ? "Ocultar\nAssin." : "Mostrar\nAssin."}
                    </span>
                  </button>
                )}

                {/* Divisor */}
                <div className="w-8 h-px bg-white/10 my-1"></div>

                {/* Baixar PDF */}
                <button
                  onClick={onDownload}
                  disabled={isDownloading}
                  className={`flex flex-col items-center justify-center gap-1 w-full p-3 rounded-3xl transition-all active:scale-90 shadow-xl ${isDownloading
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                    }`}
                  title="Baixar o PDF"
                >
                  {isDownloading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileDown className="w-6 h-6" />
                  )}
                  <span className="text-[8px] font-black uppercase tracking-widest mt-1">PDF</span>
                </button>
              </>
            )}
          </div>

          {/* Info lateral */}
          <div className="hidden md:block mt-2 pt-4 border-t border-white/10 w-full text-center">
            <div className="h-10 overflow-hidden relative group cursor-help">
              <span className="text-[7px] text-white/20 font-bold uppercase rotate-90 absolute top-2 left-0 right-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {documentTitle || 'Documento'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
