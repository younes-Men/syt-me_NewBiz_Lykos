import axios from 'axios';

const TRANCHE_EFFECTIFS_LABELS = {
  "NN": "0 à 1",
  "00": "0 salarié (ayant employé des salariés au cours de l'année)",
  "01": "1 ou 2 salariés",
  "02": "3 à 5 salariés",
  "03": "6 à 9 salariés",
  "11": "10 à 19 salariés",
  "12": "20 à 49 salariés",
  "21": "50 à 99 salariés",
  "22": "100 à 199 salariés",
  "31": "200 à 249 salariés",
  "32": "250 à 499 salariés",
  "41": "500 à 999 salariés",
  "42": "1 000 à 1 999 salariés",
  "51": "2 000 à 4 999 salariés",
  "52": "5 000 à 9 999 salariés",
  "53": "10 000 salariés et plus",
};

export class SireneClient {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.BASE_URL = "https://api.insee.fr/api-sirene/3.11";
  }

  _isDemo() {
    return !this.apiKey;
  }

  async searchBySecteurAndDepartement(secteur, departement, limit = 300) {
    if (this._isDemo()) {
      return this._demoResults(secteur, departement);
    }

    const isCodeNaf = /\d/.test(secteur);
    const q = isCodeNaf
      ? `activitePrincipaleUniteLegale:${secteur} AND codePostalEtablissement:${departement}*`
      : `denominationUniteLegale:${secteur}* AND codePostalEtablissement:${departement}*`;

    const params = {
      q,
      nombre: Math.min(limit, 1000),
    };

    const headers = {
      "X-INSEE-Api-Key-Integration": this.apiKey,
    };

    try {
      const url = `${this.BASE_URL}/siret`;
      const response = await axios.get(url, { headers, params, timeout: 15000 });
      const data = response.data;

      let etablissements = [];
      if (data.etablissements) {
        etablissements = data.etablissements.map(item => 
          item.etablissement || item
        );
      }

      const parsedResults = await this._parseResults(etablissements.slice(0, limit));
      return parsedResults;
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API SIRENE:", error.message);
      return this._demoResults(secteur, departement);
    }
  }

  // Méthode pour récupérer le siège d'une entreprise par son SIREN
  async _getSiegeBySiren(siren) {
    if (!siren || !this.apiKey || siren.length !== 9) return null;

    try {
      const headers = {
        "X-INSEE-Api-Key-Integration": this.apiKey,
      };
      
      // Rechercher le siège de l'entreprise
      const url = `${this.BASE_URL}/siret`;
      const params = {
        q: `siren:${siren} AND etablissementSiege:true`,
        nombre: 1,
      };

      const response = await axios.get(url, { headers, params, timeout: 10000 });
      const data = response.data;

      if (data.etablissements && data.etablissements.length > 0) {
        const siege = data.etablissements[0].etablissement || data.etablissements[0];
        return siege;
      }
    } catch (error) {
      // Erreur silencieuse - on retourne null
    }
    return null;
  }

  async _parseResults(etablissements) {
    const results = [];
    // Utiliser un Map pour éviter les doublons par SIREN (une entreprise = un résultat)
    const entreprisesMap = new Map();

    if (etablissements.length === 0) {
      return results;
    }

    // Grouper les établissements par SIREN
    const etablissementsBySiren = new Map();
    for (const e of etablissements) {
      // Essayer différentes façons d'accéder au SIREN
      let siren = "";
      
      // Méthode 1: depuis uniteLegale.siren
      if (e.uniteLegale && e.uniteLegale.siren) {
        siren = e.uniteLegale.siren;
      }
      // Méthode 2: depuis le SIRET (9 premiers chiffres)
      else if (e.siret && e.siret.length >= 9) {
        siren = e.siret.substring(0, 9);
      }
      // Méthode 3: depuis siren directement
      else if (e.siren) {
        siren = e.siren;
      }
      // Méthode 4: depuis periodesEtablissement
      else if (e.periodesEtablissement && Array.isArray(e.periodesEtablissement) && e.periodesEtablissement.length > 0) {
        const periode = e.periodesEtablissement[0];
        if (periode.siren) {
          siren = periode.siren;
        } else if (e.siret && e.siret.length >= 9) {
          siren = e.siret.substring(0, 9);
        }
      }
      
      if (!siren) {
        continue;
      }
      
      if (!etablissementsBySiren.has(siren)) {
        etablissementsBySiren.set(siren, []);
      }
      etablissementsBySiren.get(siren).push(e);
    }
    

    // Pour chaque entreprise (SIREN), trouver le siège et utiliser ses données
    for (const [siren, etabs] of etablissementsBySiren) {
      const firstEtab = etabs[0];
      
      // Essayer différentes façons d'accéder à l'unité légale
      let unite = firstEtab.uniteLegale || {};
      
      // Si uniteLegale est vide, essayer de le récupérer depuis les périodes
      if (!unite || Object.keys(unite).length === 0) {
        // Chercher dans les périodes de l'établissement
        if (firstEtab.periodesEtablissement && Array.isArray(firstEtab.periodesEtablissement) && firstEtab.periodesEtablissement.length > 0) {
          const periode = firstEtab.periodesEtablissement[0];
          unite = periode.uniteLegale || {};
        }
      }
      
      const nom = unite.denominationUniteLegale || 
                  unite.nomUniteLegale || 
                  firstEtab.denominationUniteLegale ||
                  firstEtab.nomUniteLegale ||
                  "";
      
      // Récupérer le SIRET du siège depuis l'unité légale
      let siretSiege = unite.siretUniteLegale || "";
      
      // Si pas de siretUniteLegale, construire avec SIREN + "000"
      if (!siretSiege) {
        siretSiege = siren + "000";
      }
      
      // Chercher l'établissement qui est le siège dans les résultats
      let siegeEtab = null;
      for (const etab of etabs) {
        const etabSiret = etab.siret || "";
        // Le siège correspond au siretUniteLegale ou a la propriété etablissementSiege
        if (etabSiret === siretSiege || 
            etab.etablissementSiege === true || 
            etab.etablissementSiege === "true" ||
            etabSiret.endsWith("000")) {
          siegeEtab = etab;
          break;
        }
      }
      
      // Si pas trouvé dans les résultats, faire une requête pour obtenir le siège
      if (!siegeEtab) {
        siegeEtab = await this._getSiegeBySiren(siren);
        
        if (siegeEtab) {
          // S'assurer que l'unité légale est disponible dans le siège
          if (!siegeEtab.uniteLegale && unite && Object.keys(unite).length > 0) {
            siegeEtab.uniteLegale = unite;
          }
        } else {
          // Dernier fallback : utiliser le premier établissement
          if (etabs.length > 0) {
            siegeEtab = etabs[0];
          }
        }
      }

      // Utiliser les données du SIÈGE (comme Pappers)
      let adresseFull = "";
      let siret = siretSiege || (siren + "000");
      
      if (siegeEtab) {
        // Utiliser le SIRET du siège
        siret = siegeEtab.siret || siret;
        
        // Utiliser l'adresse du siège
        const siegeAdresse = siegeEtab.adresseEtablissement || {};
        const voie = siegeAdresse.libelleVoieEtablissement || "";
        const cp = siegeAdresse.codePostalEtablissement || "";
        const commune = siegeAdresse.libelleCommuneEtablissement || "";
        adresseFull = [voie, `${cp} ${commune}`].filter(Boolean).join(", ");
      } else {
        // Si aucun établissement trouvé, utiliser les données de l'unité légale si disponibles
        const adresseUnite = unite.adresseUniteLegale || {};
        const voie = adresseUnite.libelleVoieUniteLegale || "";
        const cp = adresseUnite.codePostalUniteLegale || "";
        const commune = adresseUnite.libelleCommuneUniteLegale || "";
        adresseFull = [voie, `${cp} ${commune}`].filter(Boolean).join(", ");
      }

      // Effectif de l'ENTREPRISE (unité légale) - pas de l'établissement
      let effectifCode = unite.trancheEffectifsUniteLegale || "";
      
      // Si pas trouvé dans unite, chercher dans le premier établissement
      if (!effectifCode && siegeEtab) {
        effectifCode = siegeEtab.trancheEffectifsEtablissement || "";
      }
      
      const effectifLabel = TRANCHE_EFFECTIFS_LABELS[effectifCode] || "0 à 1";

      // FILTRE EFFECTIF: Exclure uniquement les entreprises avec plus de 50 salariés
      // Codes à exclure:
      // - "21" et plus: 50 salariés et plus
      const codesPlusDe50 = ["21", "22", "31", "32", "41", "42", "51", "52", "53"];
      
      if (codesPlusDe50.includes(effectifCode)) {
        continue; // Passer à l'entreprise suivante
      }

      // État de l'ENTREPRISE (unité légale)
      let etatUnite = unite.etatAdministratifUniteLegale || "";
      
      // Si pas trouvé, chercher dans les périodes
      if (!etatUnite && unite.periodesUniteLegale) {
        const periodes = unite.periodesUniteLegale;
        if (Array.isArray(periodes) && periodes.length > 0) {
          const dernierePeriode = periodes[periodes.length - 1];
          etatUnite = dernierePeriode.etatAdministratifUniteLegale || "";
        }
      }
      
      // État de l'ÉTABLISSEMENT (siège)
      let etatEtablissement = "";
      if (siegeEtab) {
        etatEtablissement = siegeEtab.etatAdministratifEtablissement || "";
        if (!etatEtablissement && siegeEtab.periodesEtablissement && Array.isArray(siegeEtab.periodesEtablissement) && siegeEtab.periodesEtablissement.length > 0) {
          const dernierePeriode = siegeEtab.periodesEtablissement[siegeEtab.periodesEtablissement.length - 1];
          etatEtablissement = dernierePeriode.etatAdministratifEtablissement || "";
        }
      }

      const etatLabels = {
        "A": "Actif",
        "F": "Fermé",
        "C": "Cessé",
      };

      const etatUniteLabel = etatLabels[etatUnite] || etatUnite || "Inconnu";
      const etatEtablissementLabel = etatLabels[etatEtablissement] || etatEtablissement || "Inconnu";

      // CONDITION: L'entreprise ET l'établissement doivent être "Actif"
      // Si l'entreprise est "Actif" mais l'établissement est "Fermé", on ne l'affiche pas
      if (etatUnite !== "A" || etatEtablissement !== "A") {
        continue; // Passer à l'entreprise suivante
      }

      // Utiliser uniquement l'état de l'entreprise (comme Pappers)
      const etatFinal = "Actif"; // On sait déjà que c'est "Actif" car on a vérifié

      // Ne garder qu'une seule entrée par SIREN (le siège)
      if (!entreprisesMap.has(siren)) {
        const entrepriseData = {
          nom,
          adresse: adresseFull,
          telephone: "",
          secteur: unite.activitePrincipaleUniteLegale || 
                   firstEtab.activitePrincipaleUniteLegale ||
                   firstEtab.activitePrincipaleEtablissement ||
                   "",
          siret, // SIRET du siège (comme Pappers)
          siren, // SIREN de l'entreprise
          dirigeant: "",
          effectif: effectifLabel, // Effectif de l'entreprise
          etat: etatFinal, // État de l'entreprise
        };
        
        entreprisesMap.set(siren, entrepriseData);
      }
    }

    // Convertir le Map en array
    return Array.from(entreprisesMap.values());
  }

  _demoResults(secteur, departement) {
    return [
      {
        nom: `Entreprise ${secteur.charAt(0).toUpperCase() + secteur.slice(1)} A (${departement})`,
        adresse: `10 Rue de la Demo, 7500${departement} Ville-Demo`,
        telephone: "01 23 45 67 89",
        secteur: secteur,
        siret: "12345678900011",
        siren: "123456789",
        dirigeant: "M. Jean Dupont",
        effectif: "03",
        etat: "Actif",
      },
      {
        nom: `Entreprise ${secteur.charAt(0).toUpperCase() + secteur.slice(1)} B (${departement})`,
        adresse: `25 Avenue Exemple, 7500${departement} Ville-Exemple`,
        telephone: "01 98 76 54 32",
        secteur: secteur,
        siret: "98765432100022",
        siren: "987654321",
        dirigeant: "Mme Marie Martin",
        effectif: "10",
        etat: "Actif",
      },
    ];
  }
}

