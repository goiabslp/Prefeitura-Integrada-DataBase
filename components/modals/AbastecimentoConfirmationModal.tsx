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
        odometer?: number | string;
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
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 leading-tight">Confirmar Registro</h3>
                            <p className="text-sm text-slate-500 font-medium">Verifique os dados com atenção</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Invoice Number - Highlighted */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText className="w-16 h-16" />
                        </div>
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm z-10">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col z-10">
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Número da Nota</span>
                            <span className="text-xl font-black text-slate-900">{data.invoiceNumber || 'Não informado'}</span>
                        </div>
                    </div>

                    {/* Vehicle */}
                    <div className="flex items-start gap-4 px-2">
                        <div className="w-10 h-10 mt-1 bg-cyan-50 rounded-full flex items-center justify-center text-cyan-600 border border-cyan-100">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col flex-1 border-b border-slate-100 pb-4">
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Veículo</span>
                            <span className="text-lg font-bold text-slate-800 leading-tight">{data.vehicle}</span>
                        </div>
                    </div>

                    {/* Odometer */}
                    <div className="flex items-start gap-4 px-2">
                        <div className="w-10 h-10 mt-1 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100">
                            <div className="font-black text-[10px]">KM</div>
                        </div>
                        <div className="flex flex-col flex-1 border-b border-slate-100 pb-4">
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Odômetro</span>
                            <span className="text-lg font-bold text-slate-800">
                                {typeof data.odometer === 'number'
                                    ? data.odometer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                    : data.odometer || '0,00'} KM
                            </span>
                        </div>
                    </div>

                    {/* Fuel & Liters Row */}
                    <div className="grid grid-cols-2 gap-6 px-2">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                                <Fuel className="w-3 h-3" /> Combustível
                            </span>
                            <span className="text-lg font-bold text-slate-800">{data.fuelType.split(' - ')[0]}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                                <Droplets className="w-3 h-3" /> Litros
                            </span>
                            <span className="text-lg font-bold text-slate-800">{data.liters.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} L</span>
                        </div>
                    </div>

                    {/* Total Cost - Prominent */}
                    <div className="mt-2 bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex flex-col items-center justify-center gap-1 shadow-sm">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Valor Total</span>
                        <div className="flex items-center gap-1 text-emerald-600">
                            <DollarSign className="w-6 h-6" />
                            <span className="text-4xl font-black tracking-tight">
                                {data.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50 text-base"
                    >
                        Revisar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-base"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-6 h-6" />
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
