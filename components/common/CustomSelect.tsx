import React, { useState, useRef, useEffect, useMemo, useDeferredValue, memo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface Option {
    value: string;
    label: string;
    subtext?: string;
    _sortKey?: string;
    key?: string;
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

// Sub-component for options to enable granular memoization
const SelectItem = memo(({
    option,
    isSelected,
    onClick
}: {
    option: Option;
    isSelected: boolean;
    onClick: (val: string) => void
}) => {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick(option.value);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-start sm:items-center justify-between group/item gap-2
                ${isSelected
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <span className="font-semibold truncate">{option.label}</span>
                {option.subtext && (
                    <span className={`text-xs sm:text-sm truncate ${isSelected ? 'text-cyan-600/70' : 'text-slate-400'}`}>
                        {option.subtext}
                    </span>
                )}
            </div>
            {isSelected && <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />}
        </button>
    );
});

SelectItem.displayName = 'SelectItem';

export const CustomSelect: React.FC<CustomSelectProps> = memo(({
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

    const selectedOption = useMemo(() => options.find(opt => opt.value === value), [options, value]);
    const deferredSearchTerm = useDeferredValue(searchTerm);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            // Auto-position logic
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceNeeded = 300;

            setDropPosition(spaceBelow < spaceNeeded && rect.top > spaceNeeded ? 'up' : 'down');

            if (window.innerWidth >= 768 && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredOptions = useMemo(() => {
        if (!deferredSearchTerm) return options;
        const lowerSearch = deferredSearchTerm.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerSearch) ||
            (opt.subtext && opt.subtext.toLowerCase().includes(lowerSearch))
        );
    }, [options, deferredSearchTerm]);

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

                {isOpen && (
                    <div className={`absolute z-50 left-0 right-0 bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in duration-200 ${dropPosition === 'up'
                        ? 'bottom-full mb-2 slide-in-from-bottom-2'
                        : 'mt-2 slide-in-from-top-2'
                        }`}>
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

                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {displayOptions.length > 0 ? (
                                displayOptions.map((option) => (
                                    <SelectItem
                                        key={option.key || option.value}
                                        option={option}
                                        isSelected={value === option.value}
                                        onClick={(val) => {
                                            onChange(val);
                                            setIsOpen(false);
                                        }}
                                    />
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

            {required && !value && !isOpen && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 opacity-50" />
            )}
        </div>
    );
});

CustomSelect.displayName = 'CustomSelect';
