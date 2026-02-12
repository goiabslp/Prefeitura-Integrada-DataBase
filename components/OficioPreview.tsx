import React, { useMemo } from 'react';
import { AppState } from '../types';
import { PageWrapper } from './PageWrapper';
import { X } from 'lucide-react';

interface OficioPreviewProps {
  state: AppState;
  isGenerating: boolean;
  onRemoveImage?: (id: string) => void;
}

export const OficioPreview: React.FC<OficioPreviewProps> = ({ state, isGenerating, onRemoveImage }) => {
  const { branding, document: docConfig, content } = state;

  const pages = useMemo(() => {
    // Calibração para folha A4 com fonte 11pt e entrelinha 1.5
    // CHARS_PER_LINE used only for pagination estimation now
    const CHARS_PER_LINE = 90;
    const SECURITY_MARGIN_LINES = 3;
    const TOTAL_LINES_CAPACITY = 40;
    const IMAGE_LINES_ALLOWANCE = 12;

    const LIMIT_NORMAL = TOTAL_LINES_CAPACITY - SECURITY_MARGIN_LINES;
    const LIMIT_FIRST_PAGE = 24;

    // Regex to split by image tokens
    const parts = content.body.split(/{{(IMG::\d+)}}/g);

    const resultPages: React.ReactNode[][] = [];
    let currentPageBlocks: React.ReactNode[] = [];
    let currentLinesUsed = 0;
    let isFirstPage = true;

    const getLimit = () => isFirstPage ? LIMIT_FIRST_PAGE : LIMIT_NORMAL;

    const formatText = (text: string) => {
      if (!text) return '\u00A0';

      const parts = text.split(/(<\/?(?:b|strong|i|em|u)>)/g);

      let isBold = false;
      let isItalic = false;
      let isUnderline = false;

      return parts.map((part, index) => {
        if (part === '<b>' || part === '<strong>') { isBold = true; return null; }
        if (part === '</b>' || part === '</strong>') { isBold = false; return null; }
        if (part === '<i>' || part === '<em>') { isItalic = true; return null; }
        if (part === '</i>' || part === '</em>') { isItalic = false; return null; }
        if (part === '<u>') { isUnderline = true; return null; }
        if (part === '</u>') { isUnderline = false; return null; }
        if (part === '') return null;

        return (
          <span key={index} className={`
            ${isBold ? 'font-bold' : ''}
            ${isItalic ? 'italic' : ''}
            ${isUnderline ? 'underline' : ''}
          `}>
            {part}
          </span>
        );
      });
    };

    const nextPage = () => {
      resultPages.push(currentPageBlocks);
      currentPageBlocks = [];
      currentLinesUsed = 0;
      isFirstPage = false;
    };

    // Helper: Push a block of text (paragraph)
    const pushParagraph = (text: string) => {
      if (!text) {
        // Empty line
        if (currentLinesUsed + 1 > getLimit()) {
          nextPage();
        }
        currentPageBlocks.push(<div key={`empty-${Math.random()}`} className="min-h-[1.5em]">{'\u00A0'}</div>);
        currentLinesUsed += 1;
        return;
      }

      // Estimate lines
      const estLines = Math.ceil(text.length / CHARS_PER_LINE) || 1;
      const limit = getLimit();
      const remaining = limit - currentLinesUsed;

      if (estLines <= remaining) {
        // Fits entirely
        currentPageBlocks.push(
          <div key={`p-${Math.random()}`} className="w-full text-justify mb-0 whitespace-normal leading-relaxed">
            {formatText(text)}
          </div>
        );
        currentLinesUsed += estLines;
      } else {
        // Needs split
        let splitIndex = remaining * CHARS_PER_LINE;
        if (splitIndex > text.length) splitIndex = text.length;

        // Backtrack to space
        const safeSplit = text.lastIndexOf(' ', splitIndex);
        const cutoff = (safeSplit > 0) ? safeSplit : splitIndex;

        const firstPart = text.substring(0, cutoff);
        const restPart = text.substring(cutoff + 1);

        currentPageBlocks.push(
          <div key={`p-split-${Math.random()}`} className="w-full text-justify mb-0 whitespace-normal leading-relaxed">
            {formatText(firstPart)}
          </div>
        );
        currentLinesUsed += remaining;

        nextPage();
        pushParagraph(restPart);
      }
    };

    const pushImage = (imageId: string) => {
      const imgData = content.images?.find(i => i.id === imageId);
      if (!imgData) return;

      if (currentLinesUsed + IMAGE_LINES_ALLOWANCE > getLimit()) {
        nextPage();
      }

      currentPageBlocks.push(
        <div key={`img-${imageId}`} className="relative w-full flex justify-center my-4 group">
          <div className="relative inline-block">
            <img
              src={imgData.url}
              alt="Anexo"
              className="max-w-full h-auto max-h-[300px] object-contain rounded-sm border border-black shadow-sm transition-all"
              style={{ width: imgData.width ? `${imgData.width}px` : 'auto' }}
            />
            {!isGenerating && onRemoveImage && (
              <button
                onClick={() => onRemoveImage(imageId)}
                className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 print:hidden"
                title="Remover Imagem"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      );
      currentLinesUsed += IMAGE_LINES_ALLOWANCE;
    };

    parts.forEach((part) => {
      if (part.startsWith('IMG::')) {
        const imageId = part.replace('IMG::', '');
        pushImage(imageId);
      } else {
        const paragraphs = part.split('\n');
        paragraphs.forEach((paragraph) => {
          pushParagraph(paragraph);
        });
      }
    });

    if (currentPageBlocks.length > 0) resultPages.push(currentPageBlocks);
    if (resultPages.length === 0) resultPages.push([]);

    return resultPages;
  }, [content.body, content.images, isGenerating]);

  return (
    <>
      {pages.map((pageText, pageIndex) => (
        <PageWrapper key={pageIndex} state={state} pageIndex={pageIndex} totalPages={pages.length} isGenerating={isGenerating}>
          {pageIndex === 0 && (
            <div className="flex flex-col gap-6 mb-6">
              <div className="flex justify-between items-start">
                <div
                  className={`whitespace-pre-wrap max-w-[45%] leading-snug ${(!docConfig.showLeftBlock || !content.leftBlockText) ? 'invisible' : ''}`}
                  style={{
                    fontSize: `${docConfig.leftBlockStyle?.size || 10}pt`,
                    color: docConfig.leftBlockStyle?.color || '#191822',
                    fontWeight: 'normal'
                  }}
                >
                  {content.leftBlockText || ' '}
                </div>

                <div
                  className={`whitespace-pre-wrap text-right max-w-[45%] leading-snug ${(!docConfig.showRightBlock || !content.rightBlockText) ? 'invisible' : ''}`}
                  style={{
                    fontSize: `${docConfig.rightBlockStyle?.size || 10}pt`,
                    color: docConfig.rightBlockStyle?.color || '#191822',
                    fontWeight: 'normal'
                  }}
                >
                  {content.rightBlockText || ' '}
                </div>
              </div>
              <h1
                className="font-bold leading-tight tracking-tight"
                style={{
                  fontSize: `${docConfig.titleStyle?.size || 12}pt`,
                  color: docConfig.titleStyle?.color || branding.primaryColor,
                  textAlign: docConfig.titleStyle?.alignment || 'left'
                }}
              >
                {content.title}
              </h1>
            </div>
          )}

          <div
            className="text-gray-700 leading-relaxed text-justify text-[11pt] whitespace-pre-wrap word-break-break-word font-sans"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {pageText}
          </div>

          {pageIndex === pages.length - 1 && docConfig.showSignature && (
            <div className="mt-auto pt-16 flex flex-col items-center text-center relative pointer-events-none">
              {content.digitalSignature?.enabled && (
                <div className="absolute -top-12 z-0 opacity-90 mix-blend-multiply filter blur-[0.5px]">
                  <div className="w-56 h-24 border-[3px] border-emerald-600/60 rounded-xl flex items-center justify-center p-2 rotate-[-4deg] relative ">
                    {/* Inner Border */}
                    <div className="absolute inset-1 border border-emerald-600/30 rounded-lg"></div>

                    {/* Content */}
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse"></div>
                        <span className="text-[14px] font-[900] text-emerald-700 uppercase tracking-tighter font-serif">ASSINADO DIGITALMENTE</span>
                      </div>
                      <div className="text-[7.5px] font-bold text-emerald-800 uppercase tracking-widest flex flex-col items-center leading-tight">
                        <span>Autenticado via Token 2FA</span>
                        <span className="mt-0.5 font-mono text-emerald-900 bg-emerald-100/50 px-1 rounded">{new Date(content.digitalSignature.date).toLocaleString('pt-BR')}</span>
                        <span className="text-[6px] text-emerald-600 mt-0.5">ID: {content.digitalSignature.id.substring(0, 18)}...</span>
                      </div>
                    </div>

                    {/* Checkmark Background Watermark */}
                    <svg className="absolute w-12 h-12 text-emerald-200/40 -z-10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Signature Line Area */}
              <div className="w-72 border-t border-slate-900 pt-3 relative z-10">
                <p className="font-bold uppercase text-[11pt] tracking-wide text-slate-900">{content.signatureName}</p>
                <p className="text-[9pt] text-slate-600 font-medium">{content.signatureRole}</p>
                <p className="text-[7pt] text-slate-400 uppercase tracking-[0.2em] mt-1">{content.signatureSector}</p>
              </div>
            </div>
          )}
        </PageWrapper>
      ))}
    </>
  );
};