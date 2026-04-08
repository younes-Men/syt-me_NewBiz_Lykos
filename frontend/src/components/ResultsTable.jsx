import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TableRow from './TableRow';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUT_OPTIONS = {
  'A traiter': { color: '#6c757d', bg: '#e9ecef', border: '#ced4da' },
  'Pas de num': { color: '#ffffff', bg: '#99756c', border: '#ffcc99' },
  'Repondeur': { color: '#ffffff', bg: '#79affd', border: '#c3e6cb' },
  'Occupé': { color: '#ffffff', bg: '#f27b54', border: '#ffeaa7' },
  'Rdv': { color: '#ffffff', bg: '#11734b', border: '#bee5eb' },
  'SIGNE': { color: '#ffffff', bg: '#00cc66', border: '#00ff80' }, // Vert vif pour signe
  'Rappel': { color: '#ffffff', bg: '#ff4185', border: '#ffcc99' },
  'Nrp': { color: '#000000', bg: '#feff00', border: '#f5c6cb' },
  'Hors Cible Opco': { color: '#ffffff', bg: '#3d3d3d', border: '#d1c4e9' },
  'Hors cible salariés': { color: '#ffffff', bg: '#3d3d3d', border: '#f5c6cb' },
  'Hors cible Siège': { color: '#ffffff', bg: '#3d3d3d', border: '#a3e4d7' },
  'Deja pec': { color: '#ffffff', bg: '#017f9b', border: '#99ccff' },
  'Absent': { color: '#ffffff', bg: '#beb000', border: '#dee2e6' },
  'Pi': { color: '#ffffff', bg: '#b10202', border: '#d6d8db' },
  'Faux num': { color: '#ffffff', bg: '#9d99ba', border: '#f5c6cb' }
};

const CLIENT_OF_OPTIONS = {
  'CA CONSEILS': { color: '#ffffff', bg: '#ff642e', border: '#ffcc99' }, // Orange
  'HORS ZONE': { color: '#ffffff', bg: '#ff0080', border: '#f5c6cb' }, // Rose
  'TB FORMATIONS': { color: '#ffffff', bg: '#373199', border: '#bee5eb' }, // Bleu ciel
  'IT PERFORMANCE': { color: '#000000', bg: '#c6f106', border: '#a3e4d7' }, // Teal
  'GO CONSEILS': { color: '#ffffff', bg: '#1fbfbf', border: '#a3e4d7' }
};

function ResultsTable({ results, projet, authHeaders }) {
  const [entrepriseData, setEntrepriseData] = useState({});
  const [selectedSiret, setSelectedSiret] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(Object.keys(STATUT_OPTIONS)));
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fermer le filtre si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setIsFilterOpen(false);
    if (isFilterOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isFilterOpen]);

  useEffect(() => {
    // Charger les données depuis Supabase à chaque fois que les résultats changent
    const loadDataFromSupabase = async () => {
      const sirets = results.map(ent => ent.siret).filter(Boolean);
      if (sirets.length === 0) {
        setEntrepriseData({});
        return;
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/entreprise/batch`,
          {
            sirets,
            projet: projet
          },
          { headers: authHeaders }
        );
        setEntrepriseData(response.data || {});
      } catch (error) {
        console.warn('Impossible de charger les données depuis Supabase:', error);
        // En cas d'erreur, initialiser avec des valeurs vides
        const emptyData = {};
        sirets.forEach(siret => {
          emptyData[siret] = {
            status: 'A traiter',
            date_modification: null,
            funebooster: '',
            observation: '',
            tel: '',
            client_of: '',
            nom_opco: '',
            secteur: results.find(ent => ent.siret === siret)?.secteur || ''
          };
        });
        setEntrepriseData(emptyData);
      }
    };

    loadDataFromSupabase();
  }, [results, projet]);

  const updateEntrepriseData = async (siret, field, value) => {
    try {
      const currentData = entrepriseData[siret] || {
        status: 'A traiter',
        date_modification: null,
        funebooster: '',
        observation: '',
        tel: '',
        client_of: ''
      };

      const updatedData = { ...currentData };
      if (field === 'status') {
        updatedData.status = value;
        updatedData.date_modification = new Date().toISOString();
      } else if (field === 'funebooster') {
        updatedData.funebooster = value;
      } else if (field === 'observation') {
        updatedData.observation = value;
      } else if (field === 'tel') {
        updatedData.tel = value;
      } else if (field === 'client_of') {
        updatedData.client_of = value;
      } else if (field === 'nom_opco') {
        updatedData.nom_opco = value;
      }

      // Trouver l'entreprise dans les résultats pour avoir le nom et l'adresse
      const entrepriseInfo = results.find(ent => ent.siret === siret) || {};

      // Sauvegarder dans Supabase d'abord
      const response = await axios.put(
        `${API_BASE_URL}/api/entreprise/${siret}`,
        {
          status: updatedData.status,
          funebooster: updatedData.funebooster,
          observation: updatedData.observation,
          tel: updatedData.tel,
          client_of: updatedData.client_of,
          nom_opco: updatedData.nom_opco,
          projet: projet,
          nom: entrepriseInfo.nom || '',
          adresse: entrepriseInfo.adresse || '',
          secteur: entrepriseInfo.secteur || ''
        },
        { headers: authHeaders }
      );

      // Mettre à jour localement avec les données retournées par Supabase
      if (response.data && response.data.data) {
        const savedData = response.data.data;
        setEntrepriseData(prev => ({
          ...prev,
          [siret]: {
            status: savedData.status || updatedData.status,
            date_modification: savedData.date_modification || updatedData.date_modification,
            funebooster: savedData.funebooster || updatedData.funebooster,
            observation: savedData.observation || updatedData.observation,
            tel: savedData.tel || updatedData.tel || '',
            client_of: savedData.client_of || updatedData.client_of || '',
            nom_opco: savedData.nom_opco || updatedData.nom_opco || '',
            secteur: savedData.secteur || updatedData.secteur || entrepriseInfo.secteur || ''
          }
        }));
      } else {
        // Fallback si la réponse n'a pas le format attendu
        setEntrepriseData(prev => ({
          ...prev,
          [siret]: updatedData
        }));
      }

      // Recharger toutes les données depuis Supabase pour s'assurer que tout est synchronisé
      // Cela permet à tous les téléconseillers de voir les mises à jour des autres
      setTimeout(async () => {
        const sirets = results.map(ent => ent.siret).filter(Boolean);
        if (sirets.length > 0) {
          try {
            const response = await axios.post(
              `${API_BASE_URL}/api/entreprise/batch`,
              {
                sirets,
                projet: projet
              },
              { headers: authHeaders }
            );
            setEntrepriseData(response.data || {});
          } catch (error) {
            console.warn('Erreur lors du rechargement:', error);
          }
        }
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      // Afficher un message d'erreur à l'utilisateur
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  const toggleStatusFilter = (status) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedStatuses(newStatuses);
  };

  const selectAllStatuses = () => {
    setSelectedStatuses(new Set(Object.keys(STATUT_OPTIONS)));
  };

  const deselectAllStatuses = () => {
    setSelectedStatuses(new Set());
  };

  // Filtrer les résultats selon les statuts sélectionnés
  const filteredResults = results.filter(ent => {
    // Si aucune case n'est cochée dans le filtre, par défaut on affiche TOUT (comportement intelligent)
    if (selectedStatuses.size === 0) return true;

    const siret = ent.siret || '';
    const data = entrepriseData[siret] || { status: 'A traiter' };
    const status = data.status || 'A traiter';
    return selectedStatuses.has(status);
  });

  return (
    <div className="rounded-[10px] shadow-lg overflow-hidden">
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-hide-x" style={{ minHeight: isFilterOpen ? '450px' : 'auto' }}>
        <table className="w-full border-collapse bg-[#1a1a1a]">
          <thead className="bg-gradient-newbiz text-white sticky top-0 z-20 shadow-lg">
            <tr>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">N°</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Nom</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Adresse</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Secteur</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">SIRET</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">SIREN</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Effectif</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">État</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">OPCO (Lien)</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Sélection OPCO</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Téléphone</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Tél</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Dirigeant</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider relative">
                <div className="flex items-center gap-2">
                  <span>Statut</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFilterOpen(!isFilterOpen);
                    }}
                    className={`p-1 rounded hover:bg-[rgba(255,255,255,0.2)] transition-colors ${selectedStatuses.size !== Object.keys(STATUT_OPTIONS).length ? 'text-yellow-400' : 'text-white'}`}
                    title="Filtrer par statut"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                  </button>
                </div>

                {/* Dropdown Filtre */}
                {isFilterOpen && (
                  <div
                    className="absolute top-full right-0 mt-1 w-64 bg-[#2a2a2a] border border-[rgba(255,255,255,0.1)] shadow-2xl rounded-lg z-50 py-3 px-1 text-white normal-case font-normal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between px-3 pb-2 border-b border-[rgba(255,255,255,0.1)] mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <span>Filtrer les statuts</span>
                      <div className="flex gap-3">
                        <button onClick={selectAllStatuses} className="hover:text-white transition-colors">Tous</button>
                        <button onClick={deselectAllStatuses} className="hover:text-white transition-colors">Aucun</button>
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {Object.keys(STATUT_OPTIONS).map(opt => (
                        <label
                          key={opt}
                          className="flex items-center px-3 py-2 hover:bg-[rgba(255,255,255,0.05)] cursor-pointer group transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStatuses.has(opt)}
                            onChange={() => toggleStatusFilter(opt)}
                            className="mr-3 w-4 h-4 rounded border-gray-600 bg-gray-700 text-newbiz-purple focus:ring-newbiz-purple focus:ring-offset-gray-800"
                          />
                          <span className="text-sm group-hover:text-white">{opt}</span>
                          <span
                            className="ml-auto w-2 h-2 rounded-full"
                            style={{ backgroundColor: STATUT_OPTIONS[opt].bg }}
                          ></span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Date de modification</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">CLIENT OF</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">FunBooster</th>
              <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Observation</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults
              .map((ent, index) => {
                const siret = ent.siret || '';
                const data = entrepriseData[siret] || {
                  status: 'A traiter',
                  date_modification: null,
                  funebooster: '',
                  observation: '',
                  tel: '',
                  client_of: '',
                  nom_opco: '',
                  secteur: ent.secteur || ''
                };

                return { ent, index, siret, data };
              })
              .map(({ ent, index, siret, data }) => (
                <TableRow
                  key={siret || index}
                  entreprise={ent}
                  index={index}
                  entrepriseData={data}
                  statutOptions={STATUT_OPTIONS}
                  clientOfOptions={CLIENT_OF_OPTIONS}
                  onUpdate={updateEntrepriseData}
                  isSelected={selectedSiret === siret}
                  onSelectRow={() => setSelectedSiret(siret)}
                  projet={projet}
                  authHeaders={authHeaders}
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsTable;

