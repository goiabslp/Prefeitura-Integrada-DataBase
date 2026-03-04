const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase
        .from('service_requests')
        .select('id, document_snapshot')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) console.error(error);
    else console.log(JSON.stringify(data[0].document_snapshot.content, null, 2));
}

run();
