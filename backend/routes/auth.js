import express from 'express';
import { authConfig, isFunboosterActive, updateFunboosterActivity } from '../middleware/auth.js';

const router = express.Router();

/**
 * Vérifie une clé d'accès (admin ou funbooster) et retourne le rôle correspondant.
 */
router.post('/verify', async (req, res) => {
  const { key } = req.body;
  const { ADMIN_ACCESS_KEY, FUNBOOSTER_KEYS } = authConfig;

  if (ADMIN_ACCESS_KEY && key === ADMIN_ACCESS_KEY) {
    return res.json({ valid: true, role: 'admin' });
  }

  if (FUNBOOSTER_KEYS.includes(key)) {
    const isActive = await isFunboosterActive(key);
    if (!isActive) {
      return res.status(403).json({
        valid: false,
        error: "Accès désactivé : Votre accès a été suspendu par l'administrateur."
      });
    }

    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : (xForwardedFor || req.ip || '').split(',')[0].trim();

    updateFunboosterActivity(key, ip.replace('::ffff:', ''));

    return res.json({ valid: true, role: 'funbooster' });
  }

  return res.status(401).json({ valid: false, error: 'Clé invalide' });
});

/**
 * Route de rétrocompatibilité pour la vérification admin uniquement.
 */
router.post('/admin/verify', (req, res) => {
  const { key } = req.body;
  const { ADMIN_ACCESS_KEY } = authConfig;

  if (ADMIN_ACCESS_KEY && key === ADMIN_ACCESS_KEY) {
    return res.json({ valid: true, role: 'admin' });
  }

  return res.status(401).json({ valid: false, error: 'Clé admin invalide' });
});

export { router as authRoutes };
