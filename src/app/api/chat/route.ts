import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';

// Global runtime cache to handle hot-reloaded URI injection
let runtimeUriCache: string | null = process.env.GEMINI_PDF_URI || null;

export async function POST(req: Request) {
  try {
    const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (!keysStr || keysStr.includes('paste_your_key_here')) {
      return NextResponse.json({ 
        error: "Missing API Keys. Please configure GEMINI_API_KEYS in .env.local."
      }, { status: 401 });
    }

    const { message } = await req.json();

    const systemPrompt = `You are a professional, highly-skilled technical assistant for Roco 4x4, an off-road vehicles parts brand.
Your goal is to converse with the user and help retrieve items.
The user has provided you with a large technical Application Catalogue (PDF). If the user asks about vehicle fitment (e.g. "show me parts for 4 runner"), you MUST read the PDF to find the answer.
IMPORTANT INSTRUCTION: The user wants you to output your response formatted structurally exactly like the OME Catalogue PDF tables.
Group items by "Front Suspension", "Rear Suspension", "Accessories", etc., using Markdown headers and lists.
CRITICAL: You MUST securely wrap every single Part Number you reference in double brackets like this: [[PART:PartNumberHere]] (e.g., [[PART:2812030]]).

CRITICAL PDF HALLUCINATION PREVENTION:
1. The PDF is a massive visual table. AI models frequently confuse visually adjacent tables (e.g. accidentally grabbing Nissan or Isuzu parts when asked for Toyota).
2. You must ONLY output a [[PART]] if you are 100% MATHEMATICALLY CERTAIN it belongs vertically and horizontally to the EXACT vehicle requested.
3. If the user asks a dangerously broad question like "show me all toyota parts", POLITELY REFUSE. Tell them the catalogue is too massive and ask them to specify a precise Model and Year (e.g. "2015-2023 Toyota Hilux").
4. Never guess part numbers. Strict accuracy is paramount.`;

    const apiKeys = keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    let content = '';
    let lastError: any = null;
    let fallbackSuccess = false;

    // Phase 13: Continuous API Key Shifting Fallback Sequence
    for (let i = 0; i < apiKeys.length; i++) {
        const currentKey = apiKeys[i];
        const genAI = new GoogleGenerativeAI(currentKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const prompt = `${systemPrompt}\n\nUser Message: ${message}`;
        
        let parts: any[] = [];
        if (runtimeUriCache) {
            parts.push({
                fileData: { mimeType: "application/pdf", fileUri: runtimeUriCache }
            });
        }
        parts.push({ text: prompt });
        
        try {
            // Attempt primary associative generation loop
            const result = await model.generateContent(parts);
            content = result.response.text();
            fallbackSuccess = true;
            break; // Valid Generation Output -> Break Loop Exfil
        } catch (apiError: any) {
            const errString = String(apiError.message || apiError);
            
            // Branch A: Quota Exhaustion -> Discard logic and shift to subsequent keys natively via continued loop
            if (errString.includes('429')) {
                console.warn(`[Drive Loop] API Key Index [${i}] exhausted (429). Shifting parameter logic to Key [${i+1}]...`);
                lastError = apiError;
                continue; // Skip the Catch Phase -> Reruns using next key mathematically!
            }
            
            // Branch B: Permission or File API Timeout -> File URIs do not cross accounts! Cross-Account Healer Sequence Required!
            if (errString.includes('400') || errString.includes('403') || errString.includes('404') || errString.includes('not exist') || errString.includes('fileUri')) {
                console.warn(`[Drive Loop] Index [${i}] threw File URI restriction. Triggering Supabase Cloud Healer override...`);
                
                const fileManager = new GoogleAIFileManager(currentKey);
                
                // Fetch the master asset out of Supabase to physically bypass local limits natively 
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijtkbisxyoondehvcqza.supabase.co';
                const supabasePdfUrl = `${supabaseUrl}/storage/v1/object/public/roco-assets/OME_Catalogue.pdf`;
                const tmpPath = "/tmp/ome_catalogue.pdf";
                
                const pdfRes = await fetch(supabasePdfUrl);
                if(!pdfRes.ok) throw new Error("Could not download PDF from Supabase! Is it missing from 'roco-assets'?");
                
                const buffer = await pdfRes.arrayBuffer();
                fs.writeFileSync(tmpPath, Buffer.from(buffer));
                
                if (fs.existsSync(tmpPath)) {
                  const uploadResult = await fileManager.uploadFile(tmpPath, {
                      mimeType: "application/pdf",
                      displayName: `OME Application Catalogue 2025 (Cloud Node - Key ${i})`,
                  });
                  console.log(`Auto-Recovery Successful on Key [${i}]. New Semantic URI: ${uploadResult.file.uri}`);
                  
                  // Re-cache for future node execution hits
                  runtimeUriCache = uploadResult.file.uri;
                  
                  if (parts[0].fileData) {
                      parts[0].fileData.fileUri = runtimeUriCache;
                  } else {
                      parts.unshift({ fileData: { mimeType: "application/pdf", fileUri: runtimeUriCache } });
                  }
                  
                  // Secondary attempt generated native to the valid key
                  const result = await model.generateContent(parts);
                  content = result.response.text();
                  fallbackSuccess = true;
                  break; 
                } else {
                  throw new Error("Cloud Temp File Write failed during Auto-Recovery attempt.");
                }
            }
            
            throw apiError;
        }
    }
    
    if (!fallbackSuccess) {
       throw new Error(`All ${apiKeys.length} API keys structurally exhausted. Please add a fresh key to the array. Last Error: ${lastError?.message || lastError}`);
    }

    return NextResponse.json({ reply: content });
    
  } catch (error: any) {
    console.error("AI Route Drive Engine Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
