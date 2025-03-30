"use server"

import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"

// Type étendu pour les données d'utilisateur
export type User = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  bio?: string
  role: string
  status: string
  preferences?: Record<string, any>
  created_at: Date
  updated_at: Date
}

// Type pour le résultat d'authentification
export type AuthResult = {
  success: boolean
  message: string
  user?: User
}

// Fonction simplifiée pour créer un utilisateur
export async function createUser(email: string, password: string, fullName = "", avatarUrl = ""): Promise<User | null> {
  try {
    console.log("Tentative de création d'utilisateur:", { email, fullName })

    // Initialiser la connexion à la base de données Neon
    const sql = neon(process.env.DATABASE_URL!)

    // Hasher le mot de passe (dans un environnement de production, utilisez bcrypt ou argon2)
    const passwordHash = Buffer.from(password + (process.env.PASSWORD_SALT || "default-salt")).toString("base64")

    // Vérifier si l'email existe déjà
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`

    if (existingUser.length > 0) {
      console.log("Email déjà utilisé:", email)
      return null
    }

    // Utiliser une requête SQL paramétrique
    const result = await sql`
      INSERT INTO users (
        email, 
        password_hash, 
        full_name, 
        avatar_url,
        role,
        status
      )
      VALUES (
        ${email}, 
        ${passwordHash}, 
        ${fullName}, 
        ${avatarUrl},
        'user',
        'active'
      )
      RETURNING id, email, full_name, avatar_url, role, status, created_at, updated_at
    `

    console.log("Résultat de la création d'utilisateur:", result)

    if (result.length > 0) {
      // Convertir le résultat en objet User
      const user: User = {
        id: result[0].id,
        email: result[0].email,
        full_name: result[0].full_name,
        avatar_url: result[0].avatar_url,
        role: result[0].role || "user",
        status: result[0].status || "active",
        created_at: result[0].created_at,
        updated_at: result[0].updated_at,
      }

      return user
    }

    return null
  } catch (error) {
    console.error("Erreur détaillée lors de la création de l'utilisateur:", error)
    return null
  }
}

// Fonction pour authentifier un utilisateur
export async function signUp(email: string, password: string, fullName = ""): Promise<boolean> {
  try {
    // Générer un avatar par défaut basé sur les initiales
    const initials = fullName
      ? fullName
          .split(" ")
          .map((name) => name[0])
          .join("")
          .toUpperCase()
      : email[0].toUpperCase()

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=8B5CF6&color=fff`

    const user = await createUser(email, password, fullName, avatarUrl)

    if (user) {
      // Créer une session pour l'utilisateur
      const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Stocker la session dans un cookie
      cookies().set("session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 semaine
        path: "/",
      })

      // Stocker les informations utilisateur dans un cookie
      cookies().set(
        "user_info",
        JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.full_name || fullName,
          avatarUrl: user.avatar_url || avatarUrl,
          role: user.role,
        }),
        {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 1 semaine
          path: "/",
        },
      )

      return true
    }

    return false
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    return false
  }
}

// Fonction pour se connecter
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Hasher le mot de passe pour la comparaison
    const passwordHash = Buffer.from(password + (process.env.PASSWORD_SALT || "default-salt")).toString("base64")

    // Rechercher l'utilisateur
    const users = await sql<User[]>`
      SELECT 
        id, 
        email, 
        full_name, 
        avatar_url, 
        role, 
        status,
        created_at, 
        updated_at
      FROM users
      WHERE email = ${email} AND password_hash = ${passwordHash}
    `

    if (users.length === 0) {
      return { success: false, message: "Email ou mot de passe incorrect" }
    }

    const user = users[0]

    // Vérifier si le compte est actif
    if (user.status !== "active") {
      return { success: false, message: "Ce compte est désactivé" }
    }

    // Créer un ID de session
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Stocker la session dans un cookie
    cookies().set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semaine
      path: "/",
    })

    // Stocker les informations utilisateur dans un cookie
    cookies().set(
      "user_info",
      JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        role: user.role,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 semaine
        path: "/",
      },
    )

    // Mettre à jour la date de dernière connexion
    try {
      await sql`
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = ${user.id}
      `
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la date de dernière connexion:", error)
      // Continue even if updating last_login fails
    }

    return {
      success: true,
      message: "Connexion réussie",
      user,
    }
  } catch (error) {
    console.error("Erreur lors de la connexion:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

// Fonction pour se déconnecter
export async function signOut(): Promise<{ success: boolean }> {
  try {
    cookies().delete("session_id")
    cookies().delete("user_info")
    return { success: true }
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error)
    return { success: false }
  }
}

