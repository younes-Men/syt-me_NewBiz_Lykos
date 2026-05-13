import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

async function checkLocalColumns() {
  const { data, error } = await supabase
    .from('entreprise')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Erreur:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Colonnes dans entreprise:', Object.keys(data[0]));
  } else {
    console.log('Aucune donnée dans entreprise');
  }
}

checkLocalColumns();
