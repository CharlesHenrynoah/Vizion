"use server"

import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import { redirect } from "next/navigation"
// Supprimer cette ligne:
// import crypto from "crypto"

// Types pour l'authentification
export type User = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  bio?: string
  role: string
  status: string
  email_verified: boolean
  preferences?: Record<string, any>
  created_at: Date
  updated_at: Date
  last_login?: Date
}

export type AuthResult = {
  success: boolean
  message: string
  user?: User
}

// Remplacer la fonction hashPassword par celle-ci:
function hashPassword(password: string): string {
  // Version simplifiée pour la démo - en production, utilisez bcrypt ou argon2
  // Cette fonction utilise un encodage base64 simple avec le sel
  const salt = process.env.PASSWORD_SALT || "default-salt-for-demo"
  return Buffer.from(password + salt).toString("base64")
}

// Fonction pour s'inscrire
export async function signUp(email: string, password: string, fullName = ""): Promise<AuthResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return { success: false, message: "Cet email est déjà utilisé" }
    }

    // Générer un avatar par défaut basé sur les initiales
    const initials = fullName
      ? fullName
          .split(" ")
          .map((name) => name[0])
          .join("")
          .toUpperCase()
      : email[0].toUpperCase()

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=8B5CF6&color=fff`

    // Hasher le mot de passe
    const passwordHash = hashPassword(password)

    // Remplacer toutes les utilisations de crypto.randomBytes() par:
    // Exemple ligne 246:
    // const verificationToken = crypto.randomBytes(32).toString("hex")
    // Remplacer par:
    const verificationToken = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

    // Insérer l'utilisateur
    const result = await sql<User[]>`
      INSERT INTO users (
        email, 
        password_hash, 
        full_name, 
        avatar_url,
        verification_token
      )
      VALUES (
        ${email}, 
        ${passwordHash}, 
        ${fullName}, 
        ${avatarUrl},
        ${verificationToken}
      )
      RETURNING 
        id, 
        email, 
        full_name, 
        avatar_url, 
        bio, 
        role, 
        status,
        email_verified,
        preferences, 
        created_at, 
        updated_at
    `

    if (result.length === 0) {
      return { success: false, message: "Échec de la création de l'utilisateur" }
    }

    const user = result[0]

    // Remplacer toutes les utilisations de crypto.randomUUID() par:
    // Exemple ligne 107:
    // const sessionId = crypto.randomUUID()
    // Remplacer par:
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
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `

    return {
      success: true,
      message: "Inscription réussie",
      user,
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

// Fonction pour se connecter
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Hasher le mot de passe pour la comparaison
    const passwordHash = hashPassword(password)

    // Rechercher l'utilisateur
    const users = await sql<User[]>`
      SELECT 
        id, 
        email, 
        full_name, 
        avatar_url, 
        bio, 
        role, 
        status,
        email_verified,
        preferences, 
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

    // Remplacer toutes les utilisations de crypto.randomUUID() par:
    // Exemple ligne 107:
    // const sessionId = crypto.randomUUID()
    // Remplacer par:
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
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `

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
export async function signOut() {
  cookies().delete("session_id")
  cookies().delete("user_info")
  redirect("/")
}

// Fonction pour vérifier si l'utilisateur est connecté
export async function getSession(): Promise<{ isLoggedIn: boolean; user?: User }> {
  const sessionId = cookies().get("session_id")?.value

  if (!sessionId) {
    return { isLoggedIn: false }
  }

  const userInfoCookie = cookies().get("user_info")?.value

  if (!userInfoCookie) {
    return { isLoggedIn: false }
  }

  try {
    const userInfo = JSON.parse(userInfoCookie)

    // Vérifier si les informations utilisateur sont valides
    if (!userInfo.id || !userInfo.email) {
      return { isLoggedIn: false }
    }

    // Récupérer les informations utilisateur à jour depuis la base de données
    const sql = neon(process.env.DATABASE_URL!)

    const users = await sql<User[]>`
      SELECT 
        id, 
        email, 
        full_name, 
        avatar_url, 
        bio, 
        role, 
        status,
        email_verified,
        preferences, 
        created_at, 
        updated_at,
        last_login
      FROM users
      WHERE id = ${userInfo.id} AND status = 'active'
    `

    if (users.length === 0) {
      return { isLoggedIn: false }
    }

    return {
      isLoggedIn: true,
      user: users[0],
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de la session:", error)
    return { isLoggedIn: false }
  }
}

// Fonction pour mettre à jour le profil utilisateur
export async function updateUserProfile(
  userId: string,
  updates: {
    fullName?: string
    bio?: string
    avatarUrl?: string
    preferences?: Record<string, any>
  },
): Promise<AuthResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Construire dynamiquement la requête de mise à jour
    const updateFields: string[] = []
    const values: any[] = []

    if (updates.fullName !== undefined) {
      updateFields.push("full_name = $1")
      values.push(updates.fullName)
    }

    if (updates.bio !== undefined) {
      updateFields.push(`bio = $${values.length + 1}`)
      values.push(updates.bio)
    }

    if (updates.avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${values.length + 1}`)
      values.push(updates.avatarUrl)
    }

    if (updates.preferences !== undefined) {
      updateFields.push(`preferences = $${values.length + 1}`)
      values.push(JSON.stringify(updates.preferences))
    }

    // Ajouter toujours updated_at
    updateFields.push("updated_at = CURRENT_TIMESTAMP")

    if (updateFields.length === 0) {
      return { success: false, message: "Aucune mise à jour fournie" }
    }

    // Exécuter la requête de mise à jour
    await sql`
      UPDATE users
      SET ${sql.raw(updateFields.join(", "))}
      WHERE id = ${userId}
    `

    // Récupérer l'utilisateur mis à jour
    const users = await sql<User[]>`
      SELECT 
        id, 
        email, 
        full_name, 
        avatar_url, 
        bio, 
        role, 
        status,
        email_verified,
        preferences, 
        created_at, 
        updated_at
      FROM users
      WHERE id = ${userId}
    `

    if (users.length === 0) {
      return { success: false, message: "Utilisateur non trouvé après la mise à jour" }
    }

    // Mettre à jour le cookie user_info
    cookies().set(
      "user_info",
      JSON.stringify({
        id: users[0].id,
        email: users[0].email,
        fullName: users[0].full_name,
        avatarUrl: users[0].avatar_url,
        role: users[0].role,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 semaine
        path: "/",
      },
    )

    return {
      success: true,
      message: "Profil mis à jour avec succès",
      user: users[0],
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

// Fonction pour demander la réinitialisation du mot de passe
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Vérifier si l'utilisateur existe
    const users = await sql`
      SELECT id FROM users WHERE email = ${email} AND status = 'active'
    `

    if (users.length === 0) {
      // Pour des raisons de sécurité, ne pas indiquer si l'email existe ou non
      return { success: true, message: "Si votre email est enregistré, vous recevrez un lien de réinitialisation" }
    }

    // Remplacer toutes les utilisations de crypto.randomBytes() par:
    // Exemple ligne 246:
    // const verificationToken = crypto.randomBytes(32).toString("hex")
    // Remplacer par:
    const resetToken = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    const resetExpires = new Date(Date.now() + 3600000) // 1 heure

    // Enregistrer le token dans la base de données
    await sql`
      UPDATE users
      SET 
        reset_password_token = ${resetToken},
        reset_password_expires = ${resetExpires}
      WHERE id = ${users[0].id}
    `

    // Dans une application réelle, envoyer un email avec le lien de réinitialisation
    // Pour cette démo, nous retournons simplement le token

    return {
      success: true,
      message: "Si votre email est enregistré, vous recevrez un lien de réinitialisation",
      user: { id: users[0].id, email, reset_token: resetToken } as any,
    }
  } catch (error) {
    console.error("Erreur lors de la demande de réinitialisation de mot de passe:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

// Fonction pour réinitialiser le mot de passe
export async function resetPassword(token: string, newPassword: string): Promise<AuthResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Vérifier si le token est valide
    const users = await sql`
      SELECT id FROM users 
      WHERE reset_password_token = ${token}
      AND reset_password_expires > CURRENT_TIMESTAMP
      AND status = 'active'
    `

    if (users.length === 0) {
      return { success: false, message: "Token invalide ou expiré" }
    }

    // Hasher le nouveau mot de passe
    const passwordHash = hashPassword(newPassword)

    // Mettre à jour le mot de passe et effacer le token
    await sql`
      UPDATE users
      SET 
        password_hash = ${passwordHash},
        reset_password_token = NULL,
        reset_password_expires = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${users[0].id}
    `

    return {
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

// Fonction pour vérifier l'email
export async function verifyEmail(token: string): Promise<AuthResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Vérifier si le token est valide
    const users = await sql<User[]>`
      SELECT 
        id, 
        email, 
        full_name, 
        avatar_url, 
        bio, 
        role, 
        status,
        email_verified,
        preferences, 
        created_at, 
        updated_at
      FROM users 
      WHERE verification_token = ${token}
      AND status = 'active'
    `

    if (users.length === 0) {
      return { success: false, message: "Token de vérification invalide" }
    }

    // Marquer l'email comme vérifié
    await sql`
      UPDATE users
      SET 
        email_verified = TRUE,
        verification_token = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${users[0].id}
    `

    return {
      success: true,
      message: "Email vérifié avec succès",
      user: { ...users[0], email_verified: true },
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

// Fonction pour changer le mot de passe
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<AuthResult> {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Vérifier le mot de passe actuel
    const currentPasswordHash = hashPassword(currentPassword)

    const users = await sql`
      SELECT id FROM users 
      WHERE id = ${userId}
      AND password_hash = ${currentPasswordHash}
      AND status = 'active'
    `

    if (users.length === 0) {
      return { success: false, message: "Mot de passe actuel incorrect" }
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = hashPassword(newPassword)

    // Mettre à jour le mot de passe
    await sql`
      UPDATE users
      SET 
        password_hash = ${newPasswordHash},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    return {
      success: true,
      message: "Mot de passe changé avec succès",
    }
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
    }
  }
}

