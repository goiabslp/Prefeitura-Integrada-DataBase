import { supabase } from './supabaseClient';

export interface FuelConfig {
    diesel: number;
    gasolina: number;
    etanol: number;
    arla: number;
}

export interface AbastecimentoRecord {
    id: string;
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

    getAbastecimentos: async (): Promise<AbastecimentoRecord[]> => {
        try {
            const { data, error } = await supabase
                .from('abastecimentos')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            
            return data.map((item: any) => ({
                id: item.id,
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
            }));
        } catch (error) {
            console.error('Error loading records:', error);
            return [];
        }
    },

    saveAbastecimento: async (record: AbastecimentoRecord): Promise<void> => {
        try {
            const dbRecord = {
                id: record.id,
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
