import React from 'react';
import { X, Calendar as CalendarIcon, Clock, Edit2, Trash2, CalendarDays, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from './Calendario';
import { supabase } from '../../services/supabaseClient';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CalendarEvent | null;
    isAdmin: boolean;
    onEditEvent: (event: CalendarEvent) => void;
    onDeleteSuccess: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
    isOpen,
    onClose,
    event,
    isAdmin,
    onEditEvent,
    onDeleteSuccess
}) => {
    if (!isOpen || !event) return null;

    const colors = {
        Feriado: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500' },
        Reunião: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-500' },
        Evento: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-500' }
    }[event.type] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'text-slate-500' };

    const formatTime = (t: string) => t.slice(0, 5);
    const formatDateBr = (d: string) => d.split('-').reverse().join('/');

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            const { error } = await supabase.from('calendar_events').delete().eq('id', event.id);
            if (error) throw error;
            onDeleteSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Erro ao excluir o evento.");
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-lg bg-white rounded-3xl shadow-2xl relative z-10 overflow-hidden"
                >
                    {/* Header */}
                    <div className={`${colors.bg} px-6 py-5 flex items-start justify-between border-b ${colors.border}`}>
                        <div className="flex gap-4">
                            <div className={`mt-1 bg-white p-2 rounded-xl shadow-sm border ${colors.border}`}>
                                <CalendarIcon className={`w-6 h-6 ${colors.icon}`} />
                            </div>
                            <div>
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest bg-white border mb-2 shadow-sm ${colors.border} ${colors.text}`}>
                                    {event.type}
                                </span>
                                <h2 className="text-xl font-bold text-slate-800 leading-tight">
                                    {event.title}
                                </h2>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full hover:bg-white/50 transition-colors ${colors.text}`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Time and Date Context */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                    <CalendarDays className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Datas</p>
                                    <p className="text-sm font-medium">
                                        {event.start_date === event.end_date
                                            ? formatDateBr(event.start_date)
                                            : `De ${formatDateBr(event.start_date)} a ${formatDateBr(event.end_date)}`
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Horário</p>
                                    <p className="text-sm font-medium">
                                        {event.is_all_day
                                            ? 'Dia Inteiro'
                                            : `${formatTime(event.start_time!)} às ${formatTime(event.end_time!)}`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-start gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                        <AlignLeft className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex-1 pb-2">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Descrição</p>
                                        <div className="text-sm border-l-2 pl-3 border-slate-200 text-slate-600 whitespace-pre-wrap leading-relaxed">
                                            {event.description}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Meta */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                            <span>Criado em: {new Date(event.created_at!).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && !event.id.startsWith('system-') && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    onEditEvent(event);
                                }}
                                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-200 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                                Editar
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
