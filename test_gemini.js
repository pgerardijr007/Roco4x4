const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const key = envFile.split('=')[1].trim();

async function run() {
  const req = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await req.json();
  if (data.models) {
    console.log("AVAILABLE MODELS:", data.models.map(m => m.name));
  } else {
    console.log("ERROR or NO MODELS:", data);
  }
}
run();
