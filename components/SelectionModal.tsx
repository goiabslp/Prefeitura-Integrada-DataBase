import React, { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface SelectionModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    options: T[];
    onSelect: (item: T) => void;
    renderItem: (item: T, isSelected: boolean) => ReactNode;
    searchPlaceholder?: string;
    filterFunction?: (item: T, query: string) => boolean;
    initialFilter?: (item: T) => boolean; // New prop to filter items when search is empty
    selectedItem?: T | null;
    getInternalId: (item: T) => string | number; // Unique ID for key and selection check
}

export function SelectionModal<T>({
    isOpen,
    onClose,
    title,
    subtitle,
    options,
    onSelect,
    renderItem,
    searchPlaceholder = "Pesquisar...",
    filterFunction,
    initialFilter,
    selectedItem,

    getInternalId
}: SelectionModalProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const [visibleCount, setVisibleCount] = useState(50);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setIsClosing(false);
            setVisibleCount(50);
            document.body.style.overflow = 'hidden';
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
        setVisibleCount(50);
    }, [searchQuery]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300); // Match animation duration
    };

    if (!isOpen && !isClosing) return null;

    const filteredOptions = options.filter(item => {
        if (!searchQuery) {
            return initialFilter ? initialFilter(item) : true;
        }
        if (filterFunction) return filterFunction(item, searchQuery);
        // Default simple stringifying check if no filter function provided
        return JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
        return JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                setVisibleCount(prev => Math.min(prev + 50, filteredOptions.length));
            }
        }
    };

    return createPortal(
        <div className={`fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={handleClose}
            />

            {/* Modal Container */}
            <div className={`
        relative w-full max-w-2xl bg-white sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-white/20
        transform transition-all duration-300 ease-out
        ${isClosing ? 'translate-y-full sm:scale-95 sm:opacity-0' : 'translate-y-0 sm:scale-100 sm:opacity-100'}
        animate-slide-up
      `}>
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 bg-white z-10 shrink-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{title}</h3>
                        {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{subtitle}</p>}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all active:scale-90 shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
                            autoFocus
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg text-slate-400">
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>

                {/* Content List */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50/30"
                >
                    {filteredOptions.length > 0 ? (
                        <div className="space-y-3">
                            {filteredOptions.slice(0, visibleCount).map((item) => {
                                const isSelected = selectedItem ? getInternalId(item) === getInternalId(selectedItem) : false;
                                return (
                                    <button
                                        key={getInternalId(item)}
                                        onClick={() => {
                                            onSelect(item);
                                            handleClose();
                                        }}
                                        className={`w-full group text-left relative overflow-hidden transition-all duration-300
                      ${isSelected
                                                ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-offset-2'
                                                : 'bg-white hover:bg-white hover:shadow-lg hover:-translate-y-0.5 border border-slate-100 hover:border-indigo-100'
                                            }
                      rounded-2xl p-1
                    `}
                                    >
                                        <div className="relative z-10">
                                            {renderItem(item, isSelected)}
                                        </div>
                                        {/* Hover Effect Background */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/30 to-indigo-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full pointer-events-none" />
                                    </button>
                                );
                            })}
                            {filteredOptions.length > visibleCount && (
                                <div className="text-center py-4">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2"><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} /> <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /> <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                <Search className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum resultado encontrado</p>
                            <p className="text-xs text-slate-400 mt-1">Tente buscar com outros termos...</p>
                        </div>
                    )}
                </div>

                {/* Footer (Mobile only mostly) */}
                <div className="p-4 bg-white border-t border-slate-100 sm:hidden shrink-0">
                    <button onClick={handleClose} className="w-full py-4 bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 transition-colors">Fechar</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
