-- ========================================================
-- SETUP: MARKETING ANEXOS (STORAGE E TABELA)
-- ========================================================

-- 1. Criação do Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-anexos', 'marketing-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Criação da Tabela marketing_anexos
CREATE TABLE IF NOT EXISTS public.marketing_anexos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    id_pedido uuid REFERENCES public.marketing_requests(id) ON DELETE CASCADE NOT NULL,
    tipo text CHECK (tipo IN ('solicitante', 'producao')) NOT NULL,
    nome_arquivo text NOT NULL,
    legenda text,
    usuario_upload text NOT NULL,
    setor text NOT NULL,
    url_storage text NOT NULL,
    data_upload timestamptz DEFAULT now() NOT NULL,
    data_expiracao timestamptz DEFAULT (now() + interval '7 days') NOT NULL,
    status text CHECK (status IN ('ativo', 'expirado')) DEFAULT 'ativo'
);

-- 3. Habilitar RLS
ALTER TABLE public.marketing_anexos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para marketing_anexos
-- Leitura: solicitante pode ver do seu setor, admin e marketing podem ver tudo.
CREATE POLICY "Leitura de anexos por setor ou admin/marketing"
ON public.marketing_anexos FOR SELECT
USING (
    setor = (auth.jwt() ->> 'sector') OR 
    (auth.jwt() ->> 'role') IN ('Administrador', 'Marketing')
);

-- Inserção:
CREATE POLICY "Insercao de anexos"
ON public.marketing_anexos FOR INSERT
WITH CHECK (
    -- Se for solicitante, qualquer um autênticado pode inserir no próprio pedido (a regra real é quem tá criando)
    -- Se for producao, só Admin e Marketing
    (tipo = 'solicitante') OR
    (tipo = 'producao' AND (auth.jwt() ->> 'role') IN ('Administrador', 'Marketing'))
);

-- Exclusão:
CREATE POLICY "Exclusao de anexos"
ON public.marketing_anexos FOR DELETE
USING (
    (auth.jwt() ->> 'role') IN ('Administrador', 'Marketing') OR
    (tipo = 'solicitante' AND setor = (auth.jwt() ->> 'sector'))
);

-- Update (ex: sistema atualizar para expirado)
CREATE POLICY "Update de anexos"
ON public.marketing_anexos FOR UPDATE
USING (
    (auth.jwt() ->> 'role') IN ('Administrador', 'Marketing')
);

-- 5. Políticas para o Bucket marketing-anexos (Storage)
CREATE POLICY "Leitura Publica ou Autenticada"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketing-anexos' AND auth.role() = 'authenticated');

CREATE POLICY "Insert no bucket marketing-anexos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'marketing-anexos' AND auth.role() = 'authenticated'
    -- Poderíamos ser bem estritos aqui, mas validamos na tabela!
);

CREATE POLICY "Exclusao no bucket marketing-anexos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'marketing-anexos' AND auth.role() = 'authenticated'
);

-- 6. Script pg_cron para limpeza (Edge Function interna no banco)
-- Requer a extensão pg_cron ativada no Supabase
/*
SELECT cron.schedule(
    'expiracao_arquivos_marketing_diario',
    '0 3 * * *', -- Roda as 03:00 AM todo dia
    $$
        -- 1. Atualizar o status para 'expirado' na tabela para arquivos de producao passados de 7 dias
        UPDATE public.marketing_anexos
        SET status = 'expirado'
        WHERE tipo = 'producao' 
          AND status = 'ativo' 
          AND data_expiracao < now();
        
        -- 2. No mundo real do Supabase sem uma Edge Function externa (Deno), deletar do storage.objects via SQL não é suportado oficialmente,
        -- apenas se usarmos as APIs RPC do net.http ou limparmos `storage.objects` na marra (nao recomendado, pois não deleta do disco/S3 subjacente do Supabase).
        -- Portanto, a maneira CORRETA de limpar o arquivo físico é criando uma Edge Function em Deno que faça:
        -- a) Busque todos marketing_anexos com status='expirado' e exclua via supabase.storage.from().remove()
        -- Por enquanto, marcaremos como expirado no DB que cortará o acesso imediatamente no frontend.
    $$
);
*/
