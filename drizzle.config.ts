import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
} satisfies Config;
