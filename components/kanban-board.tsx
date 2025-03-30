"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
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
  Plus,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ListPlus,
  Loader2,
} from "lucide-react"
import type { Ticket, SubTicket } from "@/app/actions/generate-tickets"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { enrichTicketDescription, enrichSubTicketDescription } from "@/app/actions/ai-actions"

// Types for our columns
type ColumnType = {
  id: string
  title: string
  tickets: Ticket[]
}

interface KanbanBoardProps {
  projectName: string
  projectGoal: string
  initialTickets?: Ticket[]
}

export function KanbanBoard({ projectName, projectGoal, initialTickets = [] }: KanbanBoardProps) {
  // Initialize columns with AI-generated tickets
  const [columns, setColumns] = useState<ColumnType[]>([
    {
      id: "column-1",
      title: "To Do",
      tickets: initialTickets.length > 0 ? initialTickets : [],
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
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [isSubTicketDialogOpen, setIsSubTicketDialogOpen] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false)
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
  const [generatedDescription, setGeneratedDescription] = useState("")
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({})
  const [directEditingSubTicketId, setDirectEditingSubTicketId] = useState<string | null>(null)
  const [directEditingSubTicketText, setDirectEditingSubTicketText] = useState("")
  const [directEditingSubTicketParentId, setDirectEditingSubTicketParentId] = useState<string | null>(null)

  // Ajouter après les autres états
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Ticket[]>([])

  // Toggle expanded state for a ticket
  const toggleTicketExpanded = (ticketId: string) => {
    setExpandedTickets((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }))
  }

  // Check if a ticket is expanded
  const isTicketExpanded = (ticketId: string) => {
    return expandedTickets[ticketId] || false
  }

  // Handle drag and drop
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId, type } = result

    // If there's no destination or the item is dropped in the same place
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    // Handle main ticket drag between columns
    if (type === "ticket") {
      // Find the source and destination columns
      const sourceColumn = columns.find((col) => col.id === source.droppableId)
      const destColumn = columns.find((col) => col.id === destination.droppableId)

      if (!sourceColumn || !destColumn) return

      // Find the ticket being moved
      const ticket = sourceColumn.tickets.find((t) => t.id === draggableId)
      if (!ticket) return

      // Create new arrays for the columns
      const newColumns = [...columns]
      const newSourceCol = newColumns.find((col) => col.id === source.droppableId)
      const newDestCol = newColumns.find((col) => col.id === destination.droppableId)

      if (!newSourceCol || !newDestCol) return

      // Remove from source column
      newSourceCol.tickets = newSourceCol.tickets.filter((t) => t.id !== draggableId)

      // Add to destination column
      const newTickets = Array.from(newDestCol.tickets)
      newTickets.splice(destination.index, 0, ticket)
      newDestCol.tickets = newTickets

      setColumns(newColumns)
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
      for (let i = 0; i < newColumns.length; i++) {
        const column = newColumns[i]
        const tIndex = column.tickets.findIndex((t) => t.id === parentTicketId)

        if (tIndex !== -1) {
          parentTicket = column.tickets[tIndex]
          columnIndex = i
          ticketIndex = tIndex
          break
        }
      }

      if (!parentTicket || columnIndex === -1 || ticketIndex === -1) return

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
    }
  }

  // Handle adding a new ticket
  const handleAddTicket = () => {
    if (newTicket.title.trim() === "" || newTicket.description.trim() === "") {
      return
    }

    const newTicketObj: Ticket = {
      id: `ticket-${Date.now()}`,
      title: newTicket.title,
      description: newTicket.description,
      subTickets: [],
    }

    const newColumns = [...columns]
    const todoColumn = newColumns.find((col) => col.id === "column-1")
    if (todoColumn) {
      todoColumn.tickets = [...todoColumn.tickets, newTicketObj]
    }

    setColumns(newColumns)
    setNewTicket({ title: "", description: "" })
    setIsDialogOpen(false)

    // Automatiquement développer le nouveau ticket pour montrer qu'on peut y ajouter des sous-tickets
    setExpandedTickets((prev) => ({
      ...prev,
      [newTicketObj.id]: true,
    }))

    toast({
      title: "Ticket Added",
      description: "New ticket has been added to the To Do column",
    })
  }

  // Handle adding a new sub-ticket
  const handleAddSubTicket = () => {
    if (!selectedTicket || newSubTicket.title.trim() === "" || newSubTicket.description.trim() === "") {
      return
    }

    const newSubTicketObj: SubTicket = {
      id: `subticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newSubTicket.title,
      description: newSubTicket.description,
    }

    const newColumns = [...columns]

    // Find the column and ticket to add the sub-ticket to
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === selectedTicket.id)

      if (ticketIndex !== -1) {
        // Add the sub-ticket to the parent ticket
        column.tickets[ticketIndex] = {
          ...column.tickets[ticketIndex],
          subTickets: [...column.tickets[ticketIndex].subTickets, newSubTicketObj],
        }
        break
      }
    }

    setColumns(newColumns)
    setNewSubTicket({ title: "", description: "" })
    setIsSubTicketDialogOpen(false)

    // Make sure the parent ticket is expanded to show the new sub-ticket
    setExpandedTickets((prev) => ({
      ...prev,
      [selectedTicket.id]: true,
    }))

    toast({
      title: "Sub-ticket Added",
      description: "New sub-ticket has been added to the ticket",
    })
  }

  // Handle editing a ticket
  const handleEditTicket = () => {
    if (!editingTicket || editingTicket.title.trim() === "" || editingTicket.description.trim() === "") {
      return
    }

    const newColumns = [...columns]

    // Find the column containing the ticket
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === editingTicket.id)

      if (ticketIndex !== -1) {
        // Update the ticket
        column.tickets[ticketIndex] = {
          ...editingTicket,
        }
        break
      }
    }

    setColumns(newColumns)
    setEditingTicket(null)
    setIsEditDialogOpen(false)

    toast({
      title: "Ticket Updated",
      description: "The ticket has been successfully updated",
    })
  }

  // Handle editing a sub-ticket
  const handleEditSubTicket = () => {
    if (
      !editingSubTicket ||
      !editingSubTicket.subTicket.title.trim() ||
      !editingSubTicket.subTicket.description.trim()
    ) {
      return
    }

    const newColumns = [...columns]

    // Find the column and ticket containing the sub-ticket
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === editingSubTicket.parentId)

      if (ticketIndex !== -1) {
        const ticket = column.tickets[ticketIndex]
        const subTicketIndex = ticket.subTickets.findIndex((st) => st.id === editingSubTicket.subTicket.id)

        if (subTicketIndex !== -1) {
          // Update the sub-ticket
          const updatedSubTickets = [...ticket.subTickets]
          updatedSubTickets[subTicketIndex] = editingSubTicket.subTicket

          column.tickets[ticketIndex] = {
            ...ticket,
            subTickets: updatedSubTickets,
          }
          break
        }
      }
    }

    setColumns(newColumns)
    setEditingSubTicket(null)
    setIsEditDialogOpen(false)

    toast({
      title: "Sub-ticket Updated",
      description: "The sub-ticket has been successfully updated",
    })
  }

  // Handle deleting a ticket
  const handleDeleteTicket = (ticketId: string) => {
    const newColumns = [...columns]

    // Find the column containing the ticket
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === ticketId)

      if (ticketIndex !== -1) {
        // Remove the ticket
        column.tickets.splice(ticketIndex, 1)
        break
      }
    }

    setColumns(newColumns)

    toast({
      title: "Ticket Deleted",
      description: "The ticket has been removed from the board",
    })
  }

  // Handle deleting a sub-ticket
  const handleDeleteSubTicket = (parentId: string, subTicketId: string) => {
    const newColumns = [...columns]

    // Find the column and ticket containing the sub-ticket
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === parentId)

      if (ticketIndex !== -1) {
        const ticket = column.tickets[ticketIndex]

        // Remove the sub-ticket
        column.tickets[ticketIndex] = {
          ...ticket,
          subTickets: ticket.subTickets.filter((st) => st.id !== subTicketId),
        }
        break
      }
    }

    setColumns(newColumns)

    toast({
      title: "Sub-ticket Deleted",
      description: "The sub-ticket has been removed from the ticket",
    })
  }

  // Handle copying a ticket
  const handleCopyTicket = (ticket: Ticket) => {
    const newTicketObj: Ticket = {
      id: `ticket-${Date.now()}`,
      title: `${ticket.title} (Copy)`,
      description: ticket.description,
      subTickets: ticket.subTickets.map((st) => ({
        id: `subticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: st.title,
        description: st.description,
      })),
    }

    // Find the column containing the original ticket
    const newColumns = [...columns]
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === ticket.id)

      if (ticketIndex !== -1) {
        // Add the copy right after the original
        column.tickets.splice(ticketIndex + 1, 0, newTicketObj)
        break
      }
    }

    setColumns(newColumns)

    toast({
      title: "Ticket Copied",
      description: "A copy of the ticket has been created",
    })
  }

  // Handle copying a sub-ticket
  const handleCopySubTicket = (parentId: string, subTicket: SubTicket) => {
    const newSubTicketObj: SubTicket = {
      id: `subticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${subTicket.title} (Copy)`,
      description: subTicket.description,
    }

    const newColumns = [...columns]

    // Find the column and ticket containing the sub-ticket
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === parentId)

      if (ticketIndex !== -1) {
        const ticket = column.tickets[ticketIndex]
        const subTicketIndex = ticket.subTickets.findIndex((st) => st.id === subTicket.id)

        if (subTicketIndex !== -1) {
          // Add the copy right after the original
          const updatedSubTickets = [...ticket.subTickets]
          updatedSubTickets.splice(subTicketIndex + 1, 0, newSubTicketObj)

          column.tickets[ticketIndex] = {
            ...ticket,
            subTickets: updatedSubTickets,
          }
          break
        }
      }
    }

    setColumns(newColumns)

    toast({
      title: "Sub-ticket Copied",
      description: "A copy of the sub-ticket has been created",
    })
  }

  // Handle copying ticket text to clipboard
  const handleCopyTicketText = (ticket: Ticket) => {
    try {
      // Préparer le texte à copier, incluant uniquement la description du ticket principal
      let textToCopy = ticket.description

      // Ajouter les sous-tickets s'il y en a, mais sans le titre "--- Sub-tickets ---"
      if (ticket.subTickets.length > 0) {
        ticket.subTickets.forEach((subTicket, index) => {
          textToCopy += `\n\n${subTicket.description}`
        })
      }

      // Créer un élément textarea temporaire
      const textArea = document.createElement("textarea")
      textArea.value = textToCopy

      // Le rendre invisible mais le garder dans le DOM
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)

      // Sélectionner et copier le texte
      textArea.focus()
      textArea.select()
      const successful = document.execCommand("copy")

      // Nettoyer
      document.body.removeChild(textArea)

      if (successful) {
        toast({
          title: "Text copied",
          description: "Ticket content with sub-tickets has been copied to clipboard",
        })
      } else {
        throw new Error("Copy command failed")
      }
    } catch (err) {
      console.error("Erreur lors de la copie du texte: ", err)

      // Essayer une méthode alternative avec l'API Clipboard moderne
      if (navigator.clipboard) {
        // Préparer le texte à copier, incluant uniquement la description du ticket principal
        let textToCopy = ticket.description

        // Ajouter les sous-tickets s'il y en a, mais sans le titre "--- Sub-tickets ---"
        if (ticket.subTickets.length > 0) {
          ticket.subTickets.forEach((subTicket, index) => {
            textToCopy += `\n\n${subTicket.description}`
          })
        }

        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            toast({
              title: "Text copied",
              description: "Ticket content with sub-tickets has been copied to clipboard",
            })
          })
          .catch((err) => {
            console.error("Error with Clipboard API: ", err)
            toast({
              variant: "destructive",
              title: "Error",
              description: "Unable to copy text. Try selecting it manually.",
            })
          })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to copy text. Try selecting it manually.",
        })
      }
    }
  }

  // Handle copying sub-ticket text to clipboard
  const handleCopySubTicketText = (subTicket: SubTicket) => {
    try {
      const textArea = document.createElement("textarea")
      textArea.value = subTicket.description

      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)

      textArea.focus()
      textArea.select()
      const successful = document.execCommand("copy")

      document.body.removeChild(textArea)

      if (successful) {
        toast({
          title: "Text copied",
          description: "Sub-ticket content has been copied to clipboard",
        })
      } else {
        throw new Error("Copy command failed")
      }
    } catch (err) {
      console.error("Error copying text: ", err)

      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(subTicket.description)
          .then(() => {
            toast({
              title: "Text copied",
              description: "Sub-ticket content has been copied to clipboard",
            })
          })
          .catch((err) => {
            console.error("Error with Clipboard API: ", err)
            toast({
              variant: "destructive",
              title: "Error",
              description: "Unable to copy text. Try selecting it manually.",
            })
          })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to copy text. Try selecting it manually.",
        })
      }
    }
  }

  // Handle direct editing of ticket description
  const handleStartDirectEdit = (ticket: Ticket) => {
    setDirectEditingTicketId(ticket.id)
    setDirectEditingText(ticket.description)
    setIsDirectEditDialogOpen(true)
  }

  const handleSaveDirectEdit = (ticketId: string) => {
    if (directEditingText.trim() === "") return

    const newColumns = [...columns]

    // Find the column containing the ticket
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === ticketId)

      if (ticketIndex !== -1) {
        // Update the ticket description
        column.tickets[ticketIndex] = {
          ...column.tickets[ticketIndex],
          description: directEditingText,
        }
        break
      }
    }

    setColumns(newColumns)
    setDirectEditingTicketId(null)
    setIsDirectEditDialogOpen(false)

    toast({
      title: "Description Updated",
      description: "The ticket description has been updated",
    })
  }

  const handleCancelDirectEdit = () => {
    setDirectEditingTicketId(null)
    setIsDirectEditDialogOpen(false)
  }

  // Handle direct editing of sub-ticket description
  const handleStartDirectEditSubTicket = (parentId: string, subTicket: SubTicket) => {
    setDirectEditingSubTicketId(subTicket.id)
    setDirectEditingSubTicketParentId(parentId)
    setDirectEditingSubTicketText(subTicket.description)
    setIsSubTicketEditDialogOpen(true)
  }

  const handleSaveDirectEditSubTicket = (parentId: string, subTicketId: string) => {
    if (directEditingSubTicketText.trim() === "") return

    const newColumns = [...columns]

    // Find the column and ticket containing the sub-ticket
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === parentId)

      if (ticketIndex !== -1) {
        const ticket = column.tickets[ticketIndex]
        const subTicketIndex = ticket.subTickets.findIndex((st) => st.id === subTicketId)

        if (subTicketIndex !== -1) {
          // Update the sub-ticket description
          const updatedSubTickets = [...ticket.subTickets]
          updatedSubTickets[subTicketIndex] = {
            ...updatedSubTickets[subTicketIndex],
            description: directEditingSubTicketText,
          }

          column.tickets[ticketIndex] = {
            ...ticket,
            subTickets: updatedSubTickets,
          }
          break
        }
      }
    }

    setColumns(newColumns)
    setDirectEditingSubTicketId(null)
    setDirectEditingSubTicketParentId(null)
    setIsSubTicketEditDialogOpen(false)

    toast({
      title: "Description Updated",
      description: "The sub-ticket description has been updated",
    })
  }

  const handleCancelDirectEditSubTicket = () => {
    setDirectEditingSubTicketId(null)
    setDirectEditingSubTicketParentId(null)
    setIsSubTicketEditDialogOpen(false)
  }

  // Get all tickets from all columns
  const getAllTickets = () => {
    return columns.flatMap((column) => column.tickets)
  }

  // Handle generating AI description for a ticket
  const handleGenerateAiDescription = async (ticketParam?: Ticket) => {
    // Utiliser le ticket passé en paramètre ou selectedTicket
    const ticketToUse = ticketParam || selectedTicket

    if (!ticketToUse) {
      console.error("No ticket selected for AI description generation")
      return
    }

    setIsGeneratingSuggestion(true)
    setGeneratedDescription("")

    try {
      // Get all other tickets to provide context
      const allTickets = getAllTickets()
      const otherTickets = allTickets
        .filter((t) => t.id !== ticketToUse.id)
        .map((t) => ({ title: t.title, description: t.description }))

      // Call the server action to generate a new description
      const newDescription = await enrichTicketDescription(ticketToUse.title, ticketToUse.description, otherTickets)

      setGeneratedDescription(newDescription)
    } catch (error) {
      console.error("Error generating AI description:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI description. Please try again.",
      })
    } finally {
      setIsGeneratingSuggestion(false)
    }
  }

  // Handle generating AI description for a sub-ticket
  const handleGenerateSubTicketAiDescription = async (parentTicket: Ticket, subTicket: SubTicket) => {
    try {
      toast({
        title: "Generating AI description",
        description: "Please wait while Gemini enhances the sub-ticket description...",
      })

      // Get other sub-tickets from the parent ticket
      const otherSubTickets = parentTicket.subTickets
        .filter((st) => st.id !== subTicket.id)
        .map((st) => ({ title: st.title, description: st.description }))

      // Call the server action to generate a new description
      const newDescription = await enrichSubTicketDescription(
        parentTicket.title,
        parentTicket.description,
        subTicket.title,
        subTicket.description,
        otherSubTickets,
      )

      // Update the sub-ticket with the new description
      const newColumns = [...columns]
      for (const column of newColumns) {
        const ticketIndex = column.tickets.findIndex((t) => t.id === parentTicket.id)
        if (ticketIndex !== -1) {
          const ticket = column.tickets[ticketIndex]
          const subTicketIndex = ticket.subTickets.findIndex((st) => st.id === subTicket.id)
          if (subTicketIndex !== -1) {
            // Update the sub-ticket description
            const updatedSubTickets = [...ticket.subTickets]
            updatedSubTickets[subTicketIndex] = {
              ...updatedSubTickets[subTicketIndex],
              description: newDescription,
            }

            column.tickets[ticketIndex] = {
              ...ticket,
              subTickets: updatedSubTickets,
            }
            break
          }
        }
      }

      setColumns(newColumns)

      toast({
        title: "Description Enhanced",
        description: "The sub-ticket description has been enhanced with Gemini AI",
      })
    } catch (error) {
      console.error("Error generating AI description for sub-ticket:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI description with Gemini. Please try again.",
      })
    }
  }

  // New function to handle AI description generation for main tickets
  const handleGenerateMainTicketAiDescription = async (ticket: Ticket) => {
    try {
      // Show loading toast
      toast({
        title: "Enhancing description",
        description: "Please wait while Gemini improves the ticket description...",
      })

      // Get all other tickets to provide context
      const allTickets = getAllTickets()
      const otherTickets = allTickets
        .filter((t) => t.id !== ticket.id)
        .map((t) => ({ title: t.title, description: t.description }))

      // Call the server action to generate a new description
      const newDescription = await enrichTicketDescription(ticket.title, ticket.description, otherTickets)

      // Update the ticket with the new description
      const newColumns = [...columns]
      for (const column of newColumns) {
        const ticketIndex = column.tickets.findIndex((t) => t.id === ticket.id)
        if (ticketIndex !== -1) {
          // Update the ticket description
          column.tickets[ticketIndex] = {
            ...column.tickets[ticketIndex],
            description: newDescription,
          }
          break
        }
      }

      setColumns(newColumns)

      toast({
        title: "Description Enhanced",
        description: "The ticket description has been improved with Gemini AI",
      })
    } catch (error) {
      console.error("Error generating AI description for ticket:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI description with Gemini. Please try again.",
      })
    }
  }

  // Apply the generated description to the ticket
  const handleApplyGeneratedDescription = () => {
    if (!selectedTicket || !generatedDescription) return

    const newColumns = [...columns]

    // Find the column containing the ticket
    for (const column of newColumns) {
      const ticketIndex = column.tickets.findIndex((t) => t.id === selectedTicket.id)

      if (ticketIndex !== -1) {
        // Update the ticket description
        column.tickets[ticketIndex] = {
          ...column.tickets[ticketIndex],
          description: generatedDescription,
        }
        break
      }
    }

    setColumns(newColumns)
    setIsAiDialogOpen(false)
    setGeneratedDescription("")

    toast({
      title: "Description Updated",
      description: "The ticket description has been updated with AI-generated content",
    })
  }

  // Fonction pour filtrer les tickets en fonction de la recherche
  const filterTickets = (tickets: Ticket[]) => {
    if (!searchQuery.trim()) return tickets

    const query = searchQuery.toLowerCase().trim()

    // Si la requête est vide, retourner tous les tickets
    if (query.length === 0) return tickets

    // Sinon, filtrer les tickets dont la première lettre du titre correspond à la première lettre de la requête
    const firstLetter = query[0]

    return tickets.filter((ticket) => ticket.title.toLowerCase()[0] === firstLetter)
  }

  // Fonction pour générer des suggestions de tickets en fonction de la recherche
  const generateSuggestions = (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    const query_lower = query.toLowerCase().trim()

    // Si la requête est vide, ne pas générer de suggestions
    if (query_lower.length === 0) {
      setSuggestions([])
      return
    }

    // Sinon, filtrer les tickets dont la première lettre du titre correspond à la première lettre de la requête
    const firstLetter = query_lower[0]
    const allTickets = getAllTickets()

    // Filtrer les tickets qui correspondent à la recherche uniquement par la première lettre du titre
    const matchingTickets = allTickets.filter((ticket) => ticket.title.toLowerCase()[0] === firstLetter)

    // Limiter à 5 suggestions maximum
    setSuggestions(matchingTickets.slice(0, 5))
  }

  // Handle generating AI suggestion for a ticket
  const handleGenerateAiSuggestion = () => {
    if (!selectedTicket) return

    setIsGeneratingSuggestion(true)

    // Simulate AI processing
    setTimeout(() => {
      const suggestions = [
        "To implement this feature, I recommend creating a React component with a controlled form that captures user inputs. Use text fields for the project name and text areas for longer descriptions. Add client-side validation to ensure required fields are filled before submission.",
        "This feature requires integration with a language model like GPT-4. You'll need to create an API that sends the project description to the model with a well-structured prompt asking to analyze the text and extract key elements for project structuring.",
        "For this feature, I suggest using a drag-and-drop library like react-beautiful-dnd to allow users to easily reorganize tickets between columns. Each ticket should be a component with its own state and actions for editing and deletion.",
      ]

      // Choose a random suggestion based on the ticket
      const index = Math.floor(Math.random() * suggestions.length)
      setAiSuggestion(suggestions[index])
      setIsGeneratingSuggestion(false)
    }, 1500)
  }

  // Export the Kanban board as JSON
  const handleExport = () => {
    const exportData = {
      projectName,
      projectGoal,
      tickets: columns.map((column) => ({
        column: column.title,
        tickets: column.tickets.map((ticket) => ({
          title: ticket.title,
          description: ticket.description,
          subTickets: ticket.subTickets.map((st) => ({
            title: st.title,
            description: st.description,
          })),
        })),
      })),
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `${projectName.replace(/\s+/g, "-").toLowerCase()}-kanban.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    toast({
      title: "Board Exported",
      description: "Your Kanban board has been exported as JSON",
    })
  }

  return (
    <div className="space-y-6 w-full h-full overflow-hidden flex flex-col">
      <Toaster />
      <style>{highlightStyle}</style>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{projectName}</h2>
          <p className="text-slate-600 dark:text-slate-dark:text-slate-300 mt-1">{projectGoal}</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                generateSuggestions(e.target.value)
              }}
              className="pl-8"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSuggestions([])
                }}
                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Liste des suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto scrollbar-thin">
                <style jsx global>{`
                  .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                  }
                  .scrollbar-thin::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 3px;
                  }
                  .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(124, 58, 237, 0.3);
                    border-radius: 3px;
                    transition: background 0.2s ease;
                  }
                  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(124, 58, 237, 0.5);
                  }
                  .dark .scrollbar-thin::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                  }
                  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(124, 58, 237, 0.4);
                  }
                  .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(124, 58, 237, 0.6);
                  }
                `}</style>
                {suggestions.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => {
                      // Ouvrir le ticket en grand
                      setExpandedTickets((prev) => ({
                        ...prev,
                        [ticket.id]: true,
                      }))
                      // Mettre à jour la recherche
                      setSearchQuery(ticket.title)
                      // Effacer les suggestions
                      setSuggestions([])

                      // Trouver le ticket dans les colonnes pour le mettre en évidence
                      const ticketElement = document.getElementById(`ticket-${ticket.id}`)
                      if (ticketElement) {
                        ticketElement.scrollIntoView({ behavior: "smooth", block: "center" })
                        ticketElement.classList.add("highlight-ticket")
                        setTimeout(() => {
                          ticketElement.classList.remove("highlight-ticket")
                        }, 2000)
                      }
                    }}
                  >
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{ticket.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {ticket.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a New Ticket</DialogTitle>
                <DialogDescription>Create a new functional ticket for your project.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-title">Title</Label>
                  <Input
                    id="ticket-title"
                    placeholder="Ticket title"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket-description">Description</Label>
                  <Textarea
                    id="ticket-description"
                    placeholder="Feature description"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTicket}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Ticket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubTicket ? "Edit Sub-ticket" : "Edit Ticket"}</DialogTitle>
            <DialogDescription>
              Modify the {editingSubTicket ? "sub-ticket" : "ticket"} details below.
            </DialogDescription>
          </DialogHeader>
          {editingTicket && !editingSubTicket && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ticket-title">Title</Label>
                <Input
                  id="edit-ticket-title"
                  placeholder="Ticket title"
                  value={editingTicket.title}
                  onChange={(e) => setEditingTicket({ ...editingTicket, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ticket-description">Description</Label>
                <Textarea
                  id="edit-ticket-description"
                  placeholder="Feature description"
                  value={editingTicket.description}
                  onChange={(e) => setEditingTicket({ ...editingTicket, description: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          {editingSubTicket && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subticket-title">Title</Label>
                <Input
                  id="edit-subticket-title"
                  placeholder="Sub-ticket title"
                  value={editingSubTicket.subTicket.title}
                  onChange={(e) =>
                    setEditingSubTicket({
                      ...editingSubTicket,
                      subTicket: { ...editingSubTicket.subTicket, title: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subticket-description">Description</Label>
                <Textarea
                  id="edit-subticket-description"
                  placeholder="Sub-task description"
                  value={editingSubTicket.subTicket.description}
                  onChange={(e) =>
                    setEditingSubTicket({
                      ...editingSubTicket,
                      subTicket: { ...editingSubTicket.subTicket, description: e.target.value },
                    })
                  }
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingTicket(null)
                setEditingSubTicket(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingSubTicket ? handleEditSubTicket : handleEditTicket}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sub-ticket Dialog */}
      <Dialog open={isSubTicketDialogOpen} onOpenChange={setIsSubTicketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Sub-ticket</DialogTitle>
            <DialogDescription>Create a new sub-task for: {selectedTicket?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subticket-title">Title</Label>
              <Input
                id="subticket-title"
                placeholder="Sub-ticket title"
                value={newSubTicket.title}
                onChange={(e) => setNewSubTicket({ ...newSubTicket, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subticket-description">Description</Label>
              <Textarea
                id="subticket-description"
                placeholder="Sub-task description"
                value={newSubTicket.description}
                onChange={(e) => setNewSubTicket({ ...newSubTicket, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubTicketDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubTicket}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Description Dialog */}
      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI-Enhanced Description</DialogTitle>
            <DialogDescription>
              Gemini has analyzed your ticket and generated an enhanced description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isGeneratingSuggestion ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Generating enhanced description with Gemini...</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="original-description">Original Description</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm text-slate-600 dark:text-slate-300 border">
                    {selectedTicket?.description}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-description">AI-Enhanced Description</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md text-sm text-slate-600 dark:text-slate-300 border min-h-[150px]">
                    {generatedDescription}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyGeneratedDescription}
              disabled={isGeneratingSuggestion || !generatedDescription}
            >
              Apply Enhanced Description
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Direct Edit Dialog */}
      <Dialog open={isDirectEditDialogOpen} onOpenChange={setIsDirectEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
            <DialogDescription>Edit the ticket description below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="direct-edit-description">Description</Label>
              <Textarea
                id="direct-edit-description"
                placeholder="Ticket description"
                value={directEditingText}
                onChange={(e) => setDirectEditingText(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDirectEditDialogOpen(false)
                setDirectEditingTicketId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (directEditingTicketId) {
                  handleSaveDirectEdit(directEditingTicketId)
                  setIsDirectEditDialogOpen(false)
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-ticket Edit Dialog */}
      <Dialog open={isSubTicketEditDialogOpen} onOpenChange={setIsSubTicketEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-ticket</DialogTitle>
            <DialogDescription>Edit the sub-ticket description below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subticket-edit-description">Description</Label>
              <Textarea
                id="subticket-edit-description"
                placeholder="Sub-ticket description"
                value={directEditingSubTicketText}
                onChange={(e) => setDirectEditingSubTicketText(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubTicketEditDialogOpen(false)
                setDirectEditingSubTicketId(null)
                setDirectEditingSubTicketParentId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (directEditingSubTicketId && directEditingSubTicketParentId) {
                  handleSaveDirectEditSubTicket(directEditingSubTicketParentId, directEditingSubTicketId)
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="kanban">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4 w-full flex-1 overflow-hidden">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-full">
              {columns.map((column) => {
                const filteredTickets = filterTickets(column.tickets)
                return (
                  <div key={column.id} className="space-y-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                      <h3 className="font-medium text-slate-900 dark:text-white flex items-center justify-between">
                        {column.title}
                        <Badge variant="outline">{filteredTickets.length}</Badge>
                      </h3>
                    </div>

                    <Droppable droppableId={column.id} type="ticket">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3 overflow-y-auto h-[calc(100vh-220px)] no-scrollbar pb-20"
                        >
                          {filteredTickets.map((ticket, index) => (
                            <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  id={`ticket-${ticket.id}`}
                                  className="shadow-sm hover:shadow-md transition-shadow mb-4"
                                >
                                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                                      <div className="flex items-center gap-2 flex-1">
                                        <button
                                          onClick={() => toggleTicketExpanded(ticket.id)}
                                          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                          aria-label={isTicketExpanded(ticket.id) ? "Collapse ticket" : "Expand ticket"}
                                        >
                                          {isTicketExpanded(ticket.id) ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                        </button>
                                        <CardTitle className="text-base">
                                          {ticket.title}
                                          <Badge
                                            variant="outline"
                                            className="ml-2 text-xs"
                                            title="Number of sub-tickets"
                                          >
                                            {ticket.subTickets.length}
                                          </Badge>
                                        </CardTitle>
                                      </div>
                                      {/* Menu supprimé */}
                                    </CardHeader>

                                    <CardContent className="p-4 pt-0">
                                      <div className="group relative">
                                        <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                                          {ticket.description}
                                        </CardDescription>
                                      </div>
                                    </CardContent>

                                    {/* Sub-tickets section */}
                                    {isTicketExpanded(ticket.id) && (
                                      <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                                          Sub-tickets{" "}
                                          {ticket.subTickets.length > 0 ? `(${ticket.subTickets.length})` : ""}
                                        </h4>
                                        {ticket.subTickets.length > 0 && (
                                          <Droppable droppableId={`subtickets-${ticket.id}`} type="subticket">
                                            {(provided) => (
                                              <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="space-y-2 mb-2"
                                              >
                                                {ticket.subTickets.map((subTicket, subIndex) => (
                                                  <Draggable
                                                    key={subTicket.id}
                                                    draggableId={subTicket.id}
                                                    index={subIndex}
                                                  >
                                                    {(provided) => (
                                                      <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="bg-slate-50 dark:bg-slate-800 rounded-md p-2 border border-slate-200 dark:border-slate-700"
                                                      >
                                                        <div className="flex flex-col">
                                                          <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                              <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {subTicket.title}
                                                              </h5>
                                                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                                {subTicket.description}
                                                              </p>
                                                            </div>
                                                          </div>

                                                          <div className="flex justify-end gap-1 mt-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              className="h-5 text-xs"
                                                              onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleStartDirectEditSubTicket(ticket.id, subTicket)
                                                              }}
                                                              title="Edit sub-ticket"
                                                            >
                                                              <Edit className="h-3 w-3 mr-1" />
                                                              Edit
                                                            </Button>
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              className="h-5 text-xs"
                                                              onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleCopySubTicketText(subTicket)
                                                              }}
                                                              title="Copy sub-ticket content"
                                                            >
                                                              <Copy className="h-3 w-3 mr-1" />
                                                              Copy
                                                            </Button>
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              className="h-5 text-xs"
                                                              onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleGenerateSubTicketAiDescription(ticket, subTicket)
                                                              }}
                                                              title="Enhance with AI"
                                                            >
                                                              <RefreshCw className="h-3 w-3 mr-1" />
                                                              AI
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </Draggable>
                                                ))}
                                                {provided.placeholder}
                                              </div>
                                            )}
                                          </Droppable>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                          onClick={() => {
                                            setSelectedTicket(ticket)
                                            setNewSubTicket({ title: "", description: "" })
                                            setIsSubTicketDialogOpen(true)
                                          }}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Sub-ticket
                                        </Button>
                                      </div>
                                    )}

                                    <CardFooter className="p-2 flex justify-end gap-1 border-t">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleStartDirectEdit(ticket)
                                        }}
                                        title="Edit description"
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCopyTicketText(ticket)
                                        }}
                                        title="Copy ticket content"
                                      >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleGenerateMainTicketAiDescription(ticket)
                                        }}
                                        title="Enhance with AI"
                                      >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        AI
                                      </Button>
                                    </CardFooter>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="list" className="w-full flex-1 overflow-hidden">
          <Card>
            <CardContent className="p-6 overflow-y-auto h-[calc(100vh-220px)] pb-24">
              <div className="space-y-6">
                {/* Afficher tous les tickets sans les regrouper par colonnes */}
                <div>
                  <div className="space-y-3">
                    {columns
                      .flatMap((column) => column.tickets)
                      .filter(
                        (ticket) =>
                          !searchQuery.trim() || ticket.title.toLowerCase()[0] === searchQuery.toLowerCase().trim()[0],
                      )
                      .map((ticket) => (
                        <div key={ticket.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleTicketExpanded(ticket.id)}
                                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                >
                                  {isTicketExpanded(ticket.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                <h4 className="font-medium">
                                  {ticket.title}
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {ticket.subTickets.length}
                                  </Badge>
                                </h4>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 mt-1 ml-6">{ticket.description}</p>

                              {/* Sub-tickets in list view */}
                              {isTicketExpanded(ticket.id) && (
                                <div className="ml-6 mt-3 space-y-2">
                                  <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                                    Sub-tickets {ticket.subTickets.length > 0 ? `(${ticket.subTickets.length})` : ""}:
                                  </h5>
                                  {ticket.subTickets.length > 0 && (
                                    <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                      {ticket.subTickets.map((subTicket) => (
                                        <div
                                          key={subTicket.id}
                                          className="bg-slate-50 dark:bg-slate-800 rounded-md p-2 border border-slate-200 dark:border-slate-700"
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <h6 className="text-sm font-medium text-slate-900 dark:text-white">
                                                {subTicket.title}
                                              </h6>
                                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                {subTicket.description}
                                              </p>
                                            </div>
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleStartDirectEditSubTicket(ticket.id, subTicket)}
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleCopySubTicketText(subTicket)}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleGenerateSubTicketAiDescription(ticket, subTicket)}
                                                title="Enhance with AI"
                                              >
                                                <RefreshCw className="h-3 w-3" />
                                              </Button>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                    <MoreHorizontal className="h-3 w-3" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem
                                                    onClick={() => handleStartDirectEditSubTicket(ticket.id, subTicket)}
                                                  >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => handleCopySubTicket(ticket.id, subTicket)}
                                                  >
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicate
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onClick={() => handleCopySubTicketText(subTicket)}>
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Copy text
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => handleDeleteSubTicket(ticket.id, subTicket.id)}
                                                    className="text-red-600 focus:text-red-600"
                                                  >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    onClick={() => {
                                      setSelectedTicket(ticket)
                                      setNewSubTicket({ title: "", description: "" })
                                      setIsSubTicketDialogOpen(true)
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Sub-ticket
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyTicketText(ticket)
                                }}
                                title="Copy ticket content"
                                className="h-8"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingTicket(ticket)
                                      setEditingSubTicket(null)
                                      setIsEditDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedTicket(ticket)
                                      setNewSubTicket({ title: "", description: "" })
                                      setIsSubTicketDialogOpen(true)
                                    }}
                                  >
                                    <ListPlus className="h-4 w-4 mr-2" />
                                    Add Sub-ticket
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyTicket(ticket)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyTicketText(ticket)}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Copy text
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTicket(ticket.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    {columns.flatMap((column) => column.tickets).length === 0 && (
                      <p className="text-slate-500 dark:text-slate-400 italic">No tickets available</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Ajouter un style pour l'effet de surbrillance et la barre de défilement
const highlightStyle = `
  @keyframes highlight {
    0% { background-color: rgba(124, 58, 237, 0.1); }
    100% { background-color: transparent; }
  }
  .highlight-ticket {
    animation: highlight 2s ease-out;
    background-color: rgba(124, 58, 237, 0.05);
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(124, 58, 237, 0.3);
    border-radius: 3px;
    transition: background 0.2s ease;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgba(124, 58, 237, 0.5);
  }
  .dark .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(124, 58, 237, 0.4);
  }
  .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgba(124, 58, 237, 0.6);
  }

  /* Styles pour déplacer la barre de défilement à gauche */
  .scrollbar-left {
    direction: rtl;
  }
  .scrollbar-left > * {
    direction: ltr;
  }

  /* Hide scrollbar but keep functionality */
  .no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
`

// Exporter à la fois comme exportation nommée et par défaut
export default KanbanBoard

