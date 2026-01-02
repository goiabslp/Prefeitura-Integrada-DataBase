
import React from 'react';
import { AppState } from '../types';

interface PageWrapperProps {
  state: AppState;
  pageIndex: number;
  totalPages: number;
  isGenerating: boolean;
  children: React.ReactNode;
  forceHidePageNumbers?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  state,
  pageIndex,
  totalPages,
  isGenerating,
  children,
  ...props
}) => {
  const { branding, document: docConfig, content } = state;
  const watermarkImg = branding.watermark.imageUrl || branding.logoUrl;

  return (
    <div
      className={`bg-white mx-auto flex flex-col relative ${branding.fontFamily} ${isGenerating ? 'mb-0' : 'mb-8 shadow-2xl ring-1 ring-black/5'}`}
      style={{
        width: '210mm',
        height: isGenerating ? '296.5mm' : '297mm',
        padding: '20mm',
        paddingTop: '52mm',
        paddingBottom: '35mm',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Marca d'água */}
      {branding.watermark.enabled && watermarkImg && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img
            src={watermarkImg}
            alt=""
            style={{
              width: `${branding.watermark.size}%`,
              opacity: branding.watermark.opacity / 100,
              objectFit: 'contain',
              filter: branding.watermark.grayscale ? 'grayscale(100%)' : 'none'
            }}
          />
        </div>
      )}

      {/* Borda Superior Colorida */}
      <div className="absolute top-0 left-0 w-full h-3 z-10" style={{ backgroundColor: branding.primaryColor }} />

      {/* Cabeçalho */}
      <div className="absolute top-8 left-[20mm] right-[20mm] h-32 z-20">
        <div className="absolute top-0 flex" style={{
          left: branding.logoAlignment === 'left' ? 0 : branding.logoAlignment === 'center' ? '50%' : 'auto',
          right: branding.logoAlignment === 'right' ? 0 : 'auto',
          transform: branding.logoAlignment === 'center' ? 'translateX(-50%)' : 'none'
        }}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="object-contain" style={{ width: `${branding.logoWidth}mm`, maxHeight: '30mm' }} />
          ) : (
            <div className="bg-slate-50 border rounded flex items-center justify-center text-[10px]" style={{ width: `${branding.logoWidth}mm`, height: '20mm' }}>Logo</div>
          )}
        </div>

        <div className="absolute top-0 right-0 text-right flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">{content.requesterSector || content.signatureSector || 'Prefeitura Municipal'}</span>
          <h2 className="text-sm font-bold tracking-widest uppercase mb-0.5" style={{ color: branding.secondaryColor }}>{docConfig.city}</h2>
          <p className="text-[10px] text-gray-400 font-mono mb-1">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          {/* Protocolo no Header (Todas as páginas) */}
          {/* Protocolo no Header (Todas as páginas) */}
          {(content.protocol || content.protocolId) && (
            <div className="bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-sm mt-1">
              <span className="text-[7px] font-black text-slate-500 uppercase mr-2 tracking-widest">Protocolo:</span>
              <span className="text-[10px] font-mono font-bold text-slate-900 tracking-wider">{content.protocolId || content.protocol}</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-[40mm] left-[20mm] right-[20mm] border-b border-gray-400 z-20" />

      {/* Conteúdo da Página */}
      <main className="flex-1 mt-1 relative z-10 flex flex-col h-full">
        {children}
      </main>

      {/* Rodapé */}
      <div className="absolute bottom-6 left-[20mm] right-[20mm] pt-2 border-t border-gray-300 flex justify-between items-end text-[9px] z-20 bg-white">
        <div className="flex flex-col gap-0.5 max-w-[65%]">
          <span className="font-bold text-gray-800 uppercase tracking-tighter">Prefeitura de São José do Goiabal - Minas Gerais</span>
          <span className="text-gray-400 font-light whitespace-pre-wrap leading-tight">{docConfig.footerText}</span>
        </div>
        <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
          {/* Protocolo no Footer (Todas as páginas) */}
          {(content.protocol || content.protocolId) && (
            <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 rounded border border-slate-200">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-tight">ID:</span>
              <span className="text-[8px] font-mono font-bold text-slate-600">{content.protocolId || content.protocol}</span>
            </div>
          )}
          {docConfig.showPageNumbers && !props.forceHidePageNumbers && (
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-widest">Página {pageIndex + 1} de {totalPages}</span>
          )}
        </div>
      </div>
    </div>
  );
};
