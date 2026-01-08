import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, TrendingUp, Droplet, DollarSign, Truck, Settings, LayoutDashboard, Building2, MapPin, CreditCard, Fuel, Save, Plus, Calendar, ChevronDown, History, BarChart3, Search, ChevronRight, FileText, Filter, FileSpreadsheet, Download, CalendarDays, Factory, Car } from 'lucide-react';
import { ModernSelect } from '../common/ModernSelect';
import { ModernDateInput } from '../common/ModernDateInput';
import { AbastecimentoService, AbastecimentoRecord } from '../../services/abastecimentoService';
import { getVehicles, getSectors } from '../../services/entityService';
import { AbastecimentoReportPDF } from './AbastecimentoReportPDF';
import { AppState, Vehicle, Sector } from '../../types';
import { supabase } from '../../services/supabaseClient';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface AbastecimentoDashboardProps {
    onBack: () => void;
    state: AppState;
    onAbastecimento: (view: 'new' | 'management') => void;
    vehicles: Vehicle[];
    persons: any[];
    gasStations: { id: string, name: string, city: string }[];
    fuelTypes: { key: string; label: string; price: number }[];
    sectors: Sector[];
}

type TabType = 'overview' | 'vehicle' | 'sector' | 'reports' | 'config';

interface VehicleStat {
    name: string;
    totalCost: number;
    totalLiters: number;
    count: number;
    lastRef: string;
}

interface ConfigPanelProps {
    fuelTypes: { key: string; label: string; price: number }[];
    gasStations: { id: string; name: string; cnpj?: string; city?: string }[];
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ fuelTypes, gasStations: initialGasStations }) => {
    const [fuelConfig, setFuelConfig] = useState({ diesel: 0, gasolina: 0, etanol: 0, arla: 0 });
    const [gasStations, setGasStations] = useState(initialGasStations);
    const [newStation, setNewStation] = useState({ name: '', cnpj: '', city: '' });
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        // Transform array to object for the form state
        const config: any = { diesel: 0, gasolina: 0, etanol: 0, arla: 0 };
        fuelTypes.forEach(ft => {
            if (ft.key in config) config[ft.key] = ft.price;
        });
        setFuelConfig(config);
    }, [fuelTypes]);

    useEffect(() => {
        setGasStations(initialGasStations);
    }, [initialGasStations]);

    const handleSaveConfig = async () => {
        await AbastecimentoService.saveFuelConfig(fuelConfig);
        showSuccessToast('Valores salvos com sucesso!');
    };

    const handleAddStation = async () => {
        if (!newStation.name) return;

        const station = {
            id: crypto.randomUUID(),
            ...newStation
        };

        await AbastecimentoService.saveGasStation(station);
        const updatedStations = await AbastecimentoService.getGasStations();
        setGasStations(updatedStations);
        setNewStation({ name: '', cnpj: '', city: '' });
        showSuccessToast('Posto adicionado com sucesso!');
    };

    const handleDeleteStation = async (id: string) => {
        if (window.confirm('Excluir este posto?')) {
            await AbastecimentoService.deleteGasStation(id);
            const updatedStations = await AbastecimentoService.getGasStations();
            setGasStations(updatedStations);
        }
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

export const AbastecimentoDashboard: React.FC<AbastecimentoDashboardProps> = ({ onBack, state, onAbastecimento, vehicles, persons, gasStations, fuelTypes, sectors }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [allRecords, setAllRecords] = useState<AbastecimentoRecord[]>([]);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        station: 'all',
        sector: 'all',
        vehicle: 'all',
        fuelType: 'all'
    });
    const [pendingFilters, setPendingFilters] = useState({ ...appliedFilters });
    const [selectedSector, setSelectedSector] = useState<string>('all');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    useEffect(() => {
        const loadRecords = async () => {
            const data = await AbastecimentoService.getAbastecimentos();
            setAllRecords(data);
        };
        loadRecords();

        const channel = supabase
            .channel('dashboard-records-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'abastecimentos' },
                () => {
                    loadRecords();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const stats = useMemo(() => {
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
        // Group by vehicle
        const vehicleGroups = filtered.reduce((acc, r) => {
            if (!acc[r.vehicle]) {
                // Try to resolve a friendly name if the record stores a Plate
                const matchedVehicle = vehicles.find(v => v.plate === r.vehicle);
                const displayName = matchedVehicle
                    ? `${matchedVehicle.model} (${matchedVehicle.plate})`
                    : r.vehicle;

                acc[r.vehicle] = {
                    name: displayName,
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
        }, {} as Record<string, VehicleStat>);

        const vehicleStats = Object.values(vehicleGroups).sort((a: VehicleStat, b: VehicleStat) => b.totalCost - a.totalCost) as VehicleStat[];
        const activeVehicles = vehicleStats.length;

        // Calculate Global Average KM/L (Efficiency)
        // We need to calculate efficiency for each fill-up interval across all vehicles
        let totalEfficiencySum = 0;
        let efficiencyCount = 0;

        // Group ALL records (not just filtered) by vehicle to calculate full history context
        // We need history to calculate efficiency for the CURRENT month records
        const allByVehicle: Record<string, AbastecimentoRecord[]> = {};
        allRecords.forEach(r => {
            if (!allByVehicle[r.vehicle]) allByVehicle[r.vehicle] = [];
            allByVehicle[r.vehicle].push(r);
        });

        // For each vehicle, calculate efficiencies
        Object.values(allByVehicle).forEach(vehicleRecords => {
            // Sort by date
            const sorted = vehicleRecords.map(r => ({ ...r, dateObj: new Date(r.date) }))
                .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

            sorted.forEach((record, index) => {
                // Check if this record belongs to the CURRENT selected month/year
                const rDate = record.dateObj;
                const isCurrentPeriod = rDate.getMonth() === selectedMonth && rDate.getFullYear() === selectedYear;

                if (isCurrentPeriod) {
                    // Check exclusion for Arla
                    const isArla = record.fuelType.toLowerCase().includes('arla');

                    if (!isArla) {
                        // Look ahead for the next NON-Arla record
                        let nextRecord = null;
                        for (let i = index + 1; i < sorted.length; i++) {
                            if (!sorted[i].fuelType.toLowerCase().includes('arla')) {
                                nextRecord = sorted[i];
                                break;
                            }
                        }

                        if (nextRecord) {
                            const distanceToNext = Number(nextRecord.odometer) - Number(record.odometer);
                            const nextLiters = Number(nextRecord.liters);

                            if (distanceToNext > 0 && nextLiters > 0) {
                                const efficiency = distanceToNext / nextLiters;
                                totalEfficiencySum += efficiency;
                                efficiencyCount++;
                            }
                        }
                    }
                }
            });
        });

        const avgKmL = efficiencyCount > 0 ? (totalEfficiencySum / efficiencyCount) : 0;

        // --- NEW AGGREGATIONS FOR CHARTS ---

        // 1. Spending by Sector
        const sectorSpending: Record<string, number> = {};
        filtered.forEach(r => {
            // Find vehicle to get sector
            // Try matching by Plate first (new records), then by "Model - Brand" (legacy)
            const v = vehicles.find(veh => veh.plate === r.vehicle || `${veh.model} - ${veh.brand}` === r.vehicle);
            if (v) {
                const s = sectors.find(sec => sec.id === v.sectorId);
                const sectorName = s?.name || 'Não Identificado';
                sectorSpending[sectorName] = (sectorSpending[sectorName] || 0) + r.cost;
            } else {
                sectorSpending['Desconhecido'] = (sectorSpending['Desconhecido'] || 0) + r.cost;
            }
        });
        const sectorChartData = Object.entries(sectorSpending)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5

        // 2. Fuel Type Distribution
        const fuelDist: Record<string, number> = {};
        filtered.forEach(r => {
            // Clean fuel name "DIESEL S10 - DIESEL" -> "DIESEL"
            const type = r.fuelType.split(' - ')[0];
            fuelDist[type] = (fuelDist[type] || 0) + r.liters;
        });
        const fuelChartData = Object.entries(fuelDist).map(([name, value]) => ({ name, value }));
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

        // 3. Monthly Evolution (Last 6 Months)
        // We need to look at 'allRecords' for this, not just filtered
        const last6MonthsMatches = allRecords.filter(r => {
            const d = new Date(r.date);
            const now = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 6);
            return d >= sixMonthsAgo && d <= now;
        });

        const evolutionMap: Record<string, { month: string, cost: number, liters: number }> = {};
        last6MonthsMatches.forEach(r => {
            const d = new Date(r.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`; // sortable key
            const label = months[d.getMonth()].substring(0, 3);

            if (!evolutionMap[key]) {
                evolutionMap[key] = { month: label, cost: 0, liters: 0 };
            }
            evolutionMap[key].cost += r.cost;
            evolutionMap[key].liters += r.liters;
        });
        // Sort by time
        const evolutionChartData = Object.keys(evolutionMap).sort().map(k => evolutionMap[k]);

        // 4. Vehicle Rankings
        // Most Expensive (Total Cost)
        const topConsumptionVehicles = [...vehicleStats]
            .sort((a, b) => b.totalCost - a.totalCost)
            .slice(0, 5);

        // Best Efficiency (calculated earlier per vehicle in detail, but here we can approximate or reuse logic)
        // Since we calculated 'efficiency' per tank in detail, we don't have it easily available in 'vehicleStats' 
        // without re-running the logic. Let's stick to consumption (R$/km) if possible or just total cost.
        // Let's add 'totalKm' to vehicleStats to compute R$/km

        // 5. Alerts
        // e.g. Vehicles with efficiency < 3km/L (if we had it) or just High Cost outliers
        const avgCost = totalCost / (activeVehicles || 1);
        const costAlerts = vehicleStats.filter(v => v.totalCost > avgCost * 1.5); // 50% above average

        // Total KM (for filtered period)
        // We need to sum the distance of intervals in this period.
        // Re-use logic from Global Avg Calc?
        let totalKmPeriod = 0;
        // Logic: iterate filtered sessions? No, because distance is relative.
        // We can approximate with: sum of (next_odometer - current_odometer) for records in this month.
        // Let's reuse the Global Avg loop variables if possible, or re-run.
        // For simplicity, let's create a 'totalDistance' accumulator in the GLOBAL loop we added step 162.
        // (Wait, I can just modify that loop to export totalDistanceSum)
        // Re-writing that loop slightly to capture 'totalDistanceSum'
        let totalDistanceSum = 0;
        Object.values(allByVehicle).forEach(vehicleRecords => {
            const sorted = vehicleRecords.map(r => ({ ...r, dateObj: new Date(r.date) })).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
            sorted.forEach((record, index) => {
                const rDate = record.dateObj;
                if (rDate.getMonth() === selectedMonth && rDate.getFullYear() === selectedYear) {
                    const isArla = record.fuelType.toLowerCase().includes('arla');
                    if (!isArla) {
                        // Look ahead logic again
                        let nextRecord = null;
                        for (let i = index + 1; i < sorted.length; i++) {
                            if (!sorted[i].fuelType.toLowerCase().includes('arla')) {
                                nextRecord = sorted[i];
                                break;
                            }
                        }
                        if (nextRecord) {
                            const dist = Number(nextRecord.odometer) - Number(record.odometer);
                            if (dist > 0) totalDistanceSum += dist;
                        }
                    }
                }
            });
        });


        return {
            totalCost,
            costDiff,
            totalLiters,
            litersDiff,
            activeVehicles,
            avgKmL,
            totalKmPeriod: totalDistanceSum,
            allVehiclesCount: vehicles.length,
            filteredCount: filtered.length,
            vehicleStats,
            records: filtered,
            // New Data
            sectorChartData,
            fuelChartData,
            evolutionChartData,
            topConsumptionVehicles,
            costAlerts,
            COLORS
        };
    }, [selectedMonth, selectedYear, allRecords, vehicles, sectors]);

    const sectorStats = useMemo(() => {
        // Find vehicles belonging to the selected sector
        const sectorVehicles = vehicles.filter(v => {
            if (selectedSector === 'all') return true;
            const sectorName = sectors.find(s => s.id === v.sectorId)?.name;
            return sectorName === selectedSector;
        });

        const sectorVehiclePlateSet = new Set<string>();
        sectorVehicles.forEach(v => {
            if (v.plate) sectorVehiclePlateSet.add(v.plate);
            sectorVehiclePlateSet.add(`${v.model} - ${v.brand}`);
        });

        // Records for current month filtered by sector
        const currentMonthRecords = allRecords.filter(r => {
            const date = new Date(r.date);
            return date.getMonth() === selectedMonth &&
                date.getFullYear() === selectedYear &&
                sectorVehiclePlateSet.has(r.vehicle);
        });

        // Records for previous month for comparison
        const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
        const prevMonthRecords = allRecords.filter(r => {
            const date = new Date(r.date);
            return date.getMonth() === prevMonth &&
                date.getFullYear() === prevYear &&
                sectorVehiclePlateSet.has(r.vehicle);
        });

        // Helper to calculate totals
        const calcTotals = (recs: AbastecimentoRecord[]) => {
            const totalCost = recs.reduce((sum, r) => sum + r.cost, 0);
            const totalLiters = recs.reduce((sum, r) => sum + r.liters, 0);
            return { totalCost, totalLiters };
        };

        const current = calcTotals(currentMonthRecords);
        const previous = calcTotals(prevMonthRecords);

        // Variations
        const costDiff = previous.totalCost === 0 ? 0 : ((current.totalCost - previous.totalCost) / previous.totalCost) * 100;
        const litersDiff = previous.totalLiters === 0 ? 0 : ((current.totalLiters - previous.totalLiters) / previous.totalLiters) * 100;

        // Active Vehicles count in this period for sector
        const uniqueVehiclesThisMonth = new Set(currentMonthRecords.map(r => r.vehicle)).size;

        // Averages per vehicle
        const avgCostPerVehicle = uniqueVehiclesThisMonth > 0 ? current.totalCost / uniqueVehiclesThisMonth : 0;
        const prevAvgCost = previous.totalCost / (new Set(prevMonthRecords.map(r => r.vehicle)).size || 1);
        const avgCostDiff = prevAvgCost === 0 ? 0 : ((avgCostPerVehicle - prevAvgCost) / prevAvgCost) * 100;

        const avgLitersPerVehicle = uniqueVehiclesThisMonth > 0 ? current.totalLiters / uniqueVehiclesThisMonth : 0;

        // KM driven (Sector specific)
        let totalKmSector = 0;
        let prevTotalKmSector = 0;

        // We reuse the global logic structure but filtered for sector vehicles
        // To be accurate, we need to iterate ALL records for these vehicles to find diffs
        const calcSectorKm = (targetMonth: number, targetYear: number) => {
            let kmSum = 0;
            const sectorRecordsByVehicle: Record<string, AbastecimentoRecord[]> = {};

            // Group relevant sector records
            allRecords.forEach(r => {
                if (sectorVehiclePlateSet.has(r.vehicle)) {
                    if (!sectorRecordsByVehicle[r.vehicle]) sectorRecordsByVehicle[r.vehicle] = [];
                    sectorRecordsByVehicle[r.vehicle].push(r);
                }
            });

            Object.values(sectorRecordsByVehicle).forEach(vRecs => {
                const sorted = vRecs.map(r => ({ ...r, dateObj: new Date(r.date) })).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
                sorted.forEach((record, index) => {
                    const rDate = record.dateObj;
                    if (rDate.getMonth() === targetMonth && rDate.getFullYear() === targetYear) {
                        const isArla = record.fuelType.toLowerCase().includes('arla');
                        if (!isArla) {
                            let nextRecord = null;
                            for (let i = index + 1; i < sorted.length; i++) {
                                if (!sorted[i].fuelType.toLowerCase().includes('arla')) {
                                    nextRecord = sorted[i];
                                    break;
                                }
                            }
                            if (nextRecord) {
                                const dist = Number(nextRecord.odometer) - Number(record.odometer);
                                if (dist > 0) kmSum += dist;
                            }
                        }
                    }
                });
            });
            return kmSum;
        };

        totalKmSector = calcSectorKm(selectedMonth, selectedYear);
        prevTotalKmSector = calcSectorKm(prevMonth, prevYear);
        const kmDiff = prevTotalKmSector === 0 ? 0 : ((totalKmSector - prevTotalKmSector) / prevTotalKmSector) * 100;

        // Ranking: Spending by Vehicle
        const spendingByVehicle: Record<string, { cost: number, liters: number }> = {};
        currentMonthRecords.forEach(r => {
            if (!spendingByVehicle[r.vehicle]) spendingByVehicle[r.vehicle] = { cost: 0, liters: 0 };
            spendingByVehicle[r.vehicle].cost += r.cost;
            spendingByVehicle[r.vehicle].liters += r.liters;
        });
        const vehicleRankingData = Object.entries(spendingByVehicle)
            .map(([name, data]) => ({ name, value: data.cost, liters: data.liters }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // Ranking: Driver Supplies
        const statsByDriver: Record<string, { cost: number, liters: number, count: number }> = {};
        currentMonthRecords.forEach(r => {
            const driverName = r.driver || 'Não Identificado';
            if (!statsByDriver[driverName]) statsByDriver[driverName] = { cost: 0, liters: 0, count: 0 };
            statsByDriver[driverName].cost += r.cost;
            statsByDriver[driverName].liters += r.liters;
            statsByDriver[driverName].count += 1;
        });
        const driverRankingData = Object.entries(statsByDriver)
            .map(([name, data]) => ({ name, value: data.cost, liters: data.liters, count: data.count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        return {
            current,
            costDiff,
            litersDiff,
            avgCostPerVehicle,
            avgCostDiff,
            avgLitersPerVehicle,
            totalKmSector,
            kmDiff,
            vehicleRankingData,
            driverRankingData,
            activeVehiclesCount: uniqueVehiclesThisMonth
        };
    }, [selectedMonth, selectedYear, selectedSector, allRecords, vehicles, sectors]);

    const reportData = useMemo(() => {
        // Pre-process all records to include derived sector/plate once
        const processedRecords = allRecords.map(r => {
            const veh = vehicles.find(v => `${v.model} - ${v.brand}` === r.vehicle);
            const s = sectors.find(sec => sec.id === veh?.sectorId);
            return {
                ...r,
                derivedSector: s?.name || 'Não Identificado',
                derivedPlate: veh?.plate || 'S/P'
            };
        });

        const filtered = processedRecords.filter(r => {
            const rDate = new Date(r.date);

            // Helper to parse "YYYY-MM-DD" as local date
            const parseLocalDate = (dateStr: string) => {
                const [y, m, d] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d);
            };

            const start = appliedFilters.startDate ? parseLocalDate(appliedFilters.startDate) : null;
            const end = appliedFilters.endDate ? parseLocalDate(appliedFilters.endDate) : null;

            if (start) {
                start.setHours(0, 0, 0, 0);
                if (rDate < start) return false;
            }
            if (end) {
                end.setHours(23, 59, 59, 999);
                if (rDate > end) return false;
            }

            if (appliedFilters.station !== 'all' && r.station !== appliedFilters.station) return false;
            if (appliedFilters.sector !== 'all' && !r.derivedSector.toLowerCase().includes(appliedFilters.sector.toLowerCase())) return false;
            if (appliedFilters.vehicle !== 'all' && r.vehicle !== appliedFilters.vehicle) return false;
            if (appliedFilters.fuelType !== 'all') {
                const fuel = r.fuelType?.toLowerCase() || '';
                if (appliedFilters.fuelType === 'diesel' && !fuel.includes('diesel')) return false;
                if (appliedFilters.fuelType === 'gasolina' && !fuel.includes('gasolina')) return false;
                if (appliedFilters.fuelType === 'etanol' && !fuel.includes('etanol')) return false;
                if (appliedFilters.fuelType === 'arla' && !fuel.includes('arla')) return false;
            }

            return true;
        });

        const totalLitersByFuel: Record<string, number> = {};
        const totalValueBySector: Record<string, number> = {};
        const totalValueByFuel: Record<string, number> = {};
        let grandTotalLiters = 0;
        let grandTotalValue = 0;

        filtered.forEach(r => {
            // Fuel aggregation
            const fuel = r.fuelType.split(' - ')[0];
            totalLitersByFuel[fuel] = (totalLitersByFuel[fuel] || 0) + r.liters;
            totalValueByFuel[fuel] = (totalValueByFuel[fuel] || 0) + r.cost;
            grandTotalLiters += r.liters;
            grandTotalValue += r.cost;

            // Sector aggregation
            const sectorName = r.derivedSector;
            totalValueBySector[sectorName] = (totalValueBySector[sectorName] || 0) + r.cost;
        });

        return {
            records: filtered,
            totalLitersByFuel,
            totalValueBySector,
            totalValueByFuel,
            grandTotalLiters,
            grandTotalValue
        };
    }, [allRecords, appliedFilters, vehicles, sectors]);

    const renderSectorView = () => (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Sector Filters */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Factory className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase">Visão por Setor</h2>
                            <p className="text-slate-500 text-sm font-medium">Análise detalhada de consumo por departamento</p>
                        </div>
                    </div>

                    <div className="w-full md:w-72">
                        <ModernSelect
                            label="Selecione o Setor"
                            value={selectedSector}
                            onChange={setSelectedSector}
                            options={[
                                { value: 'all', label: 'Todos os Setores (Global)' },
                                ...sectors.map(s => ({ value: s.name, label: s.name }))
                            ]}
                            icon={Factory}
                            placeholder="Todos os Setores"
                            searchable
                        />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Cost */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="w-24 h-24" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gasto Total</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(sectorStats.current.totalCost)}</p>
                    <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${sectorStats.costDiff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {sectorStats.costDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                        {Math.abs(sectorStats.costDiff).toFixed(1)}% vs anterior
                    </div>
                </div>

                {/* Avg Cost per Vehicle */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Car className="w-24 h-24" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Custo Médio / Veículo</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(sectorStats.avgCostPerVehicle)}</p>
                    <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${sectorStats.avgCostDiff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {sectorStats.avgCostDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                        {Math.abs(sectorStats.avgCostDiff).toFixed(1)}% vs anterior
                    </div>
                </div>

                {/* Total KM */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MapPin className="w-24 h-24" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Percorrido</p>
                    <p className="text-2xl font-black text-slate-900">{sectorStats.totalKmSector.toLocaleString('pt-BR')} km</p>
                    <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${sectorStats.kmDiff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {sectorStats.kmDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                        {Math.abs(sectorStats.kmDiff).toFixed(1)}% vs anterior
                    </div>
                </div>

                {/* Active Vehicles */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Truck className="w-24 h-24" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Veículos Ativos</p>
                    <p className="text-2xl font-black text-slate-900">{sectorStats.activeVehiclesCount}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-2">
                        De {sectorStats.activeVehiclesCount} veículos vinculados
                    </p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking Vehicle Cost */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-500" />
                        Ranking de Gastos por Veículo
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectorStats.vehicleRankingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 min-w-[150px]">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{data.name}</p>
                                                    <p className="text-lg font-black text-indigo-600">{formatCurrency(data.value)}</p>
                                                    <p className="text-xs font-bold text-slate-500">{data.liters.toFixed(1)} Litros</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                                    {
                                        sectorStats.vehicleRankingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index < 3 ? '#4f46e5' : '#818cf8'} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ranking Driver Supplies Count */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                        Ranking de Abastecimentos (Motorista)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectorStats.driverRankingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 min-w-[150px]">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{data.name}</p>
                                                    <p className="text-lg font-black text-emerald-600">{formatCurrency(data.value)}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-bold text-slate-500">{data.liters.toFixed(1)} L</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="text-[10px] font-bold text-slate-400">{data.count} abastecimentos</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24}>
                                    {
                                        sectorStats.driverRankingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index < 3 ? '#059669' : '#34d399'} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );


    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* 1. Top KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Custo Total */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="w-24 h-24 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custo Total</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-emerald-900 tracking-tight">
                            {formatCurrency(stats.totalCost)}
                        </h3>
                        <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${stats.costDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {stats.costDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                            <span>{Math.abs(stats.costDiff).toFixed(1)}% vs anterior</span>
                        </div>
                    </div>
                </div>

                {/* Litros */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Droplet className="w-24 h-24 text-cyan-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-cyan-50 rounded-xl text-cyan-600">
                            <Droplet className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volume Total</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-cyan-900 tracking-tight">
                            {stats.totalLiters.toFixed(0)} L
                        </h3>
                        <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${stats.litersDiff > 0 ? 'text-cyan-500' : 'text-slate-400'}`}>
                            <span>{stats.filteredCount} abastecimentos</span>
                        </div>
                    </div>
                </div>

                {/* Avg KM/L */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BarChart3 className="w-24 h-24 text-violet-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-50 rounded-xl text-violet-600">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Média Geral</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-violet-900 tracking-tight">
                            {stats.avgKmL.toFixed(1)} <span className="text-lg text-slate-400 font-bold">Km/L</span>
                        </h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">Eficiência da frota (S/ Arla)</p>
                    </div>
                </div>

                {/* Total KM */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MapPin className="w-24 h-24 text-amber-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rodagem Total</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-amber-900 tracking-tight">
                            {stats.totalKmPeriod.toFixed(0)} <span className="text-lg text-slate-400 font-bold">Km</span>
                        </h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">Estimado no período</p>
                    </div>
                </div>
            </div>

            {/* 2. Charts Row: Evolution & Fuel Dist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolution Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-800">Evolução de Gastos</h3>
                        <p className="text-sm text-slate-400 font-medium">Histórico dos últimos 6 meses</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.evolutionChartData}>
                                <defs>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `R$${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Gasto']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="cost"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCost)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Fuel Distribution */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-800">Por Combustível</h3>
                        <p className="text-sm text-slate-400 font-medium">Distribuição de volume (L)</p>
                    </div>
                    <div className="h-[300px] w-full flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.fuelChartData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.fuelChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={stats.COLORS[index % stats.COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`${value.toFixed(0)} L`, 'Volume']}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. Charts Row: Sector & Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spending by Sector */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-800">Gastos por Secretaria</h3>
                        <p className="text-sm text-slate-400 font-medium">Top 5 setores com maior consumo</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={stats.sectorChartData} margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                                />
                                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vehicle Ranking */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Ranking de Veículos</h3>
                            <p className="text-sm text-slate-400 font-medium">Maiores consumidores do mês</p>
                        </div>
                        <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                            <Fuel className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {stats.topConsumptionVehicles.map((v, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center bg-white text-slate-700 font-black rounded-lg text-xs shadow-sm border border-slate-100">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 uppercase truncate max-w-[120px]">{v.name}</p>
                                        <p className="text-[10px] text-slate-400 font-semibold">{v.count} abastecimentos</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-700">{formatCurrency(v.totalCost)}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{v.totalLiters.toFixed(0)} Litros</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Alerts Section (if any) */}
            {stats.costAlerts.length > 0 && (
                <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white text-rose-500 rounded-xl shadow-sm">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-rose-700">Alertas de Consumo</h3>
                            <p className="text-sm text-rose-400 font-medium">Veículos com gasto 50% acima da média</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.costAlerts.slice(0, 6).map((v, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-rose-100 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-slate-800 uppercase">{v.name}</p>
                                    <p className="text-[10px] text-rose-500 font-bold">{formatCurrency(v.totalCost)}</p>
                                </div>
                                <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-lg">Alto Gasto</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderVehicleDetail = () => {
        if (!selectedVehicle) return null;

        // 1. Get ALL records for this vehicle and standardise data types
        const fullHistory = allRecords
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

            // check if fuel is Arla
            const isArla = record.fuelType.toLowerCase().includes('arla');

            // 2. Calculate efficiency of THIS TANK (looking forward to next fill-up)
            // "Consumption must be shown on the previous fueling" -> The fueling that filled the tank.
            // SKIP if Arla
            if (!isArla) {
                // Find next non-Arla record
                let nextRecord = null;
                for (let i = index + 1; i < fullHistory.length; i++) {
                    if (!fullHistory[i].fuelType.toLowerCase().includes('arla')) {
                        nextRecord = fullHistory[i];
                        break;
                    }
                }

                if (nextRecord) {
                    const distanceToNext = nextRecord.odometer - record.odometer;

                    if (distanceToNext > 0 && nextRecord.liters > 0) {
                        efficiency = distanceToNext / nextRecord.liters;
                        costPerKm = nextRecord.cost / distanceToNext;
                    }
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
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {(() => {
                                    const veh = vehicles.find(v => v.plate === selectedVehicle || `${v.model} - ${v.brand}` === selectedVehicle);
                                    if (!veh) return 'Placa não encontrada';
                                    const sec = sectors.find(s => s.id === veh.sectorId);
                                    return `${veh.plate} • ${sec?.name || 'Setor não informado'}`;
                                })()} • {months[selectedMonth]}/{selectedYear}
                            </p>
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
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(totalVehicleCost)}</p>
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
                            {avgCostPerKm > 0 ? `${formatCurrency(avgCostPerKm)} ` : '--'} <span className="text-sm text-slate-400 font-bold">/km</span>
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
                                            style={{ height: Math.min((rec.liters / 100) * 100, 100) + '%' }}
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
                                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(rec.cost)}</span>
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
                                                    <span className="font-bold text-slate-700">{r.odometer.toFixed(0)} km</span>
                                                    {r.distance > 0 && <span className="text-[10px] text-cyan-600 font-bold mt-1">(+{r.distance} km)</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-cyan-600">{r.fuelType.split(' - ')[0]}</td>
                                            <td className="px-6 py-4 font-bold text-blue-600">{r.liters.toFixed(1)} L</td>
                                            <td className="px-6 py-4">
                                                {r.efficiency > 0 ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700">{r.efficiency.toFixed(1)} km/L</span>
                                                        <span className="text-xs text-slate-400">{formatCurrency(r.costPerKm)}/km</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-300 italic">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-emerald-600 text-right">{formatCurrency(r.cost)}</td>
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
                                            <div className="flex flex-col">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    {(() => {
                                                        const veh = vehicles.find(veh => `${veh.model} - ${veh.brand}` === v.name);
                                                        return veh?.plate || 'Placa não encontrada';
                                                    })()}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                                    {(() => {
                                                        const veh = vehicles.find(veh => `${veh.model} - ${veh.brand}` === v.name);
                                                        const sec = sectors.find(s => s.id === veh?.sectorId);
                                                        return sec?.name || 'Setor não informado';
                                                    })()}
                                                </p>
                                            </div>
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
                                        <p className="text-xl font-black text-slate-900">R$ {v.totalCost.toFixed(2)}</p>
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

    const renderReportsView = () => (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Filters Section */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Filter className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase">Filtros do Relatório</h2>
                        <p className="text-slate-500 text-sm font-medium">Refine os dados para geração do relatório</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Date inputs */}
                    <div>
                        <ModernDateInput
                            label="Período Inicial"
                            value={pendingFilters.startDate}
                            onChange={(val) => setPendingFilters({ ...pendingFilters, startDate: val })}
                        />
                    </div>
                    <div>
                        <ModernDateInput
                            label="Período Final"
                            value={pendingFilters.endDate}
                            onChange={(val) => setPendingFilters({ ...pendingFilters, endDate: val })}
                        />
                    </div>
                    {/* Select dropdowns */}
                    <div>
                        <ModernSelect
                            label="Posto"
                            value={pendingFilters.station}
                            onChange={(val) => setPendingFilters({ ...pendingFilters, station: val })}
                            options={[
                                { value: 'all', label: 'Todos os Postos' },
                                ...gasStations.map(s => ({ value: s.name, label: s.name }))
                            ]}
                            icon={Building2}
                            placeholder="Todos os Postos"
                        />
                    </div>
                    <div>
                        <ModernSelect
                            label="Setor"
                            value={pendingFilters.sector}
                            onChange={(val) => setPendingFilters({ ...pendingFilters, sector: val })}
                            options={[
                                { value: 'all', label: 'Todos os Setores' },
                                ...sectors.map(s => ({ value: s.name, label: s.name }))
                            ]}
                            icon={Factory}
                            placeholder="Todos os Setores"
                            searchable
                        />
                    </div>
                    <div>
                        <ModernSelect
                            label="Veículo (Placa)"
                            value={pendingFilters.vehicle}
                            onChange={(val) => setPendingFilters({ ...pendingFilters, vehicle: val })}
                            options={[
                                { value: 'all', label: 'Todos os Veículos' },
                                ...vehicles.map(v => ({ value: v.plate || v.id, label: `${v.plate} - ${v.model}` }))
                            ]}
                            icon={Car}
                            placeholder="Selecione o Veículo"
                            searchable
                        />
                    </div>
                    <div>
                        <ModernSelect
                            label="Combustível"
                            value={pendingFilters.fuelType}
                            onChange={(val) => setPendingFilters({ ...pendingFilters, fuelType: val })}
                            options={[
                                { value: 'all', label: 'Todos' },
                                { value: 'diesel', label: 'Diesel' },
                                { value: 'gasolina', label: 'Gasolina' },
                                { value: 'etanol', label: 'Etanol' },
                                { value: 'arla', label: 'Arla' }
                            ]}
                            icon={Fuel}
                            placeholder="Todos"
                        />
                    </div>

                    <div className="md:col-span-3 lg:col-span-2 flex items-end">
                        <button
                            onClick={() => setAppliedFilters({ ...pendingFilters })}
                            className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 h-[46px]"
                        >
                            <Filter className="w-4 h-4" />
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liters and Value Totals */}
                <div className="bg-slate-900 text-white rounded-[2rem] border border-slate-800 p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <FileSpreadsheet className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 mb-6">Resumo Geral</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Volume Total</p>
                                    <p className="text-4xl font-black tracking-tighter">{reportData.grandTotalLiters.toFixed(1)} <span className="text-xl text-slate-500">L</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                                    <p className="text-4xl font-black tracking-tighter text-emerald-400">{formatCurrency(reportData.grandTotalValue)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-8 border-t border-white/5 mt-8 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{reportData.records.length} registros encontrados</span>
                            <button
                                onClick={() => setShowPrintPreview(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Download className="w-3.5 h-3.5" /> Exportar PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Totals by Fuel */}
                <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Por Combustível</h3>
                    <div className="space-y-4">
                        {Object.entries(reportData.totalLitersByFuel).map(([fuel, liters]) => (
                            <div key={fuel} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-black text-slate-900 uppercase">{fuel}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{formatCurrency(reportData.totalValueByFuel[fuel] as number)}</p>
                                </div>
                                <p className="font-black text-slate-700">{(liters as number).toFixed(1)} L</p>
                            </div>
                        ))}
                        {Object.keys(reportData.totalLitersByFuel).length === 0 && (
                            <div className="text-center py-12">
                                <Fuel className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                                <p className="text-xs font-bold text-slate-300 uppercase">Nenhum dado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Totals by Sector */}
                <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Valor por Setor</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {Object.entries(reportData.totalValueBySector)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .map(([sector, value]) => (
                                <div key={sector} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase truncate max-w-[120px]" title={sector}>{sector}</p>
                                    <p className="font-black text-slate-900 text-xs">{formatCurrency(value as number)}</p>
                                </div>
                            ))
                        }
                        {Object.keys(reportData.totalValueBySector).length === 0 && (
                            <div className="text-center py-12">
                                <Factory className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                                <p className="text-xs font-bold text-slate-300 uppercase">Nenhum dado</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900">Registros Detalhados</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico filtrado</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Protocolo</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Data/Hora</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Veículo/Motorista</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Posto/Combustível</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Volume/Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.records.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors" />
                                            <span className="font-mono text-xs font-bold text-slate-500">#{record.protocol || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm">{new Date(record.date).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-medium text-slate-400">{new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm">{record.vehicle}</span>
                                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                                <Car className="w-3 h-3" /> {record.derivedPlate} • {record.driver}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-xs">{record.station || 'N/A'}</span>
                                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md w-fit mt-1">{record.fuelType}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-black text-emerald-600 text-sm">{formatCurrency(record.cost)}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{record.liters.toFixed(1)} L</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {reportData.records.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Nenhum registro encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

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
                        <div className="flex items-center gap-3">
                            <div className="w-40">
                                <ModernSelect
                                    value={selectedMonth}
                                    onChange={(val) => setSelectedMonth(Number(val))}
                                    options={months.map((m, idx) => ({ value: idx, label: m }))}
                                    icon={CalendarDays}
                                />
                            </div>
                            <div className="w-36">
                                <ModernSelect
                                    value={selectedYear}
                                    onChange={(val) => setSelectedYear(Number(val))}
                                    options={[2024, 2025, 2026].map(y => ({ value: y, label: String(y) }))}
                                    icon={Calendar}
                                />
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
                                onClick={() => setActiveTab('sector')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'sector'
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Factory className="w-3.5 h-3.5" />
                                Setor
                            </button>
                            <button
                                onClick={() => setActiveTab('reports')}

                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'reports'
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Relatórios
                            </button>
                            {user?.role === 'admin' && (
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
                            )}
                        </div>
                    </div>
                </div>

                <div className="min-h-[500px]">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'vehicle' && renderVehicleView()}
                    {activeTab === 'sector' && renderSectorView()}
                    {activeTab === 'reports' && renderReportsView()}
                    {activeTab === 'config' && user?.role === 'admin' && <ConfigPanel fuelTypes={fuelTypes} gasStations={gasStations as any} />}
                </div>
            </div>

            {showPrintPreview && (
                <AbastecimentoReportPDF
                    data={reportData}
                    filters={appliedFilters}
                    state={state}
                    onClose={() => setShowPrintPreview(false)}
                />
            )}
        </div>
    );
};
