// Remplacement temporaire pour ignorer la limite d'heure
const originalGetHours = Date.prototype.getHours;
Date.prototype.getHours = function() {
    return 22; // Simule qu'il est 22h00 pour que le scraper tourne de jour
};

// Éviter de crasher si le serveur normal est lancé sur le port 5000
process.env.PORT = '5001';

async function run() {
    const { runNightScrapingJob } = await import('./services/nightScraper.js');
    console.log('--- TEST MANUEL DU SCRAPER ---');
    console.log('Simulation de 22h00 pour contourner la sécurité jour/nuit.');

    try {
        await runNightScrapingJob();
        console.log('--- TEST TERMINÉ ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
