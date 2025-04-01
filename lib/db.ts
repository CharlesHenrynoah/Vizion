import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Read Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Basic check to ensure environment variables are set
if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Make sure NEXT_PUBLIC_SUPABASE_URL is set in your .env file.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key not found. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your .env file.");
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configuration pour Drizzle ORM avec PostgreSQL
let db: ReturnType<typeof setupDrizzle>;

// Fonction pour configurer Drizzle
function setupDrizzle() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  
  // Créer un client PostgreSQL
  const client = postgres(process.env.DATABASE_URL);
  
  // Créer une instance Drizzle
  return drizzle(client);
}

// Initialiser Drizzle en environnement serveur uniquement
if (typeof window === 'undefined') {
  db = setupDrizzle();
}

export { db };
