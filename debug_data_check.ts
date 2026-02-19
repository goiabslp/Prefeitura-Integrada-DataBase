
import { createClient } from '@supabase/supabase-js';

// Replaced with actual values from .env (to be filled after reading)
const SUPABASE_URL = 'https://lntphzphyqnscdxyauzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudHBoenBoeXFuc2NkeHlhdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NzkzMzksImV4cCI6MjA4MjQ1NTMzOX0.3yCGZx-Wjoqv-FNHaEnlxdFpjjnSl9ynGZzG70yD-Fw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSettings() {
    console.log('--- Checking Organization Settings (Full Fetch) ---');
    try {
        const { data, error } = await supabase
            .from('organization_settings')
            .select('*')
            .eq('id', 'global_config')
            .single();

        if (error) {
            console.error('Error fetching settings (full):', error.message);
        } else {
            console.log(`Total Settings Size: ${JSON.stringify(data).length}`);
            if (data.branding) console.log(`Branding Size: ${JSON.stringify(data.branding).length}`);
            if (data.document_config) console.log(`Document Config Size: ${JSON.stringify(data.document_config).length}`);
            if (data.ui_config) console.log(`UI Config Size: ${JSON.stringify(data.ui_config).length}`);
        }
    } catch (err) {
        console.error('Exception in checkSettings:', err);
    }
}

async function checkVehicles() {
    console.log('\n--- Checking Vehicles (Full Fetch) ---');
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .limit(1000);

        if (error) {
            console.error('Error fetching vehicles (full):', error.message);
        } else {
            const totalSize = JSON.stringify(data).length;
            console.log(`Success fetching ${data.length} vehicles. Total Size: ${totalSize}`);

            // Check for any single huge vehicle
            let maxVehicleSize = 0;
            let maxVehicleId = '';
            for (const v of data) {
                const vSize = JSON.stringify(v).length;
                if (vSize > maxVehicleSize) {
                    maxVehicleSize = vSize;
                    maxVehicleId = v.id;
                }
            }
            console.log(`Max Vehicle Size: ${maxVehicleSize} (ID: ${maxVehicleId})`);
        }
    } catch (err) {
        console.error('Exception in checkVehicles:', err);
    }
}

(async () => {
    await checkSettings();
    await checkVehicles();
})();
