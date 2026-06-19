-- Migration: Ajout des colonnes 'name' et 'projet' à la table funbooster_access

-- 1. On s'assure d'abord que la table existe
CREATE TABLE IF NOT EXISTS funbooster_access (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    last_ip VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ajout des nouvelles colonnes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='funbooster_access' AND column_name='name') THEN
        ALTER TABLE funbooster_access ADD COLUMN name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='funbooster_access' AND column_name='projet') THEN
        ALTER TABLE funbooster_access ADD COLUMN projet VARCHAR(50);
    END IF;
END $$;
