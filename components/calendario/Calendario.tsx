import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { EventModal } from './EventModal';

export interface CalendarEvent {
    id: string;
    title: string;
    type: string;
    date: string; // YYYY-MM-DD
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
                .gte('date', startDateStr)
                .lte('date', endDateStr)
                .order('date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
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

        // Last day of previous month
        const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

        const days = [];

        // Padding from previous month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const day = lastDayOfPrevMonth - startingDayOfWeek + i + 1;
            const dateStr = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({ day, isCurrentMonth: false, dateStr });
        }

        // Current month days
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({ day, isCurrentMonth: true, dateStr });
        }

        // Padding from next month
        const remainingSlots = 42 - days.length; // 6 rows * 7 cols = 42
        for (let day = 1; day <= remainingSlots; day++) {
            const dateStr = `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({ day, isCurrentMonth: false, dateStr });
        }

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

                {/* Grip principal fullscreen */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-2 min-h-0 relative">
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
                        const isTodaySlot = isToday(slot.dateStr);
                        // filter events for this day
                        const dayEvents = events.filter(e => e.date === slot.dateStr);

                        return (
                            <div
                                key={i}
                                className={`flex flex-col rounded-2xl border ${slot.isCurrentMonth ? 'bg-white border-slate-100 shadow-sm hover:shadow-md' : 'bg-slate-50/50 border-slate-50 opacity-60'} overflow-hidden transition-all duration-300 group`}
                            >
                                {/* Cabeçalho do Dia */}
                                <div className={`flex justify-between items-center p-2 px-3 ${isTodaySlot ? 'bg-rose-50 border-b border-rose-100' : ''}`}>
                                    <span className={`text-sm font-bold ${isTodaySlot ? 'text-rose-600' : slot.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {slot.day}
                                    </span>
                                    {/* Se admin e for hover, pode mostrar atalho pra adicionar evento na data. Por enquanto simples: */}
                                    {isAdmin && slot.isCurrentMonth && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEventToEdit(null);
                                                setSelectedDate(slot.dateStr);
                                                setIsModalOpen(true);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Eventos do Dia */}
                                <div className="flex-1 overflow-y-auto p-1 custom-scrollbar space-y-1 relative">
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isAdmin) {
                                                    setEventToEdit(event);
                                                    setSelectedDate(event.date);
                                                    setIsModalOpen(true);
                                                }
                                            }}
                                            className={`text-[10px] sm:text-xs px-2 py-1 rounded truncate font-medium shadow-sm transition-transform ${isAdmin ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'}`}
                                            style={{
                                                backgroundColor: event.type === 'Feriado' ? '#fee2e2' : event.type === 'Reunião' ? '#e0e7ff' : '#dcfce7',
                                                color: event.type === 'Feriado' ? '#991b1b' : event.type === 'Reunião' ? '#3730a3' : '#166534',
                                                borderLeft: `3px solid ${event.type === 'Feriado' ? '#ef4444' : event.type === 'Reunião' ? '#6366f1' : '#22c55e'}`
                                            }}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
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
                    fetchEvents(currentDate);
                }}
                eventToEdit={eventToEdit}
                selectedDate={selectedDate}
                currentUserId={currentUserId}
            />

        </div>
    );
};
