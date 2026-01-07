-- Create new permissions for Agriculture and Obras modules
-- Run this in your Supabase SQL Editor

-- Method 1: If using an ENUM type (Most probable)
ALTER TYPE app_permission ADD VALUE 'parent_agricultura';
ALTER TYPE app_permission ADD VALUE 'parent_obras';

-- Method 2: If using a CHECK constraint on text[]
-- You would need to drop and re-add the constraint, e.g.:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_permissions_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_permissions_check CHECK (permissions <@ ARRAY['parent_create_oficio', ... 'parent_agricultura', 'parent_obras']::text[]);

-- Verify the update
SELECT * FROM pg_enum WHERE enumtypid = 'app_permission'::regtype;
