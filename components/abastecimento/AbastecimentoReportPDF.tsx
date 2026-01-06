import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AppState } from '../../types';
import { AbastecimentoRecord } from '../../services/abastecimentoService';
import { PageWrapper } from '../PageWrapper';
import { Printer, X, FileSpreadsheet, Fuel, Building2, Calendar, LayoutDashboard } from 'lucide-react';

interface AbastecimentoReportPDFProps {
    data: {
        records: (AbastecimentoRecord & { derivedSector: string; derivedPlate: string })[];
        totalLitersByFuel: Record<string, number>;
        totalValueBySector: Record<string, number>;
        totalValueByFuel: Record<string, number>;
        grandTotalLiters: number;
        grandTotalValue: number;
    };
    filters: {
        startDate: string;
        endDate: string;
        station: string;
        sector: string;
        vehicle: string;
        fuelType: string;
    };
    state: AppState;
    onClose: () => void;
}

export const AbastecimentoReportPDF: React.FC<AbastecimentoReportPDFProps> = ({
    data,
    filters,
    state,
    onClose
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadPdf = async () => {
        setIsGenerating(true);
        setTimeout(async () => {
            const element = document.getElementById('report-pdf-content');
            if (element) {
                const opt = {
                    margin: 0,
                    filename: `Relatorio-Abastecimento-${new Date().getTime()}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        letterRendering: true,
                        scrollY: 0,
                        scrollX: 0
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: 'css' }
                };
                // @ts-ignore
                await window.html2pdf().from(element).set(opt).save();
            }
            setIsGenerating(false);
        }, 300);
    };

    // Pagination Logic
    const ITEMS_PER_PAGE = 14;
    const totalPages = Math.ceil(data.records.length / ITEMS_PER_PAGE) || 1;

    // Create a state copy without watermark for the report
    const reportState = {
        ...state,
        branding: {
            ...state.branding,
            watermark: {
                ...state.branding.watermark,
                enabled: false
            }
        }
    };

    const renderSummaryPage = () => (
        <PageWrapper state={reportState} pageIndex={0} totalPages={totalPages} isGenerating={isGenerating}>
            <div className="flex flex-col gap-6">
                {/* Main Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                        <h1 className="text-[18pt] font-black uppercase tracking-tight text-slate-900">Relatório de Abastecimentos</h1>
                        <p className="text-[10pt] font-bold text-slate-500 uppercase tracking-widest mt-1">Consolidação de Consumo e Custos</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-slate-900 text-white px-4 py-2 rounded-lg">
                            <p className="text-[7pt] font-black uppercase opacity-60">Data de Emissão</p>
                            <p className="text-[11pt] font-mono font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                {/* Filters Summary */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="col-span-3 pb-2 border-b border-slate-200 mb-2">
                        <h3 className="text-[8pt] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Parâmetros do Relatório
                        </h3>
                    </div>
                    <div>
                        <p className="text-[7pt] font-black text-slate-400 uppercase">Período</p>
                        <p className="text-[9pt] font-bold text-slate-700">
                            {filters.startDate ? new Date(filters.startDate).toLocaleDateString('pt-BR') : 'Início'}
                            <span className="mx-2 opacity-30">até</span>
                            {filters.endDate ? new Date(filters.endDate).toLocaleDateString('pt-BR') : 'Hoje'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[7pt] font-black text-slate-400 uppercase">Posto / Combustível</p>
                        <p className="text-[9pt] font-bold text-slate-700 capitalize">
                            {filters.station === 'all' ? 'Todos os Postos' : filters.station}
                            <span className="mx-1 opacity-30">|</span>
                            {filters.fuelType === 'all' ? 'Todos' : filters.fuelType}
                        </p>
                    </div>
                    <div>
                        <p className="text-[7pt] font-black text-slate-400 uppercase">Setor / Veículo</p>
                        <p className="text-[9pt] font-bold text-slate-700">
                            {filters.sector === 'all' ? 'Todos os Setores' : filters.sector}
                            <span className="mx-1 opacity-30">|</span>
                            {filters.vehicle === 'all' ? 'Todos' : filters.vehicle}
                        </p>
                    </div>
                </div>

                {/* Grand Totals */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex items-center justify-between overflow-hidden relative">
                        <FileSpreadsheet className="absolute right-[-10%] top-[-20%] w-32 h-32 opacity-10" />
                        <div className="relative z-10">
                            <p className="text-[8pt] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Volume Total (L)</p>
                            <p className="text-4xl font-black tracking-tighter">{data.grandTotalLiters.toFixed(1)} <span className="text-xl text-slate-500">L</span></p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-900 flex items-center justify-between overflow-hidden relative">
                        <LayoutDashboard className="absolute right-[-10%] top-[-20%] w-32 h-32 opacity-5 text-slate-900" />
                        <div className="relative z-10">
                            <p className="text-[8pt] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Investimento Total</p>
                            <p className="text-4xl font-black tracking-tighter text-slate-900">R$ {data.grandTotalValue.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Breakdowns Grid */}
                <div className="grid grid-cols-2 gap-6 items-start">
                    {/* Fuel Breakdown */}
                    <div className="space-y-4">
                        <h3 className="text-[10pt] font-black uppercase tracking-[0.15em] text-slate-900 flex items-center gap-2">
                            <Fuel className="w-4 h-4 text-indigo-600" /> Por Combustível
                        </h3>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-[7pt] font-black uppercase tracking-widest text-slate-500">
                                        <th className="px-4 py-2">Tipo</th>
                                        <th className="px-4 py-2 text-right">Volume (L)</th>
                                        <th className="px-4 py-2 text-right">Valor (R$)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(data.totalLitersByFuel).map(([fuel, liters]) => (
                                        <tr key={fuel} className="text-[8pt] font-bold text-slate-700">
                                            <td className="px-4 py-3 uppercase">{fuel}</td>
                                            <td className="px-4 py-3 text-right">{(liters as number).toFixed(1)}</td>
                                            <td className="px-4 py-3 text-right">R$ {(data.totalValueByFuel[fuel] as number).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sector Breakdown */}
                    <div className="space-y-4">
                        <h3 className="text-[10pt] font-black uppercase tracking-[0.15em] text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-indigo-600" /> Por Secretaria / Setor
                        </h3>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-[7pt] font-black uppercase tracking-widest text-slate-500">
                                        <th className="px-4 py-2">Setor</th>
                                        <th className="px-4 py-2 text-right">Gasto Total</th>
                                        <th className="px-4 py-2 text-right">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(data.totalValueBySector)
                                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                                        .slice(0, 10) // Top 10 to fit
                                        .map(([sector, value]) => (
                                            <tr key={sector} className="text-[8pt] font-bold text-slate-700">
                                                <td className="px-4 py-2.5 uppercase truncate max-w-[120px]">{sector}</td>
                                                <td className="px-4 py-2.5 text-right">R$ {(value as number).toFixed(2)}</td>
                                                <td className="px-4 py-2.5 text-right text-[7pt] text-slate-400">
                                                    {data.grandTotalValue > 0 ? (((value as number) / data.grandTotalValue) * 100).toFixed(1) : 0}%
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </PageWrapper>
    );

    const renderRecordPages = () => {
        const pages = [];

        // 1. Sort records by Vehicle then Date
        const sortedRecords = [...data.records].sort((a, b) => {
            if (a.vehicle < b.vehicle) return -1;
            if (a.vehicle > b.vehicle) return 1;
            // Same vehicle, sort by date desc
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        // 2. Process with summary rows
        const processedItems: Array<any> = [];
        let currentVehicle = '';
        let vehicleLiters = 0;
        let vehicleCost = 0;

        sortedRecords.forEach((r, index) => {
            // Check if vehicle changed or first record
            if (r.vehicle !== currentVehicle) {
                // If not first record, push previous vehicle summary
                if (currentVehicle !== '') {
                    processedItems.push({
                        type: 'summary',
                        vehicle: currentVehicle,
                        liters: vehicleLiters,
                        cost: vehicleCost
                    });
                    // Add Spacer between groups and new Header
                    processedItems.push({ type: 'spacer' });
                    processedItems.push({ type: 'header' });
                }

                // Reset for new vehicle
                currentVehicle = r.vehicle;
                vehicleLiters = 0;
                vehicleCost = 0;
            }

            // Accumulate
            vehicleLiters += r.liters;
            vehicleCost += r.cost;
            processedItems.push({ type: 'record', ...r });

            // If last record, push final summary
            if (index === sortedRecords.length - 1) {
                processedItems.push({
                    type: 'summary',
                    vehicle: currentVehicle,
                    liters: vehicleLiters,
                    cost: vehicleCost
                });
            }
        });

        // Skip first 8 records already shown on summary page (Note: Summary page logic might need adjustment if it blindly takes 8 raw records, but keeping it simple for now as summary is "First Records")
        // BETTER: Just paginate the processedItems directly. The summary page shows "First Records", maybe we should skip showing them there if we strictly want grouped view? 
        // User asked for "organized" list. Let's paginate the processed items starting from index 0 for the detailed view if practical, or stick to "pages" logic.
        // Current logic: Summary page shows raw sliced[0..8]. Detailed pages show sliced[8..end].
        // Refinement: Showing "First records" on summary page might be confusing if they are not grouped.
        // Let's assume detail pages are the main list.
        // Adjust pagination to handling processed items.
        // However, summary page slices from `data.records`. We should probably hide the "Primeiros Registros" table or update it.
        // For compliance with "exiba todos...", I will render ALL items in the paginated section.
        // The summary page's "Primeiros Registros" is a preview. I'll leave it as is for now, but focus on the main list.
        // Wait, if I change the order in detail pages, it might not match the preview.
        // Let's rely on `sortedRecords` for consistency if we wanted, but the prompt implies the MAIN list organization.

        // Actually, let's use the processedItems for pagination.
        // To avoid duplication or gap issues, let's start pagination from item 0 of processedItems.
        // Pagination loop:

        for (let i = 0; i < processedItems.length; i += ITEMS_PER_PAGE) {
            const pageItems = processedItems.slice(i, i + ITEMS_PER_PAGE);
            const pageIndex = Math.floor(i / ITEMS_PER_PAGE) + 1;

            pages.push(
                <PageWrapper key={pageIndex} state={reportState} pageIndex={pageIndex} totalPages={Math.ceil(processedItems.length / ITEMS_PER_PAGE)} isGenerating={isGenerating}>
                    <div className="flex flex-col h-full">
                        <div className="pb-4 border-b border-slate-200 mb-6">
                            <h2 className="text-[12pt] font-black uppercase text-slate-900">Listagem de Abastecimentos</h2>
                            <p className="text-[8pt] text-slate-500 font-bold uppercase tracking-widest leading-none">Página {pageIndex}</p>
                        </div>

                        <table className="w-full border-collapse">
                            {/* Only show main THEAD if the first item is NOT a header (to avoid double header at top), 
                                OR always show it for page structure? 
                                User asked for header "A cada nova lista". 
                                If we put it inline, the top of the page might need one too if the split happened in the middle of a group.
                                However, if the page starts with a 'header' item, we might have two headers if we keep the main one.
                                Let's strictly follow: Main page header is good for page context. Inline header is for "Nova lista".
                                If page starts with 'header' item, we can conditionally hide the main THEAD or just let it be double (standard table usually has main header).
                                Actually, usually if you break by group, you might want the group header.
                                Let's render the headers as requested inline.
                            */}
                            <thead className="bg-slate-50 border-y border-slate-200">
                                <tr className="text-[7pt] font-black uppercase tracking-widest text-slate-500">
                                    <th className="px-3 py-2 text-left w-[12%]">Data</th>
                                    <th className="px-3 py-2 text-left w-[22%]">Nº Nota</th>
                                    <th className="px-3 py-2 text-left w-[22%]">Veículo</th>
                                    <th className="px-3 py-2 text-left w-[18%]">Setor</th>
                                    <th className="px-3 py-2 text-left w-[11%]">Litros</th>
                                    <th className="px-3 py-2 text-left w-[15%] whitespace-nowrap">Custo (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageItems.map((item, idx) => {
                                    if (item.type === 'spacer') {
                                        return (
                                            <tr key={`spc-${idx}`} className="h-6 border-none bg-transparent">
                                                <td colSpan={6}></td>
                                            </tr>
                                        );
                                    }
                                    if (item.type === 'header') {
                                        // If header is the first item on the page, skip it as the main THEAD already covers it
                                        if (idx === 0) return null;
                                        return (
                                            <tr key={`hdr-${idx}`} className="bg-slate-200/50 border-y border-slate-300">
                                                <th className="px-3 py-2 text-left w-[12%] text-[7pt] font-black uppercase tracking-widest text-slate-600">Data</th>
                                                <th className="px-3 py-2 text-left w-[22%] text-[7pt] font-black uppercase tracking-widest text-slate-600">Nº Nota</th>
                                                <th className="px-3 py-2 text-left w-[22%] text-[7pt] font-black uppercase tracking-widest text-slate-600">Veículo</th>
                                                <th className="px-3 py-2 text-left w-[18%] text-[7pt] font-black uppercase tracking-widest text-slate-600">Setor</th>
                                                <th className="px-3 py-2 text-left w-[11%] text-[7pt] font-black uppercase tracking-widest text-slate-600">Litros</th>
                                                <th className="px-3 py-2 text-left w-[15%] text-[7pt] font-black uppercase tracking-widest text-slate-600 whitespace-nowrap">Custo (R$)</th>
                                            </tr>
                                        );
                                    }
                                    if (item.type === 'summary') {
                                        return (
                                            <tr key={`sum-${idx}`} className="bg-slate-100/80 border-t-2 border-slate-200">
                                                <td colSpan={4} className="px-3 py-3 text-right text-[8pt] font-black text-slate-900 uppercase tracking-wide">
                                                    TOTAL
                                                </td>
                                                <td className="px-3 py-3 text-[8pt] font-black text-slate-900">
                                                    {item.liters.toFixed(1)} Litros
                                                </td>
                                                <td className="px-3 py-3 text-[8pt] font-black text-slate-900">
                                                    R$ {item.cost.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    }
                                    const r = item;
                                    return (
                                        <tr key={idx} className="text-[7.5pt] font-medium text-slate-700">
                                            <td className="px-3 py-2">{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                                            <td className="px-3 py-2 uppercase truncate font-mono text-[9px]">{r.invoiceNumber || '-'}</td>
                                            <td className="px-3 py-2 uppercase">
                                                <p className="font-bold leading-none">{r.vehicle}</p>
                                                <p className="text-[5.5pt] text-slate-400 font-bold mt-0.5">{r.derivedPlate}</p>
                                            </td>
                                            <td className="px-3 py-2 uppercase truncate text-[7pt] font-bold text-slate-500">{r.derivedSector}</td>
                                            <td className="px-3 py-2 px-3 py-2">{r.liters.toFixed(1)} L</td>
                                            <td className="px-3 py-2 font-bold text-slate-900">R$ {r.cost.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </PageWrapper>
            );
        }
        return pages;
    };

    return createPortal(
        <div className={`fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xl animate-fade-in ${isGenerating ? 'bg-white' : ''}`}>
            {/* Action Bar */}
            {!isGenerating && (
                <div className="hidden xl:block">
                    <div className="fixed left-12 top-12 z-[100]">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isGenerating}
                            className="group px-6 py-4 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-2xl active:scale-95 flex items-center gap-3 border border-white/10 disabled:opacity-50"
                        >
                            <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>{isGenerating ? 'Gerando...' : 'Baixar Relatório PDF'}</span>
                        </button>
                    </div>

                    <div className="fixed right-12 top-12 z-[100]">
                        <button
                            onClick={onClose}
                            className="group px-6 py-4 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-2xl border border-slate-200 active:scale-95 flex items-center gap-3"
                        >
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Fechar Relatório</span>
                        </button>
                    </div>
                </div>
            )}

            <div className={`fixed inset-0 overflow-y-auto flex items-start justify-center p-4 md:p-8 ${isGenerating ? 'p-0' : ''}`}>
                <div id="report-pdf-content" className={`relative flex flex-col items-center py-12 ${isGenerating ? 'py-0' : ''}`}>
                    {renderSummaryPage()}
                    {renderRecordPages()}
                </div>
            </div>
        </div>,
        document.body
    );
};
