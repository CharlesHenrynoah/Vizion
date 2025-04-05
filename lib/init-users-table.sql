-- Supprimer toutes les tables existantes avec leurs dépendances
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS ticket_statuses CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS sub_tickets CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;

-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  avatar TEXT,
  profile_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Index pour accélérer les recherches par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Création de la table projects
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  color VARCHAR(20) DEFAULT '#3b82f6', -- Couleur par défaut (bleu)
  icon VARCHAR(50) DEFAULT 'clipboard' -- Icône par défaut
);

-- Ajout de la contrainte de clé étrangère avec le bon type
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

-- Index pour accélérer les recherches de projets par utilisateur
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- Création de la table pour les statuts de tickets
CREATE TABLE IF NOT EXISTS ticket_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- Insertion des statuts par défaut
INSERT INTO ticket_statuses (name, color, position) 
VALUES 
  ('To Do', '#3b82f6', 0),
  ('In Progress', '#8b5cf6', 1),
  ('Done', '#10b981', 2)
ON CONFLICT DO NOTHING;

-- Création de la table tickets (tickets principaux)
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status_id INTEGER NOT NULL REFERENCES ticket_statuses(id) ON DELETE RESTRICT,
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 0, -- 0: Low, 1: Medium, 2: High, 3: Urgent
  position INTEGER DEFAULT 0, -- Position dans la colonne de statut
  tags TEXT[], -- Tableau de tags
  attachments TEXT[], -- Tableau de pièces jointes
  is_sub_ticket BOOLEAN DEFAULT FALSE, -- Indique si c'est un sous-ticket
  parent_ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE, -- Référence au ticket parent (si c'est un sous-ticket)
  sub_tickets_count INTEGER DEFAULT 0 -- Nombre de sous-tickets
);

-- Index pour accélérer les recherches de tickets par projet
CREATE INDEX IF NOT EXISTS idx_tickets_project ON tickets(project_id);
-- Index pour accélérer les recherches de tickets par statut
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status_id);
-- Index pour accélérer les recherches de tickets par assigné
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
-- Index pour accélérer les recherches de sous-tickets par ticket parent
CREATE INDEX IF NOT EXISTS idx_tickets_parent ON tickets(parent_ticket_id) WHERE parent_ticket_id IS NOT NULL;

-- Création de la table pour les membres du projet (pour les projets collaboratifs)
CREATE TABLE IF NOT EXISTS project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Index pour accélérer les recherches de membres par projet
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
-- Index pour accélérer les recherches de projets par membre
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- Création de la table pour les commentaires sur les tickets
CREATE TABLE IF NOT EXISTS ticket_comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  attachments TEXT[] -- Tableau de pièces jointes pour les commentaires
);

-- Index pour accélérer les recherches de commentaires par ticket
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le compteur de sous-tickets
CREATE OR REPLACE FUNCTION update_sub_tickets_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_ticket_id IS NOT NULL THEN
    -- Incrémente le compteur de sous-tickets du ticket parent
    UPDATE tickets SET sub_tickets_count = sub_tickets_count + 1 
    WHERE id = NEW.parent_ticket_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_ticket_id IS NOT NULL THEN
    -- Décrémente le compteur de sous-tickets du ticket parent
    UPDATE tickets SET sub_tickets_count = sub_tickets_count - 1 
    WHERE id = OLD.parent_ticket_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.parent_ticket_id IS DISTINCT FROM OLD.parent_ticket_id THEN
    -- Si le parent a changé, décrémente l'ancien et incrémente le nouveau
    IF OLD.parent_ticket_id IS NOT NULL THEN
      UPDATE tickets SET sub_tickets_count = sub_tickets_count - 1 
      WHERE id = OLD.parent_ticket_id;
    END IF;
    IF NEW.parent_ticket_id IS NOT NULL THEN
      UPDATE tickets SET sub_tickets_count = sub_tickets_count + 1 
      WHERE id = NEW.parent_ticket_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour automatiquement le champ updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_comments_updated_at
BEFORE UPDATE ON ticket_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le compteur de sous-tickets
CREATE TRIGGER update_sub_tickets_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_sub_tickets_count();