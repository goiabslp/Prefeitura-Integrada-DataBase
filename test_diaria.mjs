import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase
        .from('service_requests')
        .select('protocol, document_snapshot, requested_value, requester_role, distance_km, authorized_by, description_reason')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(JSON.stringify(data[0], null, 2));
}

run();
