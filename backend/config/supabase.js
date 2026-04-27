import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Variables Supabase manquantes. Certaines fonctionnalités ne fonctionneront pas.');
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const crmSupabaseUrl = process.env.CRM_SUPABASE_URL;
const crmSupabaseKey = process.env.CRM_SUPABASE_KEY;

export const supabaseCrm = crmSupabaseUrl && crmSupabaseKey
  ? createClient(crmSupabaseUrl, crmSupabaseKey)
  : null;

if (supabaseCrm) {
  console.log('🔗 Connecté au CRM Séparé (Dual Sync Activé)');
}
