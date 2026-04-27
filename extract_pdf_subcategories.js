const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEYS.split(',')[2];
const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

async function extractSubcategories() {
  try {
    const tmpPath = "C:/Users/flore/.gemini/antigravity/scratch/roco4x4_app/web/public/tmp_OME.pdf";
    console.log("1. Downloading PDF from Supabase...");
    const res = await fetch("https://ijtkbisxyoondehvcqza.supabase.co/storage/v1/object/public/roco-assets/OME_Catalogue.pdf");
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(tmpPath, Buffer.from(buffer));
    console.log("Download complete: " + tmpPath);

    console.log("2. Uploading PDF to Gemini Key[2]...");
    const uploadResult = await fileManager.uploadFile(tmpPath, {
        mimeType: "application/pdf",
        displayName: "OME Extended Extract",
    });
    console.log("Upload complete URI:", uploadResult.file.uri);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `Read the entire PDF Application Catalogue. Extract the detailed Table of Contents or Application Index for supported vehicles. 
    You must output ONLY a valid, strict JSON array representing the exact brands, models, AND specific GENERATIONS/YEARS listed inside the catalogue under each model.
    Format example:
    [
      { "brand": "Toyota", "models": [{ "name": "Hilux", "years": ["2015-Onwards", "2005-2015", "Pre-2005"] }] }
    ]
    Include the exact string headers for generations/years found in the catalogue. Limit brands to Toyota, Ford, Nissan, Holden/Isuzu, Jeep, Mitsubishi, Land Rover, Suzuki, GWM, Volkswagen.
    Do not supply any other text, markdown, or backticks. Output absolute valid JSON only starting with [ and ending with ].`;

    console.log("3. Executing Neural Parse...");
    const parts = [
      { fileData: { mimeType: "application/pdf", fileUri: uploadResult.file.uri } },
      { text: prompt }
    ];
    const result = await model.generateContent(parts);
    console.log("\n--- RESULT ---");
    console.log(result.response.text());
  } catch (err) {
    console.error("FATAL:", err);
  }
}
extractSubcategories();
