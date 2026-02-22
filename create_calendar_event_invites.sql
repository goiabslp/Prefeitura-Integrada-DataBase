-- Drop the table if it already exists (useful for dev resets)
DROP TABLE IF EXISTS public.calendar_event_invites CASCADE;

-- Create the invites table
CREATE TABLE public.calendar_event_invites (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aceito', 'Recusado')),
    role text NOT NULL DEFAULT 'Participante' CHECK (role IN ('Colaborador', 'Participante')),
    decline_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT calendar_event_invites_pkey PRIMARY KEY (id),
    CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.calendar_event_invites ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to avoid infinite recursion in RLS
CREATE OR REPLACE FUNCTION public.is_calendar_event_owner(e_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM calendar_events 
        WHERE id = e_id AND created_by = auth.uid()
    );
$$;

-- Add RLS Policies for Invites
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_event_invites' AND policyname = 'Admins can manage all invites') THEN
        CREATE POLICY "Admins can manage all invites" ON public.calendar_event_invites
            FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_event_invites' AND policyname = 'Users can read invites pointing to them or for their events') THEN
        DROP POLICY "Users can read invites pointing to them or for their events" ON public.calendar_event_invites;
    END IF;
    
    CREATE POLICY "Users can read invites pointing to them or for their events" ON public.calendar_event_invites
        FOR SELECT USING (
            user_id = auth.uid() OR 
            public.is_calendar_event_owner(event_id)
        );
    
    -- Users can only update their own invite status
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_event_invites' AND policyname = 'Users can update their own invites') THEN
        CREATE POLICY "Users can update their own invites" ON public.calendar_event_invites
            FOR UPDATE USING (user_id = auth.uid());
    END IF;
END
$$;

-- Update RLS Policies for Events
-- Admins already have total access. 
-- We need to change the "Enable read access for all users" policy to be more restrictive based on the new rules.

DO $$
BEGIN
    -- Drop the overly permissive read policy if it exists
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Enable read access for all users') THEN
        DROP POLICY "Enable read access for all users" ON public.calendar_events;
    END IF;

    -- Admins can read all events
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Admins can read all events') THEN
        CREATE POLICY "Admins can read all events" ON public.calendar_events
            FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    -- Users can read events they created
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can read own events') THEN
        CREATE POLICY "Users can read own events" ON public.calendar_events
            FOR SELECT USING (created_by = auth.uid());
    END IF;

    -- Users can read events they are invited to
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can read invited events') THEN
        CREATE POLICY "Users can read invited events" ON public.calendar_events
            FOR SELECT USING (
                id IN (SELECT event_id FROM public.calendar_event_invites WHERE user_id = auth.uid())
            );
    END IF;
    
    -- Users can insert their own events (Admin check is already in place, but we need to allow regular users to insert too, as long as it's theirs)
    -- We'll drop the "Enable insert for admins only" and create a broader one.
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Enable insert for admins only') THEN
        DROP POLICY "Enable insert for admins only" ON public.calendar_events;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can insert own events or admins can insert') THEN
        CREATE POLICY "Users can insert own events or admins can insert" ON public.calendar_events
            FOR INSERT WITH CHECK (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            );
    END IF;

    -- Similar for Update: Users can update their own events (Or maybe only admins? Let's allow owners to update own events)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Enable update for admins only') THEN
        DROP POLICY "Enable update for admins only" ON public.calendar_events;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can update own events or admins') THEN
        CREATE POLICY "Users can update own events or admins" ON public.calendar_events
            FOR UPDATE USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            );
    END IF;

    -- Similar for Delete
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Enable delete for admins only') THEN
        DROP POLICY "Enable delete for admins only" ON public.calendar_events;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can delete own events or admins') THEN
        CREATE POLICY "Users can delete own events or admins" ON public.calendar_events
            FOR DELETE USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            );
    END IF;
END
$$;

-- Create RPC to save event and its invites in a transaction
CREATE OR REPLACE FUNCTION create_calendar_event(
    event_data jsonb,
    invites_data jsonb
) RETURNS jsonb AS $$
DECLARE
    new_event_id uuid;
    result jsonb;
    invite record;
BEGIN
    -- 1. Insert the event
    INSERT INTO public.calendar_events (
        title, type, start_date, end_date, is_all_day, start_time, end_time, description, created_by
    ) VALUES (
        event_data->>'title',
        event_data->>'type',
        (event_data->>'start_date')::date,
        (event_data->>'end_date')::date,
        (event_data->>'is_all_day')::boolean,
        (event_data->>'start_time')::time,
        (event_data->>'end_time')::time,
        event_data->>'description',
        (event_data->>'created_by')::uuid
    ) RETURNING id INTO new_event_id;

    -- 2. Insert the invites
    IF jsonb_array_length(invites_data) > 0 THEN
        FOR invite IN SELECT * FROM jsonb_array_elements(invites_data) LOOP
            INSERT INTO public.calendar_event_invites (
                event_id, user_id, status, role
            ) VALUES (
                new_event_id,
                (invite.value->>'user_id')::uuid,
                COALESCE(invite.value->>'status', 'Pendente'),
                COALESCE(invite.value->>'role', 'Participante')
            );
        END LOOP;
    END IF;

    -- Return success with the new event id
    SELECT json_build_object('success', true, 'id', new_event_id) INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Return error
    SELECT json_build_object('success', false, 'error', SQLERRM) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create RPC to respond to invite
CREATE OR REPLACE FUNCTION respond_to_event_invite(
    p_invite_id uuid,
    p_status text,
    p_decline_reason text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    result jsonb;
    v_user_id uuid;
BEGIN
    -- Force reason if declined
    IF p_status = 'Recusado' AND (p_decline_reason IS NULL OR trim(p_decline_reason) = '') THEN
        RAISE EXCEPTION 'Justificativa é obrigatória para recusar um convite.';
    END IF;

    -- Must be the user modifying their own invite, but let's just make it security invoker or check auth.uid
    -- SECURITY DEFINER simplifies updating if RLS blocks it, but we can verify user
    SELECT user_id INTO v_user_id FROM public.calendar_event_invites WHERE id = p_invite_id;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Acesso negado: Você só pode responder aos seus próprios convites.';
    END IF;

    UPDATE public.calendar_event_invites
    SET 
        status = p_status,
        decline_reason = CASE WHEN p_status = 'Recusado' THEN p_decline_reason ELSE decline_reason END
    WHERE id = p_invite_id;

    SELECT json_build_object('success', true) INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    SELECT json_build_object('success', false, 'error', SQLERRM) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Add event updates to Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'calendar_event_invites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_event_invites;
  END IF;
END;
$$;
