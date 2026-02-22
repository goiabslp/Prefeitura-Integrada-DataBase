import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Save, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from './Calendario';
import { supabase } from '../../services/supabaseClient';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    eventToEdit: CalendarEvent | null;
    selectedDate: string; // YYYY-MM-DD
    currentUserId: string;
}

export const EventModal: React.FC<Props> = ({
    isOpen, onClose, onSaved, eventToEdit, selectedDate, currentUserId
}) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Evento');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isAllDay, setIsAllDay] = useState(true);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                setTitle(eventToEdit.title);
                setType(eventToEdit.type);
                setStartDate(eventToEdit.start_date);
                setEndDate(eventToEdit.end_date);
                setIsAllDay(eventToEdit.is_all_day);
                setStartTime(eventToEdit.start_time || '');
                setEndTime(eventToEdit.end_time || '');
                setDescription(eventToEdit.description || '');
            } else {
                setTitle('');
                setType('Evento');
                setStartDate(selectedDate || new Date().toISOString().split('T')[0]);
                setEndDate(selectedDate || new Date().toISOString().split('T')[0]);
                setIsAllDay(true);
                setStartTime('');
                setEndTime('');
                setDescription('');
            }
        }
    }, [isOpen, eventToEdit, selectedDate]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !startDate || !endDate) return;

        if (startDate > endDate) {
            alert('A data de término não pode ser anterior à data de início.');
            return;
        }

        if (!isAllDay) {
            if (!startTime || !endTime) {
                alert('Informe os horários de início e término.');
                return;
            }
            if (startDate === endDate && startTime >= endTime) {
                alert('O horário de término deve ser posterior ao horário de início.');
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                title,
                type,
                start_date: startDate,
                end_date: endDate,
                is_all_day: isAllDay,
                start_time: isAllDay ? null : startTime,
                end_time: isAllDay ? null : endTime,
                description
            };

            if (eventToEdit) {
                const { error } = await supabase
                    .from('calendar_events')
                    .update(payload)
                    .eq('id', eventToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('calendar_events')
                    .insert({
                        ...payload,
                        created_by: currentUserId
                    });
                if (error) throw error;
            }
            onSaved();
        } catch (err) {
            console.error('Error saving event:', err);
            alert('Erro ao salvar o evento.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!eventToEdit) return;
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', eventToEdit.id);

            if (error) throw error;
            onSaved();
        } catch (err) {
            console.error('Error deleting event:', err);
            alert('Erro ao excluir o evento.');
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="h-24 bg-gradient-to-br from-rose-500 to-pink-600 p-6 flex items-start justify-between shrink-0 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full blur-xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 text-white mb-1">
                                <CalendarIcon className="w-6 h-6 opacity-80" />
                                <h2 className="text-xl font-black tracking-tight">
                                    {eventToEdit ? 'Editar Registro' : 'Novo Registro'}
                                </h2>
                            </div>
                            <p className="text-rose-100 text-sm font-medium">
                                Gerencie eventos, reuniões e feriados no calendário
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                Título do Registro
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Reunião de Alinhamento"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-700 font-medium placeholder:text-slate-400 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                    Data de Início
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-700 font-medium outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                    Data de Término
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-700 font-medium outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isAllDay" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} className="w-5 h-5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer" />
                            <label htmlFor="isAllDay" className="text-sm font-medium text-slate-700 cursor-pointer">Evento de Dia Inteiro</label>
                        </div>

                        {!isAllDay && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">Hora Inicial</label>
                                    <input type="time" required={!isAllDay} value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-700 font-medium outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">Hora Final</label>
                                    <input type="time" required={!isAllDay} value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-700 font-medium outline-none" />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                Tipo
                            </label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-700 font-medium outline-none appearance-none"
                            >
                                <option value="Evento">Evento Público</option>
                                <option value="Reunião">Reunião Interna</option>
                                <option value="Feriado">Feriado / Recesso</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">
                                Descrição (Opcional)
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Detalhes adicionais..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-700 font-medium placeholder:text-slate-400 outline-none resize-none h-24"
                            />
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            {eventToEdit ? (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting || loading}
                                    className="flex items-center gap-2 px-4 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                                >
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Excluir
                                </button>
                            ) : <div />}

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || deleting}
                                    className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-600/40 font-bold uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence >
    );
};
