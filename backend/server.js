import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware, authConfig, isFunboosterActive, updateFunboosterActivity } from './middleware/auth.js';
import { searchCompanies } from './routes/search.js';
import { exportExcel } from './routes/export.js';
import { entrepriseRoutes } from './routes/entreprise.js';
import { phoneRoutes } from './routes/phone.js';
import { aiRoutes } from './routes/ai.js';
import { initNightScraper } from './services/nightScraper.js';
import { syncFunboosterKeys } from './utils/authSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de base
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-funbooster-key', 'x-connect-mode']
}));
app.use(express.json());

// Middleware d'Authentification et Protection IP
app.use(authMiddleware);

// Routes API
app.use('/api/search', searchCompanies);
app.use('/api/export', exportExcel);
app.use('/api/entreprise', entrepriseRoutes);
app.use('/api/phone', phoneRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NEWBIZ Backend is running' });
});

// Authentification & Vérification
app.post('/api/auth/verify', async (req, res) => {
  const { key } = req.body;
  const { ADMIN_ACCESS_KEY, FUNBOOSTER_KEYS } = authConfig;

  if (ADMIN_ACCESS_KEY && key === ADMIN_ACCESS_KEY) {
    return res.json({ valid: true, role: 'admin' });
  }
  
  if (FUNBOOSTER_KEYS.includes(key)) {
    // Vérification du statut actif
    const isActive = await isFunboosterActive(key);
    if (!isActive) {
      return res.status(403).json({ 
        valid: false, 
        error: "Accès désactivé : Votre accès a été suspendu par l'administrateur." 
      });
    }

    // Enregistrer l'activité de connexion
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(xForwardedFor) ? xForwardedFor[0] : (xForwardedFor || req.ip || '').split(',')[0].trim();
    updateFunboosterActivity(key, ip.replace('::ffff:', ''));

    return res.json({ valid: true, role: 'funbooster' });
  }
  res.status(401).json({ valid: false, error: 'Clé invalide' });
});

// Rétrocompatibilité Admin
app.post('/api/admin/verify', (req, res) => {
  const { key } = req.body;
  const { ADMIN_ACCESS_KEY } = authConfig;
  if (ADMIN_ACCESS_KEY && key === ADMIN_ACCESS_KEY) {
    res.json({ valid: true, role: 'admin' });
  } else {
    res.status(401).json({ valid: false, error: 'Clé admin invalide' });
  }
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur http://localhost:${PORT}`);
  
  // Démarrer l'ordonnanceur pour le scraping de nuit
  initNightScraper();

  // Synchroniser les accès Funbooster
  syncFunboosterKeys();
});
