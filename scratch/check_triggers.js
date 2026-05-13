import { supabaseCrm } from './backend/config/supabase.js';

async function checkTriggers() {
  console.log('Checking triggers for crm_leads...');
  
  // Query pg_trigger table for crm_leads
  const { data, error } = await supabaseCrm.rpc('get_table_triggers', { table_name: 'crm_leads' });
  
  if (error) {
    console.log('RPC get_table_triggers failed, trying manual query...');
    const { data: data2, error: error2 } = await supabaseCrm
      .from('pg_trigger')
      .select('tgname')
      .eq('tgrelid', 'crm_leads'::regclass);
      
    if (error2) {
        // Since I can't run raw SQL easily via Supabase client without RPC, 
        // I will just try to see if there's a common trigger name like 'update_crm_leads_updated_at'
        console.error('Could not query triggers directly:', error2.message);
    } else {
        console.log('Triggers found:', data2);
    }
  } else {
    console.log('Triggers found:', data);
  }
}

// checkTriggers();
