-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id), -- Nullable for Sector/Group chat
    sector_id TEXT, -- Nullable, linking to sector name or ID if strictly referenced
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Users can view messages they sent
CREATE POLICY "Users can view sent messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = sender_id);

-- 2. Users can view messages sent TO them
CREATE POLICY "Users can view received messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = receiver_id);

-- 3. Users can view messages in their sector (Assuming we can match sector_id string or logic)
-- Note: 'profiles' table has 'sector' column. We need to join or use a subquery.
-- Complex RLS with joins can be heavy, but let's try a functional approach or direct check if possible.
-- For now, let's assume 'sector_id' stores the Sector Name string to match 'profiles.sector'.
CREATE POLICY "Users can view sector messages" ON public.chat_messages
    FOR SELECT USING (
        sector_id IS NOT NULL AND 
        sector_id = (SELECT sector FROM public.profiles WHERE id = auth.uid())
    );

-- 4. Users can insert messages (authenticated)
CREATE POLICY "Users can insert messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sector ON public.chat_messages(sector_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
