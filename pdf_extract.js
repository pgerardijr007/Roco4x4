const fs = require('fs');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function extractText() {
    console.log("Reading Local PDF file via Parser...");
    let dataBuffer = fs.readFileSync('public/tmp_OME.pdf');
    
    // We only need the index/TOC pages, usually pages 5 to 20
    let options = {
        max: 25 // max 25 pages
    };

    const data = await pdf(dataBuffer, options);
    const extractedText = data.text;
    
    console.log("Text length:", extractedText.length);
    console.log("Analyzing text with Gemini...");

    const API_KEY = process.env.GEMINI_API_KEYS.split(',')[2];
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    const prompt = `Read the following extracted text from an Application Catalogue Index. 
    You must output ONLY a valid, strict JSON array representing the exact brands, models, AND specific GENERATIONS/YEARS listed inside the index under each model.
    Format example:
    [
      { "brand": "Toyota", "models": [{ "name": "Hilux", "years": ["2015-Onwards", "2005-2015", "Pre-2005"] }] }
    ]
    Include the exact string headers for generations/years found in the text. Limit brands to Toyota, Ford, Nissan, Holden/Isuzu, Jeep, Mitsubishi, Land Rover, Suzuki, GWM, Volkswagen.
    Do not supply any other text, markdown, or backticks. Output absolute valid JSON only starting with [ and ending with ].

    TEXT:
    ${extractedText.substring(0, 100000)}
    `;

    const result = await model.generateContent(prompt);
    console.log("\n--- RESULT ---");
    console.log(result.response.text());
}
extractText();
