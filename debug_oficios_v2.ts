
import { createClient } from '@supabase/supabase-js';

// Using hardcoded keys for testing since dotenv is not available in this environment context
const SUPABASE_URL = 'https://lntphzphyqnscdxyauzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudHBoenBoeXFuc2NkeHlhdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzkzMzksImV4cCI6MjA4MjQ1NTMzOX0.3yCGZx-Wjoqv-FNHaEnlxdFpjjnSl9ynGZzG70yD-Fw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkOficios() {
    console.log('Fetching Oficios...');
    // We select only minimal fields to check if data is accessible
    const { data: rawData, error } = await supabase
        .from('oficios')
        .select('id, protocol, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching from DB:', error);
        return;
    }

    if (!rawData || rawData.length === 0) {
        console.log('No Oficios found in DB (Check RLS policies if you expect data).');
        return;
    }

    console.log('--- DB Data Check ---');
    rawData.forEach((item, index) => {
        console.log(`[${index}] ID: ${item.id}`);
        console.log(`      Protocol (DB): "${item.protocol}"`);
        console.log(`      Title: "${item.title}"`);
    });
}

checkOficios();
