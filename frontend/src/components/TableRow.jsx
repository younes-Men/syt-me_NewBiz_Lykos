import React, { useState, useEffect } from 'react';


function TableRow({ entreprise, index, entrepriseData, statutOptions, clientOfOptions, onUpdate, isSelected, onSelectRow, projet, adminKey }) {
  const [funebooster, setFunebooster] = useState(entrepriseData.funebooster || '');
  const [observation, setObservation] = useState(entrepriseData.observation || '');
  const [tel, setTel] = useState(entrepriseData.tel || '');
  const [clientOf, setClientOf] = useState(entrepriseData.client_of || '');
  const [isCopyingName, setIsCopyingName] = useState(false);
  const teleconseillers = projet === 'Assurance'
    ? ['Jihan', 'ALEX']
    : [
      'WISSAL',
      'OUMAIMA',
      'ASSIA',
      'ILHAM',
      'LABIBA',
      'BENZAYDOUNE',
      'KHADIJA',
      'ADJA',
      'WIJDAN',
      'NASSIMA',
    ];

  // Mettre à jour les valeurs quand entrepriseData change (chargement depuis Supabase)
  useEffect(() => {
    setFunebooster(entrepriseData.funebooster || '');
    setObservation(entrepriseData.observation || '');
    setTel(entrepriseData.tel || '');
    setClientOf(entrepriseData.client_of || '');
  }, [entrepriseData.funebooster, entrepriseData.observation, entrepriseData.tel, entrepriseData.client_of]);

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

  // Si le statut est "Rdv", désactiver les modifications sauf si admin
  const isRdv = status === 'Rdv' && !adminKey;

  const handleStatusChange = (e) => {
    if (isRdv) return; // Empêcher la modification si statut est Rdv
    const newStatus = e.target.value;
    onUpdate(siret, 'status', newStatus);
  };

  const handleFuneboosterSave = () => {
    if (isRdv) return; // Empêcher la modification si statut est Rdv
    onUpdate(siret, 'funebooster', funebooster);
  };

  const handleObservationSave = () => {
    if (isRdv) return; // Empêcher la modification si statut est Rdv
    onUpdate(siret, 'observation', observation);
  };

  const handleTelSave = () => {
    if (isRdv) return; // Empêcher la modification si statut est Rdv
    onUpdate(siret, 'tel', tel);
  };

  const handleClientOfChange = (e) => {
    if (isRdv) return; // Empêcher la modification si statut est Rdv
    const newClientOf = e.target.value;
    setClientOf(newClientOf);
    onUpdate(siret, 'client_of', newClientOf);
  };

  const statutStyle = statutOptions[status] || statutOptions['A traiter'];
  const clientOfValue = clientOf || '';
  const clientOfStyle = clientOfOptions[clientOfValue] || { color: '#6c757d', bg: '#e9ecef', border: '#ced4da' };

  const handleCopyName = (e) => {
    e.stopPropagation();
    const name = entreprise.nom || '';
    if (!name) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(name).then(() => {
        setIsCopyingName(true);
        setTimeout(() => setIsCopyingName(false), 200);
      }).catch(() => {
        // ignore clipboard errors
      });
    }
  };

  const handleOpenDatalegal = (e) => {
    e.stopPropagation();
    const siren = entreprise.siren || '';

    // Lien direct vers la fiche entreprise si on a le SIREN
    const url = siren
      ? `https://datalegal.fr/entreprises/${encodeURIComponent(siren)}`
      : 'https://datalegal.fr/';

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenKompass = (e) => {
    e.stopPropagation();
    const siret = entreprise.siret || '';

    // Lien vers Kompass avec le SIRET
    const url = siret
      ? `https://ma.kompass.com/searchCompanies?text=${encodeURIComponent(siret)}&searchType=COMPANYNAME`
      : 'https://ma.kompass.com/';

    window.open(url, '_blank', 'noopener,noreferrer');
  };

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

  const rowBaseClasses =
    'transition-colors border-b border-[rgba(255,0,255,0.1)] last:border-b-0 cursor-pointer';
  const rowSelectedClasses = isSelected
    ? 'bg-[rgba(255,0,255,0.25)]'
    : 'hover:bg-[rgba(255,0,255,0.1)]';

  return (
    <tr
      className={`${rowBaseClasses} ${rowSelectedClasses}`}
      onClick={onSelectRow}
    >
      <td className="px-4 py-3 text-white">{index + 1}</td>
      <td className="px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span>{entreprise.nom || ''}</span>
          {entreprise.nom && (
            <button
              type="button"
              onClick={handleCopyName}
              className={`inline-flex items-center justify-center w-4 h-4 rounded bg-transparent border border-transparent hover:border-[rgba(255,255,255,0.25)] text-[rgba(255,255,255,0.7)] hover:text-white transition-transform transition-colors ${isCopyingName ? 'rotate-12' : ''}`}
              title={`Copier le nom : ${entreprise.nom}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <rect x="9" y="9" width="11" height="11" rx="1.8" />
                <rect x="4" y="4" width="11" height="11" rx="1.8" opacity="0.55" />
              </svg>
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-white">{entreprise.adresse || ''}</td>
      <td className="px-4 py-3 text-white">{entreprise.secteur || ''}</td>
      <td className="px-4 py-3 text-white">{entreprise.siret || ''}</td>
      <td className="px-4 py-3 text-white">{entreprise.siren || ''}</td>
      <td className="px-4 py-3 text-white">{entreprise.effectif || ''}</td>
      <td className="px-4 py-3">
        <span className={etatClass}>{etat}</span>
      </td>
      <td className="px-4 py-3">{opcoLink}</td>
      <td className="px-4 py-3 text-white">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleOpenDatalegal}
            className="px-2 py-1 rounded-full border border-[rgba(255,255,255,0.4)] text-xs text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.9)] transition-colors"
            title="Ouvrir DataLegal avec cette entreprise"
          >
            Phone
          </button>
          <button
            type="button"
            onClick={handleOpenKompass}
            className="px-2 py-1 rounded-full border border-[rgba(255,255,255,0.4)] text-xs text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.9)] transition-colors"
            title="Ouvrir Kompass avec cette entreprise"
          >
            Phone 2
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={tel}
            onChange={(e) => !isRdv && setTel(e.target.value)}
            placeholder="Tél"
            disabled={isRdv}
            className={`flex-1 px-2.5 py-1.5 border border-[rgba(255,0,255,0.3)] rounded-md bg-[#1a1a1a] text-white text-sm font-inherit outline-none transition-colors focus:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.2)] placeholder:text-[rgba(255,255,255,0.4)] ${isRdv ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          />
          <span
            onClick={handleTelSave}
            className={`text-sm transition-all p-0.5 inline-flex items-center justify-center rounded ${isRdv
              ? 'opacity-30 cursor-not-allowed'
              : 'cursor-pointer opacity-70 hover:scale-110 hover:bg-[rgba(255,0,255,0.2)] hover:opacity-100'
              }`}
            title={isRdv ? "Modification désactivée (statut RDV)" : "Enregistrer"}
          >
            💾
          </span>
        </div>
      </td>
      <td className="px-4 py-3">{dirigeantLink}</td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={handleStatusChange}
          disabled={isRdv}
          className={`px-2.5 py-1.5 rounded-full border border-[rgba(255,0,255,0.3)] text-sm font-semibold transition-all min-w-[160px] font-inherit outline-none bg-[#1a1a1a] text-white hover:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.3)] ${isRdv ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          style={{
            color: statutStyle.color,
            backgroundColor: statutStyle.bg,
            borderColor: statutStyle.border,
          }}
          title={isRdv ? "Modification désactivée (statut RDV)" : ""}
        >
          {Object.keys(statutOptions).map(opt => (
            <option key={opt} value={opt} style={{ color: '#000' }}>
              {opt.toUpperCase()}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-sm text-[rgba(255,255,255,0.7)] italic">
        {dateModification}
      </td>
      <td className="px-4 py-3">
        <select
          value={clientOfValue}
          onChange={handleClientOfChange}
          disabled={isRdv}
          className={`px-2.5 py-1.5 rounded-full border border-[rgba(255,0,255,0.3)] text-sm font-semibold transition-all min-w-[160px] font-inherit outline-none bg-[#1a1a1a] text-white hover:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.3)] ${isRdv ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          style={{
            color: clientOfStyle.color,
            backgroundColor: clientOfStyle.bg,
            borderColor: clientOfStyle.border,
          }}
          title={isRdv ? "Modification désactivée (statut RDV)" : ""}
        >
          <option value="" style={{ color: '#000' }}>-- Sélectionner --</option>
          {Object.keys(clientOfOptions).map(opt => (
            <option key={opt} value={opt} style={{ color: '#000' }}>
              {opt}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <select
            value={funebooster}
            onChange={(e) => !isRdv && setFunebooster(e.target.value)}
            disabled={isRdv}
            className={`flex-1 px-2.5 py-1.5 border border-[rgba(255,0,255,0.3)] rounded-md bg-white text-black text-sm font-inherit outline-none transition-colors focus:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.2)] ${isRdv ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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
            className={`text-sm transition-all p-0.5 inline-flex items-center justify-center rounded ${isRdv
              ? 'opacity-30 cursor-not-allowed'
              : 'cursor-pointer opacity-70 hover:scale-110 hover:bg-[rgba(255,0,255,0.2)] hover:opacity-100'
              }`}
            title={isRdv ? "Modification désactivée (statut RDV)" : "Enregistrer"}
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
            onChange={(e) => !isRdv && setObservation(e.target.value)}
            placeholder="Commentaire"
            disabled={isRdv}
            className={`flex-1 px-2.5 py-1.5 border border-[rgba(255,0,255,0.3)] rounded-md bg-[#1a1a1a] text-white text-sm font-inherit outline-none transition-colors focus:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.2)] placeholder:text-[rgba(255,255,255,0.4)] ${isRdv ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          />
          <span
            onClick={handleObservationSave}
            className={`text-sm transition-all p-0.5 inline-flex items-center justify-center rounded ${isRdv
              ? 'opacity-30 cursor-not-allowed'
              : 'cursor-pointer opacity-70 hover:scale-110 hover:bg-[rgba(255,0,255,0.2)] hover:opacity-100'
              }`}
            title={isRdv ? "Modification désactivée (statut RDV)" : "Enregistrer"}
          >
            💾
          </span>
        </div>
      </td>
    </tr>
  );
}

export default TableRow;

