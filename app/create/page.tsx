"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { ProjectFormEnhanced } from "@/components/project-form-enhanced"

export default function CreateProjectPage() {
  // Protection de la page pour les utilisateurs authentifiés uniquement
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login?callbackUrl=/create')
    },
  })

  // Si l'utilisateur n'est pas encore authentifié, afficher un message de chargement
  if (status === "loading") {
    return (
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-center">
          <p className="text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/60 border border-blue-400/50 rounded-lg p-8 paper-vignette overflow-hidden relative transition-all duration-300 shadow-2xl shadow-black/20">
          <h2 className="text-2xl font-bold text-blue-400 mb-6">Créer un nouveau projet</h2>
          <p className="text-blue-400 mb-6">
            Décrivez votre projet pour générer automatiquement un tableau Kanban avec des tickets fonctionnels.
          </p>
          <ProjectFormEnhanced onProjectCreated={() => {
            // La redirection est gérée dans le composant ProjectFormEnhanced
          }} />
        </div>
      </div>
    </div>
  )
}
