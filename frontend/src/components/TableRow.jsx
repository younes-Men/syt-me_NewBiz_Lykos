import React, { useState, useEffect } from 'react';

function TableRow({ entreprise, index, entrepriseData, statutOptions, onUpdate }) {
  const [funebooster, setFunebooster] = useState(entrepriseData.funebooster || '');
  const [observation, setObservation] = useState(entrepriseData.observation || '');
  const teleconseillers = [
    'Wissal',
    'Oumaima',
    'Assia',
    'Ilham',
    'Habiba',
    'Elbouhali',
    'Benzaydoune',
  ];

  // Mettre à jour les valeurs quand entrepriseData change (chargement depuis Supabase)
  useEffect(() => {
    setFunebooster(entrepriseData.funebooster || '');
    setObservation(entrepriseData.observation || '');
  }, [entrepriseData.funebooster, entrepriseData.observation]);

  const siret = entreprise.siret || '';
  const status = entrepriseData.status || 'A traiter';
  const dateModification = entrepriseData.date_modification
    ? new Date(entrepriseData.date_modification).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    onUpdate(siret, 'status', newStatus);
  };

  const handleFuneboosterSave = () => {
    onUpdate(siret, 'funebooster', funebooster);
  };

  const handleObservationSave = () => {
    onUpdate(siret, 'observation', observation);
  };

  const statutStyle = statutOptions[status] || statutOptions['A traiter'];

  // Liens
  const pjLink = entreprise.pagesjaunes_url ? (
    <a
      href={entreprise.pagesjaunes_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#000] font-semibold px-3 py-1.5 rounded-md bg-[#ffcc00] inline-block transition-all text-center border border-[#ffcc00] hover:bg-[#ffd633] hover:-translate-y-0.5"
    >
      PagesJaunes
    </a>
  ) : (
    '-'
  );

  const opcoLink = entreprise.opco_url ? (
    <a
      href={entreprise.opco_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white font-semibold px-3 py-1.5 rounded-md bg-gradient-to-r from-newbiz-blue to-newbiz-cyan inline-block transition-all text-center border border-transparent hover:-translate-y-0.5"
    >
      OPCO
    </a>
  ) : (
    '-'
  );

  const dirigeantLink = entreprise.pappers_url ? (
    <a
      href={entreprise.pappers_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-white font-semibold px-3 py-1.5 rounded-md bg-gradient-to-r from-newbiz-purple to-newbiz-dark-purple inline-block transition-all text-center border border-transparent hover:-translate-y-0.5"
    >
      Pappers
    </a>
  ) : (
    '-'
  );

  const etat = entreprise.etat || 'Inconnu';
  const etatClass = etat === 'Actif' 
    ? 'bg-[#d4edda] text-[#155724] px-3 py-1.5 rounded-md font-semibold inline-block border border-[#c3e6cb]'
    : 'bg-[#f8d7da] text-[#721c24] px-3 py-1.5 rounded-md font-semibold inline-block border border-[#f5c6cb]';

  return (
    <tr className="transition-colors hover:bg-[rgba(255,0,255,0.1)] border-b border-[rgba(255,0,255,0.1)] last:border-b-0">
      <td className="px-4 py-3 text-white">{index + 1}</td>
      <td className="px-4 py-3 text-white">{entreprise.nom || ''}</td>
      <td className="px-4 py-3 text-white">{entreprise.adresse || ''}</td>
      <td className="px-4 py-3 text-white">{entreprise.secteur || ''}</td>
      <td className="px-4 py-3 text-white">{entreprise.siret || ''}</td>
      <td className="px-4 py-3 text-white">{entreprise.siren || ''}</td>
      <td className="px-4 py-3 text-white">{entreprise.effectif || ''}</td>
      <td className="px-4 py-3">
        <span className={etatClass}>{etat}</span>
      </td>
      <td className="px-4 py-3">{opcoLink}</td>
      <td className="px-4 py-3">{pjLink}</td>
      <td className="px-4 py-3">{dirigeantLink}</td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={handleStatusChange}
          className="px-2.5 py-1.5 rounded-full border border-[rgba(255,0,255,0.3)] text-sm font-semibold cursor-pointer transition-all min-w-[160px] font-inherit outline-none bg-[#1a1a1a] text-white hover:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.3)]"
          style={{
            color: statutStyle.color,
            backgroundColor: statutStyle.bg,
            borderColor: statutStyle.border,
          }}
        >
          {Object.keys(statutOptions).map(opt => (
            <option key={opt} value={opt} style={{ color: '#000' }}>
              {opt}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-sm text-[rgba(255,255,255,0.7)] italic">
        {dateModification}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <select
            value={funebooster}
            onChange={(e) => setFunebooster(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-[rgba(255,0,255,0.3)] rounded-md bg-white text-black text-sm font-inherit outline-none transition-colors focus:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.2)]"
          >
            <option value="">-- Choisir un téléconseiller --</option>
            {teleconseillers.map((nom) => (
              <option key={nom} value={nom} className="text-black">
                {nom}
              </option>
            ))}
          </select>
          <span
            onClick={handleFuneboosterSave}
            className="cursor-pointer text-sm transition-all p-0.5 inline-flex items-center justify-center rounded opacity-70 hover:scale-110 hover:bg-[rgba(255,0,255,0.2)] hover:opacity-100"
            title="Enregistrer"
          >
            💾
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Commentaire"
            className="flex-1 px-2.5 py-1.5 border border-[rgba(255,0,255,0.3)] rounded-md bg-[#1a1a1a] text-white text-sm font-inherit outline-none transition-colors focus:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.2)] placeholder:text-[rgba(255,255,255,0.4)]"
          />
          <span
            onClick={handleObservationSave}
            className="cursor-pointer text-sm transition-all p-0.5 inline-flex items-center justify-center rounded opacity-70 hover:scale-110 hover:bg-[rgba(255,0,255,0.2)] hover:opacity-100"
            title="Enregistrer"
          >
            💾
          </span>
        </div>
      </td>
    </tr>
  );
}

export default TableRow;

