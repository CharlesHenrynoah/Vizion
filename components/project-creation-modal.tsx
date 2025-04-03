"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProjectFormEnhanced } from "@/components/project-form-enhanced"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type ProjectCreationModalProps = {
  onClose?: () => void
  standalone?: boolean
}

export function ProjectCreationModal({ onClose, standalone = false }: ProjectCreationModalProps) {
  const [hasProjects, setHasProjects] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Vérifier si l'utilisateur a des projets
    const storedProjects = localStorage.getItem("skwerd-projects")
    if (storedProjects) {
      const projectsList = JSON.parse(storedProjects)
      setHasProjects(projectsList.length > 0)
    }
  }, [])

  // Si l'utilisateur a des projets et que ce n'est pas un mode standalone, ne pas afficher le modal
  if (hasProjects && !standalone) {
    return null
  }

  return (
    <div className={`${standalone ? "" : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"}`}>
      <div className={`bg-white/90 rounded-lg shadow-xl ${standalone ? "w-full" : "w-full max-w-2xl mx-4"}`}>
        <div className="flex items-center justify-between p-4 border-b border-blue-400/30">
          <h2 className="text-xl font-medium text-blue-500">Créez votre premier projet</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-500 hover:bg-blue-100/50 rounded-full p-1 h-8 w-8"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer</span>
            </Button>
          )}
        </div>
        <div className="p-6">
          <p className="text-blue-400 mb-6">
            Décrivez votre projet pour générer automatiquement un tableau Kanban avec des tickets fonctionnels.
          </p>
          <ProjectFormEnhanced onProjectCreated={() => {
            // Rafraîchir la page après la création du projet pour recharger les données
            router.refresh()
            
            // Si un callback onClose est fourni, l'appeler
            if (onClose) {
              onClose()
            }
          }} />
        </div>
      </div>
    </div>
  )
}
