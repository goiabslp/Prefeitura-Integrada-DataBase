-- Add payment_status to abastecimentos
ALTER TABLE public.abastecimentos
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Em Aberto';

-- Create reports history table
CREATE TABLE IF NOT EXISTS public.abastecimento_reports_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    report_type TEXT NOT NULL, -- 'simplified' or 'complete'
    start_date TEXT,
    end_date TEXT,
    station TEXT,
    sector TEXT,
    vehicle TEXT,
    fuel_type TEXT,
    payment_status TEXT DEFAULT 'Em Aberto',
    user_id UUID,
    user_name TEXT,
    record_ids JSONB -- Optional: Store array of abastecimento IDs included in this report
);

-- RLS Policies
ALTER TABLE public.abastecimento_reports_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for now" ON public.abastecimento_reports_history FOR ALL USING (true) WITH CHECK (true);
