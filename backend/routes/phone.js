import express from 'express';
import axios from 'axios';

const router = express.Router();

// Recherche simple du numéro de téléphone à partir d'une page PagesJaunes
async function extractPhoneFromHtml(html) {
  if (!html) return null;

  // Chercher un lien tel:
  const telLinkMatch = html.match(/tel:([0-9\s\.\-+]+)/i);
  if (telLinkMatch && telLinkMatch[1]) {
    return telLinkMatch[1].trim();
  }

  // Fallback: chercher un motif de numéro français classique
  const genericPhoneMatch = html.match(/(?:0|\+33)[0-9\s\.]{8,}/);
  if (genericPhoneMatch) {
    return genericPhoneMatch[0].trim();
  }

  return null;
}

router.post('/', async (req, res) => {
  try {
    const { url, nom, adresse } = req.body || {};

    if (!url && !nom) {
      return res.status(400).json({
        error: 'URL PagesJaunes ou nom requis pour la recherche de téléphone.',
      });
    }

    let targetUrl = url;

    // Si pas d’URL, essayer de construire une URL PagesJaunes basique
    if (!targetUrl && nom) {
      const codePostalMatch = adresse ? adresse.match(/\b(\d{5})\b/) : null;
      const codePostal = codePostalMatch ? codePostalMatch[1] : '';
      if (codePostal) {
        const encodedNom = encodeURIComponent(String(nom).trim());
        targetUrl = `https://www.pagesjaunes.fr/recherche/${codePostal}/${encodedNom}`;
      }
    }

    if (!targetUrl) {
      return res.status(400).json({
        error: 'Impossible de construire une URL de recherche.',
      });
    }

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
      timeout: 10000,
    });

    const html = response.data || '';
    const phone = await extractPhoneFromHtml(html);

    if (!phone) {
      return res.status(404).json({
        error: 'Aucun numéro trouvé sur la page.',
      });
    }

    res.json({ phone });
  } catch (error) {
    console.error('Erreur lors de la recherche de téléphone:', error.message);
    res.status(500).json({
      error: "Erreur lors de la recherche du numéro de téléphone.",
    });
  }
});

export { router as phoneRoutes };


