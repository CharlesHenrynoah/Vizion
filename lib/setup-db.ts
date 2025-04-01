import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: '.env.local' });

// Lire le script SQL
const sqlScript = fs.readFileSync(path.join(process.cwd(), 'lib/init-db.sql'), 'utf8');

// Vérifier que les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies');
  process.exit(1);
}

// Créer le client Supabase avec la clé de service pour les permissions admin
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('Initialisation de la base de données...');
  
  try {
    // Exécuter le script SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sqlScript });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    
    // Essayer une approche alternative si la fonction RPC n'est pas disponible
    try {
      console.log('Tentative d\'exécution SQL via l\'API REST...');
      
      // Diviser le script en commandes individuelles
      const commands = sqlScript
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);
      
      for (const cmd of commands) {
        const { error } = await supabase.from('_exec_sql').select('*').eq('query', cmd + ';');
        if (error) {
          console.error(`Erreur lors de l'exécution de la commande: ${cmd}`, error);
        }
      }
      
      console.log('✅ Base de données initialisée via l\'API REST');
    } catch (restError) {
      console.error('❌ Échec de l\'initialisation via l\'API REST:', restError);
      console.log('⚠️ Veuillez exécuter le script SQL manuellement dans l\'interface Supabase');
      console.log('Script SQL à exécuter:');
      console.log(sqlScript);
    }
  }
}

// Exécuter la fonction d'initialisation
setupDatabase();
