import React, { useState, useEffect } from 'react';


const OPCOMMERCE_NAF_CODES = [
  "74.20Z", "47.52B", "47.91A", "47.91B", "46.17A", "46.17B", "46.38B", "47.11B",
  "47.11C", "47.11D", "47.11E", "47.25Z", "47.21Z", "47.24Z", "47.29Z", "47.81Z",
  "26.52Z", "47.77Z", "47.78C", "47.72A", "47.51Z", "47.53Z", "47.59B", "47.71Z",
  "47.19B", "47.41Z", "47.42Z", "47.43Z", "47.52A", "47.54Z", "47.59A", "47.63Z",
  "47.65Z", "47.72B", "47.76Z", "47.79Z", "47.89Z", "43.21A", "77.22Z", "77.29Z",
  "95.11Z", "95.12Z", "95.21Z", "95.22Z", "46.41Z", "46.42Z", "45.11Z", "45.19Z",
  "47.64Z", "46.51Z", "46.65Z", "46.66Z", "47.62Z", "46.12A", "46.19A", "46.11Z",
  "46.12B", "46.13Z", "46.14Z", "46.15Z", "46.16Z", "46.18Z", "46.19B", "46.43Z",
  "46.47Z", "46.49Z", "46.52Z", "46.61Z", "46.62Z", "46.63Z", "46.64Z", "46.69A",
  "46.69B", "46.69C", "46.72Z", "46.75Z", "52.10B", "47.78A"
];

const BLOCKED_OPCO_SIRETS = [
  "48893017300031", "81845136100013", "38310857800022", "83899207100012", "84476563600015", "80367686500022", "41902283500013", "88898428300018", "52456471300021", "82120988900012", "85124141400016", "80771168400025", "92008069400010", "90297050800013", "85258913400026", "87982197300028", "32038429000062", "88359278400028", "89934381800014", "42460264700010", "85366974500012", "82018792000013", "50212398700047", "50133986500039", "47937644400010", "40138326000031", "47869067000045", "49764551500014", "97833170000010", "82857579500012", "83970347700019", "47993071100011", "32919744600050", "51017443600046", "41014759900014", "53931267800037", "50207093100048", "40956363200010", "43012041000021", "43210935300024", "52770296300010", "44467374300027", "78858534700016", "51969969800014", "44780318000028", "44433018700030", "78940137900019", "49067279700027", "81450436100019", "88523134000013", "39362157800037", "38390284800043", "50270906600018", "43964572200042", "40169727100039", "80385941200014", "87940714600015", "42042539900011", "33256895500022", "52997435400050", "79815725100017", "32312577300024", "53169272100032", "79485225100022", "53113069800032", "52914276200036", "35234768600029", "53236372800033", "53784957200012", "80198023600013", "53280002600025", "39872303100017", "84342363300018", "75299675100018", "80462566300013", "90802829300011", "52328005500014", "81033219700013", "43147293500011", "43233890300037", "43236020400031", "85049453500014", "43190495200014", "75073539100013", "44918736800039", "45379443000026", "48131795600029", "49191077400018", "83178686800016", "43231602400012", "45268332900034", "45321370400019", "83393024100025", "40236018400046", "84093302200013", "88020365800013", "40411981000020", "51876349500018", "39060749700026", "52054938700014", "39957146200056", "82386115800017", "44056242900025", "44091511400019", "90770957000010", "53928313500025", "48269594700036", "75254511100037", "53031176000058", "79188592400039", "89060911800025", "79239873700025", "75263934400031", "84408451700011", "51857447000036", "94761122400025", "81348702200036", "52873327200025", "40021502600024", "89060966200022", "93351448100011", "52268522100015", "48353166100047", "53162153000025", "50744794400012", "50507687700016", "51893640600017", "50381339600028", "44011483300021", "43988857900018", "83447905700012", "82959208800019", "45165760500023", "38424121200016", "51078401000017", "40282879200018", "83132774700026", "79195714500026", "89121896800016", "93091304100016", "85215272700016", "82146332000019", "84940241700026", "45091962600017", "43237256300036", "82989973100022", "79817579000012", "35001555800025", "33504388100028", "42817874300020", "47835038200048", "53467240700028", "82395384900036", "84317286700023", "48142040400016", "95137820700017", "90314685000024", "49017217800017", "82287541500017", "33880332300041", "91752602200012", "48050089100027", "48862251500010", "91929965100019", "91823297600012", "82757534100017", "52843003600020", "44051547600016", "43200923100072", "50394356500013", "48145897400013", "81096854500014", "52393601100015", "96420098400034", "56206891600013", "89853820200018", "53198075300036", "43196651400025", "50803244800047", "82236536700033", "51514155400011", "92940742700012", "98376574400013", "41772531400013", "84230019600024", "93422732300011", "88433237000037", "82014526600012", "83119046700017", "49200966700014", "85303603600038", "93243699100016", "81913088100017", "93400089400014", "82762967600012", "83077224000016", "92930102600019", "34204759400037", "33054275400024", "81490615200024", "89045300400016", "82754945200015", "85104595500024", "92096736100022", "95255634800011", "80230547400032", "91947067400012", "93975785200016", "83759690700019", "84230256400013", "91146498000018", "43427782800035", "81267785400018", "49247923300024", "91324594000014", "53155264400019", "91318235800014", "79949672400011", "48300931200024", "51406285000037", "93508244600011", "83888631500038", "82785582600026", "92245819500018", "91444976400028", "97808996900015", "89343902600012", "40310499500044", "98745798300011", "35315964300033", "89892668800026", "90203337200019", "91333836400023", "81747826600023"
];

function TableRow({ entreprise, index, entrepriseData, statutOptions, clientOfOptions, onUpdate, isSelected, onSelectRow, projet, authHeaders }) {
  const [funebooster, setFunebooster] = useState(entrepriseData.funebooster || '');
  const [observation, setObservation] = useState(entrepriseData.observation || '');
  const [tel, setTel] = useState(entrepriseData.tel || '');
  const [clientOf, setClientOf] = useState(entrepriseData.client_of || '');
  
  // Déterminer l'OPCO par défaut basé sur le code NAF (secteur)
  const isOpcommerceNaf = OPCOMMERCE_NAF_CODES.includes(entreprise.secteur);
  const defaultOpco = isOpcommerceNaf ? 'OPCOMMERCE' : '';
  
  const [nomOpco, setNomOpco] = useState(entrepriseData.nom_opco || defaultOpco);
  const [isCopyingName, setIsCopyingName] = useState(false);
  const teleconseillers = projet === 'RCD'
    ? ['GOMIS', 'ADAM', 'HOUSSAM', 'YOSRA']
    : [
      'WISSAL',
      'OUMAIMA',
      'MERYEM',
      'LABIBA',
      'BENZAYDOUNE',
      'KHADIJA',
      'WIJDAN',
      'SOUKAINA',
      'AMRI',
      'GHITA',
      'HAJJI',
    ];

  // Mettre à jour les valeurs quand entrepriseData change (chargement depuis Supabase)
  useEffect(() => {
    setFunebooster(entrepriseData.funebooster || '');
    setObservation(entrepriseData.observation || '');
    setTel(entrepriseData.tel || '');
    setClientOf(entrepriseData.client_of || '');
    setNomOpco(entrepriseData.nom_opco || defaultOpco);
  }, [entrepriseData.funebooster, entrepriseData.observation, entrepriseData.tel, entrepriseData.client_of, entrepriseData.nom_opco, defaultOpco]);

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

  // Vérifier si le SIRET est dans la liste des SIRET bloqués pour le projet OPCO
  const isBlockedSiret = projet === 'OPCO' && BLOCKED_OPCO_SIRETS.includes(siret);

  // Si le statut est "Rdv" ou "SIGNE", ou si c'est un SIRET bloqué, désactiver les modifications sauf si admin
  const isLocked = (status === 'Rdv' || status === 'SIGNE' || isBlockedSiret) && !authHeaders?.['x-admin-key'];

  const handleStatusChange = (e) => {
    if (isLocked) return; // Empêcher la modification si verrouillé
    const newStatus = e.target.value;
    onUpdate(siret, 'status', newStatus);
  };

  const handleFuneboosterSave = () => {
    if (isLocked) return; // Empêcher la modification si verrouillé
    onUpdate(siret, 'funebooster', funebooster);
  };

  const handleObservationSave = () => {
    if (isLocked) return; // Empêcher la modification si verrouillé
    onUpdate(siret, 'observation', observation);
  };

  const handleTelSave = () => {
    if (isLocked) return; // Empêcher la modification si verrouillé
    onUpdate(siret, 'tel', tel);
  };

  const handleClientOfChange = (e) => {
    if (isLocked) return; // Empêcher la modification si verrouillé
    const newClientOf = e.target.value;
    setClientOf(newClientOf);
    onUpdate(siret, 'client_of', newClientOf);
  };
  
  const handleNomOpcoChange = (e) => {
    if (isLocked) return;
    const newOpco = e.target.value;
    setNomOpco(newOpco);
    onUpdate(siret, 'nom_opco', newOpco);
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
      <td className="px-4 py-3">
        <select
          value={nomOpco}
          onChange={handleNomOpcoChange}
          disabled={isLocked}
          className={`px-2.5 py-1.5 rounded-md border border-[rgba(255,0,255,0.3)] text-sm font-semibold transition-all min-w-[160px] font-inherit outline-none bg-[#1a1a1a] text-white hover:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.3)] ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          style={{
            backgroundColor: nomOpco ? 'rgba(0, 255, 255, 0.1)' : '#1a1a1a',
            borderColor: nomOpco ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255,0,255,0.3)'
          }}
          title={isLocked ? "Modification désactivée (statut RDV/SIGNE)" : "Choisir un OPCO"}
        >
          <option value="" style={{ color: '#000' }}>-- Sélectionner --</option>
          {['OPCOMMERCE', 'OPCO EP', 'OPCO AKTO', 'OPCO ATLAS', 'AFDAS', 'CONSTRUCTYS', 'MOBILITÉ', 'OPCO 2i', 'UNIFORMATION', 'OPCO SANTÉ', 'OCAPIAT'].map(opt => (
            <option key={opt} value={opt} style={{ color: '#000' }}>
              {opt}
            </option>
          ))}
        </select>
      </td>
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
          {tel.startsWith('http') && (
            <a 
              href={tel} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-newbiz-purple p-1"
              title="Ouvrir le lien directement"
              onClick={(e) => e.stopPropagation()}
            >
              🔗
            </a>
          )}
          <input
            type="text"
            value={tel}
            onChange={(e) => !isLocked && setTel(e.target.value)}
            placeholder="Tél"
            disabled={isLocked}
            className={`flex-1 px-2.5 py-1.5 border border-[rgba(255,0,255,0.3)] rounded-md bg-[#1a1a1a] text-white text-sm font-inherit outline-none transition-colors focus:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.2)] placeholder:text-[rgba(255,255,255,0.4)] ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          />
          <span
            onClick={handleTelSave}
            className={`text-sm transition-all p-0.5 inline-flex items-center justify-center rounded ${isLocked
              ? 'opacity-30 cursor-not-allowed'
              : 'cursor-pointer opacity-70 hover:scale-110 hover:bg-[rgba(255,0,255,0.2)] hover:opacity-100'
              }`}
            title={isLocked ? "Modification désactivée (statut RDV/SIGNE)" : "Enregistrer"}
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
          disabled={isLocked}
          className={`px-2.5 py-1.5 rounded-full border border-[rgba(255,0,255,0.3)] text-sm font-semibold transition-all min-w-[160px] font-inherit outline-none bg-[#1a1a1a] text-white hover:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.3)] ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          style={{
            color: statutStyle.color,
            backgroundColor: statutStyle.bg,
            borderColor: statutStyle.border,
          }}
          title={isLocked ? "Modification désactivée (statut RDV/SIGNE)" : ""}
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
      {projet !== 'RCD' && (
        <td className="px-4 py-3">
          <select
            value={clientOfValue}
            onChange={handleClientOfChange}
            disabled={isLocked}
            className={`px-2.5 py-1.5 rounded-full border border-[rgba(255,0,255,0.3)] text-sm font-semibold transition-all min-w-[160px] font-inherit outline-none bg-[#1a1a1a] text-white hover:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.3)] ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            style={{
              color: clientOfStyle.color,
              backgroundColor: clientOfStyle.bg,
              borderColor: clientOfStyle.border,
            }}
            title={isLocked ? "Modification désactivée (statut RDV/SIGNE)" : ""}
          >
            <option value="" style={{ color: '#000' }}>-- Sélectionner --</option>
            {Object.keys(clientOfOptions).map(opt => (
              <option key={opt} value={opt} style={{ color: '#000' }}>
                {opt}
              </option>
            ))}
          </select>
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <select
            value={funebooster}
            onChange={(e) => !isLocked && setFunebooster(e.target.value)}
            disabled={isLocked}
            className={`flex-1 px-2.5 py-1.5 border border-[rgba(255,0,255,0.3)] rounded-md bg-white text-black text-sm font-inherit outline-none transition-colors focus:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.2)] ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
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
            className={`text-sm transition-all p-0.5 inline-flex items-center justify-center rounded ${isLocked
              ? 'opacity-30 cursor-not-allowed'
              : 'cursor-pointer opacity-70 hover:scale-110 hover:bg-[rgba(255,0,255,0.2)] hover:opacity-100'
              }`}
            title={isLocked ? "Modification désactivée (statut RDV/SIGNE)" : "Enregistrer"}
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
            onChange={(e) => !isLocked && setObservation(e.target.value)}
            placeholder="Commentaire"
            disabled={isLocked}
            className={`flex-1 px-2.5 py-1.5 border border-[rgba(255,0,255,0.3)] rounded-md bg-[#1a1a1a] text-white text-sm font-inherit outline-none transition-colors focus:border-newbiz-purple focus:shadow-[0_0_0_2px_rgba(255,0,255,0.2)] placeholder:text-[rgba(255,255,255,0.4)] ${isLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          />
          <span
            onClick={handleObservationSave}
            className={`text-sm transition-all p-0.5 inline-flex items-center justify-center rounded ${isLocked
              ? 'opacity-30 cursor-not-allowed'
              : 'cursor-pointer opacity-70 hover:scale-110 hover:bg-[rgba(255,0,255,0.2)] hover:opacity-100'
              }`}
            title={isLocked ? "Modification désactivée (statut RDV/SIGNE)" : "Enregistrer"}
          >
            💾
          </span>
        </div>
      </td>
    </tr>
  );
}

export default TableRow;

