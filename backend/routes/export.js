import express from 'express';
import XLSX from 'xlsx';
import { supabase } from '../server.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { results } = req.body;
    
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
    if (supabase) {
      const sirets = activeResults.map(ent => ent.siret).filter(Boolean);
      if (sirets.length > 0) {
        const { data } = await supabase
          .from('entreprise')
          .select('*')
          .in('siret', sirets);
        
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
      "Nom", "Adresse", "Téléphone", "Secteur", "SIRET", "SIREN",
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

export { router as exportExcel };

