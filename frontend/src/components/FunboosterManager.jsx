import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FunboosterManager = ({ isOpen, onClose, authHeaders }) => {
  const [funboosters, setFunboosters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    let interval;
    if (isOpen) {
      fetchFunboosters();
      // Rafraîchir automatiquement toutes les 30 secondes pour voir qui est en ligne
      interval = setInterval(fetchFunboosters, 30000);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchFunboosters = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/entreprise/admin/funboosters`, {
        headers: authHeaders
      });
      setFunboosters(response.data);
    } catch (err) {
      console.error('Erreur fetch funboosters:', err);
      setError('Impossible de récupérer la liste des Funboosters.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccess = async (key, currentStatus) => {
    setToggling(key);
    try {
      const newStatus = !currentStatus;
      await axios.post(
        `${API_BASE_URL}/api/entreprise/admin/funboosters/toggle`,
        { key, is_active: newStatus },
        { headers: authHeaders }
      );
      
      setFunboosters(prev => 
        prev.map(f => f.key === key ? { ...f, is_active: newStatus } : f)
      );
    } catch (err) {
      console.error('Erreur toggle access:', err);
      alert('Erreur lors de la modification de l\'accès.');
    } finally {
      setToggling(null);
    }
  };

  // Fonction pour vérifier si l'utilisateur est "En ligne" (activité < 2 min)
  const isOnline = (lastSeenAt) => {
    if (!lastSeenAt) return false;
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffInMinutes = (now - lastSeen) / (1000 * 60);
    return diffInMinutes < 2;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-[30px] shadow-[0_30px_100px_rgba(255,0,255,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full"></div>

        <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Gestion des Accès
            </h2>
            <p className="text-white/40 text-sm mt-1">Surveillez l'activité et gérez les accès en temps réel</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all border border-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto relative z-10 custom-scrollbar">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            {funboosters.map((fb) => {
              const online = isOnline(fb.last_seen_at);
              return (
                <div 
                  key={fb.id} 
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${fb.is_active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                      {online && (
                        <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-lg">{fb.key}</span>
                        {online && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            En ligne
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/30 text-xs uppercase tracking-wider">
                          {fb.is_active ? 'Accès Autorisé' : 'Accès Bloqué'}
                        </span>
                        {fb.last_ip && (
                          <span className="text-white/20 text-[10px] font-mono mt-1">
                            Dernière IP: {fb.last_ip}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={fb.is_active}
                      onChange={() => toggleAccess(fb.key, fb.is_active)}
                      disabled={toggling === fb.key}
                    />
                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white/60 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-600 peer-checked:after:bg-white shadow-inner transition-all duration-300"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-between items-center relative z-10">
          <button 
            onClick={fetchFunboosters}
            className="text-white/40 hover:text-white text-sm transition-colors flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading && funboosters.length > 0 ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all border border-white/10"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default FunboosterManager;
