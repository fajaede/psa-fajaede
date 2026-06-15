/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { MeiliSearch } = require('meilisearch');
const fs = require('fs');

// Koppel hier jouw eigen Hetzner VPS
const client = new MeiliSearch({
  host: 'http://116.203.39.166:7700', 
  apiKey: 'JOUW_MOEILIJKE_WACHTWOORD', // De MEILI_MASTER_KEY uit stap 2
});

async function runImport() {
  try {
    console.log("⏳ Verbinden met Hetzner Meilisearch...");
    
    // We maken een 'index' (database tabel) aan genaamd 'websites'
    const index = client.index('websites');
    
    // Optioneel: Vertel Meilisearch op welke velden mensen mogen zoeken en filteren
    await index.updateFilterableAttributes(['trustScore', 'isWebshop', 'privacyScore', 'ageScore']);
    await index.updateSearchableAttributes(['url', 'pageTitle', 'criticalIssues']);
    
    console.log("✅ Index geconfigureerd! Data inladen...");

    // --- JOUW DATA ---
    // Hier lees je de JSON data uit die je hebt gecrawld. 
    // (Pas het pad aan naar waar jouw 110GB aan bestanden staan, bijvoorbeeld een gedownloade map)
    // Voorbeeld:
    /*
    const rawData = fs.readFileSync('./data/mijn_250k_crawls.json', 'utf-8');
    const documents = JSON.parse(rawData);
    */
   
    // TEST DATA (om te testen of het werkt):
    const documents = [
      { id: "1", url: "https://nos.nl", trustScore: 85, pageTitle: "Nieuws", criticalIssues: ["No H1"] },
      { id: "2", url: "https://fajaede.nl", trustScore: 100, pageTitle: "AI SEO", criticalIssues: [] },
    ];
    // -----------------

    console.log(`🚀 Start met het uploaden van ${documents.length} websites in batches...`);
    
    // Meilisearch verwerkt dit in batches, ideaal voor 250.000 rijen!
    const task = await index.addDocuments(documents);
    
    console.log(`✅ Upload succesvol verstuurd naar de VPS! Task ID: ${task.taskUid}`);
    console.log("De zoekmachine is de data nu aan het indexeren in het werkgeheugen.");
  } catch (error) {
    console.error("❌ Er ging iets mis:", error);
  }
}

runImport();