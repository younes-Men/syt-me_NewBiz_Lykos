import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
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

// ─── Middlewares ────────────────────────────────────────────────────────────

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-funbooster-key', 'x-connect-mode']
}));

app.use(express.json());
app.use(authMiddleware);

// ─── Routes ─────────────────────────────────────────────────────────────────

app.use('/api/auth',       authRoutes);
app.use('/api/search',     searchCompanies);
app.use('/api/export',     exportExcel);
app.use('/api/entreprise', entrepriseRoutes);
app.use('/api/phone',      phoneRoutes);
app.use('/api/ai',         aiRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'NEWBIZ Backend is running' });
});

// ─── Démarrage ───────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur http://localhost:${PORT}`);
  initNightScraper();
  syncFunboosterKeys();
});
