-- Remove CHECK constraint on vehicles.oil_calculation_base
-- This allows 500, 1000, 2000, 3000 and any other integer value to be saved.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find any CHECK constraint on the 'vehicles' table that involves 'oil_calculation_base'
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.vehicles'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%oil_calculation_base%'
    ) LOOP
        -- Drop the constraint
        RAISE NOTICE 'Dropping constraint: %', r.conname;
        EXECUTE 'ALTER TABLE public.vehicles DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;
