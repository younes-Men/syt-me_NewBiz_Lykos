import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

async function checkData() {
  console.log('🔍 Diagnostic des données...');
  
  try {
    const { data: results, error } = await supabase
      .from('entreprise')
      .select('nom_opco, secteur')
      .limit(20);

    if (error) throw error;

    console.log('--- 20 premiers résultats ---');
    console.table(results.map(r => ({
      nom_opco: `"${r.nom_opco}"`,
      secteur: `"${r.secteur}"`,
      type_opco: typeof r.nom_opco,
      type_secteur: typeof r.secteur
    })));

    // Compter les secteurs qui devraient être OPCOMMERCE
    const { data: all } = await supabase
      .from('entreprise')
      .select('secteur, nom_opco');
    
    const OPCOMMERCE_NAF_CODES = [
      "74.20Z", "47.52B", "47.91A", "47.91B", "46.17A", "46.17B", "46.38B", "47.11B",
      "47.11C", "47.11D", "47.11E", "47.25Z", "47.21Z", "47.24Z", "47.29Z", "47.81Z",
      "26.52Z", "47.77Z", "47.78C", "47.72A", "47.51Z", "47.53Z", "47.59B", "47.71Z",
      "47.19B", "47.41Z", "47.42Z", "47.43Z", "47.52A", "47.54Z", "47.59A", "47.63Z",
      "47.65Z", "47.72B", "47.76Z", "47.79Z", "47.89Z", "43.21A", "77.22Z", "77.29Z",
      "95.11Z", "95.12Z", "95.21Z", "95.22Z", "46.41Z", "46.42Z", "45.11Z", "45.19Z",
      "47.64Z", "46.51Z", "46.65Z", "46.66Z", "47.62Z", "46.12A", "46.19A", "46.11Z",
      "46.12B", "46.13Z", "46.14Z", "46.15Z", "46.16Z", "46.18Z", "46.19B", "46.43Z",
      "46.47Z", "46.49Z", "46.52Z", "46.61Z", "46.62Z", "46.63Z", "46.64Z", "46.69A",
      "46.69B", "46.69C", "46.72Z", "46.75Z", "52.10B", "47.78A"
    ];

    const targets = all.filter(r => r.secteur && OPCOMMERCE_NAF_CODES.includes(r.secteur));
    console.log(`\nSur ${all.length} entreprises :`);
    console.log(`- ${targets.length} correspondent aux NAF OPCOMMERCE.`);
    console.log(`- ${targets.filter(t => !t.nom_opco).length} parmi elles ont un nom_opco VIDE.`);

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

checkData();
