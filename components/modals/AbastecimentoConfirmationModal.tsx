import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X, AlertTriangle, Fuel, Truck, FileText, Droplets, DollarSign } from 'lucide-react';

interface AbastecimentoConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: {
        invoiceNumber: string;
        vehicle: string;
        fuelType: string;
        liters: number;
        cost: number;
    } | null;
    isSaving?: boolean;
}

export const AbastecimentoConfirmationModal: React.FC<AbastecimentoConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    data,
    isSaving = false
}) => {
    if (!isOpen || !data) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col md:animate-scale-in animate-slide-up-mobile">

                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">Confirmar Registro</h3>
                            <p className="text-xs text-slate-500 font-medium">Verifique os dados abaixo</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Invoice Number */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Número da Nota</span>
                            <span className="text-sm font-bold text-slate-900">{data.invoiceNumber || 'Não informado'}</span>
                        </div>
                    </div>

                    {/* Vehicle */}
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-cyan-500 border border-slate-100">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col flex-1 border-b border-slate-100 pb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Veículo</span>
                            <span className="text-sm font-bold text-slate-800">{data.vehicle}</span>
                        </div>
                    </div>

                    {/* Fuel & Liters Row */}
                    <div className="grid grid-cols-2 gap-4 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-rose-500 border border-slate-100">
                                <Fuel className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col border-b border-slate-100 pb-2 flex-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Combustível</span>
                                <span className="text-sm font-bold text-slate-800">{data.fuelType.split(' - ')[0]}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-blue-500 border border-slate-100">
                                <Droplets className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col border-b border-slate-100 pb-2 flex-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Litros</span>
                                <span className="text-sm font-bold text-slate-800">{data.liters.toFixed(1)} L</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Cost */}
                    <div className="mt-4 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Valor Total</span>
                        <div className="flex items-center gap-1 text-emerald-600">
                            <DollarSign className="w-5 h-5" />
                            <span className="text-2xl font-black tracking-tight">
                                {data.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Confirmar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
