-- Migration: Ajouter la colonne projet et modifier la contrainte UNIQUE
-- À exécuter si vous avez déjà une base de données existante

-- 1. Ajouter la colonne projet avec valeur par défaut 'OPCO'
ALTER TABLE entreprise 
ADD COLUMN IF NOT EXISTS projet VARCHAR(50) NOT NULL DEFAULT 'OPCO';

-- 2. Supprimer l'ancienne contrainte UNIQUE sur siret si elle existe
ALTER TABLE entreprise 
DROP CONSTRAINT IF EXISTS entreprise_siret_key;

-- 3. Ajouter la nouvelle contrainte UNIQUE sur (siret, projet)
ALTER TABLE entreprise 
ADD CONSTRAINT entreprise_siret_projet_unique UNIQUE (siret, projet);

-- 4. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_entreprise_projet ON entreprise(projet);
CREATE INDEX IF NOT EXISTS idx_entreprise_siret_projet ON entreprise(siret, projet);

-- Note: Les données existantes auront automatiquement projet = 'OPCO' grâce à DEFAULT

