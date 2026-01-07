-- Run this query to see how the 'profiles' table is defined
-- ensuring we find what is blocking the update

SELECT 
    column_name, 
    data_type, 
    udt_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'permissions';

-- List all constraints (Check constraints usually block new values)
SELECT 
    conname as constraint_name, 
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'profiles';
