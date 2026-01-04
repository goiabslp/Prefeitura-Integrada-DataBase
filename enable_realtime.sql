-- Enable Realtime for Abastecimento Tables

-- Add tables to the supabase_realtime publication
alter publication supabase_realtime add table abastecimentos;
alter publication supabase_realtime add table abastecimento_config;
alter publication supabase_realtime add table abastecimento_gas_stations;
