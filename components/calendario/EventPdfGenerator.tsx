import React from 'react';
import { createPortal } from 'react-dom';
import { CalendarEvent } from '../../services/calendarService';
import { Calendar as CalendarIcon, Clock, AlignLeft, Users, Star, User, Flag, Lock, Building2 } from 'lucide-react';

interface EventPdfGeneratorProps {
    event: CalendarEvent;
}

export const EventPdfGenerator: React.FC<EventPdfGeneratorProps> = ({ event }) => {
    // Cores e Ícones do Evento
    const colors: Record<string, any> = {
        Feriado: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500', iconComp: Flag },
        Reunião: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-500', iconComp: Users },
        Evento: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-500', iconComp: CalendarIcon },
        Pessoal: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-500', iconComp: Lock }
    };
    const theme = colors[event.type] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'text-slate-500', iconComp: CalendarIcon };
    const ThemeIcon = theme.iconComp;

    const formatTime = (t: string) => t.slice(0, 5);
    const formatDateBr = (d: string) => {
        if (!d) return '';
        const [year, month, day] = d.split('-');
        return `${day}/${month}/${year}`;
    };

    return createPortal(
        <div id="event-pdf-content" className="fixed top-[-9999px] left-[-9999px] w-[210mm] opacity-0 pointer-events-none bg-white">
            <div className="w-[210mm] min-h-[297mm] p-12 bg-white flex flex-col font-sans relative">

                {/* Cabeçalho Institucional */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Prefeitura Integrada</h1>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Sistema de Gestão Pública</p>
                            <p className="text-xs text-slate-400 mt-0.5">Módulo de Calendário Institucional</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Documento Gerado Em</div>
                        <div className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Título e Capa do Evento */}
                <div className={`p-8 rounded-2xl border ${theme.border} ${theme.bg} mb-8`}>
                    <div className="flex items-start gap-5">
                        <div className={`mt-1 bg-white p-3 rounded-xl shadow-sm border ${theme.border}`}>
                            <ThemeIcon className={`w-8 h-8 ${theme.icon}`} />
                        </div>
                        <div className="flex-1">
                            <span className={`inline-block px-2.5 py-1 rounded text-xs uppercase font-black tracking-widest bg-white border outline outline-4 outline-white shadow-sm mb-3 ${theme.border} ${theme.text}`}>
                                {event.type}
                            </span>
                            <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4">
                                {event.title}
                            </h2>

                            <div className="flex flex-wrap gap-6 border-t border-slate-900/10 pt-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className={`w-4 h-4 ${theme.text}`} />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Datas</p>
                                        <p className="font-bold text-slate-900 text-sm">
                                            {event.start_date === event.end_date
                                                ? formatDateBr(event.start_date)
                                                : `De ${formatDateBr(event.start_date)} a ${formatDateBr(event.end_date)}`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className={`w-4 h-4 ${theme.text}`} />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Horário</p>
                                        <p className="font-bold text-slate-900 text-sm">
                                            {event.is_all_day
                                                ? 'Dia Inteiro'
                                                : `${formatTime(event.start_time!)} às ${formatTime(event.end_time!)}`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Descrição */}
                {event.description && (
                    <div className="mb-8">
                        <div className="flex items-start gap-3 text-slate-800">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <AlignLeft className="w-4 h-4 text-slate-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 mt-1">Descrição Detalhada</h3>
                                <div className="text-sm text-slate-700 leading-relaxed border-l-2 pl-4 border-slate-200">
                                    {event.description}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Convidados */}
                {event.invites && event.invites.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4 text-slate-600" />
                            </div>
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Lista de Convidados ({event.invites.length})</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {event.invites.map(inv => (
                                <div key={inv.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${inv.role === 'Colaborador' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {inv.role === 'Colaborador' ? <Star className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{inv.user_name || 'Usuário Desconhecido'}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{inv.role === 'Colaborador' ? 'Organizador' : 'Participante'}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${inv.status === 'Aceito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            inv.status === 'Recusado' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                'bg-white text-slate-600 border-slate-200'
                                            }`}>
                                            {inv.status}
                                        </span>
                                    </div>

                                    {inv.status === 'Recusado' && inv.decline_reason && (
                                        <div className="mt-2 text-xs bg-white border border-rose-100 rounded-lg p-2.5 text-rose-800">
                                            <span className="font-bold flex block mb-0.5">Motivo:</span>
                                            <span className="opacity-90">{inv.decline_reason}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rodapé e Metadados Técnicos */}
                <div className="mt-auto pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                    <p>Evento criado em: {new Date(event.created_at!).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="font-mono text-[10px]">ID: {event.id}</p>
                </div>

                {/* Marca d'agua / Identificacao final */}
                <div className="absolute bottom-12 left-0 right-0 text-center opacity-20 pointer-events-none">
                    <p className="text-[10vh] font-black text-slate-300 uppercase tracking-tighter leading-none select-none">
                        PREFEITURA
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};
