// Script pour initialiser la base de données manuellement
// Exécuter avec: node scripts/setup-database.js

require('dotenv').config();
const { Pool } = require('pg');

async function initDatabase() {
  console.log('Démarrage de l\'initialisation de la base de données...');
  console.log('DATABASE_URL de l\'environnement:', process.env.DATABASE_URL ? '✓ définie' : '✗ non définie');
  
  // Créer un pool de connexion PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Tentative de connexion à la base de données...');
    
    // Test de connexion
    const testConnection = await pool.query('SELECT 1 as test');
    console.log('Connexion établie avec succès ✓');
    
    // Créer la fonction de génération UUID si elle n'existe pas
    console.log('Vérification/Création des fonctions nécessaires...');
    try {
      await pool.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `);
      console.log('Extension UUID activée avec succès ✓');
    } catch (extensionError) {
      console.warn('Impossible d\'activer l\'extension uuid-ossp, utilisation d\'une alternative:', extensionError.message);
    }
    
    // Créer la table users avec une méthode alternative pour générer des UUID
    console.log('Création de la table users...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        email_verified BOOLEAN DEFAULT FALSE,
        image TEXT,
        role TEXT DEFAULT 'USER'
      );
    `).catch(async (error) => {
      console.warn('Erreur avec uuid_generate_v4(), essai avec méthode alternative:', error.message);
      
      // Si uuid_generate_v4 n'est pas disponible, essayons une autre approche
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          email_verified BOOLEAN DEFAULT FALSE,
          image TEXT,
          role TEXT DEFAULT 'USER'
        );
      `);
      console.log('Table users créée avec méthode alternative (md5) ✓');
    });
    
    // Vérifier que la table existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    console.log('Vérification de la table users:', tableCheck.rows[0].exists ? 
      '✓ Table existe' : '✗ Table n\'existe toujours pas');
    
    if (tableCheck.rows[0].exists) {
      // Compter les utilisateurs existants
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`Nombre d'utilisateurs dans la table: ${userCount.rows[0].count}`);
      
      // Afficher la structure de la table
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      console.log('Structure de la table users:');
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
      });
      
      // Créer un utilisateur de test
      console.log('Création d\'un utilisateur de test...');
      try {
        const testEmail = `test_${Date.now()}@example.com`;
        await pool.query(`
          INSERT INTO users (first_name, last_name, email, password)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) DO NOTHING
        `, ['Test', 'User', testEmail, 'hashed_password_here']);
        console.log(`Utilisateur de test créé: ${testEmail} ✓`);
      } catch (userError) {
        console.error('Erreur lors de la création de l\'utilisateur de test:', userError.message);
      }
    }
    
    // Fermer la connexion
    await pool.end();
    console.log('Initialisation de la base de données terminée avec succès ✓');
  } catch (error) {
    console.error('ERREUR CRITIQUE LORS DE L\'INITIALISATION:', error);
    try {
      await pool.end();
    } catch (closeError) {}
    process.exit(1);
  }
}

// Exécuter immédiatement la fonction d'initialisation
console.log('='.repeat(50));
console.log('SCRIPT D\'INITIALISATION DE LA BASE DE DONNÉES');
console.log('='.repeat(50));
initDatabase();
