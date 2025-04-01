import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: ".env.local" });

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  // Créer un client PostgreSQL pour les migrations
  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  
  // Initialiser Drizzle avec le client
  const db = drizzle(migrationClient);

  // Exécuter les migrations
  console.log("Running migrations...");
  
  try {
    await migrate(db, { migrationsFolder: "lib/drizzle/migrations" });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    // Fermer la connexion
    await migrationClient.end();
  }
};

runMigration();
