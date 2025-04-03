"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Clock, Plus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingsDialog } from "@/components/settings-dialog"

type Project = {
  id: string
  name: string
  date: string
  goal?: string
}

export function ProjectSidebar() {
  const router = useRouter()
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [olderProjects, setOlderProjects] = useState<Project[]>([])

  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Extraire les valeurs stables des searchParams
  const currentProjectName = searchParams?.get("name") || ""
  const currentProjectGoal = searchParams?.get("goal") || ""

  // Utiliser une référence pour suivre si le composant est monté
  const isMounted = useRef(false)
  // Référence pour suivre si le projet actuel a déjà été ajouté
  const projectAdded = useRef(false)

  // Fonction de déconnexion qui redirige vers la page d'accueil
  const handleSignOut = () => {
    // Ici, vous pourriez ajouter une logique de déconnexion réelle si nécessaire
    router.push("/")
  }

  // Fonction pour effacer tous les projets (à utiliser pour le développement)
  const clearAllProjects = () => {
    localStorage.removeItem("skwerd-projects")
    setRecentProjects([])
    setOlderProjects([])
  }

  // Charger les projets une seule fois au montage du composant
  useEffect(() => {
    if (isMounted.current) return
    isMounted.current = true

    // Effacer les projets existants (à supprimer en production)
    clearAllProjects()

    // Fonction pour charger les projets
    const loadProjects = () => {
      try {
        // Récupérer les projets du localStorage
        const storedProjects = localStorage.getItem("skwerd-projects")
        let projectsList: Project[] = []

        if (storedProjects) {
          projectsList = JSON.parse(storedProjects)
        }

        // Séparer les projets récents et plus anciens
        const recent = projectsList.filter((p) => p.date === "Today" || p.date === "Yesterday")
        const older = projectsList.filter((p) => p.date !== "Today" && p.date !== "Yesterday")

        setRecentProjects(recent)
        setOlderProjects(older)
      } catch (error) {
        console.error("Error loading projects:", error)
      }
    }

    loadProjects()
  }, []) // Dépendances vides pour n'exécuter qu'au montage

  // Effet séparé pour gérer l'ajout du projet actuel
  useEffect(() => {
    // Ne rien faire si le nom du projet est vide ou si le projet a déjà été ajouté
    if (!currentProjectName || currentProjectName.trim() === "" || projectAdded.current) {
      return
    }

    // Marquer le projet comme ajouté pour éviter les ajouts multiples
    projectAdded.current = true

    try {
      // Récupérer les projets existants
      const storedProjects = localStorage.getItem("skwerd-projects")
      let projectsList: Project[] = storedProjects ? JSON.parse(storedProjects) : []

      // Vérifier si le projet existe déjà
      const projectExists = projectsList.some((p) => p.name === currentProjectName)

      if (!projectExists) {
        // Créer un nouveau projet
        const newProject = {
          id: `project-${Date.now()}`,
          name: currentProjectName,
          date: "Today",
          goal: currentProjectGoal || undefined,
        }

        // Ajouter le nouveau projet au début de la liste
        projectsList = [newProject, ...projectsList]

        // Sauvegarder dans localStorage
        localStorage.setItem("skwerd-projects", JSON.stringify(projectsList))

        // Mettre à jour l'état avec le nouveau projet
        setRecentProjects((prev) => {
          // Vérifier si le projet existe déjà dans l'état
          if (prev.some((p) => p.name === currentProjectName)) {
            return prev
          }
          return [newProject, ...prev]
        })
      }
    } catch (error) {
      console.error("Error adding current project:", error)
    }
  }, [currentProjectName, currentProjectGoal])

  // Déterminer si un projet est actif
  const isActive = (projectName: string) => {
    return projectName === currentProjectName
  }

  return (
    <div className="w-64 h-screen fixed left-0 top-0 bottom-0 bg-white/60 border-r border-blue-400/30 flex flex-col backdrop-blur-sm">
      <div className="p-4 flex items-center justify-between border-b border-blue-400/30">
        <h2 className="font-medium text-blue-500">Projects</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col justify-between">
        <div>
          <div className="p-2">
            <Link
              href="/create"
              className="flex items-center gap-2 p-2 text-sm text-blue-500 hover:bg-blue-100/50 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Link>
          </div>

          {recentProjects.length > 0 && (
            <div className="px-3 py-2">
              <h3 className="text-xs font-medium text-blue-400 mb-2">Recent</h3>
              <ul className="space-y-1">
                {recentProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/kanban?name=${encodeURIComponent(project.name)}${project.goal ? `&goal=${encodeURIComponent(project.goal)}` : ""}`}
                      className={`flex flex-col p-2 text-sm rounded-md transition-colors ${
                        isActive(project.name)
                          ? "bg-blue-100 text-blue-600"
                          : "text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      <span className="font-medium truncate">{project.name}</span>
                      <span className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {project.date}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {olderProjects.length > 0 && (
            <div className="px-3 py-2">
              <h3 className="text-xs font-medium text-blue-400 mb-2">Older</h3>
              <ul className="space-y-1">
                {olderProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/kanban?name=${encodeURIComponent(project.name)}${project.goal ? `&goal=${encodeURIComponent(project.goal)}` : ""}`}
                      className={`flex flex-col p-2 text-sm rounded-md transition-colors ${
                        isActive(project.name)
                          ? "bg-blue-100 text-blue-600"
                          : "text-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      <span className="font-medium truncate">{project.name}</span>
                      <span className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {project.date}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="p-3 mt-auto">
          <SettingsDialog />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-blue-500 hover:bg-blue-100/50 hover:text-blue-600"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
