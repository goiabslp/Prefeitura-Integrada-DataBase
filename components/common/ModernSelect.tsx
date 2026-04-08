import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface ModernSelectProps {
    label?: string;
    value: string | number | string[];
    onChange: (value: any) => void;
    options: Option[];
    placeholder?: string;
    icon?: React.ElementType;
    className?: string;
    searchable?: boolean;
    multiple?: boolean;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder = 'Selecione...',
    icon: Icon,
    className = '',
    searchable = false,
    multiple = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = !multiple ? options.find(opt => String(opt.value) === String(value)) : undefined;
    const selectedOptions = multiple ? options.filter(opt => (value as string[]).includes(String(opt.value))) : [];

    const getDisplayText = () => {
        if (multiple) {
            if (selectedOptions.length === 0) return placeholder;
            if (selectedOptions.length === 1) return selectedOptions[0].label;
            if (selectedOptions.length === options.length) return 'Todos Selecionados';
            return `${selectedOptions.length} itens selecionados`;
        }
        return selectedOption ? selectedOption.label : placeholder;
    };

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

            <div
                className={`
                    w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl
                    hover:bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/10
                    transition-all duration-300 outline-none cursor-text
                    ${isOpen ? 'bg-white border-indigo-500 ring-4 ring-indigo-500/10' : ''}
                `}
                onClick={() => {
                    setIsOpen(true);
                }}
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {Icon && (
                        <Icon className={`w-4 h-4 shrink-0 ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
                    )}
                    {searchable && !multiple ? (
                        <input
                            type="text"
                            value={isOpen ? searchTerm : (selectedOption ? selectedOption.label : '')}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                            }}
                            onFocus={() => {
                                setIsOpen(true);
                                setSearchTerm(''); // Clear text to search when focused
                            }}
                            onBlur={() => {
                                // Delay clearing search so click event on option fires
                                setTimeout(() => {
                                    setSearchTerm('');
                                }, 200);
                            }}
                            placeholder={selectedOption && !isOpen ? selectedOption.label : placeholder}
                            className={`w-full bg-transparent text-sm font-bold outline-none truncate placeholder:text-slate-400 placeholder:font-bold ${isOpen || !selectedOption ? 'text-slate-700' : 'text-slate-700'}`}
                        />
                    ) : (
                        <span className={`text-sm font-bold truncate ${(!multiple && selectedOption) || (multiple && selectedOptions.length > 0) ? 'text-slate-700' : 'text-slate-400'}`}>
                            {getDisplayText()}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="p-1 -mr-1 outline-none shrink-0"
                >
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                </button>
            </div>

            {/* Dropdown */}
            <div className={`
                absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl border border-slate-100 shadow-xl shadow-indigo-500/10
                z-50 overflow-hidden transition-all duration-300 origin-top
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
            `}>
                {/* Dropped duplicate internal search bar code here to adhere to direct search behavior. */}

                <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => {
                            const isSelected = multiple ? (value as string[]).includes(String(option.value)) : String(value) === String(option.value);
                            
                            return (
                            <button
                                key={option.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (multiple) {
                                        // Specific logic for 'all' vs others
                                        let nextValue = Array.isArray(value) ? [...value] : [];
                                        
                                        if (String(option.value) === 'all') {
                                            nextValue = ['all'];
                                        } else {
                                            // Remove 'all' if present
                                            nextValue = nextValue.filter(v => v !== 'all');
                                            
                                            if (nextValue.includes(String(option.value))) {
                                                nextValue = nextValue.filter(v => v !== String(option.value));
                                            } else {
                                                nextValue.push(String(option.value));
                                            }
                                            if (nextValue.length === 0) nextValue.push('all');
                                        }
                                        onChange(nextValue);
                                    } else {
                                        onChange(String(option.value));
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }
                                }}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors
                                    ${isSelected
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                `}
                            >
                                <span className="text-left flex-1 truncate pr-2">{option.label}</span>
                                {isSelected && (
                                    <Check className="w-3.5 h-3.5 shrink-0 transition-transform scale-100" />
                                )}
                            </button>
                        )})
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
