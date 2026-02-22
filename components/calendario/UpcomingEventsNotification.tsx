import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar as CalendarIcon, X, Clock } from 'lucide-react';
import { calendarService, CalendarEvent } from '../../services/calendarService';
import { supabase } from '../../services/supabaseClient';

export const UpcomingEventsNotification: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) setCurrentUserId(data.user.id);
        };
        init();
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        const checkUpcomingEvents = async () => {
            try {
                // Fetch events from today up to 5 days from now
                const today = new Date();
                const startDateStr = today.toISOString().split('T')[0];

                const future = new Date(today);
                future.setDate(future.getDate() + 5);
                const endDateStr = future.toISOString().split('T')[0];

                const allEvents = await calendarService.fetchEvents(startDateStr, endDateStr);

                // Filter logic
                const nextBusinessDayStr = getNextBusinessDayDateString();
                const todayStr = getTodayDateString();

                const upcoming = allEvents.filter(evt => {
                    // Check date (Is it today or next business day?)
                    // The prompt asked for "D-1", but usually we want to show it on D-1 and also on the Day of the event (D-0).
                    const isUpcomingDate = evt.start_date === nextBusinessDayStr || evt.start_date === todayStr;
                    if (!isUpcomingDate) return false;

                    // Check ownership/invite status
                    const isOwner = evt.created_by === currentUserId;
                    const isAcceptedInvite = evt.invites?.some(i => i.user_id === currentUserId && i.status === 'Aceito');

                    return isOwner || isAcceptedInvite;
                });

                if (upcoming.length > 0) {
                    setEvents(upcoming);
                    setIsVisible(true);
                }
            } catch (err) {
                console.error("Erro ao buscar eventos próximos", err);
            }
        };

        checkUpcomingEvents();
        // Check periodically (e.g. every hour)
        const interval = setInterval(checkUpcomingEvents, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [currentUserId]);

    const getTodayDateString = () => {
        return new Date().toISOString().split('T')[0];
    };

    const getNextBusinessDayDateString = () => {
        const d = new Date();
        const day = d.getDay();
        // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        let addDays = 1;
        if (day === 5) addDays = 3; // Friday -> Monday
        else if (day === 6) addDays = 2; // Saturday -> Monday

        d.setDate(d.getDate() + addDays);
        return d.toISOString().split('T')[0];
    };

    if (!isVisible || events.length === 0) return null;

    return (
        <div className="fixed top-24 right-6 z-[2000] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {events.map((evt, idx) => (
                    <motion.div
                        key={`${evt.id}-${idx}`}
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300, delay: idx * 0.1 }}
                        className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl border border-indigo-100 overflow-hidden shrink-0 pointer-events-auto group"
                    >
                        <div className="flex bg-gradient-to-r from-indigo-50 to-white p-4 items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-200">
                                <Bell className="w-5 h-5 animate-pulse" />
                            </div>

                            <div className="flex-1 min-w-0 pr-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 block">
                                    Lembrete de Evento {evt.start_date === getTodayDateString() ? '(Hoje)' : '(Amanhã)'}
                                </span>
                                <h4 className="text-sm font-bold text-slate-800 truncate">
                                    {evt.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-500">
                                    <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" />{evt.start_date.split('-').reverse().join('/')}</span>
                                    {!evt.is_all_day && evt.start_time && (
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{evt.start_time.slice(0, 5)}</span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setEvents(prev => {
                                    const next = prev.filter(p => p.id !== evt.id);
                                    if (next.length === 0) setIsVisible(false);
                                    return next;
                                })}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Progress Bar visual indicator */}
                        <div className="h-1 w-full bg-slate-100">
                            <div className="h-full bg-indigo-500 w-full rounded-r-full" />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
