import { query, getRow, getRows } from './db';

// Classe utilitaire pour encapsuler les fonctions de base de données
export class Database {
  // Exemple de méthode pour récupérer un utilisateur par ID
  static async getUserById(id: string) {
    return await getRow('SELECT * FROM users WHERE id = $1', [id]);
  }
  
  // Exemple de méthode pour récupérer tous les utilisateurs
  static async getAllUsers() {
    return await getRows('SELECT id, name, email, image, created_at FROM users ORDER BY created_at DESC');
  }
  
  // Exemple de méthode pour une requête personnalisée
  static async executeQuery(sqlQuery: string, params: any[] = []) {
    return await query(sqlQuery, params);
  }
}

export default Database;
