-- Lets test if we can simply update the permissions directly
-- Replace 'user_guilherme' with the ID of your admin user if different (check the profiles table if unsure)

UPDATE profiles 
SET permissions = array_append(permissions, 'parent_agricultura')
WHERE role = 'admin' AND NOT (permissions @> ARRAY['parent_agricultura']);

UPDATE profiles 
SET permissions = array_append(permissions, 'parent_obras')
WHERE role = 'admin' AND NOT (permissions @> ARRAY['parent_obras']);

-- Check the result
SELECT username, permissions FROM profiles WHERE role = 'admin';
