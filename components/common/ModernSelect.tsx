import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface ModernSelectProps {
    label?: string;
    value: string | number;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    icon?: React.ElementType;
    className?: string;
    searchable?: boolean;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder = 'Selecione...',
    icon: Icon,
    className = '',
    searchable = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">
                    {label}
                </label>
            )}
            
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl
                    hover:bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/10
                    transition-all duration-300 outline-none
                    ${isOpen ? 'bg-white border-indigo-500 ring-4 ring-indigo-500/10' : ''}
                `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {Icon && (
                        <Icon className={`w-4 h-4 ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
                    )}
                    <span className={`text-sm font-bold truncate ${selectedOption ? 'text-slate-700' : 'text-slate-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>

            {/* Dropdown */}
            <div className={`
                absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl border border-slate-100 shadow-xl shadow-indigo-500/10
                z-50 overflow-hidden transition-all duration-300 origin-top
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}>
                {searchable && (
                    <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(String(option.value));
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors
                                    ${String(value) === String(option.value) 
                                        ? 'bg-indigo-50 text-indigo-600' 
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                            >
                                <span>{option.label}</span>
                                {String(value) === String(option.value) && (
                                    <Check className="w-3.5 h-3.5" />
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Nenhuma opção
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
