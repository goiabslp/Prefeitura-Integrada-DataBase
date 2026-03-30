import React from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent } from '../../services/calendarService';
import { AppState } from '../../types';
import { PageWrapper } from '../PageWrapper';
import { Calendar as CalendarIcon, Clock, Gift, Users, Flag, MapPin } from 'lucide-react';

interface MonthEventsPdfGeneratorProps {
    events: CalendarEvent[];
    monthName: string;
    year: number;
    state: AppState;
}

export const MonthEventsPdfGenerator: React.FC<MonthEventsPdfGeneratorProps> = ({ events, monthName, year, state }) => {
    
    // Configurações de Paginação - REDUZIDO para 18 para evitar cortes no fundo da página A4
    const ITEMS_PER_PAGE = 18;
    
    // Agrupar eventos para exibição organizada - OTIMIZADO para ordenar por DIA
    const sortedEvents = [...events].sort((a, b) => {
        // Obter apenas o dia para ordenação cronológica dentro do mês, ignorando o ano (para aniversários)
        const getDay = (date: string) => {
            if (!date) return 0;
            const parts = date.split('-');
            return parts.length >= 3 ? parseInt(parts[2], 10) : 0;
        };

        const dayA = getDay(a.start_date);
        const dayB = getDay(b.start_date);

        if (dayA !== dayB) return dayA - dayB;
        
        // Se no mesmo dia, ordena por título
        return (a.title || "").localeCompare(b.title || "");
    });
    
    const pages: CalendarEvent[][] = [];
    for (let i = 0; i < sortedEvents.length; i += ITEMS_PER_PAGE) {
        pages.push(sortedEvents.slice(i, i + ITEMS_PER_PAGE));
    }

    const formatDateShort = (d: string) => {
        if (!d) return '';
        const day = d.split('-')[2];
        return day;
    };

    const formatTime = (t: string) => t ? t.slice(0, 5) : '';

    return createPortal(
        <div
            id="month-events-pdf-container"
            style={{
                position: 'fixed',
                left: '-10000px',
                top: '0',
                width: '210mm',
                background: 'white',
                zIndex: -1
            }}
        >
            {pages.map((pageEvents, pageIndex) => (
                <div 
                    key={pageIndex} 
                    id={`month-events-page-${pageIndex}`}
                    className="month-events-pdf-page"
                    style={{ marginBottom: '10mm' }}
                >
                    <PageWrapper
                        state={{
                            ...state,
                            branding: {
                                ...state.branding,
                                watermark: {
                                    ...state.branding?.watermark,
                                    enabled: false
                                }
                            },
                            content: {
                                ...state.content,
                                title: `Relatório de Eventos - ${monthName}/${year}`,
                                protocol: `REL-${new Date().getTime().toString().slice(-6)}`
                            }
                        }}
                        pageIndex={pageIndex}
                        totalPages={pages.length}
                        isGenerating={true}
                    >
                        <div className="flex flex-col h-full">
                            {/* Header do Relatório (Apenas na primeira página) */}
                            {pageIndex === 0 && (
                                <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-end justify-between">
                                    <div>
                                        <h1 className="text-[18pt] font-black uppercase tracking-tight text-slate-900 leading-none">Agenda Mensal</h1>
                                        <p className="text-[10pt] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                            {monthName} <span className="text-rose-600 font-black">{year}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8pt] font-black uppercase text-slate-300 tracking-widest leading-none">Documento Gerado em</p>
                                        <p className="text-[9pt] font-bold text-slate-600">{new Date().toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Tabela Compacta */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1">
                                <table className="w-full text-left bg-white border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 text-white text-[8pt] uppercase tracking-widest">
                                            <th className="px-4 py-3 font-black w-14 text-center border-r border-slate-700">Dia</th>
                                            <th className="px-4 py-3 font-black w-24 border-r border-slate-700">Tipo</th>
                                            <th className="px-4 py-3 font-black border-r border-slate-700">Evento</th>
                                            <th className="px-4 py-3 font-black w-28 text-right">Horário</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic">
                                        {pageEvents.map((event, idx) => {
                                            let textColor = "text-slate-700";
                                            let bgColor = "inherit";
                                            
                                            if (event.type === 'Aniversário') {
                                                textColor = "text-pink-700";
                                                bgColor = "bg-pink-50/30";
                                            } else if (event.type === 'Reunião') {
                                                textColor = "text-blue-700";
                                                bgColor = "bg-blue-50/30";
                                            } else if (event.type === 'Feriado' || event.type === 'Feriado Municipal') {
                                                textColor = "text-rose-700";
                                                bgColor = "bg-rose-50/30";
                                            }

                                            return (
                                                <tr key={`${event.id}-${idx}`} className={`text-[9pt] ${bgColor}`}>
                                                    <td className="px-4 py-2.5 font-black text-slate-900 text-center border-r border-slate-100">
                                                        {formatDateShort(event.start_date)}
                                                    </td>
                                                    <td className={`px-4 py-2.5 font-bold uppercase text-[7pt] border-r border-slate-100 ${textColor}`}>
                                                        {event.type}
                                                    </td>
                                                    <td className="px-4 py-2.5 border-r border-slate-100">
                                                        <span className="font-bold text-slate-900 block leading-tight">
                                                            {event.type === 'Aniversário' ? `Aniversário: ${event.professional_name || event.title}` : event.title}
                                                        </span>
                                                        {event.description && (
                                                            <span className="text-[7pt] text-slate-400 block mt-0.5 line-clamp-1 not-italic">
                                                                {event.description}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-medium text-slate-500 whitespace-nowrap">
                                                        {event.is_all_day ? 'Dia Inteiro' : (
                                                            <div className="flex flex-col items-end">
                                                                <span className="leading-none">{formatTime(event.start_time!)}</span>
                                                                <span className="text-[7pt] opacity-40">até {formatTime(event.end_time!)}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Espaçamento para manter a altura da tabela se houver poucos itens */}
                                        {pageEvents.length < ITEMS_PER_PAGE && (
                                            Array.from({ length: ITEMS_PER_PAGE - pageEvents.length }).map((_, i) => (
                                                <tr key={`empty-${i}`} className="h-10">
                                                    <td className="border-r border-slate-100"></td>
                                                    <td className="border-r border-slate-100"></td>
                                                    <td className="border-r border-slate-100"></td>
                                                    <td></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Rodapé Interno da Página */}
                            <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-slate-300">
                                <p className="text-[6pt] font-bold uppercase tracking-widest">Sistema Integrado de Gestão Municipal</p>
                                <p className="text-[6pt] font-mono">Página {pageIndex + 1} de {pages.length}</p>
                            </div>
                        </div>
                    </PageWrapper>
                </div>
            ))}
        </div>,
        document.body
    );
};

export default MonthEventsPdfGenerator;
