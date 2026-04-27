import axios from 'axios';
import { parseSireneResults } from '../utils/sireneParser.js';

export class SireneClient {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.BASE_URL = "https://api.insee.fr/api-sirene/3.11";
  }

  _isDemo() {
    return !this.apiKey;
  }

  async searchBySecteurAndDepartement(secteur, departement, limit = 50000) {
    if (this._isDemo()) {
      return this._demoResults(secteur, departement);
    }

    const isCodeNaf = /\d/.test(secteur);
    const q = isCodeNaf
      ? `activitePrincipaleUniteLegale:${secteur} AND codePostalEtablissement:${departement}*`
      : `denominationUniteLegale:${secteur}* AND codePostalEtablissement:${departement}*`;

    const headers = {
      "X-INSEE-Api-Key-Integration": this.apiKey,
    };

    try {
      let allEtablissements = [];
      let curseur = null;
      const maxPerPage = 1000;
      let totalFetched = 0;
      let pageNumber = 0;
      let errorCount = 0;
      const maxRetries = 3;

      do {
        pageNumber++;
        let retryCount = 0;
        let pageSuccess = false;

        while (retryCount < maxRetries && !pageSuccess) {
          try {
            const params = {
              q,
              nombre: Math.min(maxPerPage, limit - totalFetched),
            };

            if (curseur) params.curseur = curseur;

            const url = `${this.BASE_URL}/siret`;
            const response = await axios.get(url, { headers, params, timeout: 30000 });
            const data = response.data;

            if (data.etablissements && data.etablissements.length > 0) {
              const pageEtablissements = data.etablissements.map(item => item.etablissement || item);
              allEtablissements = allEtablissements.concat(pageEtablissements);
              totalFetched += pageEtablissements.length;
            }

            curseur = data.header?.curseur || null;
            pageSuccess = true;

          } catch (error) {
            retryCount++;
            const statusCode = error.response?.status;

            if (statusCode === 429) {
              const retryAfter = error.response?.headers['retry-after']
                ? parseInt(error.response.headers['retry-after']) * 1000
                : Math.min(2000 * Math.pow(2, retryCount - 1), 10000);

              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryAfter));
                continue;
              }
            }

            if (statusCode === 404) {
              pageSuccess = false;
              break;
            }

            if (retryCount >= maxRetries) {
              errorCount++;
              if (errorCount === 1 && statusCode !== 404) {
                console.error(`Erreur API SIRENE (${statusCode}): ${error.message}`);
              }
              pageSuccess = false;
              break;
            }
          }
        }

        if (!pageSuccess || !curseur || totalFetched >= limit || (allEtablissements.length === 0 && pageNumber > 1)) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } while (totalFetched < limit && curseur);

      return await parseSireneResults(allEtablissements.slice(0, limit), (siren) => this._getSiegeBySiren(siren));
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Erreur lors de l'appel à l'API SIRENE:", error.message);
      }
      return this._demoResults(secteur, departement);
    }
  }

  async searchBySirets(sirets) {
    if (!Array.isArray(sirets) || sirets.length === 0) return [];

    const validSirets = sirets.map(s => String(s).trim()).filter(s => /^\d{14}$/.test(s));
    if (validSirets.length === 0) return [];

    if (this._isDemo()) return this._demoResultsBySiret(validSirets[0]);

    try {
      const headers = { "X-INSEE-Api-Key-Integration": this.apiKey };
      const q = `siret:(${validSirets.join(' OR ')})`;
      const url = `${this.BASE_URL}/siret`;
      const params = { q, nombre: validSirets.length };

      const response = await axios.get(url, { headers, params, timeout: 30000 });
      const data = response.data;

      if (data.etablissements && data.etablissements.length > 0) {
        const etablissements = data.etablissements.map(item => item.etablissement || item);
        return await parseSireneResults(etablissements, (siren) => this._getSiegeBySiren(siren));
      }
      return [];
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error(`Erreur lors de la recherche batch SIRET (${sirets.length}):`, error.message);
      }
      return [];
    }
  }

  async searchBySiret(siret) {
    if (!siret) return [];
    const siretStr = String(siret).trim();
    if (!/^\d{14}$/.test(siretStr)) return [];

    if (this._isDemo()) return this._demoResultsBySiret(siretStr);

    try {
      const headers = { "X-INSEE-Api-Key-Integration": this.apiKey };
      const url = `${this.BASE_URL}/siret/${siretStr}`;
      const response = await axios.get(url, { headers, timeout: 10000 });
      const data = response.data;

      if (data.etablissement) {
        return await parseSireneResults([data.etablissement], (siren) => this._getSiegeBySiren(siren));
      }
      return [];
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Erreur lors de la recherche par SIRET:", error.message);
      }
      return [];
    }
  }

  async _getSiegeBySiren(siren) {
    if (!siren || !this.apiKey || siren.length !== 9) return null;
    try {
      const headers = { "X-INSEE-Api-Key-Integration": this.apiKey };
      const url = `${this.BASE_URL}/siret`;
      const params = { q: `siren:${siren} AND etablissementSiege:true`, nombre: 1 };
      const response = await axios.get(url, { headers, params, timeout: 10000 });
      if (response.data.etablissements && response.data.etablissements.length > 0) {
        return response.data.etablissements[0].etablissement || response.data.etablissements[0];
      }
    } catch (error) { }
    return null;
  }

  _demoResults(secteur, departement) {
    return [
      {
        nom: `Entreprise ${secteur} Demo A`,
        adresse: `10 Rue de la Demo, ${departement}000 Ville-Demo`,
        telephone: "01 23 45 67 89",
        secteur: secteur,
        siret: "12345678900011",
        siren: "123456789",
        dirigeant: "M. Jean Dupont",
        effectif: "3 à 5 salariés",
        etat: "Actif",
      }
    ];
  }

  _demoResultsBySiret(siret) {
    return [
      {
        nom: `Entreprise Demo (SIRET: ${siret})`,
        adresse: `10 Rue de la Demo, 75001 Paris`,
        telephone: "01 23 45 67 89",
        secteur: "47.11C",
        siret: siret,
        siren: siret.substring(0, 9),
        dirigeant: "M. Jean Dupont",
        effectif: "3 à 5 salariés",
        etat: "Actif",
      },
    ];
  }
}
