import dotenv from 'dotenv';
import { supabase, supabaseCrm } from '../config/supabase.js';
import { OPCOMMERCE_NAF_CODES } from '../utils/constants.js';

dotenv.config();

async function migrate() {
  console.log('🚀 Démarrage de la migration OPCOMMERCE...');
  
  try {
    // 1. Récupérer toutes les entreprises (plus sûr pour filtrer en JS)
    const { data: entreprises, error } = await supabase
      .from('entreprise')
      .select('siret, secteur, projet, nom_opco');

    if (error) throw error;

    console.log(`🔍 Analyse de ${entreprises.length} entreprises...`);

    let count = 0;
    for (const ent of entreprises) {
      if (ent.secteur && OPCOMMERCE_NAF_CODES.includes(ent.secteur)) {
        // Mettre à jour la base principale
        await supabase
          .from('entreprise')
          .update({ nom_opco: 'OPCOMMERCE' })
          .eq('siret', ent.siret)
          .eq('projet', ent.projet);

        // Mettre à jour le CRM si présent
        if (supabaseCrm) {
          await supabaseCrm
            .from('crm_leads')
            .update({ nom_opco: 'OPCOMMERCE' })
            .eq('siret', ent.siret);
        }
        
        count++;
        if (count % 10 === 0) console.log(`✅ ${count} entreprises mises à jour...`);
      }
    }

    console.log(`🎉 Migration terminée ! ${count} entreprises ont été mises à jour vers OPCOMMERCE.`);
  } catch (err) {
    console.error('❌ Erreur lors de la migration:', err.message);
  }
}

migrate();
