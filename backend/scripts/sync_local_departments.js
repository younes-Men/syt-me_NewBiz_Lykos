import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

/**
 * Migration MASSIVE pour mettre à jour la colonne `département` de la table `entreprise` (locale).
 */
async function syncLocalDepartments() {
  console.log('🚀 Démarrage de la mise à jour LOCALE des départements...');
  
  const FETCH_SIZE = 1000;
  const CONCURRENCY_LIMIT = 10; // Nombre de requêtes UPDATE simultanées
  let from = 0;
  let hasMore = true;
  let totalProcessed = 0;
  let totalUpdated = 0;

  try {
    while (hasMore) {
      console.log(`\n📦 Fetching batch ${from} à ${from + FETCH_SIZE - 1}...`);
      
      // Récupérer uniquement ceux qui n'ont pas de département mais qui ont une adresse
      // Toujours fetcher depuis 0 car les éléments mis à jour disparaissent du filtre
      const { data: entreprises, error } = await supabase
        .from('entreprise')
        .select('id, siret, projet, adresse')
        .not('adresse', 'is', null)
        .or('département.is.null,département.eq.""')
        .order('id', { ascending: true })
        .range(0, FETCH_SIZE - 1);

      if (error) throw error;
      
      if (!entreprises || entreprises.length === 0) {
        console.log('🏁 Plus de données locales à mettre à jour.');
        hasMore = false;
        break;
      }

      // Préparer les promesses d'update
      const updatePromises = [];

      for (const ent of entreprises) {
        totalProcessed++;
        
        let département = '';
        if (ent.adresse) {
          const cpMatch = ent.adresse.match(/\b\d{5}\b/);
          if (cpMatch) {
            département = cpMatch[0].substring(0, 2);
          }
        }

        if (département) {
          // Créer une promesse d'update
          const updateTask = supabase
            .from('entreprise')
            .update({ département })
            .eq('id', ent.id);
            
          updatePromises.push(updateTask);
        }
      }

      console.log(`⏳ Exécution de ${updatePromises.length} mises à jour locales en parallèle (par lots de ${CONCURRENCY_LIMIT})...`);
      
      // Exécuter les promesses avec une limite de concurrence
      for (let i = 0; i < updatePromises.length; i += CONCURRENCY_LIMIT) {
        const chunk = updatePromises.slice(i, i + CONCURRENCY_LIMIT);
        const results = await Promise.all(chunk);
        
        // Vérifier les erreurs
        let chunkErrors = 0;
        for (const res of results) {
          if (res.error) {
            chunkErrors++;
            console.error('❌ Erreur update local:', res.error.message);
          }
        }
        totalUpdated += (chunk.length - chunkErrors);
      }

      console.log(`✅ Progress local: ${totalProcessed} vérifiés, ${totalUpdated} mis à jour avec succès.`);

      // Si on a moins de FETCH_SIZE résultats, on a fini
      if (entreprises.length < FETCH_SIZE) {
        hasMore = false;
      }

      // Petit délai pour laisser respirer la base de données
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n🎉 MISE À JOUR LOCALE TERMINÉE !`);
    console.log(`- Total vérifiés: ${totalProcessed}`);
    console.log(`- Total mis à jour: ${totalUpdated}`);

  } catch (err) {
    console.error('💥 Erreur fatale durant la mise à jour locale:', err.message);
  }
}

syncLocalDepartments();
