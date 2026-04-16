import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { SireneClient } from './sirene.js';
import { supabase, supabaseCrm } from '../server.js';
import dotenv from 'dotenv';
import { OPCOMMERCE_NAF_CODES } from '../utils/constants.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '../night_scraper_config.json');

let isRunning = false;
let cronJob = null;

// Vérifie si l'heure actuelle est autorisée (19h00 - 06h00)
export const isAuthorizedTime = () => {
  const hour = new Date().getHours();
  // Autorisé si >= 19h OU < 6h
  return hour >= 19 || hour < 6;
};

// Générateur du lien Kompass
const generateKompassUrl = (siret) => {
  if (!siret) return '';
  return `https://ma.kompass.com/searchCompanies?text=${siret}&searchType=COMPANYNAME`;
};

// Lire la configuration
const readConfig = () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[NightScraper] Erreur de lecture de la configuration:', err.message);
  }
  return null;
};

// Sauvegarder la configuration
const saveConfig = (config) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[NightScraper] Erreur de sauvegarde de la configuration:', err.message);
    return false;
  }
};

// Vérifie si on doit continuer le job (check every iteration)
const shouldContinue = () => {
  const config = readConfig();
  // Doit être actif ET dans la plage horaire autorisée
  return config && config.active && isAuthorizedTime();
};

export const getScraperStatus = () => {
  return {
    isRunning,
    config: readConfig()
  };
};

export const toggleScraper = (active) => {
  const config = readConfig();
  if (config) {
    config.active = active;
    saveConfig(config);
    
    // Si on active et que ce n'est pas déjà en cours, on lance
    if (active && !isRunning) {
      runNightScrapingJob();
    }
    
    return { success: true, active: config.active };
  }
  return { success: false, error: 'Configuration introuvable' };
};

// Fonction principale de scraping
export const runNightScrapingJob = async () => {
  if (isRunning) {
    console.log('[NightScraper] Job déjà en cours d\'exécution.');
    return;
  }

  const config = readConfig();
  if (!config || !config.active) {
    console.log('[NightScraper] Le scraping est désactivé.');
    return;
  }

  isRunning = true;
  console.log('[NightScraper] Début du job de scraping automatique...');

  const { projet_par_defaut: projet, secteurs, departements } = config;

  if (!projet || !secteurs || !departements || !supabase) {
    console.log('[NightScraper] Configuration incomplète ou base de données non connectée.');
    isRunning = false;
    return;
  }

  if (!isAuthorizedTime()) {
    console.log('[NightScraper] Tentative de lancement hors plage horaire (Autorisé: 19h-06h). Annulation.');
    isRunning = false;
    return;
  }

  const apiKey = process.env.SIRENE_API_KEY;
  const client = new SireneClient(apiKey);
  
  let totalAjoutes = 0;

  try {
    // Parcourir chaque département et secteur
    for (const dept of departements) {
      for (const secteur of secteurs) {
        // Vérifier si on doit toujours tourner
        if (!shouldContinue()) {
          console.log('[NightScraper] Scraping arrêté par l\'utilisateur ou par désactivation.');
          isRunning = false;
          return;
        }

        console.log(`[NightScraper] Téléchargement: Dept ${dept} | Secteur ${secteur}...`);
        
        try {
          const results = await client.searchBySecteurAndDepartement(secteur, dept, 50000);
          
          if (!results || results.length === 0) continue;

          for (const entreprise of results) {
            // Check again inside the inner loop for responsiveness
            if (!shouldContinue()) {
              isRunning = false;
              return;
            }

            const siret = entreprise.siret;
            
            // Vérifier si elle existe déjà dans le projet
            const { data: existing, error: errCheck } = await supabase
              .from('entreprise')
              .select('siret')
              .eq('siret', siret)
              .eq('projet', projet)
              .single();

            if (errCheck && errCheck.code !== 'PGRST116') {
              console.warn(`[NightScraper] Erreur check SIRET ${siret}:`, errCheck.message);
              continue;
            }

            // Si elle n'existe pas, on l'ajoute
            if (!existing) {
              const kompassLink = generateKompassUrl(siret);
                const dateModification = new Date().toISOString();
                const opcoDefault = OPCOMMERCE_NAF_CODES.includes(entreprise.secteur) ? 'OPCOMMERCE' : '';

                const entrepriseData = {
                  siret,
                  projet,
                  status: 'A traiter',
                  date_modification: dateModification,
                  funebooster: '',
                  observation: '',
                  tel: kompassLink,
                  client_of: '',
                  nom_entreprise: entreprise.nom,
                  adresse: entreprise.adresse,
                  secteur: entreprise.secteur || secteur,
                  nom_opco: opcoDefault
                };

                // Insertion Base Principale
                const { error: errInsert } = await supabase
                  .from('entreprise')
                  .insert(entrepriseData);

                if (errInsert) {
                  console.warn(`[NightScraper] Erreur insert Base Principale ${siret}:`, errInsert.message);
                } else {
                  totalAjoutes++;
                }
                
                // Insertion/Sync CRM externe (Toujours tenté si connecté)
                if (supabaseCrm) {
                  try {
                    const crmData = {
                      siret,
                      nom_entreprise: entreprise.nom,
                      adresse: entreprise.adresse,
                      tel: kompassLink,
                      status: 'A traiter',
                      funebooster: '',
                      client_of: '',
                      observation: '',
                      projet,
                      date_modification: dateModification,
                      secteur: entreprise.secteur || secteur,
                      nom_opco: opcoDefault
                    };
                  
                  const { error: errCrm } = await supabaseCrm
                    .from('crm_leads')
                    .upsert(crmData, { onConflict: 'siret' });
                    
                  if (errCrm) {
                    console.warn(`[NightScraper] Erreur sync CRM pour ${siret}:`, errCrm.message);
                  }
                } catch(e) { 
                  console.warn(`[NightScraper] Exception sync CRM pour ${siret}:`, e.message);
                }
              }
            }
          }
        } catch (err) {
          console.error(`[NightScraper] Erreur sur dept ${dept} / sec ${secteur}:`, err.message);
        }
      }
    }

    // Une fois que tout le cycle est fini, on désactive le scraper pour éviter de recommencer
    const finalConfig = readConfig();
    if (finalConfig) {
      finalConfig.active = false;
      saveConfig(finalConfig);
      console.log('[NightScraper] Cycle complet terminé. Le scraper a été désactivé automatiquement.');
    }
  } finally {
    isRunning = false;
    console.log(`[NightScraper] Fin du cycle de scraping. Nouveaux prospects ajoutés: ${totalAjoutes}`);
    
    const config = readConfig();
    // On ne relance plus automatiquement le cycle ici. 
    // Il attendra une nouvelle activation manuelle depuis l'interface.
  }
};

// Initialisation du scraper et planification Cron
export const initNightScraper = () => {
  console.log('🌙 [NightScraper] Initialisation du planificateur...');

  // 1. Configurer la tâche Cron pour 19h00 tous les jours
  // Cron format: minute hour dayOfMonth month dayOfWeek
  if (cronJob) {
    cronJob.stop();
  }

  cronJob = cron.schedule('0 19 * * *', () => {
    console.log('⏰ [Cron] Il est 19h00, lancement du scraping de nuit...');
    const config = readConfig();
    if (config && config.active) {
      runNightScrapingJob();
    } else {
      console.log('[Cron] Scraping automatique désactivé dans la config. Rien à faire.');
    }
  }, {
    scheduled: true,
    timezone: "Europe/Paris"
  });

  // 2. Au démarrage du serveur, on vérifie si on est dans la plage horaire 
  // et si ça devrait tourner (cas de redémarrage serveur la nuit)
  const config = readConfig();
  if (config && config.active && isAuthorizedTime()) {
    console.log('[NightScraper] Redémarrage détecté durant la nuit. Reprise du job...');
    runNightScrapingJob();
  }
};
