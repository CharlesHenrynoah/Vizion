import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: '.env.local' });

// Vérifier que les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies');
  process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupUsersTable() {
  console.log('Création de la table users...');
  
  try {
    // Vérifier si la table users existe déjà
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');
    
    if (tablesError) {
      console.error('Erreur lors de la vérification des tables existantes:', tablesError);
      return;
    }
    
    // Si la table existe déjà, ne rien faire
    if (existingTables && existingTables.length > 0) {
      console.log('✅ La table users existe déjà');
      return;
    }
    
    // Créer la table users via l'API REST de Supabase
    const { error: createError } = await supabase.rpc('create_users_table');
    
    if (createError) {
      console.error('Erreur lors de la création de la table users:', createError);
      console.log('\nVeuillez exécuter le script SQL manuellement dans l\'interface Supabase SQL Editor:');
      console.log('1. Connectez-vous à votre tableau de bord Supabase');
      console.log('2. Allez dans la section "SQL Editor"');
      console.log('3. Créez une nouvelle requête et collez le contenu du fichier lib/init-users-table.sql');
      console.log('4. Exécutez la requête\n');
      return;
    }
    
    console.log('✅ Table users créée avec succès');
    
  } catch (error) {
    console.error('Erreur lors de la création de la table users:', error);
    console.log('\nVeuillez exécuter le script SQL manuellement dans l\'interface Supabase SQL Editor:');
    console.log('1. Connectez-vous à votre tableau de bord Supabase');
    console.log('2. Allez dans la section "SQL Editor"');
    console.log('3. Créez une nouvelle requête et collez le contenu du fichier lib/init-users-table.sql');
    console.log('4. Exécutez la requête\n');
  }
}

// Exécuter la fonction d'initialisation
setupUsersTable();
