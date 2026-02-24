-- Ajouter la colonne is_system à screening_configs
ALTER TABLE screening_configs
  ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

-- Ajouter les colonnes de vérification à screening_sessions
ALTER TABLE screening_sessions
  ADD COLUMN IF NOT EXISTS verification_type text,
  ADD COLUMN IF NOT EXISTS verification_target_id text;

-- Créer un index pour les requêtes de vérification
CREATE INDEX IF NOT EXISTS idx_screening_sessions_verification
  ON screening_sessions (verification_type, verification_target_id)
  WHERE verification_type IS NOT NULL;
