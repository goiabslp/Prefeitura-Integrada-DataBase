import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Fuel, Trash2, Calendar, User, Truck, ShieldCheck } from 'lucide-react';
import { AbastecimentoService, AbastecimentoRecord } from '../../services/abastecimentoService';

interface AbastecimentoListProps {
    onBack: () => void;
}

export const AbastecimentoList: React.FC<AbastecimentoListProps> = ({ onBack }) => {
    const [supplies, setSupplies] = useState<AbastecimentoRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setSupplies(AbastecimentoService.getAbastecimentos());
    }, []);

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            AbastecimentoService.deleteAbastecimento(id);
            setSupplies(AbastecimentoService.getAbastecimentos());
        }
    };

    const filteredSupplies = supplies.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.fiscal && item.fiscal.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const DataItem = ({ label, value, icon: Icon, colorClass = "text-slate-900", flex = "flex-1" }: { label: string, value: string | number, icon?: any, colorClass?: string, flex?: string }) => (
        <div className={`flex flex-col gap-0.5 ${flex} min-w-0`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
            <div className={`flex items-center gap-1.5 text-sm font-bold ${colorClass}`}>
                {Icon && <Icon className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                <span className="truncate" title={String(value)}>{value}</span>
            </div>
        </div>
    );

    return (
        <div className="flex-1 h-full bg-slate-50 p-4 md:p-6 overflow-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="group p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all shadow-sm ring-1 ring-slate-200 bg-white">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Gestão de Abastecimento</h1>
                            <p className="text-xs text-slate-500 font-medium">Histórico e controle de gastos</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 w-full sm:w-64 shadow-sm transition-all"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                        </div>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-xs shadow-sm transition-all active:scale-95">
                            <Filter className="w-4 h-4" />
                            Filtros
                        </button>
                    </div>
                </div>

                {/* List Container */}
                {filteredSupplies.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                        <Fuel className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-400">Nenhum registro encontrado</h3>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredSupplies.map((item) => (
                            <div key={item.id} className="group bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-lg hover:border-cyan-200 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-3 min-w-0">
                                        {/* Row 1 */}
                                        <div className="flex items-start gap-4 w-full">
                                            <DataItem label="Protocolo" value={item.id} icon={ShieldCheck} colorClass="text-slate-500 font-mono text-[10px]" flex="w-[15%]" />
                                            <DataItem label="Data / Hora" value={new Date(item.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} icon={Calendar} flex="w-[15%]" />
                                            <DataItem label="Veículo" value={item.vehicle} icon={Truck} colorClass="text-slate-900 uppercase" flex="w-[25%]" />
                                            <DataItem label="Motorista" value={item.driver} icon={User} colorClass="text-slate-700 uppercase" flex="w-[30%]" />
                                            <DataItem label="Combustível" value={item.fuelType.split(' - ')[0]} icon={Fuel} colorClass="text-cyan-600" flex="w-[15%]" />
                                        </div>

                                        {/* Row 2 */}
                                        <div className="flex items-start gap-4 pt-3 border-t border-slate-50 w-full">
                                            <DataItem label="Fiscal" value={item.fiscal || 'Sistema'} icon={ShieldCheck} colorClass="text-slate-900" flex="w-[15%]" />
                                            <DataItem label="Quantidade" value={`${item.liters.toFixed(2)} L`} flex="w-[15%]" />
                                            <DataItem label="KM" value={`${item.odometer.toLocaleString()} Km`} flex="w-[25%]" />
                                            <DataItem label="Custo" value={`R$ ${item.cost.toFixed(2)}`} colorClass="text-emerald-600" flex="w-[45%]" />
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                                        title="Excluir Registro"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
