import { SireneClient } from './services/sirene.js';

const client = new SireneClient();

const testData = [
    {
        siren: '111111111',
        siret: '11111111100011',
        uniteLegale: {
            activitePrincipaleUniteLegale: '47.11C',
            trancheEffectifsUniteLegale: 'NN', // Effectif 0
            etatAdministratifUniteLegale: 'A'
        },
        etablissementSiege: true,
        etatAdministratifEtablissement: 'A'
    },
    {
        siren: '444444444',
        siret: '44444444400011',
        uniteLegale: {
            activitePrincipaleUniteLegale: '47.11B', // Previously allowed, now should be filtered
            trancheEffectifsUniteLegale: 'NN', // Effectif 0
            etatAdministratifUniteLegale: 'A'
        },
        etablissementSiege: true,
        etatAdministratifEtablissement: 'A'
    }
];

async function runTest() {
    console.log('Running restricted filtering tests (only 4711C)...');
    const results = await client._parseResults(testData);

    console.log('\nResults:');
    results.forEach(r => {
        console.log(`- ${r.nom || 'Company'} (${r.secteur}): effectif=${r.effectif}`);
    });

    const has11C = results.some(r => r.secteur === '47.11C');
    const has11B = results.some(r => r.secteur === '47.11B');

    console.log('\nVerification:');
    console.log(`- 47.11C with effectif 0 shown: ${has11C ? '✅' : '❌'}`);
    console.log(`- 47.11B with effectif 0 filtered out: ${!has11B ? '✅' : '❌'}`);

    if (has11C && !has11B) {
        console.log('\nSUCCESS: Restricted filtering logic works as expected!');
        process.exit(0);
    } else {
        console.log('\nFAILURE: Filtering logic does not match restricted requirements.');
        process.exit(1);
    }
}

runTest();
