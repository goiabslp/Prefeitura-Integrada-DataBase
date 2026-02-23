-- Criação da tabela de histórico de horas extras
CREATE TABLE IF NOT EXISTS public.rh_horas_extras (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    month TEXT NOT NULL,
    sector TEXT NOT NULL,
    entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_id UUID, -- Referência opcional caso o usuário venha da auth
    user_name TEXT NOT NULL,
    signature_name TEXT NOT NULL,
    signature_role TEXT NOT NULL,
    signature_sector TEXT NOT NULL
);

-- Habilitar Segurança a Nível de Linha (RLS)
ALTER TABLE public.rh_horas_extras ENABLE ROW LEVEL SECURITY;

-- Política 1: Permitir leitura para usuários autenticados (ou todos da organização)
CREATE POLICY "Permitir leitura de horas extras para usuários autenticados" 
ON public.rh_horas_extras 
FOR SELECT 
USING (true);

-- Política 2: Permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção de horas extras" 
ON public.rh_horas_extras 
FOR INSERT 
WITH CHECK (true);

-- Política 3: Permitir deleção/edição caso exista necessidade futura
CREATE POLICY "Permitir atualização de horas extras" 
ON public.rh_horas_extras 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir deleção de horas extras" 
ON public.rh_horas_extras 
FOR DELETE 
USING (true);
