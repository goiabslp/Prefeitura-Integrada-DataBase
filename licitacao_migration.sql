CREATE TABLE IF NOT EXISTS licitacao_processes (
    id TEXT PRIMARY KEY,
    protocol TEXT,
    title TEXT,
    status TEXT,
    stage TEXT,
    requesting_sector TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    user_id TEXT,
    user_name TEXT,
    document_snapshot JSONB
);
