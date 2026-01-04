import React, { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, Droplet, DollarSign, Truck, Settings, LayoutDashboard, Building2, MapPin, CreditCard, Fuel, Save, Plus, Calendar, ChevronDown, History, BarChart3, Search, ChevronRight } from 'lucide-react';
import { AbastecimentoService } from '../../services/abastecimentoService';

interface AbastecimentoDashboardProps {
    onBack: () => void;
}

type TabType = 'overview' | 'vehicle' | 'config';

const ConfigPanel: React.FC = () => {
    const [fuelConfig, setFuelConfig] = useState(AbastecimentoService.getFuelConfig());
    const [gasStations, setGasStations] = useState(AbastecimentoService.getGasStations());
    const [newStation, setNewStation] = useState({ name: '', cnpj: '', city: '' });
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleSaveConfig = () => {
        AbastecimentoService.saveFuelConfig(fuelConfig);
        showSuccessToast('Valores salvos com sucesso!');
    };

    const handleAddStation = () => {
        if (!newStation.name) return;

        const station = {
            id: crypto.randomUUID(),
            ...newStation
        };

        AbastecimentoService.saveGasStation(station);
        setGasStations(AbastecimentoService.getGasStations());
        setNewStation({ name: '', cnpj: '', city: '' });
        showSuccessToast('Posto adicionado com sucesso!');
    };

    const handleDeleteStation = (id: string) => {
        AbastecimentoService.deleteGasStation(id);
        setGasStations(AbastecimentoService.getGasStations());
    };

    const showSuccessToast = (msg: string) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all";
    const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

    return (
        <div className="space-y-8 animate-fade-in pb-12 relative">
            {showToast && (
                <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in z-50">
                    <Save className="w-5 h-5" />
                    <span className="font-bold">{toastMessage}</span>
                </div>
            )}

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Posto de Abastecimento</h2>
                        <p className="text-slate-500 text-sm font-medium">Cadastrar novo fornecedor</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-1">
                        <label className={labelClass}>Nome do Posto</label>
                        <div className="relative">
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Ex: Posto Ipiranga Centro"
                                value={newStation.name}
                                onChange={e => setNewStation({ ...newStation, name: e.target.value })}
                            />
                            <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>CNPJ</label>
                        <div className="relative">
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="00.000.000/0000-00"
                                value={newStation.cnpj}
                                onChange={e => setNewStation({ ...newStation, cnpj: e.target.value })}
                            />
                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Cidade</label>
                        <div className="relative">
                            <input
                                type="text"
                                className={inputClass}
                                placeholder="Nome da Cidade"
                                value={newStation.city}
                                onChange={e => setNewStation({ ...newStation, city: e.target.value })}
                            />
                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="lg:col-span-3 flex justify-end">
                        <button
                            onClick={handleAddStation}
                            disabled={!newStation.name}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Posto
                        </button>
                    </div>
                </div>

                {gasStations.length > 0 && (
                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Postos Cadastrados</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {gasStations.map((station) => (
                                <div key={station.id} className="group bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all relative">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{station.name}</h4>
                                            <div className="text-xs text-slate-500 space-y-1 mt-1">
                                                {station.cnpj && <p>CNPJ: {station.cnpj}</p>}
                                                {station.city && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {station.city}</p>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteStation(station.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remover posto"
                                        >
                                            <Settings className="w-4 h-4 rotate-45" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                        <Fuel className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Valores Licitados</h2>
                        <p className="text-slate-500 text-sm font-medium">Definir preço por tipo de combustível</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-amber-300 transition-colors group">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Diesel</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={fuelConfig.diesel || ''}
                                onChange={(e) => setFuelConfig({ ...fuelConfig, diesel: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-amber-300 transition-colors group">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Gasolina</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={fuelConfig.gasolina || ''}
                                onChange={(e) => setFuelConfig({ ...fuelConfig, gasolina: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-amber-300 transition-colors group">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Etanol</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={fuelConfig.etanol || ''}
                                onChange={(e) => setFuelConfig({ ...fuelConfig, etanol: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-amber-300 transition-colors group">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Arla</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={fuelConfig.arla || ''}
                                onChange={(e) => setFuelConfig({ ...fuelConfig, arla: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t border-slate-100">
                    <button
                        onClick={handleSaveConfig}
                        className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        Salvar Valores
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AbastecimentoDashboard: React.FC<AbastecimentoDashboardProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const stats = useMemo(() => {
        const allRecords = AbastecimentoService.getAbastecimentos();

        // Current filtered records
        const filtered = allRecords.filter(r => {
            const date = new Date(r.date);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });

        // Previous month records for comparison
        const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
        const previous = allRecords.filter(r => {
            const date = new Date(r.date);
            return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
        });

        const totalCost = filtered.reduce((acc, r) => acc + r.cost, 0);
        const prevCost = previous.reduce((acc, r) => acc + r.cost, 0);
        const costDiff = prevCost === 0 ? 0 : ((totalCost - prevCost) / prevCost) * 100;

        const totalLiters = filtered.reduce((acc, r) => acc + r.liters, 0);
        const prevLiters = previous.reduce((acc, r) => acc + r.liters, 0);
        const litersDiff = prevLiters === 0 ? 0 : ((totalLiters - prevLiters) / prevLiters) * 100;

        // Group by vehicle
        const vehicleGroups = filtered.reduce((acc, r) => {
            if (!acc[r.vehicle]) {
                acc[r.vehicle] = {
                    name: r.vehicle,
                    totalCost: 0,
                    totalLiters: 0,
                    count: 0,
                    lastRef: r.date
                };
            }
            acc[r.vehicle].totalCost += r.cost;
            acc[r.vehicle].totalLiters += r.liters;
            acc[r.vehicle].count += 1;
            if (new Date(r.date) > new Date(acc[r.vehicle].lastRef)) {
                acc[r.vehicle].lastRef = r.date;
            }
            return acc;
        }, {} as Record<string, { name: string; totalCost: number; totalLiters: number; count: number; lastRef: string }>);

        const vehicleStats = Object.values(vehicleGroups).sort((a, b) => b.totalCost - a.totalCost);
        const activeVehicles = vehicleStats.length;

        const avgKmL = filtered.length > 0 ? 9.2 : 0; // Simple placeholder

        return {
            totalCost,
            costDiff,
            totalLiters,
            litersDiff,
            activeVehicles,
            avgKmL,
            allVehiclesCount: 22,
            filteredCount: filtered.length,
            vehicleStats,
            records: filtered
        };
    }, [selectedMonth, selectedYear]);

    const renderOverview = () => (
        <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Gasto Total (Mês)</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                        R$ {stats.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <div className={`mt-auto pt-4 flex items-center gap-2 text-xs font-bold ${stats.costDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <TrendingUp className={`w-3 h-3 ${stats.costDiff < 0 ? 'rotate-180' : ''}`} />
                        {stats.costDiff === 0 ? 'Sem dados anteriores' : `${stats.costDiff > 0 ? '+' : ''}${stats.costDiff.toFixed(1)}% vs mês anterior`}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Droplet className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Litros Consumidos</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                        {stats.totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                    </h3>
                    <div className={`mt-auto pt-4 flex items-center gap-2 text-xs font-bold ${stats.litersDiff <= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                        <TrendingUp className={`w-3 h-3 ${stats.litersDiff > 0 ? '' : 'rotate-180'}`} />
                        {stats.litersDiff === 0 ? 'Consumo estável' : `${stats.litersDiff > 0 ? '+' : ''}${stats.litersDiff.toFixed(1)}% vs mês anterior`}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                            <Truck className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Veículos Ativos</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.activeVehicles}</h3>
                    <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                        Frota total: {stats.allVehiclesCount}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Média Km/L (Geral)</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.avgKmL} km/L</h3>
                    <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-bold text-emerald-600">
                        {stats.filteredCount > 0 ? 'Eficiência calculada' : 'Aguardando dados'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-80 flex items-center justify-center">
                    <p className="text-slate-400 font-medium italic">Gráfico de Consumo Diário ({months[selectedMonth]}/{selectedYear})</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-80 flex items-center justify-center">
                    <p className="text-slate-400 font-medium italic">Gráfico de Gastos por Tipo de Combustível ({months[selectedMonth]}/{selectedYear})</p>
                </div>
            </div>
        </div>
    );

    const renderVehicleDetail = () => {
        if (!selectedVehicle) return null;

        // 1. Get ALL records for this vehicle and standardise data types
        const fullHistory = AbastecimentoService.getAbastecimentos()
            .filter(r => r.vehicle === selectedVehicle)
            .map(r => ({
                ...r,
                // Ensure numeric types for calculation
                liters: Number(r.liters),
                odometer: Number(r.odometer),
                cost: Number(r.cost),
                // Helper for sorting
                dateObj: new Date(r.date)
            }))
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        // 2. enrich history with efficiency data (sequential calculation)
        const enrichedHistory = fullHistory.map((record, index) => {
            let efficiency = 0;
            let costPerKm = 0;
            let distance = 0;

            // 1. Calculate distance traveled TO GET HERE (for the (+km) display)
            if (index > 0) {
                const prevRecord = fullHistory[index - 1];
                distance = record.odometer - prevRecord.odometer;
            }

            // 2. Calculate efficiency of THIS TANK (looking forward to next fill-up)
            // "Consumption must be shown on the previous fueling" -> The fueling that filled the tank.
            if (index < fullHistory.length - 1) {
                const nextRecord = fullHistory[index + 1];
                const distanceToNext = nextRecord.odometer - record.odometer;

                if (distanceToNext > 0 && record.liters > 0) {
                    efficiency = distanceToNext / record.liters;
                    costPerKm = record.cost / distanceToNext;
                }
            }

            return {
                ...record,
                efficiency,
                costPerKm,
                distance
            };
        });

        // 3. Filter for current selected month/year
        const currentMonthRecords = enrichedHistory.filter(r => {
            return r.dateObj.getMonth() === selectedMonth && r.dateObj.getFullYear() === selectedYear;
        });

        // 4. Calculate Averages for the VIEW period
        // We only start counting for average if we have a valid interval (efficiency > 0)
        // Use a variable name that doesn't conflict
        const recordsWithEfficiency = currentMonthRecords.filter(r => r.efficiency > 0);

        const avgEfficiency = recordsWithEfficiency.length > 0
            ? recordsWithEfficiency.reduce((acc, r) => acc + r.efficiency, 0) / recordsWithEfficiency.length
            : 0;

        const avgCostPerKm = recordsWithEfficiency.length > 0
            ? recordsWithEfficiency.reduce((acc, r) => acc + r.costPerKm, 0) / recordsWithEfficiency.length
            : 0;

        // Totals for the month
        const totalVehicleCost = currentMonthRecords.reduce((acc, r) => acc + r.cost, 0);
        const totalVehicleLiters = currentMonthRecords.reduce((acc, r) => acc + r.liters, 0);
        const vehicleFuelTypes = [...new Set(currentMonthRecords.map(r => r.fuelType.split(' - ')[0]))].join(', ');

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => setSelectedVehicle(null)}
                        className="group flex items-center gap-2 px-4 py-2 bg-white text-slate-500 font-bold rounded-xl border border-slate-200 hover:border-cyan-200 hover:text-cyan-600 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar
                    </button>
                    <div className="h-8 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase">{selectedVehicle}</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhes do Veículo • {months[selectedMonth]}/{selectedYear}</p>
                        </div>
                    </div>
                </div>

                {/* Detail KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custo Total</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">R$ {totalVehicleCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Droplet className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consumo Total</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{totalVehicleLiters.toFixed(1)} L</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{vehicleFuelTypes}</p>
                    </div>
                    {/* New Metric: Avg Consumption */}
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consumo Médio</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">
                            {avgEfficiency > 0 ? avgEfficiency.toFixed(1) : '--'} <span className="text-sm text-slate-400 font-bold">km/L</span>
                        </p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">
                            {recordsWithEfficiency.length} medições (Mês)
                        </p>
                    </div>
                    {/* New Metric: Avg Cost/Km */}
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custo Médio</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">
                            {avgCostPerKm > 0 ? `R$ ${avgCostPerKm.toFixed(2)}` : '--'} <span className="text-sm text-slate-400 font-bold">/km</span>
                        </p>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm min-h-[300px] flex flex-col">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-cyan-500" /> Histórico de Consumo (Litros)
                        </h4>
                        {/* CSS-only Bar Chart Visualization */}
                        <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2 border-b border-slate-100">
                            {currentMonthRecords.slice(0, 7).map((rec, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 group w-full">
                                    <div className="relative w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-40">
                                        <div
                                            className="w-full bg-cyan-400 group-hover:bg-cyan-500 transition-all duration-500 ease-out"
                                            style={{ height: `${Math.min((rec.liters / 100) * 100, 100)}%` }}
                                        ></div>
                                        <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-bold text-white drop-shadow-md">{rec.liters.toFixed(0)}L</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{new Date(rec.date).getDate()}/{new Date(rec.date).getMonth() + 1}</span>
                                </div>
                            ))}
                            {currentMonthRecords.length === 0 && <div className="w-full text-center text-xs text-slate-400 italic py-10">Sem dados para gráfico</div>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm min-h-[300px] flex flex-col">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" /> Variação de Custo
                        </h4>
                        {/* Simple Line Viz Placeholder */}
                        <div className="flex-1 flex items-end justify-between gap-4 px-2 relative">
                            {/* Just listing the costs as boxes for now to show data */}
                            {currentMonthRecords.slice(0, 5).map((rec, i) => (
                                <div key={i} className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center gap-1">
                                    <span className="text-xs font-bold text-emerald-600">R$ {rec.cost.toFixed(0)}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{new Date(rec.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                </div>
                            ))}
                            {currentMonthRecords.length === 0 && <div className="w-full text-center text-xs text-slate-400 italic py-10">Sem dados de custo</div>}
                        </div>
                    </div>
                </div>

                {/* History List */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Histórico Detalhado</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Motorista</th>
                                    <th className="px-6 py-4">KM</th>
                                    <th className="px-6 py-4">Combustível</th>
                                    <th className="px-6 py-4">Litros</th>
                                    <th className="px-6 py-4">Consumo</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[...currentMonthRecords].reverse().map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">
                                            {new Date(r.date).toLocaleDateString('pt-BR')}
                                            <span className="block text-[10px] text-slate-400 font-normal">
                                                {new Date(r.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-600 uppercase">{r.driver}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{r.odometer.toLocaleString()} km</span>
                                                {r.distance > 0 && <span className="text-[10px] text-cyan-600 font-bold mt-1">(+{r.distance} km)</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-cyan-600">{r.fuelType.split(' - ')[0]}</td>
                                        <td className="px-6 py-4 font-bold text-blue-600">{r.liters.toFixed(1)} L</td>
                                        <td className="px-6 py-4">
                                            {r.efficiency > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{r.efficiency.toFixed(1)} km/L</span>
                                                    <span className="text-xs text-slate-400">R$ {r.costPerKm.toFixed(2)}/km</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-600 text-right">R$ {r.cost.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderVehicleView = () => {
        if (selectedVehicle) {
            return renderVehicleDetail();
        }

        const filteredVehicles = stats.vehicleStats.filter(v =>
            v.name.toLowerCase().includes(vehicleSearchTerm.toLowerCase())
        );

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Search Bar - Specific for Vehicles Tab */}
                <div className="flex justify-end mb-4">
                    <div className="relative group w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Buscar veículo..."
                            value={vehicleSearchTerm}
                            onChange={(e) => setVehicleSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 shadow-sm transition-all"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                    </div>
                </div>

                {stats.vehicleStats.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                        <Truck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Nenhuma atividade registrada</h3>
                        <p className="text-slate-500 mt-2">Não há abastecimentos para o período de {months[selectedMonth]}/{selectedYear}.</p>
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] border border-slate-200 text-center">
                        <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-400">Nenhum veículo corresponde à busca</h3>
                        <button
                            onClick={() => setVehicleSearchTerm('')}
                            className="mt-4 text-cyan-600 font-bold hover:underline"
                        >
                            Limpar busca
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredVehicles.map((v) => (
                            <div
                                key={v.name}
                                onClick={() => setSelectedVehicle(v.name)}
                                className="group bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
                                            <Truck className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 leading-tight uppercase truncate max-w-[150px]">{v.name}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Placa/Identificação</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase">
                                        {v.count} {v.count === 1 ? 'Abastecimento' : 'Abastecimentos'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-50 rounded-2xl p-4 transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Investido</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-900">R$ {v.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4 transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Droplet className="w-3.5 h-3.5 text-blue-500" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Consumo</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-900">{v.totalLiters.toFixed(1)} L</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <History className="w-3.5 h-3.5 text-slate-300" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Último: {new Date(v.lastRef).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <button className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors">
                                        Ver Detalhes <BarChart3 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 h-full bg-slate-50 p-4 md:p-6 overflow-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all shadow-sm ring-1 ring-slate-200 bg-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard do Abastecimento</h1>
                            <p className="text-slate-500 font-medium">Indicadores de consumo e custos</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        {/* Month/Year Selector */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                            <div className="relative group">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="appearance-none bg-transparent pl-4 pr-10 py-2 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                                >
                                    {months.map((m, idx) => (
                                        <option key={m} value={idx}>{m}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-cyan-600 pointer-events-none transition-colors" />
                            </div>
                            <div className="w-px h-6 bg-slate-100 mx-1"></div>
                            <div className="relative group">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="appearance-none bg-transparent pl-4 pr-10 py-2 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                                >
                                    {[2024, 2025, 2026].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-cyan-600 pointer-events-none transition-colors" />
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex p-1 bg-slate-200/50 border border-slate-200/60 rounded-2xl overflow-x-auto custom-scrollbar">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'overview'
                                    ? 'bg-white text-cyan-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <LayoutDashboard className="w-3.5 h-3.5" />
                                Visão Geral
                            </button>
                            <button
                                onClick={() => setActiveTab('vehicle')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'vehicle'
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Truck className="w-3.5 h-3.5" />
                                Veículos
                            </button>
                            <button
                                onClick={() => setActiveTab('config')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'config'
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Ajustes
                            </button>
                        </div>
                    </div>
                </div>

                <div className="min-h-[500px]">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'vehicle' && renderVehicleView()}
                    {activeTab === 'config' && <ConfigPanel />}
                </div>
            </div>
        </div>
    );
};
