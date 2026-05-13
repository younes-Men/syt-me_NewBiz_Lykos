import dotenv from 'dotenv';
import { supabase, supabaseCrm } from '../config/supabase.js';

dotenv.config();

/**
 * Script de synchronisation massive des données entre la table 'entreprise' (locale)
 * et la table 'crm_leads' (CRM).
 * Synchronise : adresse, secteur, département -> adresse, secteur, code_naf, code_departement
 */
async function syncEntrepriseToCrm() {
  console.log('🚀 Démarrage de la synchronisation Entreprise -> CRM...');

  if (!supabaseCrm) {
    console.error('❌ Erreur : supabaseCrm n\'est pas configuré. Vérifiez vos variables d\'environnement.');
    return;
  }

  const FETCH_SIZE = 500;
  let from = 0;
  let hasMore = true;
  let totalProcessed = 0;
  let totalUpdated = 0;

  try {
    while (hasMore) {
      console.log(`\n📦 Récupération du lot ${from} à ${from + FETCH_SIZE - 1}...`);

      const { data: entreprises, error } = await supabase
        .from('entreprise')
        .select('siret, adresse, secteur, département, nom_entreprise, tel, status, funebooster, client_of, observation, projet, date_modification, nom_opco')
        .range(from, from + FETCH_SIZE - 1);

      if (error) throw error;

      if (!entreprises || entreprises.length === 0) {
        hasMore = false;
        break;
      }

      // Créer une Map pour dédoublonner par SIRET dans le batch
      const uniqueBatchMap = new Map();
      
      entreprises.forEach(ent => {
        totalProcessed++;

        // Extraire le code postal de l'adresse pour crm_leads
        let codePostal = '';
        if (ent.adresse) {
          const cpMatch = ent.adresse.match(/\b\d{5}\b/);
          if (cpMatch) {
            codePostal = cpMatch[0];
          }
        }

        const crmData = {
          siret: ent.siret,
          nom_entreprise: ent.nom_entreprise || '',
          adresse: ent.adresse || '',
          tel: ent.tel || '',
          status: ent.status || 'A traiter',
          funebooster: ent.funebooster || '',
          client_of: ent.client_of || '',
          observation: ent.observation || '',
          projet: ent.projet || 'OPCO',
          date_modification: ent.date_modification,
          nom_opco: ent.nom_opco || '',
          secteur: ent.secteur || '',
          code_naf: ent.secteur || '', // Le user veut que tout soit dans code_naf
          code_postal: codePostal,
          code_departement: ent.département || ''
        };
        
        // On garde le dernier trouvé pour ce SIRET dans le lot
        uniqueBatchMap.set(ent.siret, crmData);
      });

      const crmLeadsBatch = Array.from(uniqueBatchMap.values());

      // Upsert en masse dans le CRM
      const { error: crmError } = await supabaseCrm
        .from('crm_leads')
        .upsert(crmLeadsBatch, { onConflict: 'siret' });

      if (crmError) {
        console.error(`❌ Erreur sync batch à partir de ${from}:`, crmError.message);
      } else {
        totalUpdated += crmLeadsBatch.length;
      }

      console.log(`✅ Progress: ${totalProcessed} traités, ${totalUpdated} synchronisés avec succès.`);

      if (entreprises.length < FETCH_SIZE) {
        hasMore = false;
      } else {
        from += FETCH_SIZE;
      }

      // Petit délai pour éviter de saturer les connexions
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 SYNCHRONISATION TERMINÉE !`);
    console.log(`- Total entreprises traitées: ${totalProcessed}`);
    console.log(`- Total synchronisées dans le CRM: ${totalUpdated}`);

  } catch (err) {
    console.error('💥 Erreur fatale durant la synchronisation:', err.message);
  }
}

syncEntrepriseToCrm();
