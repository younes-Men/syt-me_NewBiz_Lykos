import express from 'express';
import { supabase, supabaseCrm } from '../config/supabase.js';
import { getScraperStatus, toggleScraper, isAuthorizedTime } from '../services/nightScraper.js';
import { OPCOMMERCE_NAF_CODES } from '../utils/constants.js';
import { generatePappersUrl, generatePagesjaunesUrl, generateOpcoUrl } from '../utils/urlGenerators.js';

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
        client_of: '',
        nom_opco: '',
        secteur: ''
      });
    }

    res.json({
      ...data,
      tel: data.tel || '',
      client_of: data.client_of || '',
      nom_opco: data.nom_opco || ''
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
    const { status, funebooster, observation, tel, client_of, projet, nom, adresse, nom_opco, secteur } = req.body;

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

    // Appliquer l'OPCO par défaut si vide et si le NAF correspond
    let finalOpco = nom_opco || '';
    if (!finalOpco && secteur && OPCOMMERCE_NAF_CODES.includes(secteur)) {
      finalOpco = 'OPCOMMERCE';
    }

    // Vérifier si l'entreprise existe pour ce projet
    const { data: existing } = await supabase
      .from('entreprise')
      .select('*')
      .eq('siret', siret)
      .eq('projet', projet)
      .single();

    // Extraire le département et code postal de l'adresse
    let département = '';
    let codePostal = '';
    if (adresse) {
      const cpMatch = adresse.match(/\b\d{5}\b/);
      if (cpMatch) {
        codePostal = cpMatch[0];
        département = codePostal.substring(0, 2);
      }
    }

    const newStatus = status || 'A traiter';
    const newFunebooster = funebooster || '';
    const newObservation = observation || '';
    const newTel = tel || '';
    const newClientOf = client_of || '';
    const newNom = nom || '';
    const newAdresse = adresse || '';
    const newSecteur = secteur || '';

    // Déterminer si un changement réel a eu lieu pour la date_modification
    let dateModification = existing?.date_modification || new Date().toISOString();
    
    const hasChanged = !existing || 
      existing.status !== newStatus ||
      existing.funebooster !== newFunebooster ||
      existing.observation !== newObservation ||
      existing.tel !== newTel ||
      existing.client_of !== newClientOf ||
      existing.nom_entreprise !== newNom ||
      existing.adresse !== newAdresse ||
      existing.nom_opco !== finalOpco ||
      existing.secteur !== newSecteur;

    if (hasChanged) {
      dateModification = new Date().toISOString();
    }

    const entrepriseData = {
      siret,
      projet,
      status: newStatus,
      date_modification: dateModification,
      funebooster: newFunebooster,
      observation: newObservation,
      tel: newTel,
      client_of: newClientOf,
      nom_entreprise: newNom,
      adresse: newAdresse,
      département,
      nom_opco: finalOpco,
      secteur: newSecteur
    };

    let result;
    if (existing) {
      // Mettre à jour localement
      result = await supabase
        .from('entreprise')
        .update(entrepriseData)
        .eq('siret', siret)
        .eq('projet', projet)
        .select()
        .single();
    } else {
      // Créer localement
      result = await supabase
        .from('entreprise')
        .insert(entrepriseData)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    // --- Synchronisation vers le CRM séparé ---
    if (supabaseCrm) {
      try {
        // Utiliser la date du système pour le CRM afin d'être identique
        const dateSync = result.data.date_modification || dateModification;

        const crmData = {
          siret,
          nom_entreprise: nom || '',
          adresse: adresse || '',
          tel: tel || '',
          status: status || 'A traiter',
          funebooster: funebooster || '',
          client_of: client_of || '',
          observation: observation || '',
          projet,
          date_modification: dateSync, // Utilisation de la date système
          nom_opco: finalOpco,
          secteur: secteur || '',
          code_naf: secteur || '',
          code_postal: codePostal,
          code_departement: département
        };

        // Upsert direct basé sur siret
        const { error: crmError } = await supabaseCrm
          .from('crm_leads')
          .upsert(crmData, { onConflict: 'siret' });

        if (crmError) {
          console.warn('Erreur de synchronisation avec le CRM séparé:', crmError.message);
        }
      } catch (crmErr) {
        console.warn('Exception lors de la synchronisation CRM:', crmErr.message);
      }
    }

    // ----------------------------------------

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
        client_of: ent.client_of || '',
        nom_opco: ent.nom_opco || '',
        secteur: ent.secteur || ''
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
    const { projet, period = 'day', groupBy = 'funebooster', month, year } = req.query; // period: 'day' | 'month', groupBy: 'funebooster' | 'client_of'

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

    // Calculer les dates de début et fin
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (month && year) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    } else {
      if (period === 'month') {
        startDate.setDate(1);
      } else if (period === 'year') {
        startDate.setMonth(0, 1);
      }
    }

    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    // Mapping des champs pour le regroupement
    const groupField = groupBy === 'client_of' ? 'client_of' : 'funebooster';

    // Récupérer toutes les entreprises modifiées dans l'intervalle avec le statut "Rdv"
    const { data, error } = await supabase
      .from('entreprise')
      .select(`${groupField}, status, date_modification`)
      .eq('projet', projet)
      .eq('status', 'Rdv')
      .gte('date_modification', startDateISO)
      .lte('date_modification', endDateISO);

    if (error) {
      throw error;
    }

    // Grouper par le champ spécifié et compter
    const stats = {};

    data.forEach(ent => {
      const keyValue = ent[groupField];
      if (keyValue) {
        if (!stats[keyValue]) {
          stats[keyValue] = 0;
        }
        stats[keyValue]++;
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
      groupBy,
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

// --- Routes d'administration du scraper ---

// Récupérer le statut du scraper
router.get('/admin/scraper/status', async (req, res) => {
  try {
    const status = getScraperStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activer/Désactiver le scraper
router.post('/admin/scraper/toggle', async (req, res) => {
  try {
    const { active } = req.body;
    const result = toggleScraper(active);
    
    // Ajouter un message personnalisé si on active pendant la journée
    if (active && !isAuthorizedTime()) {
      result.message = "Scraping activé et démarré immédiatement !";
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Routes publiques (authentifiées) des Funboosters ---

// Mapping de secours : clé → {name, projet}
const KEY_FALLBACK_MAP = {
  '@FunWissal':      { name: 'WISSAL',      projet: 'OPCO' },
  '@FunOumaima':     { name: 'OUMAIMA',     projet: 'OPCO' },
  '@FunMaryem':      { name: 'MERYEM',      projet: 'OPCO' },
  '@FunLabiba':      { name: 'LABIBA',      projet: 'OPCO' },
  '@FunBenzaidoune': { name: 'BENZAYDOUNE', projet: 'OPCO' },
  '@FunKhadija':     { name: 'KHADIJA',     projet: 'OPCO' },
  '@FunWijdan':      { name: 'WIJDAN',      projet: 'OPCO' },
  '@FunSoukaina':    { name: 'SOUKAINA',    projet: 'OPCO' },
  '@FunAmri':        { name: 'AMRI',        projet: 'OPCO' },
  '@FunGhita':       { name: 'GHITA',       projet: 'OPCO' },
  '@FunAhana':       { name: 'AHANA',       projet: 'OPCO' },
  '@FunHajji':       { name: 'HAJJI',       projet: 'OPCO' },
  '@FunRiri':        { name: 'RIRI',        projet: 'OPCO' },
  '@FunGomis':       { name: 'GOMIS',       projet: 'RCD'  },
  '@FunAdam':        { name: 'ADAM',        projet: 'RCD'  },
  '@FunHoussam':     { name: 'HOUSSAM',     projet: 'RCD'  },
  '@FunYosra':       { name: 'YOSRA',       projet: 'RCD'  },
  '@FunKarim':       { name: 'KARIM',       projet: 'RCD'  },
  '@FunAya':         { name: 'AYA',         projet: 'RCD'  },
};

/**
 * Récupérer la liste de tous les funboosters actifs (pour les menus déroulants)
 */
router.get('/funboosters', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase non configuré' });

    // Essayer d'abord avec les colonnes name et projet
    let data = null;
    let columnsExist = true;

    try {
      const result = await supabase
        .from('funbooster_access')
        .select('name, projet, key')
        .eq('is_active', true)
        .order('key', { ascending: true });

      if (result.error) {
        // Si les colonnes n'existent pas encore
        if (result.error.message && (result.error.message.includes('name') || result.error.message.includes('projet') || result.error.message.includes('column'))) {
          columnsExist = false;
        } else if (result.error.code === 'PGRST116' || result.error.message.includes('funbooster_access')) {
          return res.json([]);
        } else {
          throw result.error;
        }
      } else {
        data = result.data;
      }
    } catch (innerErr) {
      columnsExist = false;
    }

    // Si les colonnes n'existent pas → fallback sur la clé uniquement
    if (!columnsExist) {
      const fallbackResult = await supabase
        .from('funbooster_access')
        .select('key')
        .eq('is_active', true);

      if (fallbackResult.error) return res.json([]);

      const enriched = (fallbackResult.data || []).map(fb => ({
        key: fb.key,
        name: KEY_FALLBACK_MAP[fb.key]?.name || fb.key.replace('@Fun', '').toUpperCase(),
        projet: KEY_FALLBACK_MAP[fb.key]?.projet || 'OPCO',
      }));
      return res.json(enriched);
    }

    // Enrichir les données : si name/projet sont null, déduire depuis la clé
    const enriched = (data || []).map(fb => ({
      key: fb.key,
      name: fb.name || KEY_FALLBACK_MAP[fb.key]?.name || fb.key.replace('@Fun', '').toUpperCase(),
      projet: fb.projet || KEY_FALLBACK_MAP[fb.key]?.projet || 'OPCO',
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Erreur lors de la récupération des funboosters (publique):', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Routes d'administration des Funboosters ---

/**
 * Récupérer tous les Funboosters et leur statut d'accès
 */
router.get('/admin/funboosters', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase non configuré' });

    // Récupérer depuis la base de données
    const { data, error } = await supabase
      .from('funbooster_access')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('funbooster_access')) {
        return res.json([]); // Table non encore créée
      }
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des funboosters:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Activer/Désactiver un Funbooster
 */
router.post('/admin/funboosters/toggle', async (req, res) => {
  try {
    const { key, is_active } = req.body;
    if (!key) return res.status(400).json({ error: 'Clé manquante' });

    if (!supabase) return res.status(503).json({ error: 'Supabase non configuré' });

    const { error } = await supabase
      .from('funbooster_access')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) throw error;

    res.json({ success: true, message: `Accès ${is_active ? 'activé' : 'désactivé'} pour ${key}` });
  } catch (error) {
    console.error('Erreur lors du toggle funbooster:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Créer un nouveau Funbooster
 */
router.post('/admin/funboosters', async (req, res) => {
  try {
    const { key, name, projet, is_active } = req.body;
    if (!key || !name || !projet) return res.status(400).json({ error: 'Champs manquants (key, name, projet)' });

    if (!supabase) return res.status(503).json({ error: 'Supabase non configuré' });

    // Vérifier si la clé existe déjà
    const { data: existing } = await supabase
      .from('funbooster_access')
      .select('key')
      .eq('key', key)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Ce code d\'accès existe déjà.' });
    }

    // Essayer d'insérer avec name et projet
    let insertError = null;
    const { error: errWithCols } = await supabase
      .from('funbooster_access')
      .insert({ key, name, projet, is_active: is_active !== undefined ? is_active : true });

    insertError = errWithCols;

    // Si erreur liée aux colonnes manquantes → insérer sans name/projet
    if (insertError && (insertError.message?.includes('name') || insertError.message?.includes('projet') || insertError.message?.includes('column'))) {
      console.warn(`[FUNBOOSTER] Colonnes name/projet absentes. Insertion sans ces champs pour ${key}.`);
      const { error: errWithoutCols } = await supabase
        .from('funbooster_access')
        .insert({ key, is_active: is_active !== undefined ? is_active : true });
      insertError = errWithoutCols;

      if (!insertError) {
        // Ajouter au KEY_FALLBACK_MAP en mémoire pour cette session
        KEY_FALLBACK_MAP[key] = { name, projet };
        return res.json({ 
          success: true, 
          message: `Funbooster ${name} créé. ⚠️ Exécutez la migration SQL pour activer toutes les fonctionnalités.`,
          warning: 'Migration SQL requise'
        });
      }
    }

    if (insertError) throw insertError;

    res.json({ success: true, message: `Funbooster ${name} créé avec succès.` });
  } catch (error) {
    console.error('Erreur lors de la création du funbooster:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as entrepriseRoutes };
