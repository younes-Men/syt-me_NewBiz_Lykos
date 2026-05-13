import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';

dotenv.config();

async function checkEmpty() {
  const { count, error } = await supabase
    .from('entreprise')
    .select('id', { count: 'exact', head: true })
    .or('adresse.is.null,adresse.eq."",secteur.is.null,secteur.eq.""');
    
  if (error) console.error(error);
  console.log('Count missing adresse or secteur:', count);
}

checkEmpty();
