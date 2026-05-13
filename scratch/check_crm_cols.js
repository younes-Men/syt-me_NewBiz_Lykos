import dotenv from 'dotenv';
import { supabaseCrm } from './backend/config/supabase.js';

dotenv.config();

async function checkCrmColumns() {
  if (!supabaseCrm) {
    console.error('Supabase CRM non configuré');
    return;
  }

  const { data, error } = await supabaseCrm
    .from('crm_leads')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Erreur:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Colonnes dans crm_leads:', Object.keys(data[0]));
  } else {
    console.log('Aucune donnée dans crm_leads pour vérifier les colonnes');
  }
}

checkCrmColumns();
