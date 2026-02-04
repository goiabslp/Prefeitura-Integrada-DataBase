ALTER TABLE abastecimento_gas_stations 
ADD COLUMN IF NOT EXISTS fuel_prices JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN abastecimento_gas_stations.fuel_prices IS 'Stores fuel prices for the station: { "diesel": 5.50, "gasolina": 6.20, ... }';
