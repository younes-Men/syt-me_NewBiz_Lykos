import { supabase } from '../config/supabase.js';

const DEFAULT_FUNBOOSTERS = [
  // OPCO
  { name: 'WISSAL', projet: 'OPCO', key: '@FunWissal' },
  { name: 'OUMAIMA', projet: 'OPCO', key: '@FunOumaima' },
  { name: 'MERYEM', projet: 'OPCO', key: '@FunMaryem' },
  { name: 'LABIBA', projet: 'OPCO', key: '@FunLabiba' },
  { name: 'BENZAYDOUNE', projet: 'OPCO', key: '@FunBenzaidoune' },
  { name: 'KHADIJA', projet: 'OPCO', key: '@FunKhadija' },
  { name: 'WIJDAN', projet: 'OPCO', key: '@FunWijdan' },
  { name: 'SOUKAINA', projet: 'OPCO', key: '@FunSoukaina' },
  { name: 'AMRI', projet: 'OPCO', key: '@FunAmri' },
  { name: 'GHITA', projet: 'OPCO', key: '@FunGhita' },
  { name: 'AHANA', projet: 'OPCO', key: '@FunAhana' },
  { name: 'HAJJI', projet: 'OPCO', key: '@FunHajji' },
  { name: 'RIRI', projet: 'OPCO', key: '@FunRiri' },
  // RCD
  { name: 'GOMIS', projet: 'RCD', key: '@FunGomis' },
  { name: 'ADAM', projet: 'RCD', key: '@FunAdam' },
  { name: 'HOUSSAM', projet: 'RCD', key: '@FunHoussam' },
  { name: 'YOSRA', projet: 'RCD', key: '@FunYosra' },
  { name: 'KARIM', projet: 'RCD', key: '@FunKarim' },
  { name: 'AYA', projet: 'RCD', key: '@FunAya' },
];

/**
 * Synchronise les clés Funbooster avec la base de données
 */
export const syncFunboosterKeys = async () => {
  if (!supabase) return;

  try {
    // 1. D'abord, on s'assure que toutes les clés du fichier .env sont aussi prises en compte (rétrocompatibilité)
    const envKeys = (process.env.FUNBOOSTER_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
    const funboostersToSync = [...DEFAULT_FUNBOOSTERS];

    for (const envKey of envKeys) {
      if (!funboostersToSync.find(f => f.key === envKey)) {
        funboostersToSync.push({ name: envKey.replace('@Fun', ''), projet: 'OPCO', key: envKey });
      }
    }

    if (funboostersToSync.length === 0) return;

    console.log(`[SYNC] Synchronisation de ${funboostersToSync.length} clés Funbooster...`);

    for (const fb of funboostersToSync) {
      // Vérifier si la clé existe déjà
      const { data, error } = await supabase
        .from('funbooster_access')
        .select('key, name, projet')
        .eq('key', fb.key)
        .single();

      if (error && error.code === 'PGRST116') {
        // La clé n'existe pas, on l'ajoute
        console.log(`[SYNC] Ajout de la nouvelle clé : ${fb.key} (${fb.name} - ${fb.projet})`);
        const { error: insertError } = await supabase
          .from('funbooster_access')
          .insert({ key: fb.key, name: fb.name, projet: fb.projet, is_active: true });
        
        if (insertError) {
          if (insertError.message.includes('funbooster_access')) {
             console.warn('[SYNC] La table funbooster_access semble absente. Veuillez exécuter le script SQL de migration.');
             return; // On arrête si la table n'existe pas
          }
          console.error(`[SYNC] Erreur lors de l'ajout de ${fb.key}:`, insertError);
        }
      } else if (data) {
        // La clé existe, on met à jour le nom et le projet si ce n'est pas déjà défini
        if (!data.name || !data.projet) {
          await supabase
            .from('funbooster_access')
            .update({ name: fb.name, projet: fb.projet })
            .eq('key', fb.key);
        }
      } else if (error) {
        if (error.message.includes('funbooster_access')) {
            console.warn('[SYNC] La table funbooster_access semble absente.');
            return;
        }
        console.error(`[SYNC] Erreur lors de la vérification de ${fb.key}:`, error);
      }
    }

    console.log('[SYNC] Synchronisation terminée.');
  } catch (err) {
    console.error('[SYNC] Erreur inattendue:', err);
  }
};
