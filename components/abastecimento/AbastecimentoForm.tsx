import React, { useState, useEffect, useMemo } from 'react';
import { Fuel, User, Truck, DollarSign, Save, X, MapPin, FileText, Clock } from 'lucide-react';
import { AbastecimentoService, AbastecimentoRecord } from '../../services/abastecimentoService';
import { useAuth } from '../../contexts/AuthContext';
import { Vehicle, Person } from '../../types';
import { CustomSelect, Option } from '../common/CustomSelect';
import { parseFormattedNumber, formatNumberInput } from '../../utils/numberUtils';

import { CustomDateTimeInput } from '../common/CustomDateTimeInput';
import { AbastecimentoConfirmationModal } from '../modals/AbastecimentoConfirmationModal';

interface AbastecimentoFormProps {
    onBack: () => void;
    onSave: (data: any) => void;
    vehicles: Vehicle[];
    persons: Person[];
    gasStations: { id: string, name: string, city: string, fuel_prices?: any }[]; // Updated type
    fuelTypes: { key: string; label: string; price: number }[];
    initialData?: AbastecimentoRecord;
}

import { useCachedVehicles } from '../../hooks/useCachedVehicles';
import { useCachedPersons } from '../../hooks/useCachedPersons';
import { useCachedFuelTypes } from '../../hooks/useCachedFuelTypes';

export const AbastecimentoForm: React.FC<AbastecimentoFormProps> = ({ onBack, onSave, vehicles: initialVehicles, persons: initialPersons, gasStations, fuelTypes: initialFuelTypes, initialData }) => {
    const { user: authUser } = useAuth();
    // Use cached data for optimized loading
    const vehicles = useCachedVehicles(initialVehicles);
    const persons = useCachedPersons(initialPersons);
    const fuelTypes = useCachedFuelTypes(initialFuelTypes);

    // Derived prices from props (now from cached fuelTypes by default)
    const [fuelPrices, setFuelPrices] = useState<{ [key: string]: number }>({});
    // Store global prices for fallback
    const [globalPrices, setGlobalPrices] = useState<{ [key: string]: number }>({});

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
    const [formattedCost, setFormattedCost] = useState('R$ 0,00');
    const [lastOdometer, setLastOdometer] = useState<number | null>(null);


    // Formatting Helpers
    // Formatting Helpers removed: now using numberUtils

    const handleOdometerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Odometer: 1 decimal place
        const formatted = formatNumberInput(e.target.value, 2);
        setOdometer(formatted);
    };

    const handleLitersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Liters: 3 decimal places
        const formatted = formatNumberInput(e.target.value, 3);
        setLiters(formatted);
    };

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Cost: 2 decimal places
        const formatted = formatNumberInput(e.target.value, 2);
        setFormattedCost(`R$ ${formatted}`);
        setCost(parseFormattedNumber(formatted));
    };


    // Confirmation Modal State
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [pendingData, setPendingData] = useState<AbastecimentoRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize state from props
    useEffect(() => {
        const prices = fuelTypes.reduce((acc: any, type: any) => {
            acc[type.key] = type.price;
            return acc;
        }, {});
        setFuelPrices(prices);
        setGlobalPrices(prices);

        if (fuelTypes.length > 0 && !fuelType) {
            setFuelType(fuelTypes[0].key);
        }

        if (gasStations.length > 0 && !station) {
            // Prioritize "Posto Xavier & Xavier Ltda" or fallback to first station
            const defaultStation = gasStations.find(s => s.name === "Posto Xavier & Xavier Ltda") || gasStations[0];
            if (defaultStation) setStation(defaultStation.name);
        }
    }, [fuelTypes, gasStations]); // Run when props change/load

    // Update prices based on selected station
    useEffect(() => {
        if (!station) {
            setFuelPrices(globalPrices);
            return;
        }

        const selectedStation = gasStations.find(s => s.name === station);
        if (selectedStation && selectedStation.fuel_prices) {
            // Merge station prices with global prices (fallback for missing keys) or just override
            // Requirement implies station prices are specific.
            // Let's iterate keys of global to ensure structure, but take from station if > 0
            const newPrices = { ...globalPrices };

            // Assuming fuel_prices keys match fuelTypes keys
            Object.keys(selectedStation.fuel_prices).forEach(key => {
                // @ts-ignore
                const val = selectedStation.fuel_prices[key];
                if (val && val > 0) {
                    newPrices[key] = val;
                }
            });
            setFuelPrices(newPrices);
        } else {
            // Revert to global if station has no specific prices
            setFuelPrices(globalPrices);
        }
    }, [station, gasStations, globalPrices]);

    // Fetch latest odometer when vehicle changes
    useEffect(() => {
        const fetchLastOdometer = async () => {
            if (vehicle) {
                const latest = await AbastecimentoService.getLatestOdometerByVehicle(vehicle);
                setLastOdometer(latest);
            } else {
                setLastOdometer(null);
            }
        };
        fetchLastOdometer();
    }, [vehicle]);

    // Load initial data for editing
    useEffect(() => {
        if (initialData) {
            const d = new Date(initialData.date);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setDate(d.toISOString().split('T')[0]);
            setTime(new Date(initialData.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }));
            // Handle legacy data (Model - Brand) vs new data (Plate)
            const savedVehicle = initialData.vehicle;
            const matchedVehicle = vehicles.find(v =>
                v.plate === savedVehicle ||
                `${v.model} - ${v.brand}` === savedVehicle
            );
            setVehicle(matchedVehicle ? matchedVehicle.plate : savedVehicle);
            setDriver(initialData.driver);
            setLiters(initialData.liters.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }));
            setOdometer(initialData.odometer.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
            // Extract fuel key from "type - price" string "gasolina - R$ 5.00" -> "gasolina" or just use full string if needed?
            // The record stores "gasolina - R$ 5.89". We need to find the key.
            // Actually record.fuelType stores "gasolina - R$ 5.89".
            // We need to set 'fuelType' state which is the KEY (e.g. 'gasolina').
            // Let's try to split by ' - ' or match with fuelTypes.
            const typePart = initialData.fuelType.split(' - ')[0];
            const foundType = fuelTypes.find(t => t.key === typePart || t.label === typePart || initialData.fuelType.includes(t.key));
            if (foundType) setFuelType(foundType.key);

            setStation(initialData.station || '');
            const initialCost = initialData.cost;
            setCost(initialCost);
            setFormattedCost(`R$ ${initialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        }

    }, [initialData, fuelTypes]);

    useEffect(() => {
        const calculateCost = () => {
            if (!liters || !fuelType) {
                setCost(0);
                setFormattedCost('R$ 0,00');
                return;
            }
            const price = fuelPrices[fuelType] || 0;
            const litersFloat = parseFormattedNumber(liters);
            const total = litersFloat * price;
            // Round to 2 decimals for precision requirement
            const roundedTotal = Number(total.toFixed(2));
            setCost(roundedTotal);
            setFormattedCost(`R$ ${roundedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        };
        calculateCost();
    }, [liters, fuelType, fuelPrices]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const combinedDate = new Date(`${date}T${time}`);
        // If editing, use existing ID and Protocol. Else generate new.
        const recordId = initialData?.id || crypto.randomUUID();
        const protocolId = initialData?.protocol || `ABA-${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

        // Strict Validation
        if (!vehicle || !driver || !fuelType) {
            alert('Por favor, preencha todos os campos obrigatórios (Veículo, Motorista, Combustível).');
            return;
        }

        const litersVal = parseFormattedNumber(liters);
        const odometerVal = parseFormattedNumber(odometer);

        if (litersVal <= 0) {
            alert('A quantidade de litros deve ser maior que zero.');
            return;
        }

        // Only validate odometer for NEW records
        if (!initialData && odometerVal <= 0) {
            alert('O odômetro deve ser maior que zero.');
            return;
        }

        // Check for duplicate invoice number (Combination: Station + Invoice)
        if (invoiceNumber && station) {
            const isDuplicate = await AbastecimentoService.checkInvoiceExists(invoiceNumber, station, initialData?.id);
            if (isDuplicate) {
                alert(`ERRO: Já existe um registro com a Nota ${invoiceNumber} para o posto ${station}. Por favor, verifique.`);
                return;
            }
        }

        const matchedVehicle = vehicles.find(v => v.plate === vehicle);

        const newRecord: AbastecimentoRecord = {
            id: recordId,
            protocol: protocolId,
            fiscal: initialData?.fiscal || authUser?.name || authUser?.username || 'Sistema',
            date: combinedDate.toISOString(),
            vehicle,
            driver,
            fuelType: `${fuelType} - R$ ${fuelPrices[fuelType]?.toFixed(2)}`,
            liters: litersVal,
            odometer: odometerVal,
            cost: Number(cost.toFixed(2)),
            station,
            invoiceNumber,
            userId: initialData?.userId || authUser?.id,
            userName: initialData?.userName || authUser?.name,
            sectorId: matchedVehicle?.sectorId || initialData?.sectorId,
            created_at: initialData?.created_at
        };

        // Open Confirmation Modal instead of saving directly
        setPendingData(newRecord);
        setConfirmModalOpen(true);
    };

    const handleFinalSave = async () => {
        if (!pendingData) return;

        try {
            setIsSaving(true);

            // Audit Log (Console for now, can be extended to DB)
            console.log(`[AUDIT] Saving Supply Record: 
                Protocol: ${pendingData.protocol}, 
                User: ${pendingData.userName} (${pendingData.userId}), 
                Vehicle: ${pendingData.vehicle}, 
                Timestamp: ${new Date().toISOString()}`
            );

            await AbastecimentoService.saveAbastecimento(pendingData, !!initialData);

            onSave(pendingData);
            setConfirmModalOpen(false);
        } catch (error) {
            console.error("[AUDIT] Error saving supply:", error);
            alert("Erro ao salvar abastecimento. Verifique sua conexão e tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        onBack();
    };

    const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all";
    const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1";

    // Prepare Options - Memoized for performance
    const vehicleOptions: Option[] = useMemo(() => vehicles
        .map(v => ({
            value: v.plate, // Store PLATE as the unique identifier
            label: v.plate, // Display ONLY Plate
            subtext: undefined, // Remove any extra info
            key: v.id
        }))
        .sort((a, b) => a.label.localeCompare(b.label)), [vehicles]);

    const driverOptions: Option[] = useMemo(() => {
        return persons
            .map(p => ({
                value: p.name,
                label: p.name,
                subtext: (p as any).role || p.jobId,
                key: p.id,
                // Pre-calculating sort key to avoid expensive operations during comparison
                _sortKey: (p.name || '').trim().toLowerCase()
            }))
            .sort((a, b) => a._sortKey.localeCompare(b._sortKey));
    }, [persons]);

    const fuelOptions: Option[] = useMemo(() => fuelTypes
        .map(t => ({
            value: t.key,
            label: t.label,
            subtext: `R$ ${(fuelPrices[t.key] || t.price).toFixed(2)}/L`
        }))
        .sort((a, b) => a.label.localeCompare(b.label)), [fuelTypes, fuelPrices]);

    const stationOptions: Option[] = useMemo(() => gasStations
        .map(s => ({
            value: s.name,
            label: s.name,
            subtext: s.city,
            key: s.id
        }))
        .sort((a, b) => a.label.localeCompare(b.label)), [gasStations]);

    // Removed isLoading check as data is passed via props

    return (
        <div className="flex-1 h-full bg-slate-50 p-4 wide:p-6 overflow-auto custom-scrollbar">
            <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
                {/* Compact Header */}
                <div className="bg-slate-900 px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-slate-900"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                            <Fuel className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{initialData ? 'Editar Abastecimento' : 'Novo Abastecimento'}</h2>
                            <p className="text-cyan-100/70 text-xs font-medium">{initialData ? 'Atualize os dados do registro' : 'Preencha os dados do registro'}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                    <div className="grid grid-cols-12 gap-x-4 gap-y-5">
                        {/* Row 1: Data, Hora, Nota (Compact) - Mobile: Date/Time hidden */}
                        <div className="hidden wide:block wide:col-span-3">
                            <CustomDateTimeInput
                                label="Data"
                                value={date}
                                onChange={setDate}
                                type="date"
                                required
                            />
                        </div>
                        <div className="hidden wide:block wide:col-span-3">
                            <CustomDateTimeInput
                                label="Hora"
                                value={time}
                                onChange={setTime}
                                type="time"
                                required
                            />
                        </div>
                        <div className="col-span-12 wide:col-span-6 space-y-1">
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
                        <div className="col-span-12 wide:col-span-6">
                            <CustomSelect
                                label="Veículo"
                                value={vehicle}
                                onChange={setVehicle}
                                options={vehicleOptions}
                                placeholder="Selecione o veículo"
                                icon={Truck}
                                required
                                mobileThreshold={1201}
                            />
                        </div>
                        <div className="col-span-12 wide:col-span-6">
                            <CustomSelect
                                label="Motorista"
                                value={driver}
                                onChange={setDriver}
                                options={driverOptions}
                                placeholder="Selecione o motorista"
                                icon={User}
                                required
                                mobileThreshold={1201}
                            />
                        </div>

                        {/* Row 3: Odômetro, Combustível, Litros (Grouped) */}
                        <div className="col-span-12 grid grid-cols-12 gap-4 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                            <div className="col-span-12 wide:col-span-4 space-y-1">
                                <label className={labelClass}>Horímetro/Odômetro (KM/H)</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        placeholder="00.000,00"
                                        value={odometer}
                                        onChange={handleOdometerChange}
                                        className="w-full font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-400">
                                        KM/H
                                    </div>
                                </div>
                                {lastOdometer !== null && !initialData && (
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                        Último registro: <span className="font-bold">{lastOdometer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </p>
                                )}
                            </div>

                            <div className="col-span-6 wide:col-span-4">
                                <CustomSelect
                                    label="Combustível"
                                    value={fuelType}
                                    onChange={setFuelType}
                                    options={fuelOptions}
                                    placeholder="Tipo"
                                    icon={Fuel}
                                    required
                                    mobileThreshold={1201}
                                    disableMobileModal={true}
                                    forceDirection="up"
                                />
                            </div>

                            <div className="col-span-6 wide:col-span-4 space-y-1">
                                <label className={labelClass}>Litros</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        placeholder="00,000"
                                        value={liters}
                                        onChange={handleLitersChange}
                                        className={inputClass}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                                        L
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 4: Posto e Total */}
                        <div className="hidden wide:block wide:col-span-8">
                            <div className="space-y-1">
                                <CustomSelect
                                    label="Posto de Abastecimento"
                                    value={station}
                                    onChange={setStation}
                                    options={stationOptions}
                                    placeholder="Selecione o posto..."
                                    icon={MapPin}
                                    required
                                    mobileThreshold={1201}
                                />
                                {gasStations.length === 0 && (
                                    <p className="text-[10px] text-amber-600 mt-1 ml-1 flex items-center gap-1">
                                        ⚠️ Nenhum posto cadastrado.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="col-span-12 wide:col-span-4">
                            <label className={labelClass}>Valor Total</label>
                            <div className="relative group mt-1">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formattedCost}
                                    onChange={handleCostChange}
                                    className="w-full font-black text-xl text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-10 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                />
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
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


            <AbastecimentoConfirmationModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleFinalSave}
                data={pendingData ? {
                    invoiceNumber: pendingData.invoiceNumber || '',
                    vehicle: pendingData.vehicle,
                    fuelType: pendingData.fuelType,
                    liters: pendingData.liters,
                    cost: pendingData.cost,
                    odometer: odometer, // Passing formatted string directly
                    lastOdometer: lastOdometer
                } : null}
                isEdit={!!initialData}
                isSaving={isSaving}
            />
        </div >
    );
};
