-- Ajouter profile_id aux invitations pour permettre l'invitation directe par profil
ALTER TABLE project_invitations ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index pour chercher les invitations reçues par un profil
CREATE INDEX IF NOT EXISTS idx_project_invitations_profile ON project_invitations(profile_id);
