import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Assurez-vous que cette fonction est correctement exportée avec le paramètre request
export async function GET(request: Request) {
  try {
    console.log('Vérification de la connexion à la base de données...');
    
    // 1. Test de connexion simple
    const connectionTest = await query('SELECT NOW() as time');
    console.log('Connexion réussie:', connectionTest.rows[0].time);
    
    // 2. Vérifier si la table users existe
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('La table users existe:', tableExists);
    
    let response = {
      connection: "ok",
      timestamp: connectionTest.rows[0].time,
      tableExists: tableExists,
      userCount: 0,
      structure: null as null | any[]
    };
    
    if (tableExists) {
      // 3. Compter le nombre d'utilisateurs
      const countResult = await query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(countResult.rows[0].count);
      console.log('Nombre d\'utilisateurs:', userCount);
      
      // 4. Vérifier la structure de la table
      const structureCheck = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      response.userCount = userCount;
      response.structure = structureCheck.rows;
    }
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la vérification de la base de données:', error);
    return NextResponse.json({
      connection: "failed",
      error: String(error),
      message: "Échec de la connexion à la base de données"
    }, { status: 500 });
  }
}
