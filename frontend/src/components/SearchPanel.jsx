import React, { useState } from 'react';

function SearchPanel({ onSearch, onSearchBySiret, onSearchByTel, onExport, canExport }) {
  const [secteur, setSecteur] = useState('');
  const [departement, setDepartement] = useState('');
  const [siret, setSiret] = useState('');
  const [tel, setTel] = useState('');
  const [formeJuridique, setFormeJuridique] = useState('');
  const [trancheEffectif, setTrancheEffectif] = useState('');

  const handleSearch = () => {
    onSearch(secteur, departement, formeJuridique, trancheEffectif);
  };

  const handleSearchBySiret = () => {
    if (siret.trim()) {
      onSearchBySiret(siret.trim());
    }
  };

  const handleSearchByTel = () => {
    if (tel.trim()) {
      onSearchByTel(tel.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (tel.trim()) {
        handleSearchByTel();
      } else if (siret.trim()) {
        handleSearchBySiret();
      } else {
        handleSearch();
      }
    }
  };

  return (
    <div className="p-8 bg-[#2a2a2a] border-b border-[rgba(255,0,255,0.2)]">
      <div className="flex gap-5 items-end flex-wrap">
        <div className="flex flex-col gap-5 flex-1 min-w-[200px]">
          <div>
            <label htmlFor="siret" className="block font-semibold mb-2 text-white text-sm">
              Recherche par SIRET
            </label>
            <input
              type="text"
              id="siret"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: 12345678901234"
              maxLength="14"
              className="w-full px-4 py-3 border-2 border-[rgba(255,0,255,0.3)] rounded-[10px] text-base transition-all font-inherit bg-[#1a1a1a] text-white focus:outline-none focus:border-newbiz-purple focus:shadow-[0_0_0_3px_rgba(255,0,255,0.2)]"
            />
          </div>
          <div>
            <label htmlFor="secteur" className="block font-semibold mb-2 text-white text-sm">
              Secteur / Activité
            </label>
            <input
              type="text"
              id="secteur"
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: boulangerie, plomberie, 47.11C"
              className="w-full px-4 py-3 border-2 border-[rgba(255,0,255,0.3)] rounded-[10px] text-base transition-all font-inherit bg-[#1a1a1a] text-white focus:outline-none focus:border-newbiz-purple focus:shadow-[0_0_0_3px_rgba(255,0,255,0.2)]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 flex-1 min-w-[200px]">
          <div>
            <label htmlFor="tel" className="block font-semibold mb-2 text-white text-sm">
              Recherche par Tél
            </label>
            <input
              type="text"
              id="tel"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: 0123456789"
              className="w-full px-4 py-3 border-2 border-[rgba(255,0,255,0.3)] rounded-[10px] text-base transition-all font-inherit bg-[#1a1a1a] text-white focus:outline-none focus:border-newbiz-purple focus:shadow-[0_0_0_3px_rgba(255,0,255,0.2)]"
            />
          </div>
          <div>
            <label htmlFor="departement" className="block font-semibold mb-2 text-white text-sm">
              Département ou code postal
            </label>
            <input
              type="text"
              id="departement"
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: 33, 75, 130, 75008"
              maxLength="5"
              className="w-full px-4 py-3 border-2 border-[rgba(255,0,255,0.3)] rounded-[10px] text-base transition-all font-inherit bg-[#1a1a1a] text-white focus:outline-none focus:border-newbiz-purple focus:shadow-[0_0_0_3px_rgba(255,0,255,0.2)]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 flex-1 min-w-[200px]">
          <div>
            <label htmlFor="formeJuridique" className="block font-semibold mb-2 text-white text-sm">
              Forme Juridique
            </label>
            <select
              id="formeJuridique"
              value={formeJuridique}
              onChange={(e) => setFormeJuridique(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[rgba(255,0,255,0.3)] rounded-[10px] text-base transition-all font-inherit bg-[#1a1a1a] text-white focus:outline-none focus:border-newbiz-purple focus:shadow-[0_0_0_3px_rgba(255,0,255,0.2)] appearance-none"
            >
              <option value="">Toutes</option>
              <option value="EI">Entreprise individuelle</option>
              <option value="MICRO">Micro entreprise</option>
              <option value="SARL">SARL / EURL</option>
              <option value="SAS">SAS / SASU</option>
              <option value="SA">SA</option>
              <option value="SCI">SCI</option>
            </select>
          </div>
          <div>
            <label htmlFor="trancheEffectif" className="block font-semibold mb-2 text-white text-sm">
              Tranche Effectif
            </label>
            <select
              id="trancheEffectif"
              value={trancheEffectif}
              onChange={(e) => setTrancheEffectif(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[rgba(255,0,255,0.3)] rounded-[10px] text-base transition-all font-inherit bg-[#1a1a1a] text-white focus:outline-none focus:border-newbiz-purple focus:shadow-[0_0_0_3px_rgba(255,0,255,0.2)] appearance-none"
            >
              <option value="">Toutes</option>
              <option value="0">0 salarié</option>
              <option value="1-5">De 1 à 5 salariés</option>
              <option value="6-9">De 6 à 9 salariés</option>
              <option value="10-19">De 10 à 19 salariés</option>
              <option value="20-49">De 20 à 49 salariés</option>
            </select>
          </div>
        </div>

        <div className="flex gap-5 items-end h-[52px]">
          <button
            onClick={tel.trim() ? handleSearchByTel : (siret.trim() ? handleSearchBySiret : handleSearch)}
            className="px-6 h-full border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 font-inherit whitespace-nowrap bg-gradient-newbiz text-white hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(255,0,255,0.4)]"
          >
            <span className="text-xl">🔍</span>
            Rechercher
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchPanel;
