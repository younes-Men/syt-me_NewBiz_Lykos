import dotenv from 'dotenv';

dotenv.config();

const ALLOWED_IPS = (process.env.ALLOWED_IPS || '154.146.232.85,185.200.206.223,127.0.0.1,::1').split(',').map(ip => ip.trim());
const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || null;
const FUNBOOSTER_KEYS = (process.env.FUNBOOSTER_KEYS || '').split(',').map(k => k.trim());

/**
 * Middleware de protection par IP et clé d'accès
 */
export const authMiddleware = (req, res, next) => {
  // Laisser passer le health check et les vérifications auth sans restriction au niveau IP ici 
  // (car elles seront vérifiées à l'intérieur de la route si nécessaire)
  const publicPaths = ['/api/health', '/api/admin/verify', '/api/auth/verify'];
  if (publicPaths.some(path => req.path === path || req.path.startsWith(path))) {
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

  console.log(`[AUTH] Client IP: ${remoteIp}`);

  const hasIpAccess = ALLOWED_IPS.includes(remoteIp);

  // Vérifier les clés
  const adminKey = req.headers['x-admin-key'];
  const funboosterKey = req.headers['x-funbooster-key'];
  const connectMode = req.headers['x-connect-mode']; // 'remote' pour connexion hors centre

  const isAdmin = ADMIN_ACCESS_KEY && adminKey === ADMIN_ACCESS_KEY;
  const isFunbooster = funboosterKey && FUNBOOSTER_KEYS.includes(funboosterKey);

  // L'admin a accès de partout
  if (isAdmin) {
    return next();
  }

  // Le Funbooster doit avoir une IP autorisée ou être en mode "remote"
  if (isFunbooster) {
    const isRemoteConnect = connectMode === 'remote';
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
};

/**
 * Exposer les clés pour les routes de vérification
 */
export const authConfig = {
  ADMIN_ACCESS_KEY,
  FUNBOOSTER_KEYS
};
