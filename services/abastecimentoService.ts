import { supabase } from './supabaseClient';

export interface FuelConfig {
    diesel: number;
    gasolina: number;
    etanol: number;
    arla: number;
}

export interface AbastecimentoRecord {
    id: string;
    protocol?: string;
    fiscal: string;
    date: string;
    vehicle: string; // "Model - Brand" or just string? The DB stores string.
    driver: string;
    fuelType: string;
    liters: number;
    odometer: number;
    cost: number;
    station?: string;
    invoiceNumber?: string;
    userId?: string;
    userName?: string;
    created_at?: string;
}

export interface GasStation {
    id: string;
    name: string;
    cnpj: string;
    city: string;
}

const DEFAULT_CONFIG: FuelConfig = {
    diesel: 0,
    gasolina: 0,
    etanol: 0,
    arla: 0
};

export const AbastecimentoService = {
    getFuelConfig: async (): Promise<FuelConfig> => {
        try {
            const { data, error } = await supabase
                .from('abastecimento_config')
                .select('value')
                .eq('key', 'fuel_prices')
                .single();

            if (error) {
                // If not found, return default
                if (error.code === 'PGRST116') return DEFAULT_CONFIG;
                console.error('Error loading fuel config:', error);
                return DEFAULT_CONFIG;
            }
            return data?.value || DEFAULT_CONFIG;
        } catch (error) {
            console.error('Error loading fuel config:', error);
            return DEFAULT_CONFIG;
        }
    },

    saveFuelConfig: async (config: FuelConfig): Promise<void> => {
        try {
            const { error } = await supabase
                .from('abastecimento_config')
                .upsert({ key: 'fuel_prices', value: config }, { onConflict: 'key' });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving fuel config:', error);
        }
    },

    getFuelTypes: async (): Promise<{ key: keyof FuelConfig; label: string; price: number }[]> => {
        const config = await AbastecimentoService.getFuelConfig();
        return [
            { key: 'diesel', label: 'Diesel', price: config.diesel },
            { key: 'gasolina', label: 'Gasolina', price: config.gasolina },
            { key: 'etanol', label: 'Etanol', price: config.etanol },
            { key: 'arla', label: 'Arla', price: config.arla }
        ];
    },

    getAbastecimentos: async (
        page: number = 1,
        limit: number = 50,
        filters?: {
            search?: string;
            date?: string;
            startDate?: string;
            endDate?: string;
            station?: string;
            sector?: string;
            vehicle?: string;
            fuelType?: string;
        }
    ): Promise<{ data: AbastecimentoRecord[], count: number }> => {
        try {
            let query = supabase
                .from('abastecimentos')
                .select('*', { count: 'exact' });

            // Apply Filters
            if (filters) {
                if (filters.search) {
                    const s = filters.search.toLowerCase();
                    query = query.or(`vehicle.ilike.%${s}%,driver.ilike.%${s}%,fiscal.ilike.%${s}%,invoice_number.ilike.%${s}%`);
                }
                if (filters.date) {
                    // Exact date match (assuming YYYY-MM-DD input, filtering whole day)
                    const start = `${filters.date}T00:00:00`;
                    const end = `${filters.date}T23:59:59`;
                    query = query.gte('date', start).lte('date', end);
                }
                if (filters.startDate) {
                    query = query.gte('date', `${filters.startDate}T00:00:00`);
                }
                if (filters.endDate) {
                    query = query.lte('date', `${filters.endDate}T23:59:59`);
                }
                if (filters.station && filters.station !== 'all') {
                    query = query.eq('station', filters.station);
                }
                if (filters.vehicle && filters.vehicle !== 'all') {
                    query = query.eq('vehicle', filters.vehicle);
                }
                if (filters.fuelType && filters.fuelType !== 'all') {
                    query = query.ilike('fuel_type', `%${filters.fuelType}%`);
                }

                if (filters.sector && filters.sector !== 'all') {
                    // Fetch vehicles belonging to this sector first
                    const { data: sectorVehicles } = await supabase
                        .from('vehicles')
                        .select('plate, model, brand')
                        .eq('sector_id', filters.sector);

                    if (sectorVehicles && sectorVehicles.length > 0) {
                        // Create a list of possible identifiers (Plate AND Model-Brand for legacy)
                        const identifiers = sectorVehicles.flatMap(v => {
                            const params = [];
                            if (v.plate) params.push(v.plate);
                            params.push(`${v.model} - ${v.brand}`);
                            return params;
                        });
                        query = query.in('vehicle', identifiers);
                    } else {
                        // If no vehicles in sector, no supplies to show
                        return { data: [], count: 0 };
                    }
                }
            }

            // Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await query
                .order('date', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const mappedData = data?.map((item: any) => ({
                id: item.id,
                protocol: item.protocol,
                fiscal: item.fiscal,
                date: item.date,
                vehicle: item.vehicle,
                driver: item.driver,
                fuelType: item.fuel_type,
                liters: item.liters,
                odometer: item.odometer,
                cost: item.cost,
                station: item.station,
                invoiceNumber: item.invoice_number,
                userId: item.user_id,
                userName: item.user_name,
                created_at: item.created_at
            })) || [];

            return { data: mappedData, count: count || 0 };
        } catch (error) {
            console.error('Error loading records:', error);
            return { data: [], count: 0 };
        }
    },

    checkInvoiceExists: async (invoiceNumber: string, excludeId?: string): Promise<boolean> => {
        try {
            let query = supabase
                .from('abastecimentos')
                .select('id')
                .eq('invoice_number', invoiceNumber);

            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data && data.length > 0;
        } catch (error) {
            console.error('Error checking invoice:', error);
            return false;
        }
    },

    saveAbastecimento: async (record: AbastecimentoRecord): Promise<void> => {
        try {
            const dbRecord = {
                id: record.id,
                protocol: record.protocol,
                date: record.date,
                vehicle: record.vehicle,
                driver: record.driver,
                fuel_type: record.fuelType, // Map camelCase to snake_case
                liters: record.liters,
                odometer: record.odometer,
                cost: record.cost,
                station: record.station,
                invoice_number: record.invoiceNumber,
                fiscal: record.fiscal,
                user_id: record.userId,
                user_name: record.userName
            };

            const { error } = await supabase
                .from('abastecimentos')
                .upsert(dbRecord);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving record:', error);
        }
    },

    deleteAbastecimento: async (id: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('abastecimentos')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    },

    // Gas Station Methods
    getGasStations: async (): Promise<GasStation[]> => {
        try {
            const { data, error } = await supabase
                .from('abastecimento_gas_stations')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading gas stations:', error);
            return [];
        }
    },

    saveGasStation: async (station: GasStation): Promise<void> => {
        try {
            const { error } = await supabase
                .from('abastecimento_gas_stations')
                .upsert(station);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving gas station:', error);
        }
    },

    deleteGasStation: async (id: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('abastecimento_gas_stations')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting gas station:', error);
        }
    }
};
