import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AppState } from '../../types';
import { AbastecimentoRecord } from '../../services/abastecimentoService';
import { PageWrapper } from '../PageWrapper';
import { Printer, X, FileSpreadsheet, Fuel, Building2, Calendar, LayoutDashboard, Car } from 'lucide-react';

interface AbastecimentoReportPDFProps {
    data: {
        records: (AbastecimentoRecord & { derivedSector: string; derivedPlate: string })[];
        totalLitersByFuel: Record<string, number>;
        totalValueBySector: Record<string, number>;
        totalValueByFuel: Record<string, number>;
        sectorFuelBreakdown: Record<string, {
            dieselLiters: number;
            dieselValue: number;
            gasolinaLiters: number;
            gasolinaValue: number;
            otherLiters: number;
            otherValue: number;
            totalValue: number;
        }>;
        plateFuelSummary: Record<string, {
            plate: string;
            sector: string;
            fuelType: string;
            totalLiters: number;
            totalValue: number;
        }>;
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
    mode: 'simplified' | 'complete';
}

export const AbastecimentoReportPDF: React.FC<AbastecimentoReportPDFProps> = ({
    data,
    filters,
    state,
    onClose,
    mode
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatNumber = (value: number, decimals: number = 2) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    };

    // Pagination Logic
    const ITEMS_PER_PAGE = 14;

    // 1. Prepare Detailed Items (Records + Headers + Summaries)
    const sortedRecords = [...data.records].sort((a, b) => {
        if (a.vehicle < b.vehicle) return -1;
        if (a.vehicle > b.vehicle) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const detailedItems: Array<any> = [];
    let currentV = '';
    let vLiters = 0;
    let vCost = 0;

    sortedRecords.forEach((r, index) => {
        if (r.vehicle !== currentV) {
            if (currentV !== '') {
                detailedItems.push({ type: 'summary', vehicle: currentV, liters: vLiters, cost: vCost });
                detailedItems.push({ type: 'spacer' });
                detailedItems.push({ type: 'header' });
            }
            currentV = r.vehicle;
            vLiters = 0;
            vCost = 0;
        }
        vLiters += r.liters;
        vCost += r.cost;
        detailedItems.push({ type: 'record', ...r });
        if (index === sortedRecords.length - 1) {
            detailedItems.push({ type: 'summary', vehicle: currentV, liters: vLiters, cost: vCost });
        }
    });

    // 2. Prepare Plate Summary Items (Grouped by Sector)
    const rawPlateItems = (Object.entries(data.plateFuelSummary || {}) as [string, any][])
        .map(([_, v]) => v)
        .sort((a, b) => {
            if (a.sector < b.sector) return -1;
            if (a.sector > b.sector) return 1;
            return a.plate.localeCompare(b.plate);
        });

    const PLATE_ITEMS_PER_PAGE = 22;
    const plateSummaryItems: Array<any> = [];
    let currentS = '';

    rawPlateItems.forEach((item) => {
        if (item.sector !== currentS) {
            if (currentS !== '') plateSummaryItems.push({ type: 'spacer' });
            currentS = item.sector;
            plateSummaryItems.push({ type: 'sectorHeader', sector: currentS });
        }
        plateSummaryItems.push({ type: 'item', ...item });
    });

    const totalPlatePages = Math.ceil(plateSummaryItems.length / PLATE_ITEMS_PER_PAGE) || 1;
    const totalDetailPages = mode === 'complete' ? (Math.ceil(detailedItems.length / ITEMS_PER_PAGE) || 1) : 0;

    // 3. Prepare Consolidated Items
    const CONSOLIDATED_ITEMS_PER_PAGE = 26;
    const consolidatedItems = [...data.records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalConsolidatedPages = Math.ceil(consolidatedItems.length / CONSOLIDATED_ITEMS_PER_PAGE) || 1;

    const globalTotalPages = 1 + totalPlatePages + totalDetailPages + totalConsolidatedPages; // Summary + Plate Summary + Details (if complete) + Consolidated

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
        <PageWrapper state={reportState} pageIndex={0} totalPages={globalTotalPages} isGenerating={isGenerating}>
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
                            {filters.startDate ? new Date(filters.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'}
                            <span className="mx-2 opacity-30">até</span>
                            {filters.endDate ? new Date(filters.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Hoje'}
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
                            <p className="text-4xl font-black tracking-tighter">{formatNumber(data.grandTotalLiters)} <span className="text-xl text-slate-500">L</span></p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-900 flex items-center justify-between overflow-hidden relative">
                        <LayoutDashboard className="absolute right-[-10%] top-[-20%] w-32 h-32 opacity-5 text-slate-900" />
                        <div className="relative z-10">
                            <p className="text-[8pt] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Investimento Total</p>
                            <p className="text-4xl font-black tracking-tighter text-slate-900">{formatCurrency(data.grandTotalValue)}</p>
                        </div>
                    </div>
                </div>

                {/* Breakdowns Grid */}
                <div className="flex flex-col gap-8">
                    {/* Fuel Breakdown - Top Small Table */}
                    <div className="space-y-4">
                        <h3 className="text-[10pt] font-black uppercase tracking-[0.15em] text-slate-900 flex items-center gap-2">
                            <Fuel className="w-4 h-4 text-indigo-600" /> Resumo por Combustível
                        </h3>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden max-w-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-[7pt] font-black uppercase tracking-widest text-slate-500">
                                        <th className="px-6 py-2">Tipo</th>
                                        <th className="px-6 py-2 text-right">Volume (L)</th>
                                        <th className="px-6 py-2 text-right">Valor (R$)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(data.totalLitersByFuel).map(([fuel, liters]) => (
                                        <tr key={fuel} className="text-[8pt] font-bold text-slate-700">
                                            <td className="px-6 py-3 uppercase">{fuel}</td>
                                            <td className="px-6 py-3 text-right whitespace-nowrap">{formatNumber(liters as number)}</td>
                                            <td className="px-6 py-3 text-right whitespace-nowrap">{formatCurrency(data.totalValueByFuel[fuel] as number)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sector Breakdown - Full Width Detailed Table */}
                    <div className="space-y-4">
                        <h3 className="text-[10pt] font-black uppercase tracking-[0.15em] text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-indigo-600" /> Por Secretaria / Setor (Detalhamento de Combustível)
                        </h3>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 text-[6pt] font-black uppercase tracking-widest text-slate-500">
                                    <tr>
                                        <th className="px-3 py-3 border-r border-slate-100" rowSpan={2}>Secretaria / Setor</th>
                                        <th className="px-3 py-1 text-center border-r border-indigo-200 bg-indigo-900 text-white" colSpan={2}>Diesel</th>
                                        <th className="px-3 py-1 text-center border-r border-sky-100 bg-sky-50 text-sky-900" colSpan={2}>Gasolina</th>
                                        <th className="px-3 py-3 text-right" rowSpan={2}>Gasto Total</th>
                                    </tr>
                                    <tr className="text-[5pt]">
                                        <th className="px-2 py-1 text-right border-r border-indigo-50 bg-indigo-50/30 text-indigo-900">L (Litros)</th>
                                        <th className="px-2 py-1 text-right border-r border-indigo-50 bg-indigo-50/30 text-indigo-900">R$ (Valor)</th>
                                        <th className="px-2 py-1 text-right border-r border-sky-50 bg-sky-50/50 text-sky-700">L (Litros)</th>
                                        <th className="px-2 py-1 text-right border-r border-sky-50 bg-sky-50/50 text-sky-700">R$ (Valor)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(Object.entries(data.sectorFuelBreakdown || {}) as [string, any][])
                                        .sort((a, b) => b[1].totalValue - a[1].totalValue)
                                        .map(([sector, details]) => (
                                            <tr key={sector} className="text-[7pt] font-bold text-slate-700">
                                                <td className="px-3 py-2 uppercase border-r border-slate-50 font-black text-slate-900 whitespace-nowrap">{sector}</td>
                                                <td className="px-2 py-2 text-right border-r border-indigo-50 bg-indigo-50/20 text-indigo-950 whitespace-nowrap">{formatNumber(details.dieselLiters)}</td>
                                                <td className="px-2 py-2 text-right border-r border-indigo-50 bg-indigo-50/20 text-indigo-950 whitespace-nowrap">{formatCurrency(details.dieselValue)}</td>
                                                <td className="px-2 py-2 text-right border-r border-sky-50 bg-sky-50/20 text-sky-600 whitespace-nowrap">{formatNumber(details.gasolinaLiters)}</td>
                                                <td className="px-2 py-2 text-right border-r border-sky-50 bg-sky-50/20 text-sky-600 whitespace-nowrap">{formatCurrency(details.gasolinaValue)}</td>
                                                <td className="px-3 py-2 text-right font-black text-slate-900 bg-slate-100/50 whitespace-nowrap">{formatCurrency(details.totalValue)}</td>
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

    const renderPlateSummaryPages = () => {
        const pages = [];
        for (let i = 0; i < plateSummaryItems.length; i += PLATE_ITEMS_PER_PAGE) {
            const pageItems = plateSummaryItems.slice(i, i + PLATE_ITEMS_PER_PAGE);
            const pageIndex = Math.floor(i / PLATE_ITEMS_PER_PAGE) + 1;

            pages.push(
                <PageWrapper key={`plate-${pageIndex}`} state={reportState} pageIndex={pageIndex} totalPages={globalTotalPages} isGenerating={isGenerating}>
                    <div className="flex flex-col gap-6 h-full">
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                            <h2 className="text-[14pt] font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                                <Building2 className="w-6 h-6 text-indigo-600" /> Resumo por Secretaria / Setor
                            </h2>
                            <p className="text-[8pt] text-slate-500 font-bold uppercase tracking-widest leading-none">Página {pageIndex + 1} de {globalTotalPages}</p>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900 text-white">
                                    <tr className="text-[7pt] font-black uppercase tracking-widest">
                                        <th className="px-6 py-4 w-[30%]">Placa / Veículo</th>
                                        <th className="px-6 py-4 w-[25%]">Combustível</th>
                                        <th className="px-6 py-4 text-right w-[20%]">Volume (L)</th>
                                        <th className="px-6 py-4 text-right w-[25%]">Valor Total (R$)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pageItems.map((item, idx) => {
                                        if (item.type === 'spacer') {
                                            return <tr key={`sp-${idx}`} className="h-2 bg-slate-50/50" />;
                                        }
                                        if (item.type === 'sectorHeader') {
                                            return (
                                                <tr key={`sh-${idx}`} className="bg-slate-100 border-y-2 border-slate-900">
                                                    <td colSpan={4} className="px-5 py-1.5 text-[8pt] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                                        <span className="w-1.5 h-4 bg-slate-900 rounded-full" />
                                                        {item.sector}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        return (
                                            <tr key={`it-${idx}`} className="text-[7.5pt] font-bold text-slate-700 hover:bg-slate-50/50">
                                                <td className="px-5 py-1.5 font-black text-slate-900 uppercase">{item.plate}</td>
                                                <td className="px-5 py-1.5 uppercase text-slate-400 font-mono text-[7pt]">{item.fuelType}</td>
                                                <td className="px-5 py-1.5 text-right text-indigo-700 whitespace-nowrap">{formatNumber(item.totalLiters)} L</td>
                                                <td className="px-5 py-1.5 text-right font-black text-slate-900 bg-slate-50/30 border-l border-slate-100 whitespace-nowrap">{formatCurrency(item.totalValue)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </PageWrapper>
            );
        }
        return pages;
    };

    const renderRecordPages = () => {
        const pages = [];

        for (let i = 0; i < detailedItems.length; i += ITEMS_PER_PAGE) {
            const pageItems = detailedItems.slice(i, i + ITEMS_PER_PAGE);
            const pageIndex = Math.floor(i / ITEMS_PER_PAGE) + 1 + totalPlatePages;

            pages.push(
                <PageWrapper key={`rec-${pageIndex}`} state={reportState} pageIndex={pageIndex} totalPages={globalTotalPages} isGenerating={isGenerating}>
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
                                    <th className="px-3 py-2 text-left w-[15%]">Nº Nota</th>
                                    <th className="px-3 py-2 text-left w-[25%]">Veículo</th>
                                    <th className="px-3 py-2 text-left w-[25%]">Setor</th>
                                    <th className="px-3 py-2 text-left w-[8%]">Litros</th>
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
                                                <th className="px-3 py-2 text-left w-[15%] text-[7pt] font-black uppercase tracking-widest text-slate-600">Nº Nota</th>
                                                <th className="px-3 py-2 text-left w-[25%] text-[7pt] font-black uppercase tracking-widest text-slate-600">Veículo</th>
                                                <th className="px-3 py-2 text-left w-[25%] text-[7pt] font-black uppercase tracking-widest text-slate-600">Setor</th>
                                                <th className="px-3 py-2 text-left w-[8%] text-[7pt] font-black uppercase tracking-widest text-slate-600">Litros</th>
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
                                                    {formatNumber(item.liters)} L
                                                </td>
                                                <td className="px-3 py-3 text-[8pt] font-black text-slate-900 whitespace-nowrap">
                                                    {formatCurrency(item.cost)}
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
                                            <td className="px-3 py-2 uppercase whitespace-nowrap text-[7pt] font-bold text-slate-500 leading-tight">{r.derivedSector}</td>
                                            <td className="px-3 py-2 px-3 py-2 whitespace-nowrap">{formatNumber(r.liters)} L</td>
                                            <td className="px-3 py-2 font-bold text-slate-900 whitespace-nowrap">{formatCurrency(r.cost)}</td>
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

    const renderConsolidatedPages = () => {
        const pages = [];
        for (let i = 0; i < consolidatedItems.length; i += CONSOLIDATED_ITEMS_PER_PAGE) {
            const pageItems = consolidatedItems.slice(i, i + CONSOLIDATED_ITEMS_PER_PAGE);
            const pageIndex = Math.floor(i / CONSOLIDATED_ITEMS_PER_PAGE) + 1 + totalPlatePages + totalDetailPages;

            pages.push(
                <PageWrapper key={`cons-${pageIndex}`} state={reportState} pageIndex={pageIndex} totalPages={globalTotalPages} isGenerating={isGenerating}>
                    <div className="flex flex-col h-full">
                        <div className="pb-4 border-b border-slate-200 mb-6">
                            <h2 className="text-[12pt] font-black uppercase text-slate-900">Consolidado Geral</h2>
                            <p className="text-[8pt] text-slate-500 font-bold uppercase tracking-widest leading-none">Página {pageIndex}</p>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-[7pt] font-black uppercase tracking-widest text-slate-500">
                                        <th className="px-4 py-3 w-[20%]">Data / Nota</th>
                                        <th className="px-4 py-3 w-[40%]">Veículo / Placa</th>
                                        <th className="px-4 py-3 text-right w-[15%]">Litros</th>
                                        <th className="px-4 py-3 text-right w-[25%]">Valor Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pageItems.map((r, idx) => (
                                        <tr key={idx} className="text-[7.5pt] font-medium text-slate-700 hover:bg-slate-50/50">
                                            <td className="px-4 py-2">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{new Date(r.date).toLocaleDateString('pt-BR')}</span>
                                                    <span className="text-[9px] font-mono text-slate-400 uppercase">{r.invoiceNumber || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 uppercase">
                                                <span className="font-bold text-slate-800">{r.vehicle}</span>
                                                <span className="block text-[6pt] text-slate-400 font-bold tracking-wider">{r.derivedPlate}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right text-indigo-700 font-bold whitespace-nowrap">{formatNumber(r.liters)} L</td>
                                            <td className="px-4 py-2 text-right font-black text-slate-900 whitespace-nowrap">{formatCurrency(r.cost)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                    {renderPlateSummaryPages()}
                    {mode === 'complete' && renderRecordPages()}
                    {renderConsolidatedPages()}
                </div>
            </div>
        </div>,
        document.body
    );
};
