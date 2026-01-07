import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Fuel, Trash2, Calendar, User, Truck, ShieldCheck, FileText } from 'lucide-react';
import { AbastecimentoService, AbastecimentoRecord } from '../../services/abastecimentoService';
import { supabase } from '../../services/supabaseClient';
import { GestureItem } from '../common/GestureItem';

interface AbastecimentoListProps {
    onBack: () => void;
    onEdit?: (record: AbastecimentoRecord) => void;
}
import { useAuth } from '../../contexts/AuthContext';
import { Edit } from 'lucide-react';

export const AbastecimentoList: React.FC<AbastecimentoListProps> = ({ onBack, onEdit }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [supplies, setSupplies] = useState<AbastecimentoRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [vehicleSectorMap, setVehicleSectorMap] = useState<Record<string, string>>({});
    const [vehiclePlateMap, setVehiclePlateMap] = useState<Record<string, string>>({});

    const loadSupplies = async () => {
        setIsLoading(true);
        try {
            const [data, vehiclesRes, sectorsRes] = await Promise.all([
                AbastecimentoService.getAbastecimentos(),
                supabase.from('vehicles').select('*'),
                supabase.from('sectors').select('*')
            ]);

            setSupplies(data.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateB !== dateA) return dateB - dateA;

                // Tie-breaker: created_at (seconds precision)
                const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return createdB - createdA;
            }));

            if (vehiclesRes.data && sectorsRes.data) {
                const sectorLookup = sectorsRes.data.reduce((acc: any, s: any) => {
                    acc[s.id] = s.name;
                    return acc;
                }, {});

                const vMap: Record<string, string> = {};
                const pMap: Record<string, string> = {};
                vehiclesRes.data.forEach((v: any) => {
                    // Match the format used in AbastecimentoForm: `${v.model} - ${v.brand}`
                    const key = `${v.model} - ${v.brand}`;
                    vMap[key] = sectorLookup[v.sector_id] || 'N/A';
                    pMap[key] = v.plate || 'S/PLACA';
                });
                setVehicleSectorMap(vMap);
                setVehiclePlateMap(pMap);
            }

        } catch (error) {
            console.error("Error loading supplies", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSupplies();

        const channel = supabase
            .channel('abastecimentos-list-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'abastecimentos' },
                () => {
                    loadSupplies();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            await AbastecimentoService.deleteAbastecimento(id);
            loadSupplies();
        }
    };

    const filteredSupplies = supplies.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.fiscal && item.fiscal.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getFuelColor = (fuel: string) => {
        const type = fuel.toLowerCase();
        if (type.includes('diesel')) return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
        if (type.includes('gasolina')) return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
        if (type.includes('etanol')) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
        return 'text-purple-600 bg-purple-500/10 border-purple-500/20';
    };

    const DataItem = ({ label, value, icon: Icon, colorClass = "text-slate-700", flex = "flex-1", truncateValue = true, isBadge = false }: { label: string, value: string | number, icon?: any, colorClass?: string, flex?: string, truncateValue?: boolean, isBadge?: boolean }) => (
        <div className={`flex flex-col gap-1 ${flex} min-w-0`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400/80 ml-0.5 whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1.5">
                {Icon && !isBadge && <Icon className="w-3 h-3" />}
                {label}
            </span>
            <div className={`flex items-center text-sm font-bold transition-colors ${colorClass} ${isBadge ? 'px-2.5 py-1 rounded-lg border w-fit' : ''}`}>
                {Icon && isBadge && <Icon className="w-3.5 h-3.5 mr-1.5 shrink-0 opacity-70" />}
                <span className={truncateValue ? "truncate" : "whitespace-nowrap"} title={String(value)}>{value}</span>
            </div>
        </div>
    );

    return (
        <div className="flex-1 h-full bg-slate-50/50 p-4 md:p-6 overflow-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="group p-2 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl transition-all shadow-sm ring-1 ring-slate-200 hover:ring-cyan-200">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Gestão de Abastecimento</h1>
                            <p className="text-xs text-slate-500 font-medium">Histórico e controle de gastos</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative group flex-1">
                            <input
                                type="text"
                                placeholder="Buscar veículo, motorista, nota ou protocolo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 w-full sm:w-72 shadow-sm transition-all placeholder:font-medium"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                        </div>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-xs shadow-sm transition-all active:scale-95">
                            <Filter className="w-4 h-4 text-slate-400" />
                            Filtros
                        </button>
                    </div>
                </div>

                {/* List Container */}
                {filteredSupplies.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-16 text-center border-2 border-dashed border-slate-200/60 flex flex-col items-center justify-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-full">
                            <Fuel className="w-8 h-8 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Nenhum registro encontrado</h3>
                            <p className="text-slate-500 text-sm">Tente ajustar seus filtros de busca</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredSupplies.map((item) => {
                            const fuelColor = getFuelColor(item.fuelType);
                            return (
                                <GestureItem
                                    key={item.id}
                                    onSwipeLeft={isAdmin ? () => handleDelete(item.id) : undefined}
                                    // onLongPress={() => alert('Long Press triggered!')} // Optional feedback for now
                                    className="rounded-2xl shadow-sm mb-3"
                                >
                                    <div className="group bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-xl hover:shadow-cyan-500/5 hover:border-cyan-200 transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-slate-200 to-transparent group-hover:via-cyan-400 transition-all" />

                                        <div className="flex flex-col md:flex-row md:items-center gap-6 pl-2">
                                            <div className="flex-1 space-y-4 min-w-0">
                                                {/* Row 1 */}
                                                <div className="grid grid-cols-2 lg:flex lg:items-start gap-4 w-full">
                                                    <DataItem
                                                        label="Protocolo"
                                                        value={item.protocol || item.id.substring(0, 8)}
                                                        colorClass="text-slate-400 font-mono text-[9px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                                                        flex="col-span-1 lg:w-[10%]"
                                                        truncateValue={false}
                                                    />
                                                    <DataItem label="Data / Hora" value={new Date(item.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} icon={Calendar} flex="col-span-1 lg:w-[15%]" />
                                                    <DataItem label="Veículo" value={item.vehicle} icon={Truck} colorClass="text-slate-900 uppercase tracking-tight" flex="col-span-2 lg:w-[25%]" />
                                                    <DataItem label="Placa" value={vehiclePlateMap[item.vehicle] || '-'} colorClass="text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100 font-mono text-xs" flex="col-span-1 lg:w-[12%]" />
                                                    <DataItem label="Motorista" value={item.driver} icon={User} colorClass="text-slate-600 uppercase tracking-tight" flex="col-span-2 lg:w-[23%]" />
                                                    <DataItem
                                                        label="Combustível"
                                                        value={item.fuelType.split(' - ')[0].toUpperCase()}
                                                        icon={Fuel}
                                                        colorClass={fuelColor}
                                                        flex="col-span-1 lg:w-[15%] lg:order-last"
                                                        isBadge={true}
                                                    />
                                                </div>

                                                {/* Row 2 */}
                                                <div className="grid grid-cols-2 lg:flex lg:items-start gap-4 pt-4 border-t border-slate-100 w-full">
                                                    <DataItem label="Nº Nota" value={item.invoiceNumber || '-'} icon={FileText} colorClass="text-slate-700 font-bold" flex="col-span-1 lg:w-[15%]" truncateValue={false} />
                                                    <DataItem label="Fiscal" value={item.fiscal || 'Sistema'} icon={ShieldCheck} colorClass="text-slate-600 font-medium" flex="col-span-1 lg:w-[20%]" truncateValue={false} />
                                                    <DataItem label="Quantidade / KM" value={`${item.liters.toFixed(2)} L - ${item.odometer.toLocaleString()} Km`} flex="col-span-2 lg:w-[20%]" colorClass="text-slate-600" />
                                                    <DataItem label="Setor" value={vehicleSectorMap[item.vehicle] || '-'} colorClass="text-slate-500 uppercase text-[10px]" flex="col-span-2 lg:w-[20%]" truncateValue={false} />
                                                    <DataItem
                                                        label="Custo"
                                                        value={`R$ ${item.cost.toFixed(2)}`}
                                                        colorClass="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-black text-base"
                                                        flex="col-span-2 lg:w-[25%]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Action */}
                                            {isAdmin && (
                                                <div className="hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                                    {onEdit && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                            className="p-2.5 text-slate-300 hover:text-cyan-500 hover:bg-cyan-50 rounded-xl transition-all shadow-sm active:scale-95"
                                                            title="Editar Registro"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm active:scale-95"
                                                        title="Excluir Registro"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}


                                        </div>
                                    </div>
                                </GestureItem>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
