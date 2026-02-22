import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Star, Users, Flag, Search, ChevronRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { CalendarEvent } from '../../services/calendarService';

interface MyEventsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    isAdmin: boolean;
    onEventClick: (event: CalendarEvent) => void;
}

export const MyEventsModal: React.FC<MyEventsModalProps> = ({
    isOpen, onClose, currentUserId, isAdmin, onEventClick
}) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchMyEvents();
        } else {
            setSearchTerm('');
        }
    }, [isOpen]);

    const fetchMyEvents = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('calendar_events')
                .select(`
                    *,
                    calendar_event_invites (
                        id, status
                    )
                `)
                .order('start_date', { ascending: false });

            // If not admin, only show events created by me
            if (!isAdmin) {
                query = query.eq('created_by', currentUserId);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Map the events to include standard invite arrays
            const mapped = (data || []).map((evt: any) => ({
                ...evt,
                invites: evt.calendar_event_invites || []
            }));
            setEvents(mapped);
        } catch (error) {
            console.error("Erro ao buscar meus eventos:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    {isAdmin ? 'Todos os Eventos do Sistema' : 'Meus Eventos Criados'}
                                </h2>
                                <p className="text-sm font-medium text-slate-500">
                                    Gerencie os eventos e acompanhe convites
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors shrink-0 shadow-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-white">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar nos meus eventos..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-4">
                                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="text-sm font-bold text-slate-400 animate-pulse">Carregando eventos...</p>
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 p-6 text-center">
                                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                    <CalendarIcon className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-1">Nenhum evento encontrado</h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    {searchTerm ? 'Tente buscar com outras palavras-chave.' : 'Você ainda não criou nenhum evento no sistema.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filteredEvents.map(event => {
                                    // Calculate stats
                                    const totalInvites = event.invites?.length || 0;
                                    const accepted = event.invites?.filter(i => i.status === 'Aceito').length || 0;
                                    const pending = event.invites?.filter(i => i.status === 'Pendente').length || 0;
                                    const declined = event.invites?.filter(i => i.status === 'Recusado').length || 0;

                                    let Icon = Star;
                                    let typeColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';

                                    if (event.type === 'Reunião') {
                                        Icon = Users;
                                        typeColor = 'text-indigo-600 bg-indigo-50 border-indigo-200';
                                    } else if (event.type === 'Feriado') {
                                        Icon = Flag;
                                        typeColor = 'text-red-600 bg-red-50 border-red-200';
                                    } else if (event.type === 'Pessoal') {
                                        typeColor = 'text-amber-600 bg-amber-50 border-amber-200';
                                        Icon = CalendarIcon;
                                    }

                                    // Format dates
                                    const dStart = new Date(event.start_date + 'T12:00:00');
                                    const dateStr = dStart.toLocaleDateString('pt-BR');
                                    const isMultiDay = event.start_date !== event.end_date;
                                    let dateLabel = dateStr;
                                    if (isMultiDay) {
                                        const dEnd = new Date(event.end_date + 'T12:00:00');
                                        dateLabel = `${dateStr} a ${dEnd.toLocaleDateString('pt-BR')}`;
                                    }

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => {
                                                onClose();
                                                onEventClick(event);
                                            }}
                                            className="group relative flex items-center bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer overflow-hidden"
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top z-10"></div>

                                            <div className="flex-1 flex items-center gap-4">
                                                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border shrink-0 ${typeColor}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>

                                                <div className="flex flex-col min-w-0">
                                                    <h4 className="text-base font-bold text-slate-800 truncate pr-4">
                                                        {event.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        <span className="inline-flex items-center text-xs font-semibold text-slate-500">
                                                            📅 {dateLabel}
                                                        </span>
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${typeColor}`}>
                                                            {event.type}
                                                        </span>

                                                        {totalInvites > 0 && (
                                                            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Convidados:</span>
                                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded" title="Aceitos">{accepted}</span>
                                                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 rounded" title="Pendentes">{pending}</span>
                                                                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 rounded" title="Recusados">{declined}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pl-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
