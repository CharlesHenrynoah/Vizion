"use server"

import { neon } from "@neondatabase/serverless"

export async function initializeDatabase() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Log the database connection to verify it's working
    console.log("Database connection established")

    // Vérifier si la table users existe déjà
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `

    if (tableExists[0].exists) {
      // La table existe déjà, vérifier sa structure
      const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      `

      const columnNames = columns.map((col) => col.column_name)
      console.log("Colonnes existantes:", columnNames)

      // Ajouter les colonnes manquantes si nécessaire
      const missingColumns = []

      if (!columnNames.includes("full_name")) {
        missingColumns.push("full_name TEXT")
      }

      if (!columnNames.includes("avatar_url")) {
        missingColumns.push("avatar_url TEXT")
      }

      if (!columnNames.includes("bio")) {
        missingColumns.push("bio TEXT")
      }

      if (!columnNames.includes("preferences")) {
        missingColumns.push("preferences JSONB DEFAULT '{}'")
      }

      if (missingColumns.length > 0) {
        // Ajouter les colonnes manquantes une par une
        try {
          for (const column of missingColumns) {
            // Utiliser sql.query avec des placeholders
            await sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column}`, [])
          }
          console.log("Colonnes ajoutées:", missingColumns)
        } catch (error) {
          console.error("Erreur lors de l'ajout des colonnes:", error)
          // Continue even if there's an error adding columns
        }
      }

      return {
        success: true,
        message:
          missingColumns.length > 0
            ? "Table users mise à jour avec les colonnes manquantes"
            : "Table users existe déjà avec toutes les colonnes nécessaires",
      }
    }

    // Créer la table users avec un schéma minimal pour l'authentification
    console.log("Création de la table users...")
    await sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Table users créée avec succès")

    return { success: true, message: "Table users créée avec succès" }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

// Fonction pour vérifier si la table users existe
export async function checkUsersTable() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `

    return {
      exists: result[0].exists,
      message: result[0].exists ? "La table users existe" : "La table users n'existe pas",
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de la table users:", error)
    return {
      exists: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

// Fonction pour obtenir la structure de la table users
export async function getUsersTableStructure() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `

    return {
      success: true,
      columns,
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la structure de la table users:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

