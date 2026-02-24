-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Anonyme',
  avatar_url TEXT,
  location TEXT,
  contact_email TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('homme', 'femme', 'non-binaire', 'autre')),
  sexuality TEXT,
  questionnaire_answers JSONB NOT NULL DEFAULT '{}',
  introduction JSONB NOT NULL DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour rechercher par user_id (déjà UNIQUE, mais utile pour les lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Index pour les profils publiés
CREATE INDEX IF NOT EXISTS idx_profiles_published ON profiles(is_published) WHERE is_published = true;

-- RLS : activer Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : lecture publique des profils publiés
CREATE POLICY "Profils publiés visibles par tous"
  ON profiles FOR SELECT
  USING (is_published = true);

-- Politique : un utilisateur peut lire son propre profil (même non publié)
CREATE POLICY "Utilisateur lit son propre profil"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : un utilisateur peut créer/modifier son propre profil
CREATE POLICY "Utilisateur gère son propre profil"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
