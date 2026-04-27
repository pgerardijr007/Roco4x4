import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const rawJsonText = await req.text();
    
    if (!rawJsonText || rawJsonText.length < 50) {
      return NextResponse.json({ error: "Invalid database structure sent to server." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijtkbisxyoondehvcqza.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) throw new Error("CRITICAL: Server lacks Supabase Service Role Key");

    // Secure Backend Client (Bypasses RLS limits)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const fileBlob = new Blob([rawJsonText], { type: 'application/json' });
    
    const { error } = await supabaseAdmin
        .storage
        .from('roco-assets')
        .upload('master_database.json', fileBlob, { upsert: true, contentType: 'application/json' });

    if (error) throw new Error(`Supabase Admin Upsert Denied: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
