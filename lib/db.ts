import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Read Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Basic check to ensure environment variables are set
if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Make sure NEXT_PUBLIC_SUPABASE_URL is set in your .env file.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key not found. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your .env file.");
}

// Create and export the Supabase client instance with anonymous key (for client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a Supabase client with service role key for server-side operations that need elevated privileges
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

// Configuration pour Drizzle ORM avec PostgreSQL
let db: ReturnType<typeof setupDrizzle>;

// Fonction pour configurer Drizzle
function setupDrizzle() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in environment variables");
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  
  try {
    // Créer un client PostgreSQL avec des options de connexion robustes
    const client = postgres(databaseUrl, {
      max: 10, // nombre maximum de connexions dans le pool
      idle_timeout: 20, // temps d'inactivité avant de fermer une connexion (en secondes)
      connect_timeout: 30, // temps maximum pour établir une connexion (en secondes)
      prepare: false, // désactiver la préparation des requêtes pour plus de compatibilité
    });
    
    // Créer une instance Drizzle
    return drizzle(client);
  } catch (error) {
    console.error("Erreur lors de la configuration de Drizzle:", error);
    throw error;
  }
}

// Initialiser Drizzle en environnement serveur uniquement
if (typeof window === 'undefined') {
  try {
    db = setupDrizzle();
  } catch (error) {
    console.error("Erreur lors de l'initialisation de Drizzle:", error);
    // Fournir une instance factice pour éviter les erreurs côté serveur
    db = {} as ReturnType<typeof setupDrizzle>;
  }
} else {
  // Fournir une instance factice pour le côté client
  db = {} as ReturnType<typeof setupDrizzle>;
}

export { db };
