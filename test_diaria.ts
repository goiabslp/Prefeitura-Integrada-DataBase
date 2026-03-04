import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_name', 'Guilherme') // just finding one
        .order('created_at', { ascending: false })
        .limit(2);

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Result:', JSON.stringify(data[0].document_snapshot, null, 2));
    } else {
        console.log('No data found');
    }
}

run();
