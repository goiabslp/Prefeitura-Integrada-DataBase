
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
  onToggleDigitalSignature,
  isDigitalSignatureVisible = true,
  hasDigitalSignature = false,
  viewOnly = false
}) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] animate-fade-in">
      <div className="bg-[#1A2130]/98 backdrop-blur-3xl border border-white/10 rounded-[4rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7)] p-5 flex flex-col items-center gap-6 w-20 md:w-24">

        {/* PRONTO / ENVIAR BUTTON */}
        {!viewOnly && (
          <div className="flex flex-col items-center w-full">
            <button
              onClick={onSend || (() => { })}
              className="group flex flex-col items-center gap-2 w-full transition-all active:scale-95"
              title="Confirmar e Enviar"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/30 group-hover:border-emerald-500/50 transition-all shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                <FileCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.1em] text-center">Pronto</span>
            </button>
            <div className="w-10 h-px bg-white/10 mt-6 opacity-30"></div>
          </div>
        )}

        <div className="flex flex-col items-center gap-7 w-full">
          {/* SAIR BUTTON */}
          <button
            onClick={onBack}
            className="flex flex-col items-center justify-center gap-2 w-full text-slate-400 hover:text-white transition-all group"
            title={viewOnly ? "Fechar Visualização" : "Sair para o Menu"}
          >
            <div className="transition-transform group-hover:-translate-x-1 duration-300">
              {viewOnly ? <X className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.1em] leading-none">Sair</span>
          </button>

          {/* EDITAR BUTTON */}
          {!viewOnly && (
            <button
              onClick={onEdit}
              className="flex flex-col items-center justify-center gap-2 w-full text-slate-400 hover:text-white transition-all group"
              title="Editar Documento"
            >
              <div className="transition-transform group-hover:rotate-12 duration-300">
                <Edit3 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.1em] leading-none">Editar</span>
            </button>
          )}

          {/* PDF BUTTON */}
          <div className="flex flex-col items-center w-full">
            <div className="w-10 h-px bg-white/10 mb-6 opacity-30"></div>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className={`group relative flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-[1.25rem] transition-all active:scale-90 shadow-[0_15px_40px_-10px_rgba(79,70,229,0.5)] ${isDownloading
                ? 'bg-indigo-500/20 text-indigo-400 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              title="Baixar o PDF"
            >
              {isDownloading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <FileDown className="w-7 h-7" />
                  <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
                </div>
              )}
            </button>
            <div className="w-10 h-px bg-white/10 mt-7 opacity-30"></div>
          </div>
        </div>

        {/* Digital Signature Toggle (Only if applicable) */}
        {!viewOnly && hasDigitalSignature && onToggleDigitalSignature && (
          <button
            onClick={onToggleDigitalSignature}
            className="flex flex-col items-center justify-center gap-1 w-full text-slate-500 hover:text-white transition-all group mt-[-0.5rem]"
            title={isDigitalSignatureVisible ? "Ocultar Assinatura Digital" : "Mostrar Assinatura Digital"}
          >
            <div className="mb-1">
              {isDigitalSignatureVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-center leading-none opacity-60">
              {isDigitalSignatureVisible ? "Ocultar\nAssin." : "Mostrar\nAssin."}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
