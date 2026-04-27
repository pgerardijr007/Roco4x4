const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require('fs');

async function run() {
    try {
        const envFile = fs.readFileSync('.env.local', 'utf8');
        const keyMatch = envFile.match(/GEMINI_API_KEY=(.*)/);
        if (!keyMatch) throw new Error("No GEMINI_API_KEY found in .env.local");
        
        const key = keyMatch[1].trim();
        const fileManager = new GoogleAIFileManager(key);
        
        const targetPdf = "C:/Users/flore/Downloads/OME Application Catalogue 66 December 2025.pdf";
        if (!fs.existsSync(targetPdf)) {
            throw new Error("Cannot find PDF at " + targetPdf);
        }

        console.log("Found PDF. Initiating secure cloud upload to Gemini API...");
        const uploadResult = await fileManager.uploadFile(targetPdf, {
            mimeType: "application/pdf",
            displayName: "OME Application Catalogue 2025",
        });

        console.log(`Upload successful! Cloud URI: ${uploadResult.file.uri}`);
        
        // Remove existing if any
        let newEnv = envFile.replace(/\nGEMINI_PDF_URI=.*/g, '');
        newEnv += `\nGEMINI_PDF_URI=${uploadResult.file.uri}\n`;
        
        fs.writeFileSync('.env.local', newEnv, 'utf8');
        console.log("Successfully securely injected URI into .env.local");
        
    } catch (e) {
        console.error("Upload Error:", e);
    }
}
run();
