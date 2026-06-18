import React, { useState } from 'react';

const MultiSelectDropdown = ({ options, selected, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="w-full px-4 py-3 border-2 border-[rgba(255,0,255,0.3)] rounded-[10px] text-base transition-all bg-[#1a1a1a] text-white cursor-pointer flex justify-between items-center focus:border-newbiz-purple focus:shadow-[0_0_0_3px_rgba(255,0,255,0.2)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selected.length === 0 ? "Toutes" : `${selected.length} sélectionné(s)`}
        </span>
        <span className="ml-2 text-xs opacity-70">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full bottom-full mb-1 bg-[#1a1a1a] border-2 border-[rgba(255,0,255,0.3)] rounded-[10px] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] max-h-60 overflow-y-auto">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className="px-4 py-3 hover:bg-[#2a2a2a] cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0"
              onClick={() => toggleOption(opt.value)}
            >
              <input 
                type="checkbox" 
                checked={selected.includes(opt.value)} 
                readOnly
                className="w-4 h-4 accent-[#ff00ff] cursor-pointer"
              />
              <label className="text-white text-sm cursor-pointer select-none flex-1">{opt.label}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function SearchPanel({ onSearch, onSearchBySiret, onSearchByTel, onExport, canExport }) {
  const [secteur, setSecteur] = useState('');
  const [departement, setDepartement] = useState('');
  const [siret, setSiret] = useState('');
  const [tel, setTel] = useState('');
  const [formeJuridique, setFormeJuridique] = useState([]);
  const [trancheEffectif, setTrancheEffectif] = useState([]);

  const formeJuridiqueOptions = [
    { value: 'EI', label: 'Entreprise individuelle' },
    { value: 'MICRO', label: 'Micro entreprise' },
    { value: 'SARL', label: 'SARL / EURL' },
    { value: 'SAS', label: 'SAS / SASU' },
    { value: 'SA', label: 'SA' },
    { value: 'SCI', label: 'SCI' }
  ];

  const trancheEffectifOptions = [
    { value: '0', label: '0 salarié' },
    { value: '1-5', label: 'De 1 à 5 salariés' },
    { value: '6-9', label: 'De 6 à 9 salariés' },
    { value: '10-19', label: 'De 10 à 19 salariés' },
    { value: '20-49', label: 'De 20 à 49 salariés' }
  ];

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
    <div className="p-8 bg-[#2a2a2a] border-b border-[rgba(255,0,255,0.2)] relative z-50">
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
            <label className="block font-semibold mb-2 text-white text-sm">
              Forme Juridique
            </label>
            <MultiSelectDropdown 
              options={formeJuridiqueOptions}
              selected={formeJuridique}
              onChange={setFormeJuridique}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-white text-sm">
              Tranche Effectif
            </label>
            <MultiSelectDropdown 
              options={trancheEffectifOptions}
              selected={trancheEffectif}
              onChange={setTrancheEffectif}
            />
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
