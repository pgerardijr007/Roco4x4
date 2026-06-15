async function test() {
   try {
       console.log("Pinging Vercel API endpoint for Hilux query...");
       const res = await fetch('https://web-gold-nu-92.vercel.app/api/chat', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ message: "Provide a full structural parts list for exactly the 2015-Onwards Toyota Hilux. You must preserve category headers." })
       });
       
       console.log("Status:", res.status);
       
       const data = await res.json();
       if (data.error) {
           console.log("API returned explicit ERROR:");
           console.log(data.error);
           return;
       }
       
       const replyText = data.reply || "";
       console.log("API returned successful text block of length:", replyText.length);
       console.log("Preview:\n", replyText.substring(0, 500), "...");
       
   } catch(e) {
       console.log("Fatal Fetch Error:", e);
   }
}
test();
