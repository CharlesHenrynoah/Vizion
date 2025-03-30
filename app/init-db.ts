import { initDatabase } from '@/lib/db';

// Fonction pour initialiser la base de données au démarrage de l'application
export async function initApp() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
