import { createClient } from '@supabase/supabase-js';

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

// Removed old/incorrect helper functions (initDatabase, query, getRow, getRows)
// Use the exported 'supabase' client directly for database interactions.
