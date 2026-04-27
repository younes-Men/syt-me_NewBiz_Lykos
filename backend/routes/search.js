import express from 'express';
import { SireneClient } from '../services/sirene.js';
import { generatePappersUrl, generatePagesjaunesUrl, generateOpcoUrl } from '../utils/urlGenerators.js';

const router = express.Router();

/**
 * Route de recherche d'entreprises par secteur et zone
 */
router.post('/', async (req, res) => {
  try {
    const { secteur, departement } = req.body;
    const secteurTrimmed = (secteur || '').trim();
    const zone = (departement || '').trim();

    if (!secteurTrimmed || !zone) {
      return res.status(400).json({ error: 'Veuillez remplir les champs Secteur et Département ou code postal.' });
    }

    const isZoneValid = /^\d{2}$/.test(zone) || /^\d{5}$/.test(zone);
    if (!isZoneValid) {
      return res.status(400).json({ error: 'Veuillez saisir soit un numéro de département (2 chiffres), soit un code postal (5 chiffres).' });
    }

    const client = new SireneClient(process.env.SIRENE_API_KEY);
    const results = await client.searchBySecteurAndDepartement(secteurTrimmed, zone);

    const enrichedResults = results.map(ent => ({
      ...ent,
      pappers_url: generatePappersUrl(ent.siren),
      pagesjaunes_url: generatePagesjaunesUrl(ent.nom, ent.adresse),
      opco_url: generateOpcoUrl(ent.siret)
    }));

    res.json({ success: true, count: enrichedResults.length, results: enrichedResults });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ error: `Erreur lors de la recherche : ${error.message}` });
  }
});

/**
 * Route pour rechercher par SIRET
 */
router.post('/siret', async (req, res) => {
  try {
    const { siret } = req.body;
    const siretTrimmed = (siret || '').trim();

    if (!siretTrimmed || !/^\d{14}$/.test(siretTrimmed)) {
      return res.status(400).json({ error: 'Veuillez saisir un numéro SIRET valide (14 chiffres).' });
    }

    const client = new SireneClient(process.env.SIRENE_API_KEY);
    const results = await client.searchBySiret(siretTrimmed);

    const enrichedResults = results.map(ent => ({
      ...ent,
      pappers_url: generatePappersUrl(ent.siren),
      pagesjaunes_url: generatePagesjaunesUrl(ent.nom, ent.adresse),
      opco_url: generateOpcoUrl(ent.siret)
    }));

    res.json({ success: true, count: enrichedResults.length, results: enrichedResults });
  } catch (error) {
    console.error('Erreur lors de la recherche par SIRET:', error);
    res.status(500).json({ error: `Erreur lors de la recherche : ${error.message}` });
  }
});

export { router as searchCompanies };
