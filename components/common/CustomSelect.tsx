import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface Option {
    value: string;
    label: string;
    subtext?: string;
}

interface CustomSelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    icon?: React.ElementType;
    required?: boolean;
    className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder = 'Selecione...',
    icon: Icon,
    required,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropPosition, setDropPosition] = useState<'down' | 'up'>('down');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            // Auto-position logic
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceNeeded = 300; // Approx max height + padding

            if (spaceBelow < spaceNeeded && rect.top > spaceNeeded) {
                setDropPosition('up');
            } else {
                setDropPosition('down');
            }

            // Only auto-focus on larger screens (desktop) to avoid keyboard popup on mobile
            if (window.innerWidth >= 768 && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
        if (!isOpen) {
            setSearchTerm(''); // Reset search on close
            // Optional: reset position after close, though not strictly necessary as it re-calcs on open
            // setDropPosition('down'); 
        }
    }, [isOpen]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const lowerSearch = searchTerm.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerSearch) ||
            (opt.subtext && opt.subtext.toLowerCase().includes(lowerSearch))
        );
    }, [options, searchTerm]);

    // Limit rendered items for mobile performance (Virtualization-lite)
    const displayOptions = useMemo(() => filteredOptions.slice(0, 50), [filteredOptions]);

    const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";
    const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all flex items-center justify-between cursor-pointer group-hover:bg-white group-hover:border-cyan-200";

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className={labelClass}>{label}</label>}

            <div
                className="group relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`${inputClass} ${isOpen ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-white' : ''}`}>
                    <span className={`block truncate ${!selectedOption ? 'text-slate-400' : 'font-medium'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>

                    <div className="flex items-center gap-2 text-slate-400">
                        {Icon && <Icon className={`w-5 h-5 transition-colors ${isOpen || selectedOption ? 'text-cyan-500' : 'group-hover:text-cyan-500'}`} />}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-500' : ''}`} />
                    </div>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className={`absolute z-50 left-0 right-0 bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in duration-200 ${dropPosition === 'up'
                        ? 'bottom-full mb-2 slide-in-from-bottom-2'
                        : 'mt-2 slide-in-from-top-2'
                        }`}>
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none bg-white placeholder:text-slate-300"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {displayOptions.length > 0 ? (
                                displayOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-start sm:items-center justify-between group/item gap-2
                                            ${value === option.value
                                                ? 'bg-cyan-50 text-cyan-700'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                            <span className="font-semibold truncate">{option.label}</span>
                                            {option.subtext && (
                                                <span className={`text-xs sm:text-sm truncate ${value === option.value ? 'text-cyan-600/70' : 'text-slate-400'}`}>
                                                    {option.subtext}
                                                </span>
                                            )}
                                        </div>
                                        {value === option.value && <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                    Nenhum resultado encontrado
                                </div>
                            )}
                            {filteredOptions.length > 50 && (
                                <div className="px-4 py-2 text-[10px] text-center text-slate-400 border-t border-slate-50">
                                    Refine sua busca para ver mais resultados ({filteredOptions.length} total)
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Required Indicator (Optional visual cue) */}
            {required && !value && !isOpen && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 opacity-50" />
            )}
        </div>
    );
};
