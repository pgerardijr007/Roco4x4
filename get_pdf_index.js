const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEYS.split(',')[2];
const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

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
    
    const prompt = `Read the entire PDF Application Catalogue. Extract the detailed Table of Contents or Application Index for supported vehicles. 
    You must output ONLY a valid, strict JSON array representing the exact brands, models, AND specific GENERATIONS/YEARS listed inside the catalogue under each model.
    Format example:
    [
      { "brand": "Toyota", "models": [{ "name": "Hilux", "years": ["2015-Onwards", "2005-2015"] }] }
    ]
    Include the exact string headers for generations/years found in the catalogue. 
    Do not supply any other text, markdown, or backticks. Output absolute valid JSON only starting with [ and ending with ].`;

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
