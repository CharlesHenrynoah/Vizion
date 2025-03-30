import { initDatabase } from '@/lib/db';
import Link from "next/link";
import { ProjectForm } from "@/components/project-form";

// Convertir cette page en composant serveur
export const dynamic = 'force-dynamic';

// Cette fonction s'exécutera côté serveur à chaque requête
export async function getServerData() {
  try {
    console.log('Initializing database...');
    const dbStatus = await initDatabase();
    console.log('Database initialization status:', dbStatus);
    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, message: `Database initialization failed: ${errorMessage}` };
  }
}

export default async function Home() {
  // Appeler la fonction d'initialisation de la base de données et attendre les résultats
  const dbStatus = await getServerData();
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Welcome to Vizion</h1>
      <p className="mb-4">The app is running correctly</p>
      
      {/* Afficher l'état de la connexion à la base de données */}
      <div className={`p-4 rounded-md mb-6 ${dbStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        <h2 className="font-semibold">Database Status:</h2>
        <p>{dbStatus.message}</p>
      </div>
      
      <div className="flex gap-4 mb-8">
        <Link href="/signup" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
          Sign Up
        </Link>
        <Link href="/login" className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700">
          Log In
        </Link>
      </div>
    </div>
  );
}

