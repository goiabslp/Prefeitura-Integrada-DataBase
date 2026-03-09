ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_category text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS available_for_scheduling text DEFAULT 'Sim';

-- Atualiza os registros antigos para ficarem disponíveis por padrão
UPDATE vehicles SET available_for_scheduling = 'Sim' WHERE available_for_scheduling IS NULL;
