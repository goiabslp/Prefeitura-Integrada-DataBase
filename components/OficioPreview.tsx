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
        currentPageText += text + '\n\n';
        currentLinesUsed += linesInParagraph + 1;
      } else {
        const availableLines = limit - currentLinesUsed;

        if (availableLines <= 2) {
          resultPages.push(currentPageText.trim());
          currentPageText = text + '\n\n';
          currentLinesUsed = linesInParagraph + 1;
          isFirstPage = false;
        } else {
          const charsFit = availableLines * CHARS_PER_LINE;
          const part1 = text.substring(0, charsFit);
          const part2 = text.substring(charsFit);

          currentPageText += part1;
          resultPages.push(currentPageText.trim());

          currentPageText = part2 + '\n\n';
          currentLinesUsed = Math.ceil(part2.length / CHARS_PER_LINE) + 1;
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
                {docConfig.showLeftBlock && content.leftBlockText && (
                  <div
                    className="whitespace-pre-wrap max-w-[45%] leading-snug"
                    style={{
                      fontSize: `${docConfig.leftBlockStyle?.size || 10}pt`,
                      color: docConfig.leftBlockStyle?.color || '#191822',
                      fontWeight: 'normal'
                    }}
                  >
                    {content.leftBlockText}
                  </div>
                )}
                {docConfig.showRightBlock && content.rightBlockText && (
                  <div
                    className="whitespace-pre-wrap text-right max-w-[45%] leading-snug"
                    style={{
                      fontSize: `${docConfig.rightBlockStyle?.size || 10}pt`,
                      color: docConfig.rightBlockStyle?.color || '#191822',
                      fontWeight: 'normal'
                    }}
                  >
                    {content.rightBlockText}
                  </div>
                )}
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
            <div className="mt-auto pt-12 flex flex-col items-center text-center">
              {content.digitalSignature?.enabled && (
                <div className="mb-2 text-[7pt] text-slate-500 uppercase tracking-widest leading-tight">
                  <p className="font-bold text-emerald-600">Assinado Digitalmente</p>
                  <p>Autenticador Mobile 2FA</p>
                  <p>IP: {content.digitalSignature.ip}</p>
                  <p>ID: <span className="font-mono">{content.digitalSignature.id}</span></p>
                  <p className="text-[6pt] normal-case opacity-70">{new Date(content.digitalSignature.date).toLocaleString('pt-BR')}</p>
                </div>
              )}
              <div className="w-64 border-t border-slate-900 pt-2">
                <p className="font-bold uppercase text-[10pt]">{content.signatureName}</p>
                <p className="text-[8pt] text-slate-500">{content.signatureRole}</p>
                <p className="text-[7pt] text-slate-400 uppercase tracking-widest">{content.signatureSector}</p>
              </div>
            </div>
          )}
        </PageWrapper>
      ))}
    </>
  );
};