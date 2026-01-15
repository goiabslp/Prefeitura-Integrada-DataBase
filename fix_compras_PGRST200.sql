-- FIX: Comprehensive Fix for PGRST200 (Missing Relationship) & RLS
-- Run this script to force-enable the relationship between Purchase Orders and Profiles.

BEGIN;

-------------------------------------------------------------------------------
-- 1. FORCE RE-CREATE FOREIGN KEY
-------------------------------------------------------------------------------
-- Drop if exists (to ensure clean slate)
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_user_id_fkey;

-- Re-create
ALTER TABLE public.purchase_orders
ADD CONSTRAINT purchase_orders_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Comment for PostgREST (Optional but helpful)
COMMENT ON CONSTRAINT purchase_orders_user_id_fkey ON public.purchase_orders IS 'Link purchase order to the user profile.';

-------------------------------------------------------------------------------
-- 2. FIX RLS ON PROFILES (Crucial for Joins)
-------------------------------------------------------------------------------
-- If RLS on profiles is too strict, the join returns NULL or 400.
-- We ensure authenticated users can read ALL profiles (needed for sector display).

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop restricting policies (if any collide)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create Permissive Read Policy for Authenticated
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
FOR SELECT TO authenticated
USING (true);

-------------------------------------------------------------------------------
-- 3. GRANT PERMISSIONS (Just in Case)
-------------------------------------------------------------------------------
GRANT REFERENCES ON public.profiles TO authenticated;
GRANT REFERENCES ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;

COMMIT;

-- 4. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload config';
