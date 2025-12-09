-- Migration: Ajouter la colonne client_of
-- À exécuter si vous avez déjà une base de données existante

-- Ajouter la colonne client_of avec valeur par défaut vide
ALTER TABLE entreprise 
ADD COLUMN IF NOT EXISTS client_of VARCHAR(255) DEFAULT '';

