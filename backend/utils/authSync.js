import { supabase } from '../config/supabase.js';

/**
 * Synchronise les clés Funbooster du .env avec la base de données
 */
export const syncFunboosterKeys = async () => {
  if (!supabase) return;

  try {
    const keys = (process.env.FUNBOOSTER_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
    
    if (keys.length === 0) return;

    console.log(`[SYNC] Synchronisation de ${keys.length} clés Funbooster...`);

    for (const key of keys) {
      // Vérifier si la clé existe déjà
      const { data, error } = await supabase
        .from('funbooster_access')
        .select('key')
        .eq('key', key)
        .single();

      if (error && error.code === 'PGRST116') {
        // La clé n'existe pas, on l'ajoute
        console.log(`[SYNC] Ajout de la nouvelle clé : ${key}`);
        const { error: insertError } = await supabase
          .from('funbooster_access')
          .insert({ key, is_active: true });
        
        if (insertError) {
          if (insertError.message.includes('funbooster_access')) {
             console.warn('[SYNC] La table funbooster_access semble absente. Veuillez exécuter le script SQL.');
             return; // On arrête si la table n'existe pas
          }
          console.error(`[SYNC] Erreur lors de l'ajout de ${key}:`, insertError);
        }
      } else if (error) {
        if (error.message.includes('funbooster_access')) {
            console.warn('[SYNC] La table funbooster_access semble absente.');
            return;
        }
        console.error(`[SYNC] Erreur lors de la vérification de ${key}:`, error);
      }
    }

    console.log('[SYNC] Synchronisation terminée.');
  } catch (err) {
    console.error('[SYNC] Erreur inattendue:', err);
  }
};
