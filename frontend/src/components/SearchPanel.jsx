import React, { useState } from 'react';

function SearchPanel({ onSearch, onExport, canExport }) {
  const [secteur, setSecteur] = useState('');
  const [departement, setDepartement] = useState('');

  const handleSearch = () => {
    onSearch(secteur, departement);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-5 p-8 bg-[#2a2a2a] border-b border-[rgba(255,0,255,0.2)] items-end flex-wrap">
      <div className="flex-1 min-w-[200px]">
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

      <div className="flex-1 min-w-[200px]">
        <label htmlFor="departement" className="block font-semibold mb-2 text-white text-sm">
          Département
        </label>
        <input
          type="text"
          id="departement"
          value={departement}
          onChange={(e) => setDepartement(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ex: 33, 75, 13"
          maxLength="3"
          className="w-full px-4 py-3 border-2 border-[rgba(255,0,255,0.3)] rounded-[10px] text-base transition-all font-inherit bg-[#1a1a1a] text-white focus:outline-none focus:border-newbiz-purple focus:shadow-[0_0_0_3px_rgba(255,0,255,0.2)]"
        />
      </div>

      <button
        onClick={handleSearch}
        className="px-6 py-3 border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all flex items-center gap-2 font-inherit whitespace-nowrap bg-gradient-newbiz text-white hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(255,0,255,0.4)]"
      >
        <span className="text-xl">🔍</span>
        Rechercher
      </button>

      <button
        onClick={onExport}
        disabled={!canExport}
        className={`px-6 py-3 border-none rounded-[10px] text-base font-semibold cursor-pointer transition-all flex items-center gap-2 font-inherit whitespace-nowrap ${
          canExport
            ? 'bg-gradient-to-r from-newbiz-blue to-newbiz-cyan text-white hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(33,150,243,0.4)]'
            : 'opacity-50 cursor-not-allowed bg-gradient-to-r from-newbiz-blue to-newbiz-cyan text-white'
        }`}
      >
        <span className="text-xl">📥</span>
        Télécharger Excel
      </button>
    </div>
  );
}

export default SearchPanel;

