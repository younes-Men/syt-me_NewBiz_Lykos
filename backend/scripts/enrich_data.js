import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';
import axios from 'axios';

dotenv.config();

/**
 * Script d'enrichissement massif des données manquantes via l'API recherche-entreprises.api.gouv.fr.
 */
async function enrichData() {
  console.log('🚀 Démarrage de l\'enrichissement des données...');
  
  const FETCH_SIZE = 1000;
  let from = 0;
  let hasMore = true;
  let totalProcessed = 0;
  let totalUpdated = 0;

  try {
    while (hasMore) {
      console.log(`\n📦 Fetching batch ${from} à ${from + FETCH_SIZE - 1}...`);
      
      const { data: entreprises, error } = await supabase
        .from('entreprise')
        .select('id, siret, projet, adresse, secteur')
        .or('adresse.is.null,adresse.eq."",secteur.is.null,secteur.eq.""')
        .order('id', { ascending: true })
        .range(0, FETCH_SIZE - 1);

      if (error) throw error;
      
      if (!entreprises || entreprises.length === 0) {
        console.log('🏁 Plus de données à enrichir.');
        hasMore = false;
        break;
      }

      for (const ent of entreprises) {
        totalProcessed++;
        
        try {
          // Appel API Gouv (limite à 7 req/s)
          const url = `https://recherche-entreprises.api.gouv.fr/search?q=${ent.siret}`;
          const response = await axios.get(url, { timeout: 10000 });
          
          if (response.data && response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            const siege = result.siege || {};
            
            // Extraction des données
            const nom = result.nom_complet || result.nom_entreprise || '';
            const secteur = result.activite_principale || '';
            const adresse = siege.adresse || '';
            const codePostal = siege.code_postal || '';
            const departement = codePostal ? codePostal.substring(0, 2) : '';
            
            // Update local
            const updateData = {};
            if (nom) updateData.nom_entreprise = nom;
            if (secteur) updateData.secteur = secteur;
            if (adresse) updateData.adresse = adresse;
            if (departement) updateData.département = departement;
            
            if (Object.keys(updateData).length > 0) {
              const dateModification = new Date().toISOString();
              updateData.date_modification = dateModification;

              const { data: updated, error: updateError } = await supabase
                .from('entreprise')
                .update(updateData)
                .eq('id', ent.id)
                .select()
                .single();
                
              if (!updateError && updated) {
                totalUpdated++;
                
                // Sync to CRM if available
                const { supabaseCrm } = await import('../config/supabase.js');
                if (supabaseCrm) {
                  const cpMatch = updated.adresse ? updated.adresse.match(/\b\d{5}\b/) : null;
                  const codePostal = cpMatch ? cpMatch[0] : '';
                  const département = codePostal ? codePostal.substring(0, 2) : '';

                  await supabaseCrm
                    .from('crm_leads')
                    .upsert({
                      siret: updated.siret,
                      nom_entreprise: updated.nom_entreprise,
                      adresse: updated.adresse,
                      secteur: updated.secteur,
                      code_naf: updated.secteur,
                      code_postal: codePostal,
                      code_departement: département,
                      date_modification: updated.date_modification,
                      projet: updated.projet
                    }, { onConflict: 'siret' });
                }
              }
            }
          }
        } catch (err) {
          if (err.response && err.response.status === 429) {
            console.warn('⚠️ Rate limit atteint, pause de 2 secondes...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            // On ne re-tente pas la même ligne pour simplifier, on la rattrapera plus tard si on relance
          } else {
            // Silencieux pour ne pas spammer les 404
          }
        }

        // Respecter la limite de 7 req/s (donc ~143ms entre chaque requête)
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      console.log(`✅ Progress enrichissement: ${totalProcessed} vérifiés, ${totalUpdated} mis à jour avec succès.`);

      if (entreprises.length < FETCH_SIZE) {
        hasMore = false;
      }
    }

    console.log(`\n🎉 ENRICHISSEMENT TERMINÉ !`);
    console.log(`- Total vérifiés: ${totalProcessed}`);
    console.log(`- Total mis à jour: ${totalUpdated}`);

  } catch (err) {
    console.error('💥 Erreur fatale durant l\'enrichissement:', err.message);
  }
}

enrichData();
