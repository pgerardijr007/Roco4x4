const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

async function extractIndex() {
  try {
    console.log("Uploading PDF to Gemini...");
    const targetPdf = "C:/Users/flore/Downloads/OME Application Catalogue 66 December 2025.pdf";
    const uploadResult = await fileManager.uploadFile(targetPdf, {
        mimeType: "application/pdf",
        displayName: "OME Extract",
    });
    
    console.log("PDF Uploaded. URI:", uploadResult.file.uri);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    const prompt = `Read the entire PDF Application Catalogue. Extract the Table of Contents or Application Index for supported vehicles. 
    You must output ONLY a valid, strict JSON array representing the exact brands and main models listed inside the catalogue. 
    Format example:
    [
      { "brand": "Toyota", "models": ["Hilux", "Land Cruiser 70", "4Runner"] }
    ]
    Do not invent or add generic models. Only include exactly what is found in the catalogue. Limit models to the major sub-categories to avoid an excessively large array.
    Do not supply any other text, markdown, or backticks. Output valid JSON only.`;

    const parts = [
      { fileData: { mimeType: "application/pdf", fileUri: uploadResult.file.uri } },
      { text: prompt }
    ];

    console.log("Analyzing 325-page PDF for Exact Index...");
    const result = await model.generateContent(parts);
    console.log("\n--- RESULT ---");
    console.log(result.response.text());
    
  } catch (err) {
    console.error("Extraction failed:", err);
  }
}
extractIndex();
