import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchPanel from './components/SearchPanel';
import ResultsTable from './components/ResultsTable';
import StatusMessage from './components/StatusMessage';
import Leaderboard from './components/Leaderboard';
import Logo from './images/Logo2.jpeg';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [canExport, setCanExport] = useState(false);
  const [selectedProjet, setSelectedProjet] = useState('OPCO');
  const [adminKey, setAdminKey] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Charger la clé admin depuis le localStorage au démarrage
  useEffect(() => {
    const storedKey = localStorage.getItem('ADMIN_ACCESS_KEY') || '';
    if (storedKey) {
      setAdminKey(storedKey);
      setIsAdmin(true);
    }
  }, []);

  const handleAdminLogin = () => {
    const input = window.prompt('Entrez la clé admin :');
    if (!input) return;

    // On peut ajouter plus tard une vérification côté serveur si besoin
    localStorage.setItem('ADMIN_ACCESS_KEY', input);
    setAdminKey(input);
    setIsAdmin(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('ADMIN_ACCESS_KEY');
    setAdminKey('');
    setIsAdmin(false);
  };

  const searchCompanies = async (secteur, departement) => {
    const secteurTrimmed = (secteur || '').trim();
    const zone = (departement || '').trim();

    if (!secteurTrimmed || !zone) {
      showStatus('Veuillez remplir les champs Secteur et Département ou code postal.', 'error');
      return;
    }

    // Valider que la zone est soit un département (2 chiffres), soit un code postal (5 chiffres)
    const isDepartement = /^\d{2}$/.test(zone);
    const isCodePostal = /^\d{5}$/.test(zone);

    if (!isDepartement && !isCodePostal) {
      showStatus('Veuillez saisir soit un numéro de département (2 chiffres), soit un code postal (5 chiffres).', 'error');
      return;
    }

    setLoading(true);
    setStatus({ message: '', type: '' });
    setCanExport(false);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/search`,
        {
          secteur: secteurTrimmed,
          departement: zone,
        },
        adminKey
          ? { headers: { 'x-admin-key': adminKey } }
          : undefined
      );

      const data = response.data;
      setResults(data.results || []);

      if (data.results && data.results.length > 0) {
        setCanExport(true);
        showStatus(`✓ ${data.results.length} entreprise(s) trouvée(s).`, 'success');
      } else {
        showStatus('Aucune entreprise trouvée pour ces critères.', 'error');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de la recherche';
      showStatus(`Erreur : ${errorMessage}`, 'error');
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchBySiret = async (siret) => {
    const siretTrimmed = (siret || '').trim();

    if (!siretTrimmed) {
      showStatus('Veuillez saisir un numéro SIRET.', 'error');
      return;
    }

    // Valider le format SIRET (14 chiffres)
    if (!/^\d{14}$/.test(siretTrimmed)) {
      showStatus('Le SIRET doit contenir exactement 14 chiffres.', 'error');
      return;
    }

    setLoading(true);
    setStatus({ message: '', type: '' });
    setCanExport(false);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/search/siret`,
        {
          siret: siretTrimmed,
        },
        adminKey
          ? { headers: { 'x-admin-key': adminKey } }
          : undefined
      );

      const data = response.data;
      setResults(data.results || []);

      if (data.results && data.results.length > 0) {
        setCanExport(true);
        showStatus(`✓ ${data.results.length} entreprise(s) trouvée(s).`, 'success');
      } else {
        showStatus('Aucune entreprise trouvée pour ce SIRET.', 'error');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de la recherche';
      showStatus(`Erreur : ${errorMessage}`, 'error');
      console.error('Erreur lors de la recherche par SIRET:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchByTel = async (tel) => {
    const telTrimmed = (tel || '').trim();

    if (!telTrimmed) {
      showStatus('Veuillez saisir un numéro de téléphone.', 'error');
      return;
    }

    setLoading(true);
    setStatus({ message: '', type: '' });
    setCanExport(false);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/entreprise/search/tel`,
        {
          tel: telTrimmed,
          projet: selectedProjet
        },
        adminKey
          ? { headers: { 'x-admin-key': adminKey } }
          : undefined
      );

      const data = response.data;
      setResults(data.results || []);

      if (data.results && data.results.length > 0) {
        setCanExport(true);
        showStatus(`✓ ${data.results.length} entreprise(s) trouvée(s) avec ce numéro.`, 'success');
      } else {
        showStatus('Aucune entreprise trouvée avec ce numéro de téléphone.', 'error');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de la recherche';
      showStatus(`Erreur : ${errorMessage}`, 'error');
      console.error('Erreur lors de la recherche par téléphone:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (results.length === 0) {
      showStatus('Aucune donnée à exporter.', 'error');
      return;
    }

    try {
      // Récupérer les données depuis Supabase
      const sirets = results.map(ent => ent.siret).filter(Boolean);
      let entrepriseDataMap = {};

      if (sirets.length > 0) {
        try {
          const batchResponse = await axios.post(
            `${API_BASE_URL}/api/entreprise/batch`,
            {
              sirets,
              projet: selectedProjet
            },
            adminKey
              ? { headers: { 'x-admin-key': adminKey } }
              : undefined
          );
          entrepriseDataMap = batchResponse.data || {};
        } catch (err) {
          console.warn('Impossible de récupérer les données Supabase:', err);
        }
      }

      // Enrichir les résultats avec les données Supabase
      const enrichedResults = results.map(ent => {
        const siret = ent.siret || '';
        const entrepriseData = entrepriseDataMap[siret] || {};
        return {
          ...ent,
          statut: entrepriseData.status || 'A traiter',
          date_modification: entrepriseData.date_modification || '',
          funbooster: entrepriseData.funebooster || '',
          observation: entrepriseData.observation || ''
        };
      });

      const response = await axios.post(
        `${API_BASE_URL}/api/export`,
        { results: enrichedResults, projet: selectedProjet },
        adminKey
          ? { responseType: 'blob', headers: { 'x-admin-key': adminKey } }
          : { responseType: 'blob' }
      );

      // Télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `entreprises_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showStatus('✓ Fichier Excel téléchargé avec succès !', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de l\'export';
      showStatus(`Erreur lors de l'export : ${errorMessage}`, 'error');
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const showStatus = (message, type) => {
    setStatus({ message, type });
  };

  return (
    <div className="min-h-screen bg-black p-5">
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        projet={selectedProjet}
        adminKey={adminKey}
      />

      <div className="max-w-[1600px] mx-auto bg-[#1a1a1a] rounded-[20px] shadow-[0_20px_60px_rgba(255,0,255,0.2)] overflow-hidden border border-[rgba(255,0,255,0.3)]">
        {/* Header */}
        <header className="bg-black text-white p-10 text-center border-b border-[rgba(255,0,255,0.4)] shadow-[0_10px_40px_rgba(255,0,255,0.25)]">
          <div className="relative w-full py-5 my-0">
            <img
              src={Logo}
              alt="Logo"
              className="w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(255,0,255,0.7)]"
            />
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[60%] h-[3px] bg-gradient-newbiz rounded-[2px] shadow-[0_0_10px_rgba(255,0,255,0.6)]"></span>
          </div>
          {/* Sélecteur de projet */}
          <div className="mt-6 flex justify-center gap-4 items-center flex-wrap">
            <select
              value={selectedProjet}
              onChange={(e) => {
                setSelectedProjet(e.target.value);
                setResults([]);
                setCanExport(false);
              }}
              className="px-6 py-3 rounded-lg border-2 border-white/30 bg-white/10 text-white text-lg font-semibold cursor-pointer transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="OPCO" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>OPCO</option>
              <option value="Assurance" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Assurance</option>
            </select>

            <button
              onClick={() => setShowLeaderboard(true)}
              className="px-6 py-3 rounded-lg border-2 border-blue-500/50 bg-blue-500/10 text-blue-300 text-lg font-semibold cursor-pointer transition-all hover:bg-blue-500/20 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2"
            >
              <span>🏆</span> Classement
            </button>

            {/* Bouton Admin */}
            <button
              type="button"
              onClick={isAdmin ? handleAdminLogout : handleAdminLogin}
              className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${isAdmin
                  ? 'border-green-400 text-green-300 bg-white/10 hover:bg-white/20'
                  : 'border-yellow-400 text-yellow-300 bg-white/5 hover:bg-white/15'
                }`}
              title={isAdmin ? 'Se déconnecter du mode admin' : 'Se connecter en tant qu’admin'}
            >
              {isAdmin ? 'Admin connecté' : 'Connexion admin'}
            </button>
          </div>
        </header>

        {/* Search Panel */}
        <SearchPanel onSearch={searchCompanies} onSearchBySiret={searchBySiret} onSearchByTel={searchByTel} onExport={exportToExcel} canExport={canExport} />

        {/* Status Message */}
        {status.message && (
          <StatusMessage message={status.message} type={status.type} />
        )}

        {/* Results */}
        <div className="p-8">
          {loading && (
            <div className="text-center py-16 text-newbiz-purple">
              <div className="w-12 h-12 border-4 border-[rgba(255,0,255,0.2)] border-t-newbiz-purple rounded-full animate-spin mx-auto mb-5"></div>
              <p>Recherche en cours...</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <ResultsTable results={results} projet={selectedProjet} adminKey={adminKey} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

