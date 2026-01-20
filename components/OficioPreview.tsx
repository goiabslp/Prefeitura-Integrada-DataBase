import React, { useMemo } from 'react';
import { AppState } from '../types';
import { PageWrapper } from './PageWrapper';

interface OficioPreviewProps {
  state: AppState;
  isGenerating: boolean;
}

export const OficioPreview: React.FC<OficioPreviewProps> = ({ state, isGenerating }) => {
  const { branding, document: docConfig, content } = state;

  const pages = useMemo(() => {
    // Calibração para folha A4 com fonte 11pt e entrelinha 1.5
    const CHARS_PER_LINE = 85;
    const SECURITY_MARGIN_LINES = 3; // LIMITE DE 03 LINHAS ANTES DO RODAPÉ
    const TOTAL_LINES_CAPACITY = 40;

    const LIMIT_NORMAL = TOTAL_LINES_CAPACITY - SECURITY_MARGIN_LINES;
    const LIMIT_FIRST_PAGE = 24; // Espaço reduzido na primeira página devido ao cabeçalho/blocos

    const paragraphs = content.body.split('\n');

    const resultPages: string[] = [];
    let currentPageText = '';
    let currentLinesUsed = 0;
    let isFirstPage = true;

    const getLimit = () => isFirstPage ? LIMIT_FIRST_PAGE : LIMIT_NORMAL;

    paragraphs.forEach((paragraph) => {
      const text = paragraph.trim();

      if (!text) {
        if (currentLinesUsed + 1 > getLimit()) {
          resultPages.push(currentPageText.trim());
          currentPageText = '\n';
          currentLinesUsed = 1;
          isFirstPage = false;
        } else {
          currentPageText += '\n';
          currentLinesUsed += 1;
        }
        return;
      }

      const linesInParagraph = Math.max(1, Math.ceil(text.length / CHARS_PER_LINE));
      const limit = getLimit();

      if ((currentLinesUsed + linesInParagraph) <= limit) {
        currentPageText += text + '\n';
        currentLinesUsed += linesInParagraph;
      } else {
        const availableLines = limit - currentLinesUsed;

        if (availableLines <= 2) {
          resultPages.push(currentPageText.trim());
          currentPageText = text + '\n';
          currentLinesUsed = linesInParagraph;
          isFirstPage = false;
        } else {
          const charsFit = availableLines * CHARS_PER_LINE;
          const part1 = text.substring(0, charsFit);
          const part2 = text.substring(charsFit);

          currentPageText += part1;
          resultPages.push(currentPageText.trim());

          currentPageText = part2 + '\n';
          currentLinesUsed = Math.ceil(part2.length / CHARS_PER_LINE);
          isFirstPage = false;
        }
      }
    });

    if (currentPageText) resultPages.push(currentPageText.trim());
    return resultPages;
  }, [content.body]);

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