"use client"
import { useEffect, useState } from "react"
import KanbanBoard from "@/components/kanban-board"
import { generateTicketsWithAI, type Ticket } from "@/app/actions/generate-tickets"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useSearchParams } from "next/navigation"

export default function KanbanPage() {
  const searchParams = useSearchParams()
  const projectName = searchParams?.get("name") || "Untitled Project"
  const projectGoal = searchParams?.get("goal") || ""
  const inspirations = searchParams?.get("inspirations") || ""

  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])

  useEffect(() => {
    async function loadTickets() {
      try {
        const generatedTickets = await generateTicketsWithAI(projectName, projectGoal, inspirations)
        setTickets(generatedTickets)
      } catch (error) {
        console.error("Error generating tickets:", error)
        // Use default tickets in case of error
        setTickets([])
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate tickets. Please try again or start with an empty board.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTickets()
  }, [projectName, projectGoal, inspirations])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Generating project structure with Gemini...</p>
        </div>
      </div>
    )
  }

  return <KanbanBoard projectName={projectName} projectGoal={projectGoal} initialTickets={tickets} />
}

