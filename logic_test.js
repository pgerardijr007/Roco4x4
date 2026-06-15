const fs = require('fs');

async function test() {
   try {
       // 1. Fetch real AI response
       const res = await fetch('https://web-gold-nu-92.vercel.app/api/chat', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ message: "Provide a full structural parts list for exactly the 2015-Onwards Toyota Hilux. You must preserve category headers." })
       });
       const data = await res.json();
       const replyText = data.reply || data.error || data;
       
       // 2. Fetch real database local copy
       const dbRes = await fetch('https://ijtkbisxyoondehvcqza.supabase.co/storage/v1/object/public/roco-assets/master_database.json');
       const database = await dbRes.json();
       
       let catMap = {};
       let currentHeader = 'General Information';

       const lines = replyText.split('\n');
       lines.forEach((line) => {
          if (line.match(/^###?\s+(.*)/)) {
             currentHeader = line.replace(/^###?\s+/, '').replace(/\*\*/g, '').trim();
          } else {
             const rawTags = line.match(/\[\[PART:(.*?)\]\]/g);
             if (rawTags) {
                 rawTags.forEach((tag) => {
                     const pNum = tag.replace(/\[\[PART:|\]\]/g, '').trim().toUpperCase();
                     const dbItem = database.find(p => String(p['Unnamed: 0']).toUpperCase() === pNum && pNum.length > 1);
                     if (dbItem) {
                         if (!catMap[currentHeader]) catMap[currentHeader] = [];
                         if (!catMap[currentHeader].find(i => String(i['Unnamed: 0']) === pNum)) {
                            catMap[currentHeader].push(dbItem);
                         }
                     }
                 });
             } else if (line.includes('|') && !line.includes('---')) {
                 const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
                 cells.forEach(cell => {
                     const exactDbMatch = database.find(p => String(p['Unnamed: 0']).toUpperCase() === cell.toUpperCase() && cell.length > 2);
                     if (exactDbMatch) {
                         if (!catMap[currentHeader]) catMap[currentHeader] = [];
                         if (!catMap[currentHeader].find(i => String(i['Unnamed: 0']) === String(exactDbMatch['Unnamed: 0']))) {
                             catMap[currentHeader].push(exactDbMatch);
                         }
                     }
                 });
             }
          }
      });
      console.log("\nPARTS FOUND:");
      Object.keys(catMap).forEach(cat => {
          console.log(`\n--- ${cat} ---`);
          catMap[cat].forEach(p => console.log(p['Unnamed: 0'], "->", p['Unnamed: 1']));
      });
   } catch(e) {
       console.log("Error:", e);
   }
}
test();
