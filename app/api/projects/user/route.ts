import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { supabaseAdmin } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Vérifier si l'utilisateur est authentifié
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = session.user.id
    console.log("User ID:", userId, "Type:", typeof userId)

    try {
      // Utiliser l'API Supabase pour récupérer les projets dont l'utilisateur est propriétaire
      const { data: ownedProjects, error: ownedError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('owner_id', userId.toString()) // Conversion en chaîne pour éviter les problèmes de type
        .eq('is_active', true)

      if (ownedError) {
        console.error("Erreur lors de la récupération des projets:", ownedError)
        throw ownedError
      }

      // Récupérer les projets dont l'utilisateur est membre
      const { data: memberProjects, error: memberError } = await supabaseAdmin
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('user_id', userId.toString()) // Conversion en chaîne pour éviter les problèmes de type
        .eq('projects.is_active', true)

      if (memberError) {
        console.error("Erreur lors de la récupération des projets membres:", memberError)
        throw memberError
      }

      // Combiner les projets
      const allProjects = [
        ...(ownedProjects || []),
        ...(memberProjects || []).map(mp => mp.projects)
      ]

      // Éliminer les doublons
      const uniqueProjects = Array.from(
        new Map(allProjects.map(project => [project.id, project])).values()
      )

      // Retourner le nombre de projets et les projets
      return NextResponse.json({
        count: uniqueProjects.length,
        projects: uniqueProjects
      })
    } catch (dbError) {
      console.error("Erreur de base de données:", dbError)
      
      // Retourner une réponse vide en cas d'erreur de base de données
      // pour que le frontend puisse continuer à fonctionner
      return NextResponse.json({
        count: 0,
        projects: [],
        dbError: true
      }, { status: 200 }) // On retourne 200 pour éviter l'erreur côté client
    }
  } catch (error) {
    console.error("Erreur serveur:", error)
    
    // Même en cas d'erreur générale, on retourne une réponse valide
    return NextResponse.json({
      count: 0,
      projects: [],
      error: true
    }, { status: 200 }) // On retourne 200 pour éviter l'erreur côté client
  }
}
