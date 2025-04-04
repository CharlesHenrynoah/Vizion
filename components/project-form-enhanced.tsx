"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles } from "lucide-react"
import { enhanceProjectDescription, generateProjectTickets, createProjectTicketsInDB, generateProjectTicketsFormatted } from "@/app/actions/gemini-integration"
import { useSession } from "next-auth/react"
import { toast } from "@/components/ui/use-toast"

interface ProjectFormEnhancedProps {
  onProjectCreated?: () => void;
}

export function ProjectFormEnhanced({ onProjectCreated }: ProjectFormEnhancedProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [projectName, setProjectName] = useState("")
  const [projectGoal, setProjectGoal] = useState("")
  const [inspirations, setInspirations] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const fullTextRef = useRef("")
  const typingIndexRef = useRef(0)
  const typingSpeedRef = useRef(20) // milliseconds per character
  const MAX_CHARS = 500

  // Effect for the typing animation
  useEffect(() => {
    if (isTyping && typingIndexRef.current < fullTextRef.current.length) {
      // Stop typing if we've reached the character limit
      if (typingIndexRef.current >= MAX_CHARS - 1) {
        setProjectGoal(fullTextRef.current.substring(0, MAX_CHARS))
        setIsTyping(false)
        return
      }

      const typingTimer = setTimeout(() => {
        setProjectGoal(fullTextRef.current.substring(0, typingIndexRef.current + 1))
        typingIndexRef.current += 1
      }, typingSpeedRef.current)

      return () => clearTimeout(typingTimer)
    } else if (isTyping && typingIndexRef.current >= fullTextRef.current.length) {
      setIsTyping(false)
    }
  }, [isTyping, projectGoal])

  // Fonction pour générer une description de projet avec Gemini
  const generateProjectDescription = async () => {
    if (!projectName.trim()) {
      return
    }

    setIsAiLoading(true)

    try {
      // Utiliser l'action serveur pour générer la description
      const aiGeneratedDescription = await enhanceProjectDescription(
        projectName,
        inspirations || "modern web application"
      )

      // Ensure it doesn't exceed character limit
      let finalText = aiGeneratedDescription
      if (finalText.length > MAX_CHARS) {
        finalText = finalText.substring(0, MAX_CHARS)
      }

      // Use the AI-generated description
      fullTextRef.current = finalText

      // Reset typing index and start animation
      typingIndexRef.current = 0
      setProjectGoal("")
      setIsTyping(true)
    } catch (error) {
      console.error("Error with server AI generation:", error)
      // Fallback to a simple description
      fullTextRef.current = `A versatile platform combining modern features and intuitive design. Offers seamless integration with third-party services, real-time collaboration tools, and customizable workflows to enhance productivity.`
      typingIndexRef.current = 0
      setProjectGoal("")
      setIsTyping(true)
    } finally {
      setIsAiLoading(false)
    }
  }

  // Fonction pour créer un projet dans la base de données
  const createProjectInDatabase = async (name: string, description: string) => {
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a project.",
      })
      return false
    }

    try {
      console.log("Creating project with session user ID:", session.user.id);
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          color: '#3B82F6', // Default blue color
          icon: 'sparkles', // Default icon
        }),
      })

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error ${response.status}:`, errorData);
        throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json()
      console.log("Project created successfully:", data);
      return data
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to create project. Please try again.",
      })
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Créer le projet dans la base de données
      const projectData = await createProjectInDatabase(
        projectName || "Untitled Project",
        projectGoal
      )

      if (projectData) {
        // Add project to localStorage for compatibility with existing code
        try {
          const storedProjects = localStorage.getItem("skwerd-projects")
          let projectsList = storedProjects ? JSON.parse(storedProjects) : []
          
          // Check if the project already exists
          if (!projectsList.some((p: any) => p.name === projectName)) {
            const newProject = {
              id: `project-${projectData.id || Date.now()}`,
              name: projectName || "Untitled Project",
              date: "Today",
              goal: projectGoal,
            }
            
            projectsList = [newProject, ...projectsList]
            localStorage.setItem("skwerd-projects", JSON.stringify(projectsList))
          }
        } catch (error) {
          console.error("Error adding project to localStorage:", error)
        }

        // Générer les tickets pour le projet avec Gemini
        try {
          toast({
            title: "Génération des tickets en cours...",
            description: "Votre tableau Kanban se prépare avec des tickets personnalisés",
          })
          
          // Extraire l'ID de l'utilisateur actuel de la session
          const userId = session?.user?.id || session?.user?.email || 'unknown';
          
          // Utiliser le format standard (format JSON)
          const generatedTickets = await generateProjectTickets(
            projectName || "Untitled Project",
            projectGoal
          )
          
          if (generatedTickets && generatedTickets.length > 0) {
            // Créer les tickets dans la base de données
            const ticketsCreated = await createProjectTicketsInDB(
              projectData.id,
              generatedTickets,
              userId
            )
            
            if (ticketsCreated) {
              toast({
                title: "Tickets générés avec succès",
                description: `${generatedTickets.length} tickets ont été créés pour votre projet`,
              })
            } else {
              toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de créer les tickets. Veuillez réessayer.",
              })
            }
          } else {
            toast({
              variant: "destructive",
              title: "Attention",
              description: "Aucun ticket n'a pu être généré automatiquement.",
            })
          }
        } catch (ticketError) {
          console.error("Erreur lors de la génération des tickets:", ticketError)
        }

        // Call the callback if provided
        if (onProjectCreated) {
          onProjectCreated()
        }

        // Build URL with project parameters
        const params = new URLSearchParams()
        params.append("projectId", projectData.id)
        params.append("name", projectName || "Untitled Project")
        
        // Redirect to Kanban page with parameters
        router.push(`/kanban?${params.toString()}`)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error:", error)
      setIsLoading(false)
    }
  }

  // Handle manual text change - stop typing animation if user edits
  const handleProjectGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsTyping(false)
    const newValue = e.target.value
    // Only update if we're under the limit or if we're deleting characters
    if (newValue.length <= MAX_CHARS) {
      setProjectGoal(newValue)
    }
  }

  // Determine if we've reached the character limit
  const isAtCharLimit = projectGoal.length >= MAX_CHARS

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-blue-400 font-medium">
              Project Name
            </Label>
            <Input
              id="project-name"
              placeholder="ChatApp"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-white text-blue-400 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md placeholder:text-blue-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspirations" className="text-blue-400 font-medium">
              Inspirations
            </Label>
            <Input
              id="inspirations"
              placeholder="e.g., Slack, Notion, Trello..."
              value={inspirations}
              onChange={(e) => setInspirations(e.target.value)}
              className="bg-white text-blue-400 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md placeholder:text-blue-300"
            />
            <p className="text-xs text-blue-400/80">
              Mention software or platforms that inspire your project
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-goal" className="text-blue-400 font-medium">
              Project Purpose
            </Label>
            <Textarea
              id="project-goal"
              placeholder="Describe the main purpose of your application..."
              value={projectGoal}
              onChange={handleProjectGoalChange}
              required
              maxLength={MAX_CHARS}
              className={`min-h-[100px] bg-white text-blue-400 border-blue-400/30 focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-md placeholder:text-blue-300 ${
                isAtCharLimit ? "opacity-90" : ""
              }`}
            />
            <div className="flex justify-between items-center">
              <p
                className={`text-xs ${
                  isAtCharLimit ? "text-green-500 font-medium" : "text-blue-400"
                }`}
              >
                {projectGoal.length}/{MAX_CHARS} characters
              </p>
              <Button
                type="button"
                size="sm"
                className={`bg-blue-400 hover:bg-blue-300 text-white flex items-center gap-1 px-2 py-1 h-7 text-xs rounded-md ${!inspirations.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (inspirations.trim()) {
                    generateProjectDescription()
                  }
                }}
                disabled={!inspirations.trim() || isAiLoading}
              >
                {isAiLoading || isTyping ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {isTyping ? "Typing..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col w-full">
            <Button
              type="submit"
              className={`w-full bg-blue-400 hover:bg-blue-300 text-white font-medium py-2 rounded-md transition-all ${(!projectName.trim() || !projectGoal.trim() || isLoading || isTyping) ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!projectName.trim() || !projectGoal.trim() || isLoading || isTyping}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
            {(!projectName.trim() || !projectGoal.trim()) && (
              <p className="text-xs text-red-500 mt-1 text-center">
                Please fill in both project name and purpose.
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
