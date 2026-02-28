-- Criação do schema para o Módulo de Marketing

-- Tabela de Pedidos (Marketing Requests)
CREATE TABLE IF NOT EXISTS public.marketing_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    protocol TEXT UNIQUE NOT NULL,
    requester_name TEXT NOT NULL,
    requester_sector TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Em Análise',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    digital_signature JSONB
);

-- Tabela de Conteúdos (Marketing Contents)
CREATE TABLE IF NOT EXISTS public.marketing_contents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES public.marketing_requests(id) ON DELETE CASCADE NOT NULL,
    content_type TEXT NOT NULL,
    content_sector TEXT,
    event_date DATE,
    event_time TIME,
    event_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.marketing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_contents ENABLE ROW LEVEL SECURITY;

-- Políticas para marketing_requests
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.marketing_requests FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de pedidos de marketing" ON public.marketing_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de pedidos de marketing" ON public.marketing_requests FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção de pedidos de marketing" ON public.marketing_requests FOR DELETE USING (true);

-- Políticas para marketing_contents
CREATE POLICY "Permitir leitura de conteúdos" ON public.marketing_contents FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de conteúdos" ON public.marketing_contents FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de conteúdos" ON public.marketing_contents FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção de conteúdos" ON public.marketing_contents FOR DELETE USING (true);

-- Criar bucket para anexos de marketing, se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('marketing_attachments', 'marketing_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket (se necessário recriar, usar IF NOT EXISTS para as policies seria ideal, mas no Supabase isso as vezes gera erro, então criamos considerando que não existem)
-- Nota: se as policies já existirem, este bloco pode falhar, geralmente criamos via painel ou ignoramos erros
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for Marketing'
    ) THEN
        CREATE POLICY "Public Access for Marketing" ON storage.objects FOR SELECT USING (bucket_id = 'marketing_attachments');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Auth Insert for Marketing'
    ) THEN
        CREATE POLICY "Auth Insert for Marketing" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketing_attachments' AND auth.role() = 'authenticated');
    END IF;
END
$$;
