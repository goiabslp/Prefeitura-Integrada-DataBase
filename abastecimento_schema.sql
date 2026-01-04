
CREATE TABLE IF NOT EXISTS public.abastecimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ NOT NULL,
    vehicle TEXT NOT NULL,
    driver TEXT NOT NULL,
    fuel_type TEXT NOT NULL,
    liters NUMERIC NOT NULL,
    odometer NUMERIC NOT NULL,
    cost NUMERIC NOT NULL,
    station TEXT,
    invoice_number TEXT,
    fiscal TEXT,
    user_id UUID,
    user_name TEXT
);

CREATE TABLE IF NOT EXISTS public.abastecimento_gas_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    cnpj TEXT,
    city TEXT
);

CREATE TABLE IF NOT EXISTS public.abastecimento_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL
);

-- RLS Policies
ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for now" ON public.abastecimentos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.abastecimento_gas_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for now" ON public.abastecimento_gas_stations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.abastecimento_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for now" ON public.abastecimento_config FOR ALL USING (true) WITH CHECK (true);
