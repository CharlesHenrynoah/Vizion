import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Assurez-vous que cette fonction est correctement exportée
export async function GET(request: Request) {
  console.log('Initialisation simple de la base de données');
  
  // Créer un pool de connexion
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test de connexion
    console.log('Test de connexion...');
    const testResult = await pool.query('SELECT NOW() as time');
    console.log('Connexion réussie:', testResult.rows[0].time);
    
    // Créer la table users
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
    
    // Vérifier que la table existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    // Fermer la connexion
    await pool.end();
    
    // Retourner une réponse
    return NextResponse.json({
      success: true,
      message: 'Base de données initialisée',
      tableExists: tableCheck.rows[0].exists
    });
  } catch (error) {
    console.error('Erreur:', error);
    
    try {
      await pool.end();
    } catch (e) {}
    
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
