import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// Récupérer les données d'une entreprise
router.get('/:siret', async (req, res) => {
  try {
    const { siret } = req.params;
    
    if (!supabase) {
      return res.status(503).json({ 
        error: 'Supabase non configuré' 
      });
    }

    const { data, error } = await supabase
      .from('entreprise')
      .select('*')
      .eq('siret', siret)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.json({
        siret,
        status: 'A traiter',
        date_modification: null,
        funebooster: '',
        observation: ''
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    res.status(500).json({ 
      error: `Erreur : ${error.message}` 
    });
  }
});

// Mettre à jour les données d'une entreprise
router.put('/:siret', async (req, res) => {
  try {
    const { siret } = req.params;
    const { status, funebooster, observation } = req.body;
    
    if (!supabase) {
      return res.status(503).json({ 
        error: 'Supabase non configuré' 
      });
    }

    const dateModification = new Date().toISOString();

    // Vérifier si l'entreprise existe
    const { data: existing } = await supabase
      .from('entreprise')
      .select('id')
      .eq('siret', siret)
      .single();

    const entrepriseData = {
      siret,
      status: status || 'A traiter',
      date_modification: dateModification,
      funebooster: funebooster || '',
      observation: observation || ''
    };

    let result;
    if (existing) {
      // Mettre à jour
      result = await supabase
        .from('entreprise')
        .update(entrepriseData)
        .eq('siret', siret)
        .select()
        .single();
    } else {
      // Créer
      result = await supabase
        .from('entreprise')
        .insert(entrepriseData)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ 
      error: `Erreur : ${error.message}` 
    });
  }
});

// Récupérer toutes les entreprises (pour export)
router.post('/batch', async (req, res) => {
  try {
    const { sirets } = req.body;
    
    if (!supabase) {
      return res.status(503).json({ 
        error: 'Supabase non configuré' 
      });
    }

    if (!Array.isArray(sirets) || sirets.length === 0) {
      return res.json({});
    }

    const { data, error } = await supabase
      .from('entreprise')
      .select('*')
      .in('siret', sirets);

    if (error) {
      throw error;
    }

    // Convertir en objet indexé par SIRET
    const result = {};
    data.forEach(ent => {
      result[ent.siret] = {
        status: ent.status || 'A traiter',
        date_modification: ent.date_modification || null,
        funebooster: ent.funebooster || '',
        observation: ent.observation || ''
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération batch:', error);
    res.status(500).json({ 
      error: `Erreur : ${error.message}` 
    });
  }
});

export { router as entrepriseRoutes };

