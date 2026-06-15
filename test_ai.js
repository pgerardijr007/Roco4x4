async function test() {
   try {
       const res = await fetch('https://web-gold-nu-92.vercel.app/api/chat', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ message: "Provide a full structural parts list for exactly the 2015-Onwards Toyota Hilux. You must preserve category headers." })
       });
       const data = await res.json();
       console.log("Raw Response Status:", res.status);
       console.log("------------------------");
       console.log(data.reply || data.error || data);
   } catch(e) {
       console.log("Error:", e);
   }
}
test();
