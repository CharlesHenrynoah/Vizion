-- Script pour mettre à jour les types de colonnes d'ID utilisateur de INTEGER à TEXT

-- Supprimer les contraintes de clé étrangère existantes
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_created_by_fkey;
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
ALTER TABLE ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_user_id_fkey;

-- Modifier les types de colonnes
ALTER TABLE projects ALTER COLUMN owner_id TYPE TEXT;
ALTER TABLE tickets ALTER COLUMN assigned_to TYPE TEXT;
ALTER TABLE tickets ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE project_members ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE ticket_comments ALTER COLUMN user_id TYPE TEXT;

-- Recréer les contraintes de clé étrangère
ALTER TABLE projects ADD CONSTRAINT projects_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE tickets ADD CONSTRAINT tickets_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
  
ALTER TABLE tickets ADD CONSTRAINT tickets_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;
  
ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  
ALTER TABLE ticket_comments ADD CONSTRAINT ticket_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Mettre à jour la séquence pour la table users si nécessaire
-- Cette étape est nécessaire si vous avez des utilisateurs existants avec des IDs numériques
-- et que vous souhaitez continuer à générer des IDs numériques pour les nouveaux utilisateurs
-- qui n'utilisent pas OAuth
CREATE OR REPLACE FUNCTION generate_user_id() 
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'ID n'est pas déjà défini (par exemple par OAuth)
  IF NEW.id IS NULL THEN
    -- Générer un nouvel ID numérique en tant que texte
    NEW.id := nextval('users_id_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer la séquence si elle n'existe pas
CREATE SEQUENCE IF NOT EXISTS users_id_seq;

-- Créer le trigger pour générer automatiquement les IDs utilisateur
DROP TRIGGER IF EXISTS set_user_id ON users;
CREATE TRIGGER set_user_id
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_user_id();
