
import React, { useState } from 'react';
import { LucideIcon, Calendar, Clock, ChevronDown } from 'lucide-react';
import { DateTimePickerModal } from '../DateTimePickerModal';

interface CustomDateTimeInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    type: 'date' | 'time';
    placeholder?: string;
    icon?: LucideIcon;
    required?: boolean;
    className?: string;
}

export const CustomDateTimeInput: React.FC<CustomDateTimeInputProps> = ({
    label,
    value,
    onChange,
    type,
    placeholder = 'Selecione...',
    icon: Icon,
    required,
    className
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Styling classes (matching CustomSelect)
    const labelClass = "block text-sm font-bold text-slate-700 mb-1.5 ml-1";
    const inputClass = `
        w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium 
        focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 
        transition-all duration-200 flex items-center justify-between cursor-pointer group
        hover:border-cyan-300 hover:bg-slate-50/50
    `;

    // Helpers
    const getDisplayValue = () => {
        if (!value) return '';
        if (type === 'date') {
            const [year, month, day] = value.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if (isNaN(date.getTime())) return value;
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        return value; // Time is already HH:MM
    };

    const handleSelect = (date: Date) => {
        if (type === 'date') {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
        } else {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            onChange(`${hours}:${minutes}`);
        }
    };

    const getInitialDate = () => {
        if (!value) return new Date();
        const date = new Date();
        if (type === 'date') {
            const [year, month, day] = value.split('-').map(Number);
            date.setFullYear(year, month - 1, day);
        } else {
            const [hours, minutes] = value.split(':').map(Number);
            date.setHours(hours, minutes);
        }
        return date;
    };

    const DefaultIcon = type === 'date' ? Calendar : Clock;
    const DisplayIcon = Icon || DefaultIcon;

    return (
        <div className={`relative ${className}`}>
            {label && <label className={labelClass}>{label}</label>}

            <div
                className={`${inputClass} ${isModalOpen ? 'border-cyan-500 ring-4 ring-cyan-500/10 bg-white' : ''}`}
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <div className={`p-1.5 rounded-lg ${value ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-100 text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-500'} transition-colors`}>
                        <DisplayIcon className="w-4 h-4" />
                    </div>
                    <span className={`block truncate ${!value ? 'text-slate-400' : 'text-slate-700'}`}>
                        {getDisplayValue() || placeholder}
                    </span>
                </div>

                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isModalOpen ? 'rotate-180 text-cyan-500' : 'group-hover:text-cyan-500'}`} />
            </div>

            {/* Required Indicator */}
            {required && !value && !isModalOpen && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 opacity-50" />
            )}

            <DateTimePickerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleSelect}
                initialDate={getInitialDate()}
                title={label || (type === 'date' ? 'Selecione a Data' : 'Selecione o Horário')}
                mode={type}
            />
        </div>
    );
};
