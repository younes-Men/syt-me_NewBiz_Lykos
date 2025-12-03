import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { searchCompanies } from './routes/search.js';
import { exportExcel } from './routes/export.js';
import { entrepriseRoutes } from './routes/entreprise.js';
import { phoneRoutes } from './routes/phone.js';
import { aiRoutes } from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Protection IP simple + accès admin
const ALLOWED_IP = process.env.ALLOWED_IP || '154.146.232.85';
const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || null;

app.use((req, res, next) => {
  // Laisser passer le health check sans restriction
  if (req.path === '/api/health') {
    return next();
  }

  // Récupérer l'IP réelle derrière le proxy Render
  const xForwardedFor = req.headers['x-forwarded-for'];
  const remoteIp = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]
    : (xForwardedFor || req.ip || '').split(',')[0].trim();

  const hasIpAccess = remoteIp === ALLOWED_IP;

  // Vérifier la clé admin (par ex. envoyée depuis le front dans un header)
  const adminKey = req.headers['x-admin-key'];
  const isAdmin = ADMIN_ACCESS_KEY && adminKey === ADMIN_ACCESS_KEY;

  if (!hasIpAccess && !isAdmin) {
    return res.status(403).json({
      error: 'Accès refusé : cette application n’est utilisable qu’à partir du centre d’appel.'
    });
  }

  next();
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

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur http://localhost:${PORT}`);
});

