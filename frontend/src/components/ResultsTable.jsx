import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TableRow from './TableRow';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUT_OPTIONS = {
  'A traiter': { color: '#6c757d', bg: '#e9ecef', border: '#ced4da' },
  'Repondeur': { color: '#28a745', bg: '#d4edda', border: '#c3e6cb' },
  'Occupé': { color: '#ffc107', bg: '#fff3cd', border: '#ffeaa7' },
  'Rdv': { color: '#17a2b8', bg: '#d1ecf1', border: '#bee5eb' },
  'Rappel': { color: '#fd7e14', bg: '#ffe5d0', border: '#ffcc99' },
  'Nrp': { color: '#dc3545', bg: '#f8d7da', border: '#f5c6cb' },
  'Hors Cible Opco': { color: '#6f42c1', bg: '#e2d9f3', border: '#d1c4e9' },
  'Hors cible salariés': { color: '#e83e8c', bg: '#f8d7da', border: '#f5c6cb' },
  'Hors cible Siège': { color: '#20c997', bg: '#d1f2eb', border: '#a3e4d7' },
  'Deja pec': { color: '#007bff', bg: '#cce5ff', border: '#99ccff' },
  'Absent': { color: '#6c757d', bg: '#f8f9fa', border: '#dee2e6' },
  'Pi': { color: '#343a40', bg: '#e2e3e5', border: '#d6d8db' }
};

function ResultsTable({ results, projet, adminKey }) {
  const [entrepriseData, setEntrepriseData] = useState({});
  const [selectedSiret, setSelectedSiret] = useState(null);

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
          adminKey
            ? { headers: { 'x-admin-key': adminKey } }
            : undefined
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
            observation: ''
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
        observation: ''
      };

      const updatedData = { ...currentData };
      if (field === 'status') {
        updatedData.status = value;
        updatedData.date_modification = new Date().toISOString();
      } else if (field === 'funebooster') {
        updatedData.funebooster = value;
      } else if (field === 'observation') {
        updatedData.observation = value;
      }

      // Sauvegarder dans Supabase d'abord
      const response = await axios.put(
        `${API_BASE_URL}/api/entreprise/${siret}`,
        {
          status: updatedData.status,
          funebooster: updatedData.funebooster,
          observation: updatedData.observation,
          projet: projet
        },
        adminKey
          ? { headers: { 'x-admin-key': adminKey } }
          : undefined
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
            observation: savedData.observation || updatedData.observation
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
              adminKey
                ? { headers: { 'x-admin-key': adminKey } }
                : undefined
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

  return (
    <div className="rounded-[10px] shadow-lg overflow-hidden">
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-hide-x">
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
            <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">OPCO</th>
            <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Téléphone</th>
            <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Dirigeant</th>
            <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Statut</th>
            <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Date de modification</th>
            <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">FunBooster</th>
            <th className="px-4 py-4 text-left font-semibold text-xs uppercase tracking-wider">Observation</th>
          </tr>
        </thead>
        <tbody>
          {results.map((ent, index) => {
            const siret = ent.siret || '';
            const data = entrepriseData[siret] || {
              status: 'A traiter',
              date_modification: null,
              funebooster: '',
              observation: ''
            };

            return (
              <TableRow
                key={siret || index}
                entreprise={ent}
                index={index}
                entrepriseData={data}
                statutOptions={STATUT_OPTIONS}
                onUpdate={updateEntrepriseData}
                isSelected={selectedSiret === siret}
                onSelectRow={() => setSelectedSiret(siret)}
              />
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsTable;

