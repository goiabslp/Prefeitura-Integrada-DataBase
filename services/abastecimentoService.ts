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
    vehicle: string;
    driver: string;
    fuelType: string;
    liters: number;
    odometer: number;
    cost: number;
    station?: string;
    invoiceNumber?: string;
}

const STORAGE_KEY = 'abastecimento_fuel_config';
const RECORDS_KEY = 'abastecimento_records';

const DEFAULT_CONFIG: FuelConfig = {
    diesel: 0,
    gasolina: 0,
    etanol: 0,
    arla: 0
};

const GAS_STATIONS_KEY = 'abastecimento_gas_stations';

export interface GasStation {
    id: string;
    name: string;
    cnpj: string;
    city: string;
}

export const AbastecimentoService = {
    getFuelConfig: (): FuelConfig => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
        } catch (error) {
            console.error('Error loading fuel config:', error);
            return DEFAULT_CONFIG;
        }
    },

    saveFuelConfig: (config: FuelConfig): void => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
            console.error('Error saving fuel config:', error);
        }
    },

    getFuelTypes: (): { key: keyof FuelConfig; label: string; price: number }[] => {
        const config = AbastecimentoService.getFuelConfig();
        return [
            { key: 'diesel', label: 'Diesel', price: config.diesel },
            { key: 'gasolina', label: 'Gasolina', price: config.gasolina },
            { key: 'etanol', label: 'Etanol', price: config.etanol },
            { key: 'arla', label: 'Arla', price: config.arla }
        ];
    },

    getAbastecimentos: (): AbastecimentoRecord[] => {
        try {
            const stored = localStorage.getItem(RECORDS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading records:', error);
            return [];
        }
    },

    saveAbastecimento: (record: AbastecimentoRecord): void => {
        try {
            const current = AbastecimentoService.getAbastecimentos();
            const updated = [record, ...current];
            localStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving record:', error);
        }
    },

    deleteAbastecimento: (id: string): void => {
        try {
            const current = AbastecimentoService.getAbastecimentos();
            const updated = current.filter(r => r.id !== id);
            localStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    },

    // Gas Station Methods
    getGasStations: (): GasStation[] => {
        try {
            const stored = localStorage.getItem(GAS_STATIONS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading gas stations:', error);
            return [];
        }
    },

    saveGasStation: (station: GasStation): void => {
        try {
            const current = AbastecimentoService.getGasStations();
            const exists = current.find(s => s.id === station.id);
            const updated = exists
                ? current.map(s => s.id === station.id ? station : s)
                : [...current, station];
            localStorage.setItem(GAS_STATIONS_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving gas station:', error);
        }
    },

    deleteGasStation: (id: string): void => {
        try {
            const current = AbastecimentoService.getGasStations();
            const updated = current.filter(s => s.id !== id);
            localStorage.setItem(GAS_STATIONS_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error deleting gas station:', error);
        }
    }

};
