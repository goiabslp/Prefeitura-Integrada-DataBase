import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, ChevronsLeft, ChevronsRight, Star, Users, Flag } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { EventModal } from './EventModal';
import { DayDetailsModal } from './DayDetailsModal';
import { EventDetailsModal } from './EventDetailsModal';
import { generateHolidaysForYear } from './holidays';

export interface CalendarEvent {
    id: string;
    title: string;
    type: string;
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
    is_all_day: boolean;
    start_time?: string;
    end_time?: string;
    description?: string;
    created_by?: string;
    created_at?: string;
}

interface CalendarioProps {
    onBack: () => void;
    userRole: string;
    currentUserId: string;
}

export const Calendario: React.FC<CalendarioProps> = ({ onBack, userRole, currentUserId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const isAdmin = userRole === 'admin';
    const [direction, setDirection] = useState(0); // For animation: -1 left, 1 right

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
    const [selectedDate, setSelectedDate] = useState('');

    const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
    const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);

    const [eventDetailsEvent, setEventDetailsEvent] = useState<CalendarEvent | null>(null);
    const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

    // Fetch events for current month (and slightly padding)
    const fetchEvents = async (date: Date) => {
        setLoading(true);
        try {
            const year = date.getFullYear();
            let prevMonth = date.getMonth();
            let prevYear = year;
            if (prevMonth === 0) { prevMonth = 12; prevYear--; }

            let nextMonth = date.getMonth() + 2;
            let nextYear = year;
            if (nextMonth === 13) { nextMonth = 1; nextYear++; }

            const startDateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
            const endDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-31`;

            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .lte('start_date', endDateStr)
                .gte('end_date', startDateStr)
                .order('start_date', { ascending: true });

            if (error) throw error;

            // Gen recurring holidays for the current view and surroundings
            const holidaysData = [
                ...generateHolidaysForYear(prevYear),
                ...((prevYear !== nextYear) && (nextYear !== year) ? generateHolidaysForYear(year) : []),
                ...((prevYear !== nextYear) ? generateHolidaysForYear(nextYear) : [])
            ];

            // Deduplicate generated holidays since there could be overlaps depending on the month
            const uniqueHolidays = Array.from(new Map(holidaysData.map(h => [h.id, h])).values());

            setEvents([...uniqueHolidays, ...(data || [])]);
        } catch (error) {
            console.error('Erro ao buscar eventos do calendário:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents(currentDate);
    }, [currentDate.getFullYear(), currentDate.getMonth()]);

    const nextMonth = () => {
        setDirection(1);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setDirection(-1);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextYear = () => {
        setDirection(1);
        setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    };

    const prevYear = () => {
        setDirection(-1);
        setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    };

    const goToToday = () => {
        const now = new Date();
        const yearDiff = now.getFullYear() - currentDate.getFullYear();
        const monthDiff = now.getMonth() - currentDate.getMonth();

        if (yearDiff === 0 && monthDiff === 0) return; // Algready today

        // Determine animation direction
        if (yearDiff > 0 || (yearDiff === 0 && monthDiff > 0)) {
            setDirection(1);
        } else {
            setDirection(-1);
        }

        setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    };

    const today = new Date();

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Generate calendar grid
    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // First day of the month
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayOfWeek = firstDayOfMonth.getDay();

        // Last day of the month
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const totalDaysInMonth = lastDayOfMonth.getDate();

        const days = [];

        // Padding from previous month (empty slots)
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ day: null, isCurrentMonth: false, dateStr: '', isWeekend: false });
        }

        // Current month days
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = new Date(year, month, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            days.push({ day, isCurrentMonth: true, dateStr, isWeekend });
        }

        // We don't pad the end with next month anymore, let the grid flow naturally.
        return days;
    }, [currentDate]);

    const isToday = (dateStr: string) => {
        const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        return dateStr === t;
    };

    const variants = {
        enter: (direction: number) => {
            return {
                x: direction > 0 ? 100 : -100,
                opacity: 0
            };
        },
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => {
            return {
                zIndex: 0,
                x: direction < 0 ? 100 : -100,
                opacity: 0
            };
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-[#FAFAFA] flex flex-col z-[100] font-sans">

            {/* HEADER FIXO */}
            <div className="h-20 shrink-0 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 desktop:px-10 z-[110]">

                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="group flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all active:scale-95"
                        title="Voltar ao Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-800 transition-colors" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <CalendarIcon className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Calendário Institucional</h1>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => {
                            setEventToEdit(null);
                            setSelectedDate(new Date().toISOString().split('T')[0]);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Novo Evento</span>
                    </button>
                )}
            </div>

            {/* NAVEGAÇÃO E CONTROLES */}
            <div className="px-6 desktop:px-10 py-4 flex items-center justify-between bg-white/50 backdrop-blur-sm relative z-[105]">
                <div className="flex items-center gap-2">
                    <button onClick={prevYear} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Ano Anterior">
                        <ChevronsLeft className="w-5 h-5" />
                    </button>
                    <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Mês Anterior">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <div className="w-64 flex justify-center overflow-hidden">
                        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                            <motion.div
                                key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 uppercase tracking-wider text-center"
                            >
                                {monthNames[currentDate.getMonth()]} <span className="text-rose-500">{currentDate.getFullYear()}</span>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={goToToday}
                        className="mt-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
                    >
                        Hoje
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Próximo Mês">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                    <button onClick={nextYear} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Próximo Ano">
                        <ChevronsRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* GRADE DO CALENDÁRIO */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden p-6 desktop:p-10 pt-2">
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 gap-2 mb-2 shrink-0">
                    {weekDays.map(day => (
                        <div key={day} className="text-center py-2 text-xs font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-100">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grip principal dinâmico */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-2 min-h-0 relative">
                    <AnimatePresence mode="wait">
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[2px] flex items-center justify-center rounded-2xl"
                            >
                                <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {calendarGrid.map((slot, i) => {
                        if (!slot.isCurrentMonth || !slot.day) {
                            return <div key={i} className="flex flex-col rounded-2xl border-none bg-transparent"></div>;
                        }

                        const isTodaySlot = isToday(slot.dateStr);
                        // filter events for this day (if slot date is between start_date and end_date)
                        const dayEvents = events.filter(e => {
                            return slot.dateStr >= e.start_date && slot.dateStr <= e.end_date;
                        });

                        // Define styles based on Priority: Today > Weekend > Regular
                        let bgClass = slot.isWeekend ? 'bg-indigo-50/30' : 'bg-white';
                        let borderClass = 'border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200';
                        let headerBgClass = slot.isWeekend ? 'bg-indigo-50/50 border-b border-indigo-100/50' : 'border-b border-slate-50';
                        let textClass = slot.isWeekend ? 'text-indigo-900/60' : 'text-slate-700';

                        if (isTodaySlot) {
                            bgClass = 'bg-blue-50';
                            borderClass = 'border-blue-400 shadow-md ring-1 ring-blue-400';
                            headerBgClass = 'bg-blue-600 border-b border-blue-700';
                            textClass = 'text-white';
                        }

                        return (
                            <div
                                key={i}
                                onClick={() => {
                                    setSelectedDate(slot.dateStr);
                                    setSelectedDayEvents(dayEvents);
                                    setIsDayDetailsOpen(true);
                                }}
                                className={`flex flex-col min-h-[90px] desktop:min-h-[110px] rounded-2xl border overflow-hidden transition-all duration-300 group cursor-pointer ${bgClass} ${borderClass}`}
                            >
                                {/* Cabeçalho do Dia */}
                                <div className={`flex justify-between items-center p-2 px-3 ${headerBgClass}`}>
                                    <span className={`text-sm font-bold ${textClass}`}>
                                        {slot.day === 1 && slot.dateStr
                                            ? new Date(slot.dateStr + 'T12:00:00')
                                                .toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
                                                .replace('.', '')
                                            : slot.day}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                        {/* Icons summary */}
                                        {dayEvents.length > 0 && (
                                            <div className="flex items-center -space-x-1 mr-0.5">
                                                {dayEvents.slice(0, 3).map((e, idx) => {
                                                    let Icon = Star;
                                                    let colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";
                                                    if (e.type === 'Reunião') {
                                                        Icon = Users;
                                                        colorClass = "text-indigo-600 bg-indigo-50 border-indigo-200";
                                                    } else if (e.type === 'Feriado') {
                                                        Icon = Flag;
                                                        colorClass = "text-red-600 bg-red-50 border-red-200";
                                                    }

                                                    return (
                                                        <div key={`${e.id}-${idx}`} title={e.title} className={`w-5 h-5 flex items-center justify-center rounded-full border relative shadow-sm ${colorClass}`} style={{ zIndex: 10 - idx }}>
                                                            <Icon className="w-[10px] h-[10px]" />
                                                        </div>
                                                    )
                                                })}
                                                {dayEvents.length > 3 && (
                                                    <div className="w-5 h-5 flex items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-[9px] font-black text-slate-600 relative z-0">
                                                        +{dayEvents.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDate(slot.dateStr);
                                                    setSelectedDayEvents(dayEvents);
                                                    setIsDayDetailsOpen(true);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-all shrink-0"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Eventos do Dia */}
                                <div className="flex-1 overflow-y-hidden p-1 flex flex-col gap-0.5 relative">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEventDetailsEvent(event);
                                                setIsEventDetailsOpen(true);
                                            }}
                                            className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold transition-transform cursor-pointer hover:opacity-80 truncate"
                                            style={{
                                                backgroundColor: event.type === 'Feriado' ? '#fee2e2' : event.type === 'Reunião' ? '#e0e7ff' : '#dcfce7',
                                                color: event.type === 'Feriado' ? '#991b1b' : event.type === 'Reunião' ? '#3730a3' : '#166534',
                                                borderLeft: `2px solid ${event.type === 'Feriado' ? '#ef4444' : event.type === 'Reunião' ? '#6366f1' : '#22c55e'}`
                                            }}
                                        >
                                            <span className="truncate block font-bold leading-tight">{event.title}</span>
                                        </div>
                                    ))}

                                    {dayEvents.length > 3 && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDate(slot.dateStr);
                                                setSelectedDayEvents(dayEvents);
                                                setIsDayDetailsOpen(true);
                                            }}
                                            className="text-[9px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded px-1.5 py-0.5 mt-auto cursor-pointer text-left transition-colors"
                                        >
                                            +{dayEvents.length - 3} mais...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={() => {
                    setIsModalOpen(false);
                    // Update the day events list if the day details is open
                    fetchEvents(currentDate).then(() => {
                        // After fetch closes, we can update selectedDayEvents
                        // A slightly hacky but simple way: we just let the parent handle the events array, 
                        // but selectedDayEvents need to react. 
                    });
                }}
                eventToEdit={eventToEdit}
                selectedDate={selectedDate}
                currentUserId={currentUserId}
            />

            <DayDetailsModal
                isOpen={isDayDetailsOpen}
                onClose={() => setIsDayDetailsOpen(false)}
                dateStr={selectedDate}
                // Recalculate directly from state so updates bubble gracefully
                events={events.filter(e => selectedDate >= e.start_date && selectedDate <= e.end_date)}
                isAdmin={isAdmin}
                onAddEvent={() => {
                    setEventToEdit(null);
                    setIsModalOpen(true);
                }}
                onEditEvent={(evt) => {
                    setEventToEdit(evt);
                    setIsModalOpen(true);
                }}
                onDeleteEvent={async (evt) => {
                    // Quick inline delete handler avoiding opening EventModal just to delete
                    try {
                        const { error } = await supabase.from('calendar_events').delete().eq('id', evt.id);
                        if (error) throw error;
                        fetchEvents(currentDate);
                    } catch (e) {
                        console.error(e);
                        alert("Erro ao remover evento.");
                    }
                }}
            />

            <EventDetailsModal
                isOpen={isEventDetailsOpen}
                onClose={() => setIsEventDetailsOpen(false)}
                event={eventDetailsEvent}
                isAdmin={isAdmin}
                onEditEvent={(evt) => {
                    setEventToEdit(evt);
                    setSelectedDate(evt.start_date);
                    setIsModalOpen(true);
                }}
                onDeleteSuccess={() => {
                    fetchEvents(currentDate);
                }}
            />
        </div>
    );
};

export default Calendario;
