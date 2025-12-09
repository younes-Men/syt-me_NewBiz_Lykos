-- Table entreprise pour stocker les statuts, dates de modification, funebooster et observations
CREATE TABLE IF NOT EXISTS entreprise (
    id BIGSERIAL PRIMARY KEY,
    siret VARCHAR(14) NOT NULL,
    projet VARCHAR(50) NOT NULL DEFAULT 'OPCO',
    status VARCHAR(50) DEFAULT 'A traiter',
    date_modification TIMESTAMP WITH TIME ZONE,
    funebooster VARCHAR(255) DEFAULT '',
    observation TEXT DEFAULT '',
    tel VARCHAR(255) DEFAULT '',
    client_of VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(siret, projet)
);

-- Index sur SIRET pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_entreprise_siret ON entreprise(siret);

-- Index sur projet pour les filtres
CREATE INDEX IF NOT EXISTS idx_entreprise_projet ON entreprise(projet);

-- Index sur status pour les filtres
CREATE INDEX IF NOT EXISTS idx_entreprise_status ON entreprise(status);

-- Index composite pour les recherches par SIRET et projet
CREATE INDEX IF NOT EXISTS idx_entreprise_siret_projet ON entreprise(siret, projet);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entreprise_updated_at BEFORE UPDATE ON entreprise
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Optionnel, à activer selon vos besoins
-- ALTER TABLE entreprise ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous (ajustez selon vos besoins)
-- CREATE POLICY "Allow public read access" ON entreprise FOR SELECT USING (true);

-- Politique pour permettre l'écriture à tous (ajustez selon vos besoins)
-- CREATE POLICY "Allow public write access" ON entreprise FOR ALL USING (true);

