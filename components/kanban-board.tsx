"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Edit,
  Flag,
  ListPlus,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Ticket as TicketIcon,
  Trash,
  Trash2,
  X,
} from "lucide-react"
import { Ticket, SubTicket } from "@/app/kanban/page"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { TicketSearch } from "@/components/ticket-search"

// Types for our columns
type ColumnType = {
  id: string
  title: string
  tickets: Ticket[]
}

interface KanbanBoardProps {
  projectName: string
  projectId: string
  columns: ColumnType[]
  onCreateTicket: (ticket: Partial<Ticket>) => Promise<Ticket>
  onUpdateTicket: (ticket: Partial<Ticket>) => Promise<Ticket>
  onDeleteTicket: (ticketId: string) => Promise<boolean>
}

export default function KanbanBoard({ 
  projectName, 
  projectId, 
  columns: initialColumns, 
  onCreateTicket, 
  onUpdateTicket, 
  onDeleteTicket 
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnType[]>(initialColumns || [
    {
      id: "column-1",
      title: "To Do",
      tickets: [],
    },
    {
      id: "column-2",
      title: "In Progress",
      tickets: [],
    },
    {
      id: "column-3",
      title: "Done",
      tickets: [],
    },
  ])

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubTicketDialogOpen, setIsSubTicketDialogOpen] = useState(false)
  const [newTicket, setNewTicket] = useState<{ title: string; description: string }>({
    title: "",
    description: "",
  })
  const [newSubTicket, setNewSubTicket] = useState<{ title: string; description: string }>({
    title: "",
    description: "",
  })
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [isDirectEditDialogOpen, setIsDirectEditDialogOpen] = useState(false)
  const [isSubTicketEditDialogOpen, setIsSubTicketEditDialogOpen] = useState(false)

  const [editingSubTicket, setEditingSubTicket] = useState<{
    parentId: string
    subTicket: SubTicket
  } | null>(null)
  const [directEditingTicketId, setDirectEditingTicketId] = useState<string | null>(null)
  const [directEditingText, setDirectEditingText] = useState("")
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({})
  const [directEditingSubTicketId, setDirectEditingSubTicketId] = useState<string | null>(null)
  const [directEditingSubTicketText, setDirectEditingSubTicketText] = useState("")
  const [directEditingSubTicketParentId, setDirectEditingSubTicketParentId] = useState<string | null>(null)

  // Ajouter après les autres états
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // États pour la génération de sous-tickets avec IA
  const [isAISubTicketDialogOpen, setIsAISubTicketDialogOpen] = useState(false)
  const [aiSubTicketDescription, setAISubTicketDescription] = useState("")
  const [selectedEpicForAI, setSelectedEpicForAI] = useState<Ticket | null>(null)
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false)
  const [generatedSubTicket, setGeneratedSubTicket] = useState<{ title: string; description: string } | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // États pour l'édition du sous-ticket en prévisualisation
  const [editableTitle, setEditableTitle] = useState("")
  const [editableDescription, setEditableDescription] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const MAX_DESCRIPTION_LENGTH = 800

  useEffect(() => {
    if (generatedSubTicket) {
      setEditableTitle(generatedSubTicket.title)
      // S'assurer que la description ne dépasse jamais MAX_DESCRIPTION_LENGTH
      const safeDescription = generatedSubTicket.description || ""
      setEditableDescription(safeDescription.substring(0, MAX_DESCRIPTION_LENGTH))
      setIsEditing(false)
    }
  }, [generatedSubTicket])

  // Toggle expanded state for a ticket
  const toggleTicketExpanded = (ticketId: string) => {
    setExpandedTickets((prev) => {
      const newState = { ...prev };
      newState[ticketId] = !prev[ticketId];
      return newState;
    });
  }

  // Check if a ticket is expanded
  const isTicketExpanded = (ticketId: string) => {
    return expandedTickets[ticketId] || false
  }

  // Handle drag and drop
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result

    // If there's no destination or the item is dropped in the same place
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    // Handle main ticket drag between columns
    if (type === "ticket") {
      // Find the source and destination columns
      const sourceColumn = columns.find((col: ColumnType) => col.id === source.droppableId)
      const destColumn = columns.find((col: ColumnType) => col.id === destination.droppableId)

      if (!sourceColumn || !destColumn) return

      // Find the ticket being moved
      const ticket = sourceColumn.tickets.find((t: Ticket) => t.id === draggableId)
      if (!ticket) return

      // Create new arrays for the columns
      const newColumns = [...columns]
      const newSourceCol = newColumns.find((col: ColumnType) => col.id === source.droppableId)
      const newDestCol = newColumns.find((col: ColumnType) => col.id === destination.droppableId)

      if (!newSourceCol || !newDestCol) return

      // Remove from source column
      newSourceCol.tickets = newSourceCol.tickets.filter((t: Ticket) => t.id !== draggableId)

      // Add to destination column
      const newTickets = Array.from(newDestCol.tickets)
      newTickets.splice(destination.index, 0, ticket)
      newDestCol.tickets = newTickets

      setColumns(newColumns)

      // Mettre à jour le statut du ticket dans la base de données
      const statusId = parseInt(destColumn.id.split('-')[1])
      try {
        await onUpdateTicket({
          id: draggableId,
          statusId,
          position: destination.index
        })
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut du ticket:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour le statut du ticket.",
        })
      }
    }
    // Handle sub-ticket drag within a ticket
    else if (type === "subticket") {
      // Extract the parent ticket ID from the droppableId
      const parentTicketId = source.droppableId.split("-subtickets-")[1]

      // Only allow reordering within the same parent ticket
      if (destination.droppableId !== source.droppableId) {
        return
      }

      // Find the column and ticket containing the sub-ticket
      const newColumns = [...columns]
      let parentTicket: Ticket | null = null
      let columnIndex = -1
      let ticketIndex = -1

      // Find the parent ticket
      for (const column of newColumns) {
        const tIndex = column.tickets.findIndex((t: Ticket) => t.id === parentTicketId)

        if (tIndex !== -1) {
          parentTicket = column.tickets[tIndex]
          columnIndex = newColumns.indexOf(column)
          ticketIndex = tIndex
          break
        }
      }

      if (!parentTicket || columnIndex === -1 || ticketIndex === -1 || !parentTicket.subTickets) return

      // Reorder the sub-tickets
      const subTickets = Array.from(parentTicket.subTickets)
      const [movedSubTicket] = subTickets.splice(source.index, 1)
      subTickets.splice(destination.index, 0, movedSubTicket)

      // Update the parent ticket with the new sub-tickets order
      newColumns[columnIndex].tickets[ticketIndex] = {
        ...parentTicket,
        subTickets,
      }

      setColumns(newColumns)

      // Mettre à jour la position du sous-ticket dans la base de données
      try {
        await onUpdateTicket({
          id: movedSubTicket.id,
          position: destination.index
        })
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la position du sous-ticket:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour la position du sous-ticket.",
        })
      }
    }
  }

  // Handle ticket creation
  const handleCreateTicket = async () => {
    if (!newTicket.title.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le titre du ticket ne peut pas être vide.",
      })
      return
    }

    setIsLoading(true)
    try {
      // Créer le ticket dans la base de données
      const createdTicket = await onCreateTicket({
        title: newTicket.title,
        description: newTicket.description,
        statusId: 1, // "To Do" par défaut
        projectId: parseInt(projectId),
        isSubTicket: false
      })

      setIsDialogOpen(false)
      setNewTicket({ title: "", description: "" })
      
      toast({
        title: "Succès",
        description: "Ticket créé avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors de la création du ticket:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le ticket. Veuillez réessayer.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sub-ticket creation
  const handleCreateSubTicket = async () => {
    if (!selectedTicket) return
    if (!newSubTicket.title.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le titre du sous-ticket ne peut pas être vide.",
      })
      return
    }

    setIsLoading(true)
    try {
      // Créer le sous-ticket dans la base de données
      const createdSubTicket = await onCreateTicket({
        title: newSubTicket.title,
        description: newSubTicket.description,
        statusId: selectedTicket.statusId,
        projectId: parseInt(projectId),
        isSubTicket: true,
        parentTicketId: parseInt(selectedTicket.id)
      })

      setIsSubTicketDialogOpen(false)
      setNewSubTicket({ title: "", description: "" })
      
      toast({
        title: "Succès",
        description: "Sous-ticket créé avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors de la création du sous-ticket:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le sous-ticket. Veuillez réessayer.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle ticket edit
  const handleEditTicket = async () => {
    if (!editingTicket) return
    if (!editingTicket.title.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le titre du ticket ne peut pas être vide.",
      })
      return
    }

    setIsLoading(true)
    try {
      // Mettre à jour le ticket dans la base de données
      await onUpdateTicket({
        id: editingTicket.id,
        title: editingTicket.title,
        description: editingTicket.description
      })

      setIsEditDialogOpen(false)
      setEditingTicket(null)
      
      toast({
        title: "Succès",
        description: "Ticket mis à jour avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors de la mise à jour du ticket:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le ticket. Veuillez réessayer.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sub-ticket edit
  const handleEditSubTicket = async () => {
    if (!editingSubTicket) return
    if (!editingSubTicket.subTicket.title.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le titre du sous-ticket ne peut pas être vide.",
      })
      return
    }

    setIsLoading(true)
    try {
      // Mettre à jour le sous-ticket dans la base de données
      await onUpdateTicket({
        id: editingSubTicket.subTicket.id,
        title: editingSubTicket.subTicket.title,
        description: editingSubTicket.subTicket.description
      })

      setIsSubTicketEditDialogOpen(false)
      setEditingSubTicket(null)
      
      toast({
        title: "Succès",
        description: "Sous-ticket mis à jour avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors de la mise à jour du sous-ticket:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le sous-ticket. Veuillez réessayer.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle ticket deletion
  const handleDeleteTicket = async (ticketId: string) => {
    if (!ticketId) return

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ticket ?")) {
      return
    }

    setIsLoading(true)
    try {
      // Supprimer le ticket dans la base de données
      await onDeleteTicket(ticketId)
      
      toast({
        title: "Succès",
        description: "Ticket supprimé avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors de la suppression du ticket:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le ticket. Veuillez réessayer.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour générer un sous-ticket avec IA (prévisualisation)
  const handlePreviewSubTicket = async () => {
    if (!selectedEpicForAI || !selectedEpicForAI.id) {
      return
    }
    
    setIsGeneratingWithAI(true)
    try {
      // Appel à l'API pour obtenir une prévisualisation du sous-ticket généré par l'IA
      console.log("Génération d'une prévisualisation avec les données:", {
        epicId: selectedEpicForAI.id,
        epicTitle: selectedEpicForAI.title,
        descriptionLength: aiSubTicketDescription.length
      });
      
      const response = await fetch('/api/tickets/ai-subticket/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          epicId: selectedEpicForAI.id,
          epicTitle: selectedEpicForAI.title,
          epicDescription: selectedEpicForAI.description || "",
          subTicketDescription: aiSubTicketDescription,
        }),
      })

      console.log("Statut de la réponse de génération:", response.status);
      
      if (!response.ok) {
        let errorMessage = 'Erreur lors de la génération du sous-ticket'
        
        try {
          // Lire la réponse texte d'abord
          const responseText = await response.text();
          console.log("Texte de la réponse d'erreur:", responseText || "");
          
          if (responseText && responseText.trim() !== "") {
            try {
              const errorData = JSON.parse(responseText);
              console.error("Détails de l'erreur:", errorData || {});
              if (errorData && errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (parseError) {
              console.error("Erreur lors du parsing de la réponse d'erreur JSON:", parseError);
            }
          }
        } catch (e) {
          console.error("Erreur lors de la lecture de la réponse d'erreur:", e);
        }
        
        throw new Error(errorMessage);
      }

      // Lire la réponse de manière sécurisée
      let generatedData;
      try {
        const responseText = await response.text();
        console.log("Texte de la réponse de génération:", responseText.substring(0, 100) + "...");
        
        if (responseText && responseText.trim() !== "") {
          try {
            generatedData = JSON.parse(responseText);
          } catch (parseError) {
            console.error("Erreur lors du parsing de la réponse JSON:", parseError);
            // Créer un objet par défaut
            generatedData = {
              title: `Ticket pour: ${aiSubTicketDescription.substring(0, 50)}...`,
              description: aiSubTicketDescription.substring(0, 400),
              priority: 2
            };
          }
        } else {
          console.warn("Réponse vide reçue de l'API de génération");
          generatedData = {
            title: `Ticket pour: ${aiSubTicketDescription.substring(0, 50)}...`,
            description: aiSubTicketDescription.substring(0, 400),
            priority: 2
          };
        }
      } catch (error) {
        console.error("Erreur lors de la lecture de la réponse:", error);
        // Créer un objet par défaut en cas d'erreur
        generatedData = {
          title: `Ticket pour: ${aiSubTicketDescription.substring(0, 50)}...`,
          description: aiSubTicketDescription.substring(0, 400),
          priority: 2
        };
      }
      
      console.log("Prévisualisation générée avec succès:", {
        title: generatedData.title,
        descriptionLength: generatedData.description?.length || 0
      });
      
      // S'assurer que les champs requis sont présents
      if (!generatedData.title) {
        generatedData.title = `Ticket pour: ${aiSubTicketDescription.substring(0, 50)}...`;
      }
      
      if (!generatedData.description) {
        generatedData.description = aiSubTicketDescription.substring(0, 400);
      }
      
      // Limiter la description au maximum autorisé
      if (generatedData.description && generatedData.description.length > MAX_DESCRIPTION_LENGTH) {
        generatedData.description = generatedData.description.substring(0, MAX_DESCRIPTION_LENGTH);
      }
      
      setGeneratedSubTicket(generatedData);
      setEditableTitle(generatedData.title);
      setEditableDescription(generatedData.description);
      setIsPreviewMode(true);
      
    } catch (error) {
      console.error("Erreur lors de la génération du sous-ticket:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la génération du sous-ticket avec l'IA.",
      });
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  // Fonction séparée pour créer un sous-ticket à partir de la prévisualisation
  const handleValidateSubTicket = async () => {
    if (!selectedEpicForAI || !selectedEpicForAI.id || !generatedSubTicket) {
      console.error("Informations manquantes pour valider le sous-ticket");
      return;
    }

    setIsGeneratingWithAI(true);
    try {
      // Utiliser le titre et la description édités par l'utilisateur
      const finalSubTicket = {
        ...generatedSubTicket,
        title: editableTitle,
        description: editableDescription
      };

      console.log("Validation du sous-ticket:", {
        epicId: selectedEpicForAI.id,
        epicTitle: selectedEpicForAI.title,
        title: finalSubTicket.title,
        descriptionLength: finalSubTicket.description.length
      });

      // Appel API pour créer le sous-ticket
      const requestBody = {
        epicId: selectedEpicForAI.id,
        epicTitle: selectedEpicForAI.title,
        epicDescription: selectedEpicForAI.description || "",
        subTicketDescription: aiSubTicketDescription,
        generatedSubTicket: finalSubTicket
      };
      
      console.log("Envoi de la requête de création:", JSON.stringify(requestBody));
      
      const response = await fetch('/api/tickets/ai-subticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log("Statut de la réponse:", response.status);
      
      // Traiter la réponse de manière sécurisée
      let responseBody;
      try {
        const responseText = await response.text();
        console.log("Texte de la réponse:", responseText ? responseText.substring(0, 50) + "..." : "(vide)");
        
        responseBody = responseText && responseText.trim() !== "" 
          ? JSON.parse(responseText) 
          : { error: "Réponse vide du serveur" };
          
      } catch (error) {
        console.error("Erreur lors du traitement de la réponse:", error);
        responseBody = { error: "Impossible de traiter la réponse du serveur" };
      }

      if (!response.ok) {
        const errorMsg = responseBody.error || `Erreur ${response.status} lors de la création du sous-ticket`;
        throw new Error(errorMsg);
      }

      // Vérifier que nous avons un ID valide
      if (!responseBody.id) {
        throw new Error("Le sous-ticket créé n'a pas d'identifiant valide");
      }

      // Mettre à jour l'état local pour afficher le nouveau sous-ticket
      const newColumns = [...columns];
      for (const column of newColumns) {
        for (const ticket of column.tickets) {
          if (ticket.id === selectedEpicForAI.id) {
            if (!ticket.subTickets) {
              ticket.subTickets = [];
            }
            ticket.subTickets.push(responseBody);
            break;
          }
        }
      }
      setColumns(newColumns);
      
      // Réinitialiser tous les états
      setIsAISubTicketDialogOpen(false);
      setAISubTicketDescription("");
      setSelectedEpicForAI(null);
      setGeneratedSubTicket(null);
      setIsPreviewMode(false);
      setIsEditing(false);
      setEditableTitle("");
      setEditableDescription("");
      
      toast({
        title: "Succès",
        description: "Sous-ticket créé avec succès !",
        variant: "default",
      });
    } catch (error) {
      console.error("Erreur lors de la validation du sous-ticket:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le sous-ticket. Veuillez réessayer.",
      });
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  // Nouvelle fonction pour régénérer directement un sous-ticket
  const handleRegenerateSubTicket = async () => {
    if (!selectedEpicForAI || !selectedEpicForAI.id || !aiSubTicketDescription.trim()) {
      return;
    }
    
    setIsGeneratingWithAI(true);
    
    try {
      // Utiliser la même API mais sans passer de generatedSubTicket pour forcer une nouvelle génération
      const epicId: string = selectedEpicForAI.id;
      const epicTitle: string = selectedEpicForAI.title || '';
      const epicDescription: string = selectedEpicForAI.description || '';
      
      const response = await fetch('/api/tickets/ai-subticket/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          epicId: epicId,
          epicTitle: epicTitle,
          epicDescription: epicDescription,
          subTicketDescription: aiSubTicketDescription,
        }),
      });

      console.log("Statut de la réponse de génération:", response.status);
      
      if (!response.ok) {
        let errorMessage = 'Erreur lors de la génération du sous-ticket'
        
        try {
          // Lire la réponse texte d'abord
          const responseText = await response.text();
          console.log("Texte de la réponse d'erreur:", responseText || "");
          
          if (responseText && responseText.trim() !== "") {
            try {
              const errorData = JSON.parse(responseText);
              console.error("Détails de l'erreur:", errorData || {});
              if (errorData && errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (parseError) {
              console.error("Erreur lors du parsing de la réponse d'erreur JSON:", parseError);
            }
          }
        } catch (e) {
          console.error("Erreur lors de la lecture de la réponse d'erreur:", e);
        }
        
        throw new Error(errorMessage);
      }

      // Lire la réponse de manière sécurisée
      let generatedData;
      try {
        const responseText = await response.text();
        console.log("Texte de la réponse de génération:", responseText.substring(0, 100) + "...");
        
        if (responseText && responseText.trim() !== "") {
          try {
            generatedData = JSON.parse(responseText);
          } catch (parseError) {
            console.error("Erreur lors du parsing de la réponse JSON:", parseError);
            // Créer un objet par défaut
            generatedData = {
              title: `Ticket pour: ${aiSubTicketDescription.substring(0, 50)}...`,
              description: aiSubTicketDescription.substring(0, 400),
              priority: 2
            };
          }
        } else {
          console.warn("Réponse vide reçue de l'API de génération");
          generatedData = {
            title: `Ticket pour: ${aiSubTicketDescription.substring(0, 50)}...`,
            description: aiSubTicketDescription.substring(0, 400),
            priority: 2
          };
        }
      } catch (error) {
        console.error("Erreur lors de la lecture de la réponse:", error);
        // Créer un objet par défaut en cas d'erreur
        generatedData = {
          title: `Ticket pour: ${aiSubTicketDescription.substring(0, 50)}...`,
          description: aiSubTicketDescription.substring(0, 400),
          priority: 2
        };
      }
      
      console.log("Prévisualisation générée avec succès:", {
        title: generatedData.title,
        descriptionLength: generatedData.description?.length || 0
      });
      
      // S'assurer que les champs requis sont présents
      if (!generatedData.title) {
        generatedData.title = `Ticket pour: ${aiSubTicketDescription.substring(0, 50)}...`;
      }
      
      if (!generatedData.description) {
        generatedData.description = aiSubTicketDescription.substring(0, 400);
      }
      
      // Limiter la description au maximum autorisé
      if (generatedData.description && generatedData.description.length > MAX_DESCRIPTION_LENGTH) {
        generatedData.description = generatedData.description.substring(0, MAX_DESCRIPTION_LENGTH);
      }
      
      setGeneratedSubTicket(generatedData);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la génération du sous-ticket avec l'IA.",
      });
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  // Fonction pour gérer la validation du formulaire d'édition
  const handleEditFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limiter la description à MAX_DESCRIPTION_LENGTH caractères
    const trimmedDescription = editableDescription.slice(0, MAX_DESCRIPTION_LENGTH)
    
    if (generatedSubTicket) {
      setGeneratedSubTicket({
        ...generatedSubTicket,
        title: editableTitle,
        description: trimmedDescription
      })
    }
    
    setIsEditing(false)
  }

  // Gérer les modifications du titre éditable
  const handleEditableTitle = (title: string) => {
    try {
      console.log("Mise à jour du titre éditable:", title);
      setEditableTitle(title || "");
      
      if (generatedSubTicket) {
        const updatedSubTicket = { ...generatedSubTicket, title: title || "" };
        setGeneratedSubTicket(updatedSubTicket);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du titre éditable:", error);
      // Ne pas propager l'erreur, simplement logger
    }
  }
  
  // Gérer les modifications de la description éditable
  const handleEditableDescription = (description: string) => {
    try {
      console.log("Mise à jour de la description éditable, longueur:", description?.length || 0);
      setEditableDescription(description || "");
      
      if (generatedSubTicket) {
        // Limiter la description à la longueur maximale
        const trimmedDescription = description && description.length > MAX_DESCRIPTION_LENGTH
          ? description.substring(0, MAX_DESCRIPTION_LENGTH)
          : description || "";
        
        const updatedSubTicket = { ...generatedSubTicket, description: trimmedDescription };
        setGeneratedSubTicket(updatedSubTicket);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la description éditable:", error);
      // Ne pas propager l'erreur, simplement logger
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{projectName}</h1>
          <p className="text-sm text-muted-foreground">Gérez votre projet avec ce tableau Kanban</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Ajout du composant de recherche */}
          <TicketSearch projectId={projectId} />
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un ticket
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="space-y-4">
              <div className="bg-secondary/20 p-3 rounded-lg">
                <h2 className="font-semibold mb-2 flex items-center">
                  <span className="mr-2">{column.title}</span>
                  <Badge variant="outline">{column.tickets.length}</Badge>
                </h2>
                <Droppable droppableId={column.id} type="ticket">
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[200px]"
                    >
                      {column.tickets.map((ticket, index) => (
                        <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                          {(provided: DraggableProvided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-2"
                            >
                              <CardHeader className="p-3 pb-0">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center w-full">
                                    {ticket.subTickets && ticket.subTickets.length > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 mr-1"
                                        onClick={() => toggleTicketExpanded(ticket.id)}
                                      >
                                        {isTicketExpanded(ticket.id) ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                    <CardTitle className="text-sm font-medium">{ticket.title}</CardTitle>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditingTicket(ticket)
                                          setIsEditDialogOpen(true)
                                        }}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedTicket(ticket)
                                          setIsSubTicketDialogOpen(true)
                                        }}
                                      >
                                        <ListPlus className="mr-2 h-4 w-4" />
                                        Ajouter un sous-ticket
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedEpicForAI(ticket)
                                          setIsAISubTicketDialogOpen(true)
                                        }}
                                      >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Générer sous-ticket avec IA
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteTicket(ticket.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              <CardContent className="p-3 pt-1">
                                <CardDescription className="text-xs">
                                  {ticket.description ? ticket.description.substring(0, 100) + (ticket.description.length > 100 ? "..." : "") : "Aucune description"}
                                </CardDescription>
                              </CardContent>
                              {ticket.subTickets && ticket.subTickets.length > 0 && isTicketExpanded(ticket.id) && (
                                <CardFooter className="p-3 pt-0">
                                  <div className="w-full">
                                    <h4 className="text-xs font-medium mb-2">Sous-tickets ({ticket.subTickets.length})</h4>
                                    <Droppable droppableId={`subtickets-${ticket.id}`} type="subticket">
                                      {(provided: DroppableProvided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className="space-y-2"
                                        >
                                          {ticket.subTickets && ticket.subTickets.map((subTicket, subIndex) => (
                                            <Draggable
                                              key={subTicket.id}
                                              draggableId={subTicket.id}
                                              index={subIndex}
                                            >
                                              {(provided: DraggableProvided) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  className="bg-background border rounded p-2 text-xs"
                                                >
                                                  <div className="flex justify-between items-start">
                                                    <span>{subTicket.title}</span>
                                                    <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                          <MoreHorizontal className="h-3 w-3" />
                                                        </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                          onClick={() => {
                                                            setEditingSubTicket({
                                                              parentId: ticket.id,
                                                              subTicket,
                                                            })
                                                            setIsSubTicketEditDialogOpen(true)
                                                          }}
                                                        >
                                                          <Edit className="mr-2 h-3 w-3" />
                                                          Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteTicket(subTicket.id)}>
                                                          <Trash2 className="mr-2 h-3 w-3" />
                                                          Supprimer
                                                        </DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                    </DropdownMenu>
                                                  </div>
                                                  {subTicket.description && (
                                                    <p className="mt-1 text-muted-foreground">
                                                      {subTicket.description.substring(0, 50)}
                                                      {subTicket.description.length > 50 ? "..." : ""}
                                                    </p>
                                                  )}
                                                </div>
                                              )}
                                            </Draggable>
                                          ))}
                                          {provided.placeholder as React.ReactNode}
                                        </div>
                                      )}
                                    </Droppable>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full mt-2 text-xs flex items-center justify-center"
                                      onClick={() => {
                                        // Réinitialiser tous les états avant d'ouvrir pour un nouveau ticket
                                        setAISubTicketDescription("")
                                        setGeneratedSubTicket(null)
                                        setIsPreviewMode(false)
                                        setIsEditing(false)
                                        setEditableTitle("")
                                        setEditableDescription("")
                                        // Puis définir le nouvel EPIC sélectionné et ouvrir le dialogue
                                        setSelectedEpicForAI(ticket)
                                        setIsAISubTicketDialogOpen(true)
                                      }}
                                    >
                                      <Sparkles className="mr-2 h-3 w-3" />
                                      Générer sous-ticket avec IA
                                    </Button>
                                  </div>
                                </CardFooter>
                              )}
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder as React.ReactNode}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Dialog for creating a new ticket */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau ticket</DialogTitle>
            <DialogDescription>Ajoutez un nouveau ticket à votre tableau Kanban.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder="Titre du ticket"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Description du ticket"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTicket} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for creating a sub-ticket */}
      <Dialog open={isSubTicketDialogOpen} onOpenChange={setIsSubTicketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un sous-ticket</DialogTitle>
            <DialogDescription>
              Ajoutez un sous-ticket à "{selectedTicket?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subTicketTitle">Titre</Label>
              <Input
                id="subTicketTitle"
                value={newSubTicket.title}
                onChange={(e) => setNewSubTicket({ ...newSubTicket, title: e.target.value })}
                placeholder="Titre du sous-ticket"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subTicketDescription">Description</Label>
              <Textarea
                id="subTicketDescription"
                value={newSubTicket.description}
                onChange={(e) => setNewSubTicket({ ...newSubTicket, description: e.target.value })}
                placeholder="Description du sous-ticket"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubTicketDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateSubTicket} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for editing a ticket */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le ticket</DialogTitle>
            <DialogDescription>Modifiez les détails du ticket.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editTitle">Titre</Label>
              <Input
                id="editTitle"
                value={editingTicket?.title || ""}
                onChange={(e) => setEditingTicket(editingTicket ? { ...editingTicket, title: e.target.value } : null)}
                placeholder="Titre du ticket"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editingTicket?.description || ""}
                onChange={(e) =>
                  setEditingTicket(editingTicket ? { ...editingTicket, description: e.target.value } : null)
                }
                placeholder="Description du ticket"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditTicket} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for editing a sub-ticket */}
      <Dialog open={isSubTicketEditDialogOpen} onOpenChange={setIsSubTicketEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le sous-ticket</DialogTitle>
            <DialogDescription>Modifiez les détails du sous-ticket.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editSubTicketTitle">Titre</Label>
              <Input
                id="editSubTicketTitle"
                value={editingSubTicket?.subTicket.title || ""}
                onChange={(e) =>
                  setEditingSubTicket(
                    editingSubTicket
                      ? {
                          ...editingSubTicket,
                          subTicket: { ...editingSubTicket.subTicket, title: e.target.value },
                        }
                      : null
                  )
                }
                placeholder="Titre du sous-ticket"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editSubTicketDescription">Description</Label>
              <Textarea
                id="editSubTicketDescription"
                value={editingSubTicket?.subTicket.description || ""}
                onChange={(e) =>
                  setEditingSubTicket(
                    editingSubTicket
                      ? {
                          ...editingSubTicket,
                          subTicket: { ...editingSubTicket.subTicket, description: e.target.value },
                        }
                      : null
                  )
                }
                placeholder="Description du sous-ticket"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubTicketEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditSubTicket} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour créer un sous-ticket avec IA */}
      <Dialog
        open={isAISubTicketDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Réinitialiser complètement tous les états lors de la fermeture
            setIsAISubTicketDialogOpen(false)
            setAISubTicketDescription("")
            setSelectedEpicForAI(null)
            setGeneratedSubTicket(null)
            setIsPreviewMode(false)
            setIsEditing(false)
            setEditableTitle("")
            setEditableDescription("")
            setIsGeneratingWithAI(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px] sm:min-w-[800px] max-h-[650px] overflow-hidden">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-blue-500 text-xl flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-blue-400" />
              Générer un sous-ticket avec IA
            </DialogTitle>
            <DialogDescription className="text-blue-400 flex items-center">
              Génération de sous-ticket pour 
              {selectedEpicForAI ? (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-semibold flex items-center">
                  <TicketIcon className="h-3.5 w-3.5 mr-1" />
                  {selectedEpicForAI.title}
                </span>
              ) : (
                <span className="ml-1 text-gray-400 italic">(Aucun EPIC sélectionné)</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 h-[430px]">
            <div className="space-y-2 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-subticket-description" className="text-blue-500">
                  Description du sous-ticket souhaité
                </Label>
              </div>
              <Textarea
                id="ai-subticket-description"
                placeholder="Ex: Créer un formulaire de contact avec validation des champs"
                value={aiSubTicketDescription}
                onChange={(e) => {
                  // Limiter à 800 caractères
                  if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                    setAISubTicketDescription(e.target.value)
                  }
                }}
                maxLength={MAX_DESCRIPTION_LENGTH}
                className="flex-grow min-h-[300px] bg-white text-blue-400 placeholder:text-blue-300 border-blue-400/30"
              />
              <div className="text-xs text-muted-foreground mt-1 text-left">
                {Math.min(aiSubTicketDescription.length, MAX_DESCRIPTION_LENGTH)}/{MAX_DESCRIPTION_LENGTH}
              </div>
              {/* Le bouton Générer a été supprimé ici pour éviter la duplication, car il existe déjà en bas de la modal */}
            </div>
            
            <div className="h-full flex flex-col">
              {isPreviewMode && generatedSubTicket ? (
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-blue-500 mr-2">{selectedEpicForAI?.title}</span>
                    </div>
                    <Button 
                      onClick={() => setIsEditing(!isEditing)} 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      {isEditing ? "Annuler" : "Modifier"}
                      {isEditing ? <X className="ml-2 h-3 w-3" /> : <Pencil className="ml-2 h-3 w-3" />}
                    </Button>
                  </div>
                  
                  <div className="flex-grow mb-2">
                    {isEditing ? (
                      // Formulaire d'édition
                      <form onSubmit={handleEditFormSubmit} className="space-y-3 h-full flex flex-col">
                        <div>
                          <Label htmlFor="title" className="text-xs font-medium">Titre</Label>
                          <Input 
                            id="title"
                            value={editableTitle}
                            onChange={(e) => handleEditableTitle(e.target.value)}
                            className="h-8 text-xs"
                            maxLength={200}
                          />
                        </div>
                        <div className="flex-grow flex flex-col">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="description" className="text-xs font-medium">Description</Label>
                          </div>
                          <Textarea 
                            id="description"
                            value={editableDescription}
                            onChange={(e) => handleEditableDescription(e.target.value)}
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            className="text-xs flex-grow"
                            placeholder="Description du sous-ticket"
                          />
                          <div className="text-xs text-muted-foreground mt-1 text-left">
                            {Math.min(editableDescription.length, MAX_DESCRIPTION_LENGTH)}/{MAX_DESCRIPTION_LENGTH}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" size="sm" className="text-xs bg-blue-500 hover:bg-blue-400">
                            <Check className="mr-2 h-3 w-3" />
                            Appliquer
                          </Button>
                        </div>
                      </form>
                    ) : (
                      // Affichage de la prévisualisation
                      <div className="bg-background border rounded p-4 text-xs h-full flex flex-col">
                        <div className="mb-2 pb-2 border-b">
                          <span className="font-medium text-sm">{generatedSubTicket.title}</span>
                        </div>
                        {generatedSubTicket.description && (
                          <div className="text-muted-foreground whitespace-pre-line overflow-y-auto pr-1 flex-grow max-h-[250px] custom-scrollbar">
                            {generatedSubTicket.description.substring(0, MAX_DESCRIPTION_LENGTH)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground text-left mt-2 pt-2 border-t">
                          {Math.min(generatedSubTicket?.description?.length || 0, MAX_DESCRIPTION_LENGTH)}/{MAX_DESCRIPTION_LENGTH}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-center p-6 border rounded border-dashed">
                  <div>
                    <Sparkles className="w-10 h-10 mx-auto mb-4 text-blue-300" />
                    <p>Zone de prévisualisation</p>
                    <p className="text-xs mt-2">Décrivez le ticket et cliquez sur "Générer"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between pt-3 border-t mt-2">
            <Button
              variant="outline"
              onClick={() => {
                // Réinitialiser complètement tous les états
                setIsAISubTicketDialogOpen(false)
                setAISubTicketDescription("")
                setSelectedEpicForAI(null)
                setGeneratedSubTicket(null)
                setIsPreviewMode(false)
                setIsEditing(false)
                setEditableTitle("")
                setEditableDescription("")
                setIsGeneratingWithAI(false)
              }}
              className="border-blue-400/30 text-blue-500"
            >
              Annuler
            </Button>
            
            {!isPreviewMode ? (
              // Mode saisie - Bouton Générer
              <Button
                onClick={handlePreviewSubTicket}
                disabled={!aiSubTicketDescription.trim() || isGeneratingWithAI}
                className="bg-blue-500 hover:bg-blue-400 text-white"
              >
                {isGeneratingWithAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    En cours de génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Générer
                  </>
                )}
              </Button>
            ) : (
              // Mode prévisualisation - Boutons Régénérer et Valider
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setGeneratedSubTicket(null);
                    handleRegenerateSubTicket();
                  }} 
                  variant="outline"
                  className="border-blue-400/30 text-blue-500"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Régénérer
                </Button>
                <Button 
                  onClick={handleValidateSubTicket} 
                  disabled={isGeneratingWithAI}
                  className="bg-green-500 hover:bg-green-400 text-white"
                >
                  {isGeneratingWithAI ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      En cours de génération...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Valider ticket
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
