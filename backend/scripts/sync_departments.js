import dotenv from 'dotenv';
import { supabase, supabaseCrm } from '../config/supabase.js';

dotenv.config();

/**
 * Migration MASSIVE pour extraire le département des adresses et synchroniser avec le CRM.
 * Gère la pagination et les batchs pour traiter les 148k+ entrées.
 */
async function syncDepartmentsMassive() {
  console.log('🚀 Démarrage de la synchronisation MASSIVE des départements...');
  
  if (!supabaseCrm) {
    console.error('CRM non configuré. Arrêt.');
    return;
  }

  const FETCH_SIZE = 1000;
  const SYNC_SUB_BATCH = 100;
  let from = 0;
  let hasMore = true;
  let totalProcessed = 0;
  let totalSynced = 0;

  try {
    while (hasMore) {
      console.log(`\n📦 Fetching batch ${from} à ${from + FETCH_SIZE - 1}...`);
      
      const { data: entreprises, error } = await supabase
        .from('entreprise')
        .select('*')
        .not('adresse', 'is', null)
        .order('id', { ascending: true })
        .range(from, from + FETCH_SIZE - 1);

      if (error) throw error;
      
      if (!entreprises || entreprises.length === 0) {
        console.log('🏁 Plus de données à traiter.');
        hasMore = false;
        break;
      }

      const crmUpserts = [];

      for (const ent of entreprises) {
        totalProcessed++;
        
        let département = '';
        let codePostal = '';
        if (ent.adresse) {
          const cpMatch = ent.adresse.match(/\b\d{5}\b/);
          if (cpMatch) {
            codePostal = cpMatch[0];
            département = codePostal.substring(0, 2);
          }
        }

        if (département) {
          crmUpserts.push({
            siret: ent.siret,
            nom_entreprise: ent.nom_entreprise || '',
            adresse: ent.adresse || '',
            tel: ent.tel || '',
            status: ent.status || 'A traiter',
            funebooster: ent.funebooster || '',
            client_of: ent.client_of || '',
            observation: ent.observation || '',
            projet: ent.projet,
            date_modification: ent.date_modification,
            nom_opco: ent.nom_opco,
            secteur: ent.secteur || '',
            code_naf: ent.secteur || '', // Mapping crucial pour le filtre CRM
            code_postal: codePostal,
            code_departement: département
          });
        }
      }

      if (crmUpserts.length > 0) {
        // Upsert par sous-batches pour éviter les limites de taille de payload ou timeouts
        for (let i = 0; i < crmUpserts.length; i += SYNC_SUB_BATCH) {
          const subBatch = crmUpserts.slice(i, i + SYNC_SUB_BATCH);
          const { error: crmErr } = await supabaseCrm
            .from('crm_leads')
            .upsert(subBatch, { onConflict: 'siret' });
          
          if (crmErr) {
            console.error(`❌ Erreur CRM Sub-batch à l'index ${from + i}:`, crmErr.message);
          } else {
            totalSynced += subBatch.length;
          }
        }
      }

      console.log(`✅ Progress: ${totalProcessed} traités, ${totalSynced} synchronisés avec succès.`);

      if (entreprises.length < FETCH_SIZE) {
        hasMore = false;
      } else {
        from += FETCH_SIZE;
      }

      // Petit délai pour laisser respirer les API
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\n🎉 MIGRATION TERMINÉE !`);
    console.log(`- Total traités: ${totalProcessed}`);
    console.log(`- Total synchronisés: ${totalSynced}`);

  } catch (err) {
    console.error('💥 Erreur fatale durant la migration:', err.message);
  }
}

syncDepartmentsMassive();
