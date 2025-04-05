"use client"
import { useEffect, useState } from "react"
import KanbanBoard from "@/components/kanban-board"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { ProjectCreationModal } from "@/components/project-creation-modal"

// Type pour les tickets
export type Ticket = {
  id: string
  title: string
  description: string
  statusId: number
  projectId: number
  assignedTo?: number
  createdBy: number
  priority: number
  position: number
  tags?: string[]
  isSubTicket: boolean
  parentTicketId?: number
  subTickets?: SubTicket[]
}

export type SubTicket = {
  id: string
  title: string
  description: string
  statusId: number
  projectId: number
  assignedTo?: number
  createdBy: number
  priority: number
  position: number
  isSubTicket: boolean
  parentTicketId: number
}

// Type pour les colonnes
type ColumnType = {
  id: string
  title: string
  tickets: Ticket[]
}

export default function KanbanPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams?.get("projectId")
  const projectName = searchParams?.get("name") || "Untitled Project"
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect('/login?callbackUrl=/kanban' + (projectId ? `?projectId=${projectId}` : ''))
    }
  }, [status, projectId])

  const [isLoading, setIsLoading] = useState(true)
  const [columns, setColumns] = useState<ColumnType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasProjects, setHasProjects] = useState(true)
  const [showProjectCreation, setShowProjectCreation] = useState(false)
  const [isCheckingProjects, setIsCheckingProjects] = useState(true)

  // Vérifier si l'utilisateur a des projets dans la base de données
  useEffect(() => {
    const checkUserProjects = async () => {
      if (status !== "authenticated" || !session) {
        return
      }

      setIsCheckingProjects(true)

      try {
        // Si nous n'avons pas d'ID de projet, vérifier si l'utilisateur a des projets
        if (!projectId) {
          try {
            // Appeler l'API pour vérifier les projets de l'utilisateur
            const response = await fetch('/api/projects/user')
            
            if (!response.ok) {
              // En cas d'erreur de l'API, rediriger vers la page de création
              console.log("Erreur API projects/user: redirection vers /create")
              setIsCheckingProjects(false)
              redirect('/create')
              return
            }
            
            const data = await response.json()
            const userHasProjects = data.count > 0
            
            // Si l'utilisateur n'a pas de projets, rediriger vers la page de création
            if (!userHasProjects) {
              console.log("Utilisateur sans projets: redirection vers /create")
              setIsCheckingProjects(false)
              redirect('/create')
              return
            }
            
            // Si l'utilisateur a des projets mais qu'aucun n'est sélectionné,
            // afficher le message d'erreur "ID de projet manquant"
            setHasProjects(true)
            setShowProjectCreation(false)
            setError("ID de projet manquant")
          } catch (fetchError) {
            // En cas d'erreur, rediriger vers la page de création
            console.log("Erreur lors de la vérification des projets:", fetchError)
            setIsCheckingProjects(false)
            redirect('/create')
            return
          }
        } else {
          // Si nous avons un ID de projet, on peut continuer normalement
          setHasProjects(true)
          setShowProjectCreation(false)
        }
      } catch (outerError) {
        // Gestion globale des erreurs
        console.log("Erreur globale:", outerError)
        setHasProjects(false)
        setError("Une erreur est survenue")
      } finally {
        setIsCheckingProjects(false)
      }
    }

    if (status === "authenticated") {
      checkUserProjects()
    }
  }, [status, session, projectId, projectName])

  useEffect(() => {
    async function loadTickets() {
      if (isCheckingProjects) {
        // Attendre que la vérification des projets soit terminée
        return
      }

      if (!projectId) {
        // Si on a un nom de projet mais pas d'ID, c'est un nouveau projet
        if (projectName && projectName !== "Untitled Project") {
          setIsLoading(false)
          return
        }
        
        // Si on n'a pas de projets et qu'on doit afficher le formulaire
        if (!hasProjects && showProjectCreation) {
          setIsLoading(false)
          return
        }
        
        setError("ID de projet manquant")
        setIsLoading(false)
        return
      }

      try {
        // Charger les tickets depuis l'API
        const response = await fetch(`/api/tickets?projectId=${projectId}`)
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${await response.text()}`)
        }
        
        const data = await response.json()
        setColumns(data)
      } catch (error) {
        console.error("Erreur lors du chargement des tickets:", error)
        setError("Impossible de charger les tickets. Veuillez réessayer.")
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les tickets. Veuillez réessayer.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated" && !isCheckingProjects) {
      loadTickets()
    }
  }, [projectId, status, projectName, hasProjects, showProjectCreation, isCheckingProjects])

  // Fonction pour créer un ticket
  const createTicket = async (ticket: Partial<Ticket>) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ticket,
          projectId: projectId
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`)
      }

      // Recharger les tickets après création
      const ticketsResponse = await fetch(`/api/tickets?projectId=${projectId}`)
      const data = await ticketsResponse.json()
      setColumns(data)

      return await response.json()
    } catch (error) {
      console.error("Erreur lors de la création du ticket:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le ticket. Veuillez réessayer.",
      })
      throw error
    }
  }

  // Fonction pour mettre à jour un ticket
  const updateTicket = async (ticket: Partial<Ticket>) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticket),
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`)
      }

      // Recharger les tickets après mise à jour
      const ticketsResponse = await fetch(`/api/tickets?projectId=${projectId}`)
      const data = await ticketsResponse.json()
      setColumns(data)

      return await response.json()
    } catch (error) {
      console.error("Erreur lors de la mise à jour du ticket:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le ticket. Veuillez réessayer.",
      })
      throw error
    }
  }

  // Fonction pour supprimer un ticket
  const deleteTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets?id=${ticketId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`)
      }

      // Recharger les tickets après suppression
      const ticketsResponse = await fetch(`/api/tickets?projectId=${projectId}`)
      const data = await ticketsResponse.json()
      setColumns(data)

      return true
    } catch (error) {
      console.error("Erreur lors de la suppression du ticket:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le ticket. Veuillez réessayer.",
      })
      throw error
    }
  }

  if (isLoading || isCheckingProjects) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Chargement du projet...</p>
        </div>
      </div>
    )
  }

  // Afficher le formulaire de création de projet si l'utilisateur n'a pas de projets
  if (showProjectCreation) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-lg text-center">Vous n'avez pas encore de projet.</p>
          <button 
            onClick={() => redirect('/create')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Créer un nouveau projet
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <p className="text-lg font-medium text-destructive">{error}</p>
          {error === "ID de projet manquant" && (
            <p>Veuillez sélectionner un projet depuis votre tableau de bord.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <KanbanBoard 
        projectName={projectName}
        projectId={projectId || "0"}
        columns={columns}
        onCreateTicket={createTicket}
        onUpdateTicket={updateTicket}
        onDeleteTicket={deleteTicket}
      />
    </div>
  )
}
