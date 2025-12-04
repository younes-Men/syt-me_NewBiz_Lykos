-- Migration: Ajouter la colonne tel pour stocker un numéro de téléphone saisi manuellement
-- À exécuter si vous avez déjà une base de données existante

ALTER TABLE entreprise 
ADD COLUMN IF NOT EXISTS tel VARCHAR(50) DEFAULT '';


