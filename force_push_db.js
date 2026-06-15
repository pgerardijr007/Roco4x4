const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function pushDatabase() {
    try {
        console.log("Loading local master database payload...");
        const path = 'public/master_database.json';
        const rawJsonText = fs.readFileSync(path, 'utf8');

        console.log("Initializing Secure Supabase Admin Uplink...");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        console.log(`Pushing ${rawJsonText.length} bytes to [roco-assets] bucket...`);
        
        // Supabase-js natively supports Buffer uploads in Node.js instead of Blob
        const fileBuffer = Buffer.from(rawJsonText, 'utf8');

        const { data, error } = await supabaseAdmin
            .storage
            .from('roco-assets')
            .upload('master_database.json', fileBuffer, { 
                upsert: true, 
                contentType: 'application/json' 
            });

        if (error) {
            throw new Error(`Upload rejected: ${error.message}`);
        }

        console.log("SUCCESS! Database securely vaulted in Cloud Drive:", data);
    } catch (err) {
        console.error("FATAL ERROR:", err);
    }
}
pushDatabase();
