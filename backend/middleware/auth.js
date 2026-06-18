import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

const ALLOWED_IPS = (process.env.ALLOWED_IPS || '154.146.232.85,185.200.206.223,127.0.0.1,::1').split(',').map(ip => ip.trim());
const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || null;
const FUNBOOSTER_KEYS = (process.env.FUNBOOSTER_KEYS || '').split(',').map(k => k.trim());

/**
 * Met à jour l'activité d'un Funbooster (IP et Date)
 */
export const updateFunboosterActivity = async (key, ip) => {
  if (!supabase) return;
  try {
    await supabase
      .from('funbooster_access')
      .update({ 
        last_ip: ip, 
        last_seen_at: new Date().toISOString() 
      })
      .eq('key', key);
  } catch (err) {
    console.error('[AUTH] Erreur update activity:', err);
  }
};

/**
 * Vérifie si une clé Funbooster est active dans la base de données
 */
export const isFunboosterActive = async (key) => {
  if (!supabase) return true;
  
  try {
    const { data, error } = await supabase
      .from('funbooster_access')
      .select('is_active')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('funbooster_access')) {
        return true;
      }
      return true;
    }
    
    return data?.is_active !== false;
  } catch (err) {
    return true;
  }
};

/**
 * Middleware de protection par IP et clé d'accès
 */
export const authMiddleware = async (req, res, next) => {
  const publicPaths = ['/api/health', '/api/auth'];
  if (publicPaths.some(path => req.path === path || req.path.startsWith(path))) {
    return next();
  }

  const xForwardedFor = req.headers['x-forwarded-for'];
  let remoteIp = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]
    : (xForwardedFor || req.ip || '').split(',')[0].trim();

  if (remoteIp.startsWith('::ffff:')) {
    remoteIp = remoteIp.replace('::ffff:', '');
  }

  const hasIpAccess = ALLOWED_IPS.includes(remoteIp);

  const adminKey = req.headers['x-admin-key'];
  const funboosterKey = req.headers['x-funbooster-key'];
  const connectMode = req.headers['x-connect-mode'];

  const isAdmin = ADMIN_ACCESS_KEY && adminKey === ADMIN_ACCESS_KEY;
  const isFunbooster = funboosterKey && FUNBOOSTER_KEYS.includes(funboosterKey);

  if (isAdmin) {
    return next();
  }

  if (isFunbooster) {
    const isActive = await isFunboosterActive(funboosterKey);
    if (!isActive) {
      return res.status(403).json({
        error: "Accès désactivé : Votre accès a été suspendu par l'administrateur."
      });
    }

    // MISE À JOUR DE L'ACTIVITÉ (IP et Heure)
    updateFunboosterActivity(funboosterKey, remoteIp);

    const isRemoteConnect = connectMode === 'remote';
    if (isRemoteConnect || hasIpAccess) {
      return next();
    } else {
      return res.status(403).json({
        error: "Accès refusé : votre adresse IP n'est pas autorisée pour cet accès Funbooster."
      });
    }
  }

  return res.status(401).json({
    error: "Accès non autorisé. Veuillez vous connecter."
  });
};

export const authConfig = {
  ADMIN_ACCESS_KEY,
  FUNBOOSTER_KEYS
};
