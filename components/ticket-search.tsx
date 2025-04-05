"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

type Ticket = {
  id: string
  title: string
  description: string
  status_id: string
  status_name?: string
  priority: number
  is_sub_ticket: boolean
  parent_ticket_id?: string
}

export function TicketSearch({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    // Raccourci clavier pour ouvrir la recherche (Ctrl+K or ⌘+K)
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Lorsque la boîte de dialogue est ouverte, charger les tickets
  useEffect(() => {
    if (open && projectId) {
      loadTickets()
    }
  }, [open, projectId])

  const loadTickets = async () => {
    if (!projectId) return

    setLoading(true)
    try {
      // Charger les tickets du projet
      const response = await fetch(`/api/tickets/search?projectId=${projectId}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }
      
      const data = await response.json()
      setTickets(data.tickets || [])
      setStatusMap(data.statusMap || {})
    } catch (error) {
      console.error("Erreur lors du chargement des tickets:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les tickets. Veuillez réessayer.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les tickets en fonction de la recherche
  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = search.toLowerCase()
    return (
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.description.toLowerCase().includes(searchLower)
    )
  })

  // Fonction pour naviguer vers un ticket
  const navigateToTicket = (ticketId: string) => {
    // Fermer la boîte de dialogue
    setOpen(false)
    
    // Construire l'URL avec les paramètres
    const params = new URLSearchParams(window.location.search)
    params.set("projectId", projectId)
    params.set("ticketId", ticketId)
    
    // Naviguer vers le ticket sélectionné
    router.push(`/kanban?${params.toString()}`)
    
    // Notifier l'utilisateur
    toast({
      title: "Ticket trouvé",
      description: "Navigation vers le ticket sélectionné...",
    })
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Rechercher des tickets...</span>
        <span className="inline-flex lg:hidden">Rechercher...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Rechercher des tickets..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <CommandEmpty>
                {search === "" ? (
                  "Commencez à taper pour rechercher des tickets."
                ) : (
                  "Aucun ticket trouvé."
                )}
              </CommandEmpty>
              {filteredTickets.length > 0 && (
                <CommandGroup heading="Tickets">
                  {filteredTickets.map((ticket) => (
                    <CommandItem
                      key={ticket.id}
                      value={ticket.id}
                      onSelect={() => navigateToTicket(ticket.id)}
                      className="flex flex-col items-start"
                    >
                      <div className="flex w-full items-center">
                        <span className="font-medium">
                          {ticket.is_sub_ticket && "└ "}
                          {ticket.title}
                        </span>
                        <div className="ml-auto flex gap-2">
                          <Badge variant="outline" className="ml-2">
                            {statusMap[ticket.status_id] || "To Do"}
                          </Badge>
                          <Badge 
                            variant={
                              ticket.priority === 1
                                ? "destructive"
                                : ticket.priority === 2
                                ? "default"
                                : "secondary"
                            }
                            className="ml-2"
                          >
                            P{ticket.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {ticket.description}
                      </p>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
