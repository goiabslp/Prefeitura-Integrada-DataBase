-- Migration: Create Projetos and Projeto History tables

-- Enums for Status
CREATE TYPE public.projeto_status AS ENUM (
    'Aguardando Admin',
    'Em Andamento',
    'Concluído',
    'Cancelado'
);

CREATE TYPE public.projeto_history_action AS ENUM (
    'Criado',
    'Encaminhado',
    'Mensagem',
    'Anexo',
    'Status Alterado'
);

-- Table: projetos
CREATE TABLE IF NOT EXISTS public.projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    responsible_id UUID NOT NULL REFERENCES public.profiles(id),
    status public.projeto_status DEFAULT 'Aguardando Admin',
    start_date DATE,
    end_date DATE,
    current_owner_id UUID REFERENCES public.profiles(id),
    current_sector_id UUID REFERENCES public.sectors(id),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: projeto_history
CREATE TABLE IF NOT EXISTS public.projeto_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    sector_id UUID REFERENCES public.sectors(id),
    action public.projeto_history_action NOT NULL,
    message TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS Policies
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_history ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users on projetos"
ON public.projetos FOR SELECT
TO authenticated
USING (true);

-- Allow insert/update to authenticated users
CREATE POLICY "Allow insert/update to authenticated users on projetos"
ON public.projetos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users on projeto_history"
ON public.projeto_history FOR SELECT
TO authenticated
USING (true);

-- Allow insert access to authenticated users
CREATE POLICY "Allow insert to authenticated users on projeto_history"
ON public.projeto_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- Functions and Triggers
-- Update updated_at column on projetos changes
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projetos_modtime
    BEFORE UPDATE ON public.projetos
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Subscriptions Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Handle if already exists or permission issues
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.projetos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projeto_history;
