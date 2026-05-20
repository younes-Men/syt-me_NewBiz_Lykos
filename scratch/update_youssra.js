import dotenv from 'dotenv';
import { supabase, supabaseCrm } from '../backend/config/supabase.js';

dotenv.config();

async function run() {
  console.log('Starting migration from YOUSSRA to YOSRA...');

  // 1. Update funbooster_access table (local Supabase)
  if (supabase) {
    console.log('\nChecking funbooster_access in local Supabase...');
    
    // Check if @FunYoussra exists
    const { data: youssraKey, error: checkErr } = await supabase
      .from('funbooster_access')
      .select('*')
      .eq('key', '@FunYoussra');

    if (checkErr) {
      console.error('Error checking funbooster_access:', checkErr.message);
    } else if (youssraKey && youssraKey.length > 0) {
      console.log('Found @FunYoussra key. Deleting it...');
      const { error: delErr } = await supabase
        .from('funbooster_access')
        .delete()
        .eq('key', '@FunYoussra');
      if (delErr) {
        console.error('Error deleting @FunYoussra key:', delErr.message);
      } else {
        console.log('Successfully deleted @FunYoussra key from funbooster_access.');
      }
    } else {
      console.log('No @FunYoussra key found in funbooster_access.');
    }

    // Insert @FunYosra if not exists (although syncFunboosterKeys does this at start, let's do it here too)
    const { data: yosraKey, error: checkYosraErr } = await supabase
      .from('funbooster_access')
      .select('*')
      .eq('key', '@FunYosra');

    if (checkYosraErr) {
      console.error('Error checking for @FunYosra key:', checkYosraErr.message);
    } else if (!yosraKey || yosraKey.length === 0) {
      console.log('Inserting @FunYosra key...');
      const { error: insErr } = await supabase
        .from('funbooster_access')
        .insert({ key: '@FunYosra', is_active: true });
      if (insErr) {
        console.error('Error inserting @FunYosra key:', insErr.message);
      } else {
        console.log('Successfully inserted @FunYosra key.');
      }
    } else {
      console.log('@FunYosra key already exists in funbooster_access.');
    }

    // 2. Update entreprise table in local Supabase
    console.log('\nChecking entreprise table in local Supabase...');
    const { data: rowsToUpdate, error: fetchErr } = await supabase
      .from('entreprise')
      .select('siret, funebooster')
      .eq('funebooster', 'YOUSSRA');

    if (fetchErr) {
      console.error('Error fetching rows from entreprise table:', fetchErr.message);
    } else if (rowsToUpdate && rowsToUpdate.length > 0) {
      console.log(`Found ${rowsToUpdate.length} rows with funebooster = 'YOUSSRA'. Updating them to 'YOSRA'...`);
      const { data: updatedRows, error: updErr } = await supabase
        .from('entreprise')
        .update({ funebooster: 'YOSRA' })
        .eq('funebooster', 'YOUSSRA');

      if (updErr) {
        console.error('Error updating entreprise table:', updErr.message);
      } else {
        console.log(`Successfully updated ${rowsToUpdate.length} rows to 'YOSRA' in local Supabase.`);
      }
    } else {
      console.log('No rows with funebooster = ' + "'YOUSSRA' found in entreprise table.");
    }
  } else {
    console.log('Local Supabase client not initialized.');
  }

  // 3. Update crm_leads table in supabaseCrm
  if (supabaseCrm) {
    console.log('\nChecking crm_leads table in Supabase CRM...');
    const { data: crmRowsToUpdate, error: crmFetchErr } = await supabaseCrm
      .from('crm_leads')
      .select('siret, funebooster')
      .eq('funebooster', 'YOUSSRA');

    if (crmFetchErr) {
      console.error('Error fetching rows from crm_leads table:', crmFetchErr.message);
    } else if (crmRowsToUpdate && crmRowsToUpdate.length > 0) {
      console.log(`Found ${crmRowsToUpdate.length} rows in crm_leads with funebooster = 'YOUSSRA'. Updating to 'YOSRA'...`);
      const { error: crmUpdErr } = await supabaseCrm
        .from('crm_leads')
        .update({ funebooster: 'YOSRA' })
        .eq('funebooster', 'YOUSSRA');

      if (crmUpdErr) {
        console.error('Error updating crm_leads table:', crmUpdErr.message);
      } else {
        console.log(`Successfully updated ${crmRowsToUpdate.length} rows to 'YOSRA' in Supabase CRM.`);
      }
    } else {
      console.log("No rows with funebooster = 'YOUSSRA' found in crm_leads table.");
    }
  } else {
    console.log('Supabase CRM client not initialized.');
  }

  console.log('\nMigration script completed.');
}

run();
