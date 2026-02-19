
import { createClient } from '@supabase/supabase-js';

// Replaced with actual values
const SUPABASE_URL = 'https://lntphzphyqnscdxyauzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudHBoenBoeXFuc2NkeHlhdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzkzMzksImV4cCI6MjA4MjQ1NTMzOX0.3yCGZx-Wjoqv-FNHaEnlxdFpjjnSl9ynGZzG70yD-Fw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySettingsFallback() {
    console.log('--- Verifying Settings Fetch ---');
    // Simulate what the service does: fetch *
    try {
        const { data, error } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('id', 'global_config')
            .single();

        if (error) {
            console.log('Main fetch failed (expected if data is huge/corrupt). Simulating fallback...');
            // Fallback simulation
            const [brandingReq, documentReq, uiReq] = await Promise.all([
                supabase.from('organization_settings').select('branding').eq('id', 'global_config').single(),
                supabase.from('organization_settings').select('document_config').eq('id', 'global_config').single(),
                supabase.from('organization_settings').select('ui_config').eq('id', 'global_config').single()
            ]);

            console.log('Fallback Branding:', brandingReq.data ? 'Success' : 'Failed');
            console.log('Fallback Document:', documentReq.data ? 'Success' : 'Failed');
            console.log('Fallback UI:', uiReq.data ? 'Success' : 'Failed');

        } else {
            console.log('Main fetch SUCCEEDED. The issue might be intermittent or resolved.');
            console.log(`Payload size: ${JSON.stringify(data).length}`);
        }
    } catch (e) {
        console.error('Exception during settings verify:', e);
    }
}

async function verifyVehiclesChunking() {
    console.log('\n--- Verifying Vehicles Chunking ---');
    // Simulate chunked fetch
    try {
        const CHUNK_SIZE = 50;
        let allVehicles: any[] = [];
        let from = 0;
        let to = CHUNK_SIZE - 1;
        let keepFetching = true;

        console.log(`Starting fetch with chunk size ${CHUNK_SIZE}...`);

        while (keepFetching) {
            console.log(`Fetching range ${from}-${to}...`);
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .range(from, to);

            if (error) {
                console.error(`Error fetching chunk ${from}-${to}:`, error.message);
                break;
            }

            if (data) {
                allVehicles = [...allVehicles, ...data];
                console.log(`Received ${data.length} items.`);
                if (data.length < CHUNK_SIZE) {
                    keepFetching = false;
                } else {
                    from += CHUNK_SIZE;
                    to += CHUNK_SIZE;
                }
            } else {
                keepFetching = false;
            }
            if (from > 200) { // Limit for test
                console.log('Stopping test at 200 items.');
                break;
            }
        }
        console.log(`Total vehicles fetched: ${allVehicles.length}`);
    } catch (e) {
        console.error('Exception during vehicle verify:', e);
    }
}

(async () => {
    await verifySettingsFallback();
    await verifyVehiclesChunking();
})();
