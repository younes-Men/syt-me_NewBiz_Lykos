import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// Récupérer les données d'une entreprise
router.get('/:siret', async (req, res) => {
  try {
    const { siret } = req.params;
    const { projet } = req.query;

    if (!supabase) {
      return res.status(503).json({
        error: 'Supabase non configuré'
      });
    }

    if (!projet) {
      return res.status(400).json({
        error: 'Le paramètre projet est requis'
      });
    }

    const { data, error } = await supabase
      .from('entreprise')
      .select('*')
      .eq('siret', siret)
      .eq('projet', projet)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.json({
        siret,
        projet,
        status: 'A traiter',
        date_modification: null,
        funebooster: '',
        observation: '',
        tel: '',
        client_of: ''
      });
    }

    res.json({
      ...data,
      tel: data.tel || '',
      client_of: data.client_of || ''
    });
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    res.status(500).json({
      error: `Erreur : ${error.message}`
    });
  }
});

// Mettre à jour les données d'une entreprise
router.put('/:siret', async (req, res) => {
  try {
    const { siret } = req.params;
    const { status, funebooster, observation, tel, client_of, projet } = req.body;

    if (!supabase) {
      return res.status(503).json({
        error: 'Supabase non configuré'
      });
    }

    if (!projet) {
      return res.status(400).json({
        error: 'Le paramètre projet est requis'
      });
    }

    const dateModification = new Date().toISOString();

    // Vérifier si l'entreprise existe pour ce projet
    const { data: existing } = await supabase
      .from('entreprise')
      .select('id')
      .eq('siret', siret)
      .eq('projet', projet)
      .single();

    const entrepriseData = {
      siret,
      projet,
      status: status || 'A traiter',
      date_modification: dateModification,
      funebooster: funebooster || '',
      observation: observation || '',
      tel: tel || '',
      client_of: client_of || ''
    };

    let result;
    if (existing) {
      // Mettre à jour
      result = await supabase
        .from('entreprise')
        .update(entrepriseData)
        .eq('siret', siret)
        .eq('projet', projet)
        .select()
        .single();
    } else {
      // Créer
      result = await supabase
        .from('entreprise')
        .insert(entrepriseData)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({
      error: `Erreur : ${error.message}`
    });
  }
});

// Rechercher les entreprises par numéro de téléphone
router.post('/search/tel', async (req, res) => {
  try {
    const { tel, projet } = req.body;

    if (!supabase) {
      return res.status(503).json({
        error: 'Supabase non configuré'
      });
    }

    if (!projet) {
      return res.status(400).json({
        error: 'Le paramètre projet est requis'
      });
    }

    if (!tel || !tel.trim()) {
      return res.status(400).json({
        error: 'Le numéro de téléphone est requis'
      });
    }

    const telTrimmed = tel.trim();

    // Rechercher les entreprises avec ce numéro de téléphone
    const { data, error } = await supabase
      .from('entreprise')
      .select('siret')
      .eq('tel', telTrimmed)
      .eq('projet', projet);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.json({
        success: true,
        count: 0,
        results: []
      });
    }

    // Récupérer les SIRETs trouvés
    const sirets = data.map(ent => ent.siret).filter(Boolean);

    if (sirets.length === 0) {
      return res.json({
        success: true,
        count: 0,
        results: []
      });
    }

    // Maintenant, rechercher les entreprises dans l'API SIRENE avec ces SIRETs
    // Pour chaque SIRET, faire une recherche
    const SireneClient = (await import('../services/sirene.js')).SireneClient;
    const apiKey = process.env.SIRENE_API_KEY;
    const client = new SireneClient(apiKey);

    const allResults = [];
    for (const siret of sirets) {
      try {
        const results = await client.searchBySiret(siret);
        if (results && results.length > 0) {
          allResults.push(...results);
        }
      } catch (err) {
        console.warn(`Erreur lors de la recherche pour SIRET ${siret}:`, err.message);
      }
    }

    // Ajouter les liens Pappers, PagesJaunes et OPCO
    const generatePappersUrl = (siren) => {
      if (!siren || siren.length < 9) return '';
      return `https://www.pappers.fr/recherche?q=${siren}`;
    };

    const generatePagesjaunesUrl = (nom, adresse) => {
      if (!nom) return '';
      const codePostalMatch = adresse ? adresse.match(/\b(\d{5})\b/) : null;
      const codePostal = codePostalMatch ? codePostalMatch[1] : '';
      if (!codePostal) return '';
      const encodedNom = encodeURIComponent(nom.trim());
      return `https://www.pagesjaunes.fr/recherche/${codePostal}/${encodedNom}`;
    };

    const generateOpcoUrl = (siret) => {
      if (!siret) return '';
      const siretStr = String(siret).trim();
      if (!/^\d{14}$/.test(siretStr)) return '';
      return `https://quel-est-mon-opco.francecompetences.fr/?siret=${siretStr}`;
    };

    const enrichedResults = allResults.map(ent => ({
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
    console.error('Erreur lors de la recherche par téléphone:', error);
    res.status(500).json({
      error: `Erreur : ${error.message}`
    });
  }
});

// Récupérer toutes les entreprises (pour export)
router.post('/batch', async (req, res) => {
  try {
    const { sirets, projet } = req.body;

    if (!supabase) {
      return res.status(503).json({
        error: 'Supabase non configuré'
      });
    }

    if (!projet) {
      return res.status(400).json({
        error: 'Le paramètre projet est requis'
      });
    }

    if (!Array.isArray(sirets) || sirets.length === 0) {
      return res.json({});
    }

    const { data, error } = await supabase
      .from('entreprise')
      .select('*')
      .in('siret', sirets)
      .eq('projet', projet);

    if (error) {
      throw error;
    }

    // Convertir en objet indexé par SIRET
    const result = {};
    data.forEach(ent => {
      result[ent.siret] = {
        status: ent.status || 'A traiter',
        date_modification: ent.date_modification || null,
        funebooster: ent.funebooster || '',
        observation: ent.observation || '',
        tel: ent.tel || '',
        client_of: ent.client_of || ''
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération batch:', error);
    res.status(500).json({
      error: `Erreur : ${error.message}`
    });
  }
});


// Récupérer le classement du jour ou du mois
router.get('/stats/leaderboard', async (req, res) => {
  try {
    const { projet, period = 'day' } = req.query; // period: 'day' | 'month'

    if (!supabase) {
      return res.status(503).json({
        error: 'Supabase non configuré'
      });
    }

    if (!projet) {
      return res.status(400).json({
        error: 'Le paramètre projet est requis'
      });
    }

    // Calculer la date de début
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'month') {
      startDate.setDate(1); // 1er jour du mois courant
    }

    const startDateISO = startDate.toISOString();

    // Récupérer toutes les entreprises modifiées depuis la date de début avec le statut "Rdv"
    const { data, error } = await supabase
      .from('entreprise')
      .select('funebooster, status, date_modification')
      .eq('projet', projet)
      .eq('status', 'Rdv')
      .gte('date_modification', startDateISO);

    if (error) {
      throw error;
    }

    // Grouper par funebooster et compter
    const stats = {};

    // Initialiser les funeboosters connus si besoin (optionnel, ici on compte juste ceux qui ont des RDV)

    data.forEach(ent => {
      if (ent.funebooster) {
        if (!stats[ent.funebooster]) {
          stats[ent.funebooster] = 0;
        }
        stats[ent.funebooster]++;
      }
    });

    // Convertir en tableau trié
    const leaderboard = Object.entries(stats)
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      period,
      startDate: startDateISO,
      total: data.length,
      leaderboard
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    res.status(500).json({
      error: `Erreur : ${error.message}`
    });
  }
});

export { router as entrepriseRoutes };
