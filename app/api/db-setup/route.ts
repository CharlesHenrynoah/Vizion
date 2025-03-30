import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: Request) {
  console.log('Initialisation directe de la base de données via l\'API');
  
  // Créer un pool de connexion directement ici
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test de connexion
    console.log('Test de connexion à la base de données...');
    const connTest = await pool.query('SELECT NOW() as time');
    console.log('Connexion réussie:', connTest.rows[0].time);
    
    // Créer la table users avec méthode alternative (sans dépendre d'extensions)
    console.log('Création de la table users...');
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
    
    // Vérifier la table
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    // Créer un utilisateur de test
    let testUserCreated = false;
    let testUserEmail = '';
    
    if (tableExists) {
      testUserEmail = `test_${Date.now()}@example.com`;
      try {
        await pool.query(`
          INSERT INTO users (first_name, last_name, email, password)
          VALUES ($1, $2, $3, $4)
        `, ['Test', 'User', testUserEmail, 'test_password_123']);
        testUserCreated = true;
      } catch (userError) {
        console.error('Erreur lors de la création de l\'utilisateur de test:', userError);
      }
    }
    
    // Fermer la connexion
    await pool.end();
    
    // Réponse de succès
    return NextResponse.json({
      success: true,
      message: 'Initialisation de la base de données réussie',
      databaseConnection: true,
      tableCreated: tableExists,
      testUserCreated: testUserCreated,
      testUserEmail: testUserEmail
    }, { status: 200 });
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    
    try {
      await pool.end();
    } catch (e) {}
    
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de l\'initialisation de la base de données',
      error: String(error)
    }, { status: 500 });
  }
}
