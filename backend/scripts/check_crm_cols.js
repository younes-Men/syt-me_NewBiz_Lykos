import { supabaseCrm } from '../config/supabase.js';

async function checkCols() {
  if (!supabaseCrm) {
    console.error('supabaseCrm not configured');
    return;
  }
  const { data, error } = await supabaseCrm
    .from('crm_leads')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error(error);
  } else if (data && data.length > 0) {
    console.log('Columns in crm_leads:', Object.keys(data[0]));
  } else {
    console.log('No data in crm_leads');
  }
}

checkCols();
