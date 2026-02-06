import express from 'express';
import XLSX from 'xlsx';
import { supabase } from '../server.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { results, projet } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        error: 'Aucune donnée à exporter.'
      });
    }

    // Filtrer uniquement les entreprises actives
    const activeResults = results.filter(
      ent => String(ent.etat || '').trim() === 'Actif'
    );

    if (activeResults.length === 0) {
      return res.status(400).json({
        error: 'Aucune entreprise active à exporter.'
      });
    }

    // Récupérer les données depuis Supabase si disponible
    let entrepriseDataMap = {};
    if (supabase && projet) {
      const sirets = activeResults.map(ent => ent.siret).filter(Boolean);
      if (sirets.length > 0) {
        const { data } = await supabase
          .from('entreprise')
          .select('*')
          .in('siret', sirets)
          .eq('projet', projet);

        if (data) {
          data.forEach(ent => {
            entrepriseDataMap[ent.siret] = ent;
          });
        }
      }
    }

    // Préparer les données pour Excel
    const excelData = activeResults.map(ent => {
      const siret = String(ent.siret || '').trim();
      const entrepriseData = entrepriseDataMap[siret] || {};

      return {
        "Nom": String(ent.nom || '').trim(),
        "Adresse": String(ent.adresse || '').trim(),
        "Téléphone": String(ent.telephone || '').trim(),
        "Tél": String(entrepriseData.tel || '').trim(),
        "Secteur": String(ent.secteur || '').trim(),
        "SIRET": siret,
        "SIREN": String(ent.siren || '').trim(),
        "Effectif": String(ent.effectif || '').trim(),
        "État": String(ent.etat || '').trim(),
        "Statut": entrepriseData.status || ent.statut || 'A traiter',
        "Date de modification": entrepriseData.date_modification
          ? new Date(entrepriseData.date_modification).toLocaleString('fr-FR')
          : (ent.date_modification || ''),
        "FunBooster": entrepriseData.funebooster || ent.funbooster || '',
        "Observation": entrepriseData.observation || ent.observation || '',
        "Lien OPCO (France Compétences)": String(ent.opco_url || '').trim(),
        "Lien Dirigeant (Pappers)": String(ent.pappers_url || '').trim(),
        "Lien Téléphone (PagesJaunes)": String(ent.pagesjaunes_url || '').trim(),
      };
    });

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Définir l'ordre des colonnes
    const columnOrder = [
      "Nom", "Adresse", "Téléphone", "Tél", "Secteur", "SIRET", "SIREN",
      "Effectif", "État", "Statut", "Date de modification",
      "FunBooster", "Observation",
      "Lien OPCO (France Compétences)", "Lien Dirigeant (Pappers)",
      "Lien Téléphone (PagesJaunes)"
    ];

    // Réorganiser les colonnes
    const reorderedData = excelData.map(row => {
      const newRow = {};
      columnOrder.forEach(col => {
        newRow[col] = row[col];
      });
      return newRow;
    });

    const wsReordered = XLSX.utils.json_to_sheet(reorderedData);

    // Ajuster les largeurs des colonnes
    const colWidths = [
      { wch: 30 }, // Nom
      { wch: 40 }, // Adresse
      { wch: 20 }, // Téléphone
      { wch: 20 }, // Tél (manuel)
      { wch: 20 }, // Secteur
      { wch: 18 }, // SIRET
      { wch: 15 }, // SIREN
      { wch: 15 }, // Effectif
      { wch: 15 }, // État
      { wch: 20 }, // Statut
      { wch: 25 }, // Date de modification
      { wch: 20 }, // FunBooster
      { wch: 30 }, // Observation
      { wch: 40 }, // Lien OPCO
      { wch: 50 }, // Lien Dirigeant
      { wch: 50 }, // Lien Téléphone
    ];
    wsReordered['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, wsReordered, "Entreprises");

    // Générer le buffer
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx'
    });

    // Nom du fichier
    const filename = `entreprises_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.xlsx`;

    // Envoyer le fichier
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({
      error: `Erreur lors de l'export : ${error.message}`
    });
  }
});

router.post('/period', async (req, res) => {
  try {
    const { projet, period, month, year } = req.body;

    if (!supabase || !projet) {
      return res.status(400).json({ error: 'Projet ou Supabase manquant.' });
    }

    // Calculer les dates de début et fin
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (period === '15days') {
      startDate.setDate(startDate.getDate() - 15);
    } else if (period === 'month') {
      startDate.setDate(1);
    } else if (period === 'year') {
      startDate.setMonth(0, 1);
    } else if (period === 'custom' && month && year) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    }

    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    console.log(`[EXPORT] Début export pour ${projet}, période: ${period}, de ${startDateISO} à ${endDateISO}`);

    // FETCH TOUTES LES DONNÉES DE SUPABASE (BYPASS 1000 LIMIT)
    let allTreated = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error: dbError } = await supabase
        .from('entreprise')
        .select('*')
        .eq('projet', projet)
        .gte('date_modification', startDateISO)
        .lte('date_modification', endDateISO)
        .range(from, from + step - 1);

      if (dbError) throw dbError;

      if (batch && batch.length > 0) {
        allTreated = allTreated.concat(batch);
        from += step;
        if (batch.length < step) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    console.log(`[EXPORT] ${allTreated.length} entreprises trouvées dans Supabase.`);

    if (allTreated.length === 0) {
      return res.status(404).json({ error: 'Aucune entreprise trouvée pour cette période.' });
    }

    // RÉCUPÉRER LES DÉTAILS SIRENE PAR BATCH DE 100
    const SireneClient = (await import('../services/sirene.js')).SireneClient;
    const client = new SireneClient(process.env.SIRENE_API_KEY);

    const excelData = [];
    const batchSize = 100;

    for (let i = 0; i < allTreated.length; i += batchSize) {
      const batchEnt = allTreated.slice(i, i + batchSize);
      const batchSirets = batchEnt.map(e => e.siret);

      console.log(`[EXPORT] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allTreated.length / batchSize)}...`);

      try {
        const sireneResults = await client.searchBySirets(batchSirets);
        const sireneMap = {};
        sireneResults.forEach(r => {
          sireneMap[r.siret] = r;
        });

        // Aligner les données Supabase avec les données Sirene
        batchEnt.forEach(ent => {
          const info = sireneMap[ent.siret] || {};
          excelData.push({
            "Nom": String(info.nom || ent.nom || 'Inconnu').trim(),
            "Adresse": String(info.adresse || 'Inconnue').trim(),
            "Téléphone": String(info.telephone || '').trim(),
            "Tél": String(ent.tel || '').trim(),
            "Secteur": String(info.secteur || '').trim(),
            "SIRET": ent.siret,
            "SIREN": String(info.siren || ent.siret.substring(0, 9)).trim(),
            "Effectif": String(info.effectif || '').trim(),
            "État": String(info.etat || 'Actif').trim(),
            "Statut": ent.status || 'A traiter',
            "Date de modification": ent.date_modification
              ? new Date(ent.date_modification).toLocaleString('fr-FR')
              : '',
            "FunBooster": ent.funebooster || '',
            "Observation": ent.observation || '',
            "Lien OPCO (France Compétences)": `https://quel-est-mon-opco.francecompetences.fr/?siret=${ent.siret}`,
            "Lien Dirigeant (Pappers)": `https://www.pappers.fr/recherche?q=${ent.siret.substring(0, 9)}`,
            "Lien Téléphone (PagesJaunes)": "",
          });
        });
      } catch (err) {
        console.error(`[EXPORT] Erreur sur le batch ${i}:`, err.message);
        // Fallback pour ce batch si Sirene échoue complètement
        batchEnt.forEach(ent => {
          excelData.push({
            "Nom": String(ent.nom || 'Inconnu').trim(),
            "Adresse": 'Inconnue',
            "Téléphone": '',
            "Tél": String(ent.tel || '').trim(),
            "Secteur": '',
            "SIRET": ent.siret,
            "SIREN": ent.siret.substring(0, 9),
            "Effectif": '',
            "État": 'Actif',
            "Statut": ent.status || 'A traiter',
            "Date de modification": ent.date_modification ? new Date(ent.date_modification).toLocaleString('fr-FR') : '',
            "FunBooster": ent.funebooster || '',
            "Observation": ent.observation || '',
            "Lien OPCO (France Compétences)": `https://quel-est-mon-opco.francecompetences.fr/?siret=${ent.siret}`,
            "Lien Dirigeant (Pappers)": `https://www.pappers.fr/recherche?q=${ent.siret.substring(0, 9)}`,
            "Lien Téléphone (PagesJaunes)": "",
          });
        });
      }
    }

    console.log(`[EXPORT] Génération du fichier Excel pour ${excelData.length} lignes...`);

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Définir les largeurs de colonnes
    const colWidths = [
      { wch: 35 }, { wch: 45 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
      { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
      { wch: 25 }, { wch: 15 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 40 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Entreprises");

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `export_${projet}_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

    console.log(`[EXPORT] Export terminé avec succès : ${filename}`);

  } catch (error) {
    console.error('Erreur export period:', error);
    res.status(500).json({ error: `Erreur lors de l'exportation : ${error.message}` });
  }
});

export { router as exportExcel };

