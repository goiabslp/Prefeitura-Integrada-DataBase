-- Add Calendar module access control and permissions
-- Run this script in your Supabase SQL Editor

-- 1. Ensure the parent_calendario exists in the app_permission enum
-- This is used for the "permissions" column in the profiles table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_permission') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'app_permission'::regtype AND enumlabel = 'parent_calendario') THEN
            ALTER TYPE app_permission ADD VALUE 'parent_calendario';
        END IF;
    END IF;
END
$$;

-- 2. Add the Calendar module to global_module_settings
-- This allows the module to be toggled globally in the "Controle de Acesso" module
INSERT INTO public.global_module_settings (module_key, label, is_enabled, parent_key, order_index, description)
VALUES ('parent_calendario', 'Calendário', true, NULL, 55, 'Módulo de Agenda e Eventos')
ON CONFLICT (module_key) DO UPDATE 
SET label = EXCLUDED.label, 
    description = EXCLUDED.description;

-- 3. Automatically grant this permission to all current admins
UPDATE public.profiles
SET permissions = array_append(permissions, 'parent_calendario')
WHERE role = 'admin' AND NOT ('parent_calendario' = ANY(permissions));

-- 4. Backend Validation: Update RLS policies for calendar_events
-- Only users with the permission (or admins) can view events
DROP POLICY IF EXISTS "Enable read access for all users" ON public.calendar_events;
CREATE POLICY "Enable read access for all users" ON public.calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() 
            AND ('parent_calendario' = ANY(permissions) OR role = 'admin')
        )
    );
