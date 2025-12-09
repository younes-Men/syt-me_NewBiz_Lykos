import express from 'express';
import { SireneClient } from '../services/sirene.js';

const router = express.Router();

// Générer URL Pappers
function generatePappersUrl(siren) {
  if (!siren || siren.length < 9) {
    return '';
  }
  return `https://www.pappers.fr/recherche?q=${siren}`;
}

// Générer URL PagesJaunes
function generatePagesjaunesUrl(nom, adresse) {
  if (!nom) return '';
  
  const codePostalMatch = adresse ? adresse.match(/\b(\d{5})\b/) : null;
  const codePostal = codePostalMatch ? codePostalMatch[1] : '';
  
  if (!codePostal) return '';
  
  const encodedNom = encodeURIComponent(nom.trim());
  return `https://www.pagesjaunes.fr/recherche/${codePostal}/${encodedNom}`;
}

// Générer URL OPCO
function generateOpcoUrl(siret) {
  if (!siret) return '';
  const siretStr = String(siret).trim();
  if (!/^\d{14}$/.test(siretStr)) return '';
  return `https://quel-est-mon-opco.francecompetences.fr/?siret=${siretStr}`;
}

router.post('/', async (req, res) => {
  try {
    const { secteur, departement } = req.body;
    
    const secteurTrimmed = (secteur || '').trim();
    const zone = (departement || '').trim();

    if (!secteurTrimmed || !zone) {
      return res.status(400).json({
        error: 'Veuillez remplir les champs Secteur et Département ou code postal.'
      });
    }

    // Vérifier que la zone est soit un département (2 chiffres), soit un code postal (5 chiffres)
    const isDepartement = /^\d{2}$/.test(zone);
    const isCodePostal = /^\d{5}$/.test(zone);

    if (!isDepartement && !isCodePostal) {
      return res.status(400).json({
        error: 'Veuillez saisir soit un numéro de département (2 chiffres), soit un code postal (5 chiffres).'
      });
    }
    
    const apiKey = process.env.SIRENE_API_KEY;
    const client = new SireneClient(apiKey);
    
    // Lancer la recherche avec une limite très élevée pour récupérer le maximum d'entreprises
    // Le filtrage (entreprise Actif ET établissement Actif) est déjà fait dans _parseResults
    const results = await client.searchBySecteurAndDepartement(
      secteurTrimmed,
      zone,
      50000 // Limite très élevée pour récupérer le maximum possible
    );
    
    // Ajouter les liens Pappers, PagesJaunes et OPCO
    const enrichedResults = results.map(ent => ({
      ...ent,
      pappers_url: generatePappersUrl(ent.siren),
      pagesjaunes_url: generatePagesjaunesUrl(ent.nom, ent.adresse),
      opco_url: generateOpcoUrl(ent.siret)
    }));
    
    res.json({
      success: true,
      count: enrichedResults.length,
      results: enrichedResults
    });
    
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ 
      error: `Erreur lors de la recherche : ${error.message}` 
    });
  }
});

// Route pour rechercher par SIRET
router.post('/siret', async (req, res) => {
  try {
    const { siret } = req.body;
    
    const siretTrimmed = (siret || '').trim();

    if (!siretTrimmed) {
      return res.status(400).json({
        error: 'Veuillez saisir un numéro SIRET.'
      });
    }

    // Vérifier que le SIRET est au format correct (14 chiffres)
    if (!/^\d{14}$/.test(siretTrimmed)) {
      return res.status(400).json({
        error: 'Le SIRET doit contenir exactement 14 chiffres.'
      });
    }
    
    const apiKey = process.env.SIRENE_API_KEY;
    const client = new SireneClient(apiKey);
    
    // Rechercher l'entreprise par SIRET
    const results = await client.searchBySiret(siretTrimmed);
    
    // Ajouter les liens Pappers, PagesJaunes et OPCO
    const enrichedResults = results.map(ent => ({
      ...ent,
      pappers_url: generatePappersUrl(ent.siren),
      pagesjaunes_url: generatePagesjaunesUrl(ent.nom, ent.adresse),
      opco_url: generateOpcoUrl(ent.siret)
    }));
    
    res.json({
      success: true,
      count: enrichedResults.length,
      results: enrichedResults
    });
    
  } catch (error) {
    console.error('Erreur lors de la recherche par SIRET:', error);
    res.status(500).json({ 
      error: `Erreur lors de la recherche : ${error.message}` 
    });
  }
});

export { router as searchCompanies };

