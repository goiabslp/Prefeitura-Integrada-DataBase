import React, { useState, useEffect } from 'react';
import { Fuel, Calendar, User, Truck, DollarSign, Clock, Save, X, MapPin, FileText } from 'lucide-react';
import { AbastecimentoService, AbastecimentoRecord } from '../../services/abastecimentoService';
import { useAuth } from '../../contexts/AuthContext';
import { Vehicle, Person } from '../../types';
import { CustomSelect, Option } from '../common/CustomSelect';
import { CustomDateTimeInput } from '../common/CustomDateTimeInput';

interface AbastecimentoFormProps {
    onBack: () => void;
    onSave: (data: any) => void;
    vehicles: Vehicle[];
    persons: Person[];
}

export const AbastecimentoForm: React.FC<AbastecimentoFormProps> = ({ onBack, onSave, vehicles, persons }) => {
    const { user: authUser } = useAuth();

    // State for Async Data
    const [fuelTypes, setFuelTypes] = useState<{ key: string; label: string; price: number }[]>([]);
    const [fuelPrices, setFuelPrices] = useState<{ [key: string]: number }>({});
    const [gasStations, setGasStations] = useState<{ id: string, name: string, city: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    });
    const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }));
    const [vehicle, setVehicle] = useState('');
    const [driver, setDriver] = useState('');
    const [liters, setLiters] = useState('');
    const [odometer, setOdometer] = useState('');
    const [fuelType, setFuelType] = useState('');
    const [station, setStation] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [cost, setCost] = useState(0);

    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [types, stations] = await Promise.all([
                    AbastecimentoService.getFuelTypes(),
                    AbastecimentoService.getGasStations()
                ]);

                setFuelTypes(types);
                const prices = types.reduce((acc: any, type: any) => {
                    acc[type.key] = type.price;
                    return acc;
                }, {});
                setFuelPrices(prices);
                setGasStations(stations);

                if (types.length > 0) setFuelType(types[0].key);

                // Prioritize "Posto Xavier & Xavier Ltda" or fallback to first station
                const defaultStation = stations.find(s => s.name === "Posto Xavier & Xavier Ltda") || stations[0];
                if (defaultStation) setStation(defaultStation.name);

            } catch (error) {
                console.error("Error loading form data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const calculateCost = () => {
            if (!liters || !fuelType) {
                setCost(0);
                return;
            }
            const price = fuelPrices[fuelType] || 0;
            const total = parseFloat(liters) * price;
            setCost(total);
        };
        calculateCost();
    }, [liters, fuelType, fuelPrices]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const combinedDate = new Date(`${date}T${time}`);

        const newRecord: AbastecimentoRecord = {
            id: crypto.randomUUID(), // Or let DB handle it, but keeping for ID consistency before reload
            fiscal: authUser?.name || authUser?.username || 'Sistema',
            date: combinedDate.toISOString(),
            vehicle,
            driver,
            fuelType: `${fuelType} - R$ ${fuelPrices[fuelType]?.toFixed(2)}`,
            liters: Number(liters),
            odometer: Number(odometer),
            cost: Number(cost.toFixed(2)),
            station,
            invoiceNumber,
            userId: authUser?.id,
            userName: authUser?.name
        };

        await AbastecimentoService.saveAbastecimento(newRecord);
        onSave(newRecord); // Pass the new record to onSave
    };

    const handleCancel = () => {
        onBack();
    };

    const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all";
    const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

    // Prepare Options
    const vehicleOptions: Option[] = vehicles.map(v => ({
        value: `${v.model} - ${v.brand}`, // Keeping original value format logic
        label: `${v.model} - ${v.brand}`,
        subtext: v.plate
    }));

    const driverOptions: Option[] = persons.map(p => ({
        value: p.name,
        label: p.name,
        subtext: p.role // Assuming role exists on Person, otherwise undefined
    }));

    const fuelOptions: Option[] = fuelTypes.map(t => ({
        value: t.key,
        label: t.label,
        subtext: `R$ ${t.price.toFixed(2)}/L`
    }));

    const stationOptions: Option[] = gasStations.map(s => ({
        value: s.name,
        label: s.name,
        subtext: s.city
    }));

    if (isLoading) return <div className="flex-1 p-6 text-center text-slate-500">Carregando formulário...</div>;

    return (
        <div className="flex-1 h-full bg-slate-50 p-4 md:p-6 overflow-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
                {/* Compact Header */}
                <div className="bg-slate-900 px-6 py-5 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-slate-900"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                            <Fuel className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Novo Abastecimento</h2>
                            <p className="text-cyan-100/70 text-xs font-medium">Preencha os dados do registro</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-12 gap-x-4 gap-y-5">
                        {/* Row 1: Data, Hora, Nota (Compact) - Mobile: Date/Time hidden */}
                        <div className="hidden md:block md:col-span-3">
                            <CustomDateTimeInput
                                label="Data"
                                value={date}
                                onChange={setDate}
                                type="date"
                                required
                            />
                        </div>
                        <div className="hidden md:block md:col-span-3">
                            <CustomDateTimeInput
                                label="Hora"
                                value={time}
                                onChange={setTime}
                                type="time"
                                required
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6 space-y-1">
                            <label className={labelClass}>Número da Nota</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="000.000"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className={inputClass}
                                />
                                <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        {/* Row 2: Veículo e Motorista */}
                        <div className="col-span-12 md:col-span-6">
                            <CustomSelect
                                label="Veículo"
                                value={vehicle}
                                onChange={setVehicle}
                                options={vehicleOptions}
                                placeholder="Selecione o veículo"
                                icon={Truck}
                                required
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <CustomSelect
                                label="Motorista"
                                value={driver}
                                onChange={setDriver}
                                options={driverOptions}
                                placeholder="Selecione o motorista"
                                icon={User}
                                required
                            />
                        </div>

                        {/* Row 3: Odômetro, Combustível, Litros (Grouped) */}
                        <div className="col-span-12 grid grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="col-span-12 md:col-span-4 space-y-1">
                                <label className={labelClass}>Odômetro (KM)</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        required
                                        placeholder="000000"
                                        value={odometer}
                                        onChange={(e) => setOdometer(e.target.value)}
                                        className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-400">
                                        KM
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-6 md:col-span-4">
                                <CustomSelect
                                    label="Combustível"
                                    value={fuelType}
                                    onChange={setFuelType}
                                    options={fuelOptions}
                                    placeholder="Tipo"
                                    icon={Fuel}
                                    required
                                />
                            </div>

                            <div className="col-span-6 md:col-span-4 space-y-1">
                                <label className={labelClass}>Litros</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.1"
                                        required
                                        placeholder="00.0"
                                        value={liters}
                                        onChange={(e) => setLiters(e.target.value)}
                                        className={inputClass}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                        L
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 4: Posto e Total */}
                        <div className="hidden md:block md:col-span-8">
                            <div className="space-y-1">
                                <CustomSelect
                                    label="Posto de Abastecimento"
                                    value={station}
                                    onChange={setStation}
                                    options={stationOptions}
                                    placeholder="Selecione o posto..."
                                    icon={MapPin}
                                    required
                                />
                                {gasStations.length === 0 && (
                                    <p className="text-[10px] text-amber-600 mt-1 ml-1 flex items-center gap-1">
                                        ⚠️ Nenhum posto cadastrado.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-4">
                            <label className={labelClass}>Valor Total</label>
                            <div className="w-full bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between h-[46px] mt-1">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                    <span className="text-xl font-black text-emerald-600 tracking-tight">
                                        R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md shadow-cyan-600/20 text-sm transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            Salvar Registro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
