
import React, { useMemo } from 'react';
import { AppState } from '../types';
import { PageWrapper } from './PageWrapper';

interface LicitacaoPreviewProps {
  state: AppState;
  isGenerating: boolean;
}

export const LicitacaoPreview: React.FC<LicitacaoPreviewProps> = ({ state, isGenerating }) => {
  const { branding, document: docConfig, content } = state;

  // Standard Signature Helper matches DocumentPreview style
  const getSignatureHtml = (name?: string, role?: string, sector?: string) => {
    if (!name) return '';
    return `
      <div class="signature-block mt-auto pt-10 break-inside-avoid flex flex-col items-center justify-center" style="line-height: 0.3;">
        <div class="w-64 border-t border-slate-900 text-center" style="padding-top: 0px; border-color: #0f172a;">
             <p style="margin: 0; padding: 0; line-height: 1.1; font-size: 10pt; font-weight: 700; text-transform: uppercase; color: #0f172a;">${name}</p>
             <p style="margin: 0; padding: 0; line-height: 1.1; font-size: 8pt; color: #64748b; margin-top: 2px;">${role || 'Responsável'}</p>
             ${sector ? `<p style="margin: 0; padding: 0; line-height: 1.1; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-top: 2px;">${sector}</p>` : ''}
        </div>
      </div>
    `;
  };

  const pages = useMemo(() => {
    const TOTAL_LINES_CAPACITY = 36;
    const SECURITY_MARGIN_LINES = 3;
    const MAX_LINES_PER_PAGE = TOTAL_LINES_CAPACITY - SECURITY_MARGIN_LINES; // 33
    const CHARS_PER_LINE = 80;

    const historicStages = content.licitacaoStages || [];

    // Construct the "Current" stage using current form data
    const currentStage = {
      id: 'current',
      title: content.currentStageIndex !== undefined
        ? `Etapa ${(content.currentStageIndex + 1).toString().padStart(2, '0')}`
        : 'Etapa Atual',
      body: content.body,
      signatureName: content.signatureName,
      signatureRole: content.signatureRole,
      signatureSector: content.signatureSector
    };

    const allStages = [...historicStages, currentStage];

    // Process stages INDEPENDENTLY to enforce page breaks
    let allPages: string[] = [];

    allStages.forEach((stage, index) => {
      let stageHtml = '';
      const stageInternalTitle = stage.title || `Etapa ${(index + 1).toString().padStart(2, '0')}`;

      // Header for the stage
      stageHtml += `<h3 class="text-blue-900 font-bold uppercase text-sm mb-6 pb-2 border-b border-blue-100">${stageInternalTitle}</h3>`;

      // Body
      stageHtml += stage.body || '<p class="text-slate-400 italic py-4">[Conteúdo da etapa em elaboração]</p>';

      // Signature (Always at bottom of this stage's content)
      stageHtml += getSignatureHtml(stage.signatureName, stage.signatureRole, stage.signatureSector);

      // Split THIS stage into its own pages
      // Fix: Use lookbehind for <br> so it is preserved in the previous block instead of consumed
      const blocks = stageHtml.split(/(?<=<\/p>)|(?<=<\/div>)|(?<=<br\s*\/?>)/g);

      // Initialize first page for this stage
      let currentStagePages: string[] = [];
      let currentPageContent = '';
      let currentLinesUsed = 0;

      blocks.forEach((blockHTML) => {
        if (!blockHTML?.trim()) return;
        const plainText = blockHTML.replace(/<[^>]+>/g, '') || ' ';
        const isSignature = blockHTML.includes('signature-block');

        // Estimate lines
        let linesInBlock = Math.max(1, Math.ceil(plainText.length / CHARS_PER_LINE));

        // Adjust estimation for special blocks
        if (isSignature) linesInBlock += 6;
        if (blockHTML.includes('<h3')) linesInBlock += 3;

        if ((currentLinesUsed + linesInBlock) > MAX_LINES_PER_PAGE) {
          // Push current page
          currentStagePages.push(currentPageContent);
          // Start new page
          currentPageContent = blockHTML;
          currentLinesUsed = linesInBlock;
        } else {
          currentPageContent += blockHTML;
          currentLinesUsed += linesInBlock;
        }
      });

      if (currentPageContent) currentStagePages.push(currentPageContent);

      // append this stage's pages to the master list
      allPages = [...allPages, ...currentStagePages];
    });

    return allPages;
  }, [content.body, content.licitacaoStages, content.signatureName, content.signatureRole, content.signatureSector, content.currentStageIndex]);

  return (
    <>
      {pages.map((pageHtml, pageIndex) => (
        <PageWrapper key={pageIndex} state={state} pageIndex={pageIndex} totalPages={pages.length} isGenerating={isGenerating}>
          {pageIndex === 0 && (
            <div className="mb-6">
              <div className="bg-blue-900 text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-[0.3em] mb-4 text-center">
                Processo Administrativo / Licitatório
              </div>
              <h1 className="font-black leading-tight tracking-tight text-[24pt] text-blue-900 text-center uppercase">
                {content.title}
              </h1>
              <div className="w-20 h-1 bg-blue-900 mx-auto mt-4" />
            </div>
          )}
          <div className="max-w-none w-full text-gray-800 leading-relaxed text-justify text-[10.5pt] whitespace-pre-wrap font-serif break-words" dangerouslySetInnerHTML={{ __html: pageHtml }} />

          {/* Global Digital Signature Footer (if enabled) - Only on last page */}
          {pageIndex === pages.length - 1 && content.digitalSignature?.enabled && (
            <div className="mt-auto pt-10 flex justify-center">
              <div className="text-[7pt] text-slate-500 uppercase tracking-widest leading-tight text-center">
                <p className="font-bold text-emerald-600">Documento Finalizado e Consolidado</p>
                <p>Hash Validador: <span className="font-mono text-slate-900">{content.digitalSignature.id}</span></p>
              </div>
            </div>
          )}
        </PageWrapper>
      ))}
    </>
  );
};
