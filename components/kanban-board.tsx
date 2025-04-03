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
import { Ticket, SubTicket } from "@/app/kanban/page"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

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
  const onDragEnd = async (result: any) => {
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{projectName}</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un ticket
        </Button>
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
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[200px]"
                    >
                      {column.tickets.map((ticket, index) => (
                        <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                          {(provided) => (
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
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className="space-y-2"
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
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  </div>
                                </CardFooter>
                              )}
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
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

      <Toaster />
    </div>
  )
}
