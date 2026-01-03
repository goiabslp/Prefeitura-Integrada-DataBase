import React from 'react';
import { ArrowLeft, Search, Filter, Fuel, Trash2, Edit2 } from 'lucide-react';

interface AbastecimentoListProps {
    onBack: () => void;
}

export const AbastecimentoList: React.FC<AbastecimentoListProps> = ({ onBack }) => {
    // Mock Data
    const supplies = [
        { id: 1, date: '2023-10-25', vehicle: 'ABC-1234', driver: 'João Silva', type: 'Gasolina', liters: 45.5, cost: 250.25, km: 54000 },
        { id: 2, date: '2023-10-24', vehicle: 'XYZ-9876', driver: 'Maria Oliveira', type: 'Diesel', liters: 60.0, cost: 360.00, km: 12500 },
        { id: 3, date: '2023-10-23', vehicle: 'DEF-5678', driver: 'Carlos Santos', type: 'Etanol', liters: 30.0, cost: 110.50, km: 32100 },
    ];

    return (
        <div className="flex-1 h-full bg-slate-50 p-6 overflow-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Abastecimento</h1>
                            <p className="text-slate-500 font-medium">Histórico e controle de gastos</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 w-64 shadow-sm"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 uppercase text-[10px] tracking-wider text-slate-500 font-bold">
                                    <th className="p-4 pl-6">Data</th>
                                    <th className="p-4">Veículo</th>
                                    <th className="p-4">Motorista</th>
                                    <th className="p-4">Combustível</th>
                                    <th className="p-4 text-right">Litros</th>
                                    <th className="p-4 text-right">Valor Total</th>
                                    <th className="p-4 text-right">KM</th>
                                    <th className="p-4 pr-6 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {supplies.map((item) => (
                                    <tr key={item.id} className="hover:bg-cyan-50/30 transition-colors group">
                                        <td className="p-4 pl-6 text-sm font-semibold text-slate-700">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-sm font-bold text-slate-800">{item.vehicle}</td>
                                        <td className="p-4 text-sm text-slate-600">{item.driver}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                                <Fuel className="w-3 h-3" /> {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-sm font-mono text-slate-600">{item.liters.toFixed(2)} L</td>
                                        <td className="p-4 text-right text-sm font-bold text-emerald-600 font-mono">R$ {item.cost.toFixed(2)}</td>
                                        <td className="p-4 text-right text-sm text-slate-500 font-mono">{item.km.toLocaleString()}</td>
                                        <td className="p-4 pr-6">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
