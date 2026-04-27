import { TRANCHE_EFFECTIFS_LABELS, ETAT_LABELS } from './constants.js';

/**
 * Parse les résultats de l'API SIRENE pour normaliser les données des entreprises.
 * @param {Array} etablissements - Liste brute des établissements retournés par l'API.
 * @param {Function} getSiegeCallback - Fonction asynchrone pour récupérer le siège si manquant.
 * @returns {Promise<Array>} - Liste des entreprises normalisées.
 */
export async function parseSireneResults(etablissements, getSiegeCallback) {
  const results = [];
  const entreprisesMap = new Map();

  if (!etablissements || etablissements.length === 0) {
    return results;
  }

  // Grouper les établissements par SIREN
  const etablissementsBySiren = new Map();
  for (const e of etablissements) {
    let siren = "";

    if (e.uniteLegale && e.uniteLegale.siren) {
      siren = e.uniteLegale.siren;
    } else if (e.siret && e.siret.length >= 9) {
      siren = e.siret.substring(0, 9);
    } else if (e.siren) {
      siren = e.siren;
    } else if (e.periodesEtablissement && Array.isArray(e.periodesEtablissement) && e.periodesEtablissement.length > 0) {
      const periode = e.periodesEtablissement[0];
      if (periode.siren) {
        siren = periode.siren;
      } else if (e.siret && e.siret.length >= 9) {
        siren = e.siret.substring(0, 9);
      }
    }

    if (!siren) continue;

    if (!etablissementsBySiren.has(siren)) {
      etablissementsBySiren.set(siren, []);
    }
    etablissementsBySiren.get(siren).push(e);
  }

  // Pour chaque entreprise (SIREN), trouver le siège et utiliser ses données
  for (const [siren, etabs] of etablissementsBySiren) {
    const firstEtab = etabs[0];
    let unite = firstEtab.uniteLegale || {};

    if (!unite || Object.keys(unite).length === 0) {
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

    let siretSiege = unite.siretUniteLegale || "";
    if (!siretSiege) {
      siretSiege = siren + "000";
    }

    let siegeEtab = null;
    for (const etab of etabs) {
      const etabSiret = etab.siret || "";
      if (etabSiret === siretSiege ||
        etab.etablissementSiege === true ||
        etab.etablissementSiege === "true" ||
        etabSiret.endsWith("000")) {
        siegeEtab = etab;
        break;
      }
    }

    if (!siegeEtab && getSiegeCallback) {
      siegeEtab = await getSiegeCallback(siren);
      if (siegeEtab && !siegeEtab.uniteLegale && unite && Object.keys(unite).length > 0) {
        siegeEtab.uniteLegale = unite;
      }
    }

    if (!siegeEtab && etabs.length > 0) {
      siegeEtab = etabs[0];
    }

    let adresseFull = "";
    let siret = siretSiege || (siren + "000");

    if (siegeEtab) {
      siret = siegeEtab.siret || siret;
      const siegeAdresse = siegeEtab.adresseEtablissement || {};
      const voie = siegeAdresse.libelleVoieEtablissement || "";
      const cp = siegeAdresse.codePostalEtablissement || "";
      const commune = siegeAdresse.libelleCommuneEtablissement || "";
      adresseFull = [voie, `${cp} ${commune}`].filter(Boolean).join(", ");
    } else {
      const adresseUnite = unite.adresseUniteLegale || {};
      const voie = adresseUnite.libelleVoieUniteLegale || "";
      const cp = adresseUnite.codePostalUniteLegale || "";
      const commune = adresseUnite.libelleCommuneUniteLegale || "";
      adresseFull = [voie, `${cp} ${commune}`].filter(Boolean).join(", ");
    }

    let effectifCode = unite.trancheEffectifsUniteLegale || "";
    if (!effectifCode && siegeEtab) {
      effectifCode = siegeEtab.trancheEffectifsEtablissement || "";
    }

    const effectifLabel = TRANCHE_EFFECTIFS_LABELS[effectifCode] || "0 à 1";

    // FILTRES EFFECTIFS
    const codes0a1 = ["NN", "00"];
    const codesPlusDe50 = ["21", "22", "31", "32", "41", "42", "51", "52", "53"];

    if (codes0a1.includes(effectifCode) || codesPlusDe50.includes(effectifCode)) {
      continue;
    }

    let etatUnite = unite.etatAdministratifUniteLegale || "";
    if (!etatUnite && unite.periodesUniteLegale) {
      const periodes = unite.periodesUniteLegale;
      if (Array.isArray(periodes) && periodes.length > 0) {
        const dernierePeriode = periodes[periodes.length - 1];
        etatUnite = dernierePeriode.etatAdministratifUniteLegale || "";
      }
    }

    let etatEtablissement = "";
    if (siegeEtab) {
      etatEtablissement = siegeEtab.etatAdministratifEtablissement || "";
      if (!etatEtablissement && siegeEtab.periodesEtablissement && Array.isArray(siegeEtab.periodesEtablissement) && siegeEtab.periodesEtablissement.length > 0) {
        const dernierePeriode = siegeEtab.periodesEtablissement[siegeEtab.periodesEtablissement.length - 1];
        etatEtablissement = dernierePeriode.etatAdministratifEtablissement || "";
      }
    }

    if (etatUnite !== "A" || etatEtablissement !== "A") {
      continue;
    }

    if (!entreprisesMap.has(siren)) {
      const entrepriseData = {
        nom,
        adresse: adresseFull,
        telephone: "",
        secteur: unite.activitePrincipaleUniteLegale ||
          firstEtab.activitePrincipaleUniteLegale ||
          firstEtab.activitePrincipaleEtablissement ||
          "",
        siret,
        siren,
        dirigeant: "",
        effectif: effectifLabel,
        etat: "Actif",
      };

      entreprisesMap.set(siren, entrepriseData);
    }
  }

  return Array.from(entreprisesMap.values());
}
