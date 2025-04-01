import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Vérifier que l'URL de la base de données est définie
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Créer un client PostgreSQL
const client = postgres(process.env.DATABASE_URL);

// Créer une instance Drizzle avec le client et le schéma
export const db = drizzle(client, { schema });

// Exporter le schéma pour être utilisé ailleurs
export { schema };
