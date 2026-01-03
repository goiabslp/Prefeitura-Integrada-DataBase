import React, { useState } from 'react';
import { Fuel, Calendar, User, Truck, DollarSign, Gauge, ArrowLeft, Save } from 'lucide-react';

interface AbastecimentoFormProps {
    onBack: () => void;
    onSave: (data: any) => void;
}

export const AbastecimentoForm: React.FC<AbastecimentoFormProps> = ({ onBack, onSave }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        vehicle: '',
        driver: '',
        fuelType: 'Gasolina',
        liters: '',
        cost: '',
        odometer: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all";
    const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

    return (
        <div className="flex-1 h-full bg-slate-50 p-4 md:p-6 overflow-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Novo Abastecimento</h1>
                        <p className="text-sm md:text-base text-slate-500 font-medium">Registrar entrada de combustível</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-5 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <div>
                            <label className={labelClass}>Data</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className={inputClass}
                                    required
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Veículo</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.vehicle}
                                    onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
                                    className={inputClass}
                                    placeholder="Placa ou Modelo"
                                    required
                                />
                                <Truck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Motorista</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.driver}
                                    onChange={e => setFormData({ ...formData, driver: e.target.value })}
                                    className={inputClass}
                                    placeholder="Nome do condutor"
                                    required
                                />
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Tipo de Combustível</label>
                            <div className="relative">
                                <select
                                    value={formData.fuelType}
                                    onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="Gasolina">Gasolina</option>
                                    <option value="Etanol">Etanol</option>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Diesel S10">Diesel S10</option>
                                    <option value="GNV">GNV</option>
                                </select>
                                <Fuel className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Litros</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.liters}
                                    onChange={e => setFormData({ ...formData, liters: e.target.value })}
                                    className={inputClass}
                                    placeholder="0.00"
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">L</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Valor Total</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.cost}
                                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                    className={inputClass}
                                    placeholder="0.00"
                                    required
                                />
                                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Odômetro (Km)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={formData.odometer}
                                    onChange={e => setFormData({ ...formData, odometer: e.target.value })}
                                    className={inputClass}
                                    placeholder="Quilometragem atual"
                                    required
                                />
                                <Gauge className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-end pt-6 border-t border-slate-100 gap-4 md:gap-0">
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-95 w-full md:w-auto"
                        >
                            <Save className="w-5 h-5" />
                            Registrar Abastecimento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
