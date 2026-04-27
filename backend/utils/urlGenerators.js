/**
 * Générer URL Pappers à partir d'un SIREN
 */
export function generatePappersUrl(siren) {
  if (!siren || siren.length < 9) {
    return '';
  }
  return `https://www.pappers.fr/recherche?q=${siren}`;
}

/**
 * Générer URL PagesJaunes à partir du nom et de l'adresse
 */
export function generatePagesjaunesUrl(nom, adresse) {
  if (!nom) return '';

  const codePostalMatch = adresse ? adresse.match(/\b(\d{5})\b/) : null;
  const codePostal = codePostalMatch ? codePostalMatch[1] : '';

  if (!codePostal) return '';

  const encodedNom = encodeURIComponent(nom.trim());
  return `https://www.pagesjaunes.fr/recherche/${codePostal}/${encodedNom}`;
}

/**
 * Générer URL OPCO à partir d'un SIRET
 */
export function generateOpcoUrl(siret) {
  if (!siret) return '';
  const siretStr = String(siret);
  if (!/^\d{14}$/.test(siretStr)) return '';
  return `https://quel-est-mon-opco.francecompetences.fr/?siret=${siretStr}`;
}
