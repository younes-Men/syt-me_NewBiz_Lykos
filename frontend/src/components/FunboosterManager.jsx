import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FunboosterManager = ({ isOpen, onClose, authHeaders }) => {
  const [funboosters, setFunboosters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toggling, setToggling] = useState(null);
  
  // Formulaire d'ajout
  const [newName, setNewName] = useState('');
  const [newProjet, setNewProjet] = useState('OPCO');
  const [newKey, setNewKey] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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

  const handleAddFunbooster = async (e) => {
    e.preventDefault();
    if (!newName || !newProjet || !newKey) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    setIsAdding(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/entreprise/admin/funboosters`,
        { name: newName, projet: newProjet, key: newKey, is_active: true },
        { headers: authHeaders }
      );
      
      setSuccess(response.data.message || 'Funbooster ajouté avec succès');
      setNewName('');
      setNewKey('');
      fetchFunboosters(); // Rafraîchir la liste
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur ajout funbooster:', err);
      setError(err.response?.data?.error || `Erreur lors de l'ajout du Funbooster.`);
    } finally {
      setIsAdding(false);
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
          {success && (
            <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
              {success}
            </div>
          )}
          
          <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-newbiz-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un nouveau Funbooster
            </h3>
            <form onSubmit={handleAddFunbooster} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-white/50 text-xs mb-1 uppercase tracking-wider">Nom (Smia)</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.toUpperCase())}
                  placeholder="EX: ADAM"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-newbiz-purple outline-none transition-colors"
                />
              </div>
              <div className="w-[120px]">
                <label className="block text-white/50 text-xs mb-1 uppercase tracking-wider">Projet</label>
                <select 
                  value={newProjet}
                  onChange={(e) => setNewProjet(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-newbiz-purple outline-none transition-colors appearance-none"
                >
                  <option value="OPCO">OPCO</option>
                  <option value="RCD">RCD</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-white/50 text-xs mb-1 uppercase tracking-wider">Code d'accès</label>
                <input 
                  type="text" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="EX: @FunAdam"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-newbiz-purple outline-none transition-colors"
                />
              </div>
              <button 
                type="submit" 
                disabled={isAdding}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-newbiz-purple to-newbiz-cyan text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isAdding ? 'Ajout...' : 'Ajouter'}
              </button>
            </form>
          </div>

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
                        <span className="text-white font-medium text-lg">{fb.name || fb.key}</span>
                        {fb.projet && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${fb.projet === 'OPCO' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                            {fb.projet}
                          </span>
                        )}
                        {online && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            En ligne
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/40 text-xs mt-0.5">Code: {fb.key}</span>
                        <span className={`text-xs mt-1 uppercase tracking-wider ${fb.is_active ? 'text-green-400/80' : 'text-red-400/80'}`}>
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
