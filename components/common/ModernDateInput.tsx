import React, { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { DateTimePickerModal } from '../DateTimePickerModal';

interface ModernDateInputProps {
    label?: string;
    value: string; // ISO Date String 'YYYY-MM-DD'
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minDate?: string;
    maxDate?: string;
}

export const ModernDateInput: React.FC<ModernDateInputProps> = ({
    label,
    value,
    onChange,
    placeholder = 'Selecione a data',
    className = '',
    minDate,
    maxDate
}) => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Parse value to Date object for the picker
    const dateValue = value ? new Date(value + 'T00:00:00') : undefined;

    const handleDateSelect = (date: Date) => {
        // Format to YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
    };

    const displayValue = dateValue
        ? dateValue.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">
                    {label}
                </label>
            )}

            <button
                onClick={() => setIsPickerOpen(true)}
                className={`
                    w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl
                    hover:bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/10
                    transition-all duration-300 outline-none group
                    ${isPickerOpen ? 'bg-white border-indigo-500 ring-4 ring-indigo-500/10' : ''}
                `}
            >
                <CalendarIcon className={`w-4 h-4 transition-colors ${value ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                <span className={`text-sm font-bold flex-1 text-left ${value ? 'text-slate-700' : 'text-slate-400'}`}>
                    {value ? displayValue : placeholder}
                </span>
                {value && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                        }}
                        className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </div>
                )}
            </button>

            <DateTimePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleDateSelect}
                initialDate={dateValue || new Date()}
                mode="date"
                title={label || "Selecione a data"}
                minDate={minDate ? new Date(minDate + 'T00:00:00') : undefined}
                maxDate={maxDate ? new Date(maxDate + 'T00:00:00') : undefined}
            />
        </div>
    );
};
