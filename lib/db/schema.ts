// Types pour les structures de données utilisées avec Supabase
// Ces types servent uniquement de référence et ne définissent pas le schéma de la base de données

export type User = {
  id: string;
  email: string;
  name: string;
  password?: string | null;
  avatar?: string | null;
  profile_photo?: string | null;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
};

export type Project = {
  id: number;
  name: string;
  description?: string | null;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  color?: string;
  icon?: string;
};

export type TicketStatus = {
  id: number;
  name: string;
  color: string;
  position: number;
};

export type Ticket = {
  id: number;
  title: string;
  description?: string | null;
  project_id: number;
  status_id: number;
  assigned_to?: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  due_date?: string | null;
  priority?: number;
  position?: number;
  tags?: string[] | null;
  attachments?: string[] | null;
  is_sub_ticket?: boolean;
  parent_ticket_id?: number | null;
  sub_tickets_count?: number;
};

export type ProjectMember = {
  id: number;
  project_id: number;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at?: string;
};

export type TicketComment = {
  id: number;
  ticket_id: number;
  user_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  attachments?: string[] | null;
};
