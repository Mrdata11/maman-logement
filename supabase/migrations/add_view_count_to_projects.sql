-- Ajouter la colonne view_count à la table projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Fonction RPC pour incrémenter le compteur de vues de façon atomique
CREATE OR REPLACE FUNCTION increment_project_views(project_id uuid)
RETURNS void AS $$
  UPDATE projects SET view_count = view_count + 1 WHERE id = project_id;
$$ LANGUAGE sql;
