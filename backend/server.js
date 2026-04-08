import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { searchCompanies } from './routes/search.js';
import { exportExcel } from './routes/export.js';
import { entrepriseRoutes } from './routes/entreprise.js';
import { phoneRoutes } from './routes/phone.js';
import { aiRoutes } from './routes/ai.js';
import { initNightScraper } from './services/nightScraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // En production, idéalement mettre l'URL du frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-funbooster-key', 'x-connect-mode']
}));
app.use(express.json());

// Protection IP simple + accès admin
const ALLOWED_IPS = (process.env.ALLOWED_IPS || '154.146.232.85,185.200.206.223,127.0.0.1,::1').split(',').map(ip => ip.trim());
const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || null;
const FUNBOOSTER_KEYS = (process.env.FUNBOOSTER_KEYS || '').split(',').map(k => k.trim());

app.use((req, res, next) => {
  // Laisser passer le health check et la vérification auth sans restriction
  // Utiliser startsWith pour éviter les soucis de slash final ou de paramètres
  if (req.path === '/api/health' || req.path.startsWith('/api/admin/verify') || req.path.startsWith('/api/auth/verify')) {
    return next();
  }

  // Récupérer l'IP réelle derrière le proxy Render
  const xForwardedFor = req.headers['x-forwarded-for'];
  let remoteIp = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]
    : (xForwardedFor || req.ip || '').split(',')[0].trim();

  // Normaliser l'IP (enlever le préfixe IPv6 mapé IPv4 ::ffff:)
  if (remoteIp.startsWith('::ffff:')) {
    remoteIp = remoteIp.replace('::ffff:', '');
  }

  // Log pour aider au debug
  console.log(`[AUTH] Client IP: ${remoteIp}`);

  const hasIpAccess = ALLOWED_IPS.includes(remoteIp);

  // Vérifier les clés
  const adminKey = req.headers['x-admin-key'];
  const funboosterKey = req.headers['x-funbooster-key'];
  const connectMode = req.headers['x-connect-mode']; // 'remote' pour connexion hors centre

  const isAdmin = ADMIN_ACCESS_KEY && adminKey === ADMIN_ACCESS_KEY;
  const isFunbooster = funboosterKey && FUNBOOSTER_KEYS.includes(funboosterKey);

  // Si c'est une connexion hors centre (remote), on ignore la validation IP
  // MAIS LE CODE DOIT ETRE VALIDE (déjà vérifié par isFunbooster)
  const isRemoteConnect = connectMode === 'remote';

  // L'admin a accès de partout
  if (isAdmin) {
    return next();
  }

  // Le Funbooster doit avoir une IP autorisée
  if (isFunbooster) {
    // Si connexion hors centre OU IP autorisée, c'est bon
    if (isRemoteConnect || hasIpAccess) {
      return next();
    } else {
      return res.status(403).json({
        error: "Accès refusé : votre adresse IP n'est pas autorisée pour cet accès Funbooster."
      });
    }
  }

  // Aucun accès valide
  return res.status(401).json({
    error: "Accès non autorisé. Veuillez vous connecter."
  });
});

// Initialiser Supabase
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

// Routes
app.use('/api/search', searchCompanies);
app.use('/api/export', exportExcel);
app.use('/api/entreprise', entrepriseRoutes);
app.use('/api/phone', phoneRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NEWBIZ Backend is running' });
});

// Vérifier les clés (Admin ou Funbooster)
app.post('/api/auth/verify', (req, res) => {
  const { key } = req.body;

  if (ADMIN_ACCESS_KEY && key === ADMIN_ACCESS_KEY) {
    return res.json({ valid: true, role: 'admin' });
  }

  if (FUNBOOSTER_KEYS.includes(key)) {
    return res.json({ valid: true, role: 'funbooster' });
  }

  res.status(401).json({ valid: false, error: 'Clé invalide' });
});

// Rétrocompatibilité pour la vérification admin
app.post('/api/admin/verify', (req, res) => {
  const { key } = req.body;
  if (ADMIN_ACCESS_KEY && key === ADMIN_ACCESS_KEY) {
    res.json({ valid: true, role: 'admin' });
  } else {
    res.status(401).json({ valid: false, error: 'Clé admin invalide' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur http://localhost:${PORT}`);
  
  // Démarrer l'ordonnanceur pour le scraping de nuit
  initNightScraper();
});

