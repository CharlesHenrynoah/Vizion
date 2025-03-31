"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { generateProjectDescription as generateProjectDescriptionServer } from "@/app/actions/project-actions"

// Define a type for the inspiration tree node
type InspirationNode = {
  name: string
  category: string
  features: string[]
  children: InspirationNode[]
}

export function ProjectForm() {
  const router = useRouter()
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

  // Function to create a hierarchical tree from inspirations
  const createInspirationTree = (inspirationText: string): InspirationNode[] => {
    if (!inspirationText || inspirationText.trim() === "") return []

    // Split the inspirations by commas, semicolons, or "and"
    const inspirationList = inspirationText
      .split(/,|;|\sand\s/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    // Software categories and their keywords
    const categories = {
      Communication: ["slack", "discord", "teams", "zoom", "chat", "message", "email", "communication"],
      Productivity: ["notion", "trello", "asana", "todoist", "task", "todo", "note", "productivity"],
      Content: ["wordpress", "medium", "ghost", "blog", "cms", "content", "publish"],
      "E-commerce": ["shopify", "woocommerce", "magento", "shop", "store", "commerce", "sell"],
      Analytics: ["tableau", "powerbi", "looker", "analytics", "dashboard", "data", "report"],
      Social: ["facebook", "instagram", "twitter", "social", "network", "community"],
      Education: ["moodle", "canvas", "coursera", "learn", "course", "education", "teach"],
      "Project Management": ["jira", "monday", "basecamp", "github", "project", "manage", "agile"],
    }

    // Known software features
    const softwareFeatures: Record<string, string[]> = {
      // Communication
      slack: ["channel-based messaging", "thread discussions", "file sharing", "app integrations"],
      discord: ["voice channels", "server communities", "role management", "bot integrations"],
      teams: ["video conferencing", "document collaboration", "team channels", "calendar integration"],
      zoom: ["video meetings", "screen sharing", "breakout rooms", "meeting recordings"],

      // Productivity
      notion: ["all-in-one workspace", "customizable blocks", "databases", "wiki pages"],
      trello: ["kanban boards", "card-based tasks", "checklists", "board automation"],
      asana: ["project timelines", "task dependencies", "team workload", "milestone tracking"],
      todoist: ["task prioritization", "recurring tasks", "natural language input", "productivity stats"],

      // Content
      wordpress: ["content management", "plugin ecosystem", "theme customization", "blog publishing"],
      medium: ["article publishing", "publications", "member-only content", "curation system"],
      ghost: ["newsletter publishing", "subscription management", "markdown editor", "theme system"],

      // E-commerce
      shopify: ["product catalog", "payment processing", "inventory management", "storefront themes"],
      woocommerce: ["product listings", "shopping cart", "shipping options", "order management"],

      // Analytics
      tableau: ["data visualization", "interactive dashboards", "data connectors", "calculated fields"],
      powerbi: ["data modeling", "report sharing", "natural language queries", "embedded analytics"],

      // Social
      facebook: ["news feed", "groups", "events", "marketplace"],
      instagram: ["photo sharing", "stories", "direct messages", "explore feed"],
      twitter: ["short-form posts", "trending topics", "lists", "spaces"],

      // Project Management
      jira: ["issue tracking", "agile boards", "sprint planning", "workflow customization"],
      github: ["code repositories", "pull requests", "issue tracking", "project boards"],
      linear: ["issue tracking", "roadmap", "cycles", "command interface"],
    }

    // Generic features by category
    const genericFeatures: Record<string, string[]> = {
      Communication: ["messaging", "file sharing", "notifications", "user presence"],
      Productivity: ["task management", "note-taking", "reminders", "organization"],
      Content: ["content editing", "publishing workflow", "media management", "categorization"],
      "E-commerce": ["product management", "checkout process", "inventory tracking", "order fulfillment"],
      Analytics: ["data visualization", "reporting", "metrics tracking", "insights"],
      Social: ["profiles", "connections", "content sharing", "engagement"],
      Education: ["course management", "assignments", "progress tracking", "discussions"],
      "Project Management": ["task tracking", "team collaboration", "milestones", "timelines"],
    }

    // Create tree nodes for each inspiration
    const nodes: InspirationNode[] = []

    for (const inspiration of inspirationList) {
      const lowerInspiration = inspiration.toLowerCase()

      // Determine category
      let category = "Other"
      for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some((keyword) => lowerInspiration.includes(keyword))) {
          category = cat
          break
        }
      }

      // Determine features
      let features: string[] = []

      // Check if it's a known software
      for (const [software, softwareFeats] of Object.entries(softwareFeatures)) {
        if (lowerInspiration.includes(software)) {
          // Get 2-3 random features
          features = [...softwareFeats].sort(() => 0.5 - Math.random()).slice(0, 3)
          break
        }
      }

      // If no specific features found, use generic ones for the category
      if (features.length === 0 && genericFeatures[category]) {
        features = genericFeatures[category].slice(0, 3)
      }

      // If still no features, use some default ones
      if (features.length === 0) {
        features = ["user interface", "data management", "customization options"]
      }

      // Create the node
      const node: InspirationNode = {
        name: inspiration,
        category,
        features,
        children: [],
      }

      // Find related nodes to create hierarchy
      for (const existingNode of nodes) {
        if (existingNode.category === category) {
          // Add as child or parent based on name length (simple heuristic)
          if (existingNode.name.length > inspiration.length) {
            existingNode.children.push(node)
          } else {
            node.children.push(existingNode)
          }
        }
      }

      nodes.push(node)
    }

    return nodes
  }

  // Update the generatePurposeFromTree function to create more detailed descriptions

  // Replace the existing generatePurposeFromTree function with this enhanced version:
  const generatePurposeFromTree = (tree: InspirationNode[]): string => {
    if (tree.length === 0) {
      return "Create a versatile application with an intuitive interface that adapts to user preferences. Implement customizable features allowing users to tailor their experience, streamline workflows through automation, and provide comprehensive data visualization capabilities for informed decision-making."
    }

    // Collect all features from the tree
    const allFeatures: string[] = []
    const categories = new Set<string>()
    const softwareNames: string[] = []

    const collectFeatures = (node: InspirationNode) => {
      allFeatures.push(...node.features)
      categories.add(node.category)
      softwareNames.push(node.name)
      node.children.forEach(collectFeatures)
    }

    tree.forEach(collectFeatures)

    // Get unique features
    const uniqueFeatures = [...new Set(allFeatures)]

    // Get primary categories
    const categoryArray = [...categories]
    const primaryCategory = categoryArray.length > 0 ? categoryArray[0] : "application"
    const secondaryCategories = categoryArray.slice(1, 3)

    // Define use cases by category
    const useCases: Record<string, string[]> = {
      Communication: [
        "facilitate real-time collaboration between team members",
        "streamline information sharing across departments",
        "enable seamless communication regardless of location",
        "maintain organized conversation threads and searchable history",
      ],
      Productivity: [
        "track progress on tasks and projects with visual indicators",
        "organize information in customizable hierarchical structures",
        "automate repetitive workflows to save time",
        "prioritize work items based on deadlines and importance",
      ],
      Content: [
        "publish and manage multimedia content with robust version control",
        "implement flexible content templates for consistent formatting",
        "schedule content publication across multiple channels",
        "analyze content performance with detailed metrics",
      ],
      "E-commerce": [
        "showcase products with detailed descriptions and high-quality images",
        "implement secure checkout processes with multiple payment options",
        "track inventory levels and automate reordering",
        "personalize shopping experiences based on user preferences",
      ],
      Analytics: [
        "transform complex datasets into actionable insights",
        "create interactive dashboards for real-time monitoring",
        "generate comprehensive reports with exportable formats",
        "identify trends and patterns through advanced visualizations",
      ],
      Social: [
        "build communities around shared interests and activities",
        "facilitate content discovery through intelligent recommendations",
        "enable rich interactions between users through various media types",
        "maintain privacy controls and content moderation",
      ],
      Education: [
        "deliver structured learning paths with progressive difficulty",
        "track learner progress and provide personalized feedback",
        "facilitate knowledge sharing through discussion forums",
        "assess comprehension through interactive quizzes and assignments",
      ],
      "Project Management": [
        "visualize project timelines and dependencies",
        "allocate resources efficiently across multiple projects",
        "track milestones and deliverables with automated notifications",
        "facilitate collaboration between cross-functional teams",
      ],
      Other: [
        "provide intuitive navigation through complex information structures",
        "implement responsive design for seamless multi-device experiences",
        "ensure accessibility for users with diverse needs",
        "integrate with existing systems through robust APIs",
      ],
    }

    // Select relevant use cases
    const selectedUseCases: string[] = []
    categoryArray.forEach((category) => {
      if (useCases[category]) {
        // Get 1-2 random use cases from each category
        const categoryUseCases = [...useCases[category]].sort(() => 0.5 - Math.random()).slice(0, 2)
        selectedUseCases.push(...categoryUseCases)
      }
    })

    // If we don't have enough use cases, add some from the "Other" category
    if (selectedUseCases.length < 2) {
      selectedUseCases.push(...useCases["Other"].sort(() => 0.5 - Math.random()).slice(0, 2))
    }

    // Limit to 3 use cases maximum
    const finalUseCases = selectedUseCases.slice(0, 3)

    // Select 5-7 features for a more detailed description
    const selectedFeatures = [...uniqueFeatures]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(7, uniqueFeatures.length))

    // Group features into 2-3 sentences
    const featuresSentences: string[] = []

    if (selectedFeatures.length > 0) {
      // First sentence with 2-3 features
      const firstBatch = selectedFeatures.slice(0, Math.min(3, selectedFeatures.length))
      if (firstBatch.length === 1) {
        featuresSentences.push(`Implement ${firstBatch[0]} to enhance user experience.`)
      } else if (firstBatch.length === 2) {
        featuresSentences.push(`Combine ${firstBatch[0]} and ${firstBatch[1]} for a comprehensive solution.`)
      } else {
        featuresSentences.push(
          `Integrate ${firstBatch[0]}, ${firstBatch[1]}, and ${firstBatch[2]} into a cohesive system.`,
        )
      }

      // Second sentence with remaining features
      const secondBatch = selectedFeatures.slice(3)
      if (secondBatch.length === 1) {
        featuresSentences.push(`Enhance functionality with ${secondBatch[0]}.`)
      } else if (secondBatch.length === 2) {
        featuresSentences.push(`Extend capabilities through ${secondBatch[0]} and ${secondBatch[1]}.`)
      } else if (secondBatch.length >= 3) {
        featuresSentences.push(
          `Provide additional value with ${secondBatch[0]}, ${secondBatch[1]}, and ${secondBatch.slice(2).join(", ")}.`,
        )
      }
    }

    // Generate purpose based on categories, features, and use cases
    let purpose = ""

    // Opening statement based on primary category
    switch (primaryCategory) {
      case "Communication":
        purpose =
          "Create a sophisticated communication platform that connects users through intuitive interfaces and real-time interactions."
        break
      case "Productivity":
        purpose =
          "Develop a comprehensive productivity ecosystem that empowers users to organize, track, and optimize their workflows."
        break
      case "Content":
        purpose =
          "Build a robust content management system that streamlines creation, editing, and publishing across multiple channels."
        break
      case "E-commerce":
        purpose =
          "Design an immersive e-commerce experience that guides customers from discovery to purchase with personalized interactions."
        break
      case "Analytics":
        purpose =
          "Create a powerful analytics platform that transforms complex data into clear visualizations and actionable insights."
        break
      case "Social":
        purpose =
          "Develop an engaging social platform that fosters meaningful connections and facilitates content sharing within communities."
        break
      case "Education":
        purpose =
          "Build an adaptive educational environment that delivers personalized learning experiences and tracks progress over time."
        break
      case "Project Management":
        purpose =
          "Design a flexible project management solution that enhances team collaboration and ensures timely delivery of objectives."
        break
      default:
        purpose =
          "Create a versatile application that adapts to user needs with intuitive interfaces and powerful functionality."
    }

    // Add secondary category influence if available
    if (secondaryCategories.length > 0) {
      purpose += ` Incorporate elements of ${secondaryCategories.join(" and ")} to extend functionality beyond traditional solutions.`
    }

    // Add feature sentences
    purpose += " " + featuresSentences.join(" ")

    // Add use cases
    if (finalUseCases.length > 0) {
      purpose += ` Enable users to ${finalUseCases.join(", and ")}.`
    }

    // Add inspiration reference
    if (softwareNames.length > 0) {
      const uniqueNames = [...new Set(softwareNames)]
      purpose += ` Inspired by ${uniqueNames.join(", ")}, the platform delivers a seamless experience that meets modern expectations while introducing innovative approaches to user interaction.`
    }

    return purpose
  }

  const generateProjectDescription = async () => {
    setIsAiLoading(true)

    try {
      // Create inspiration tree
      const inspirationTree = createInspirationTree(inspirations)

      // Generate purpose from tree
      const generatedPurpose = generatePurposeFromTree(inspirationTree)

      // If we have server-side AI generation, use it with only inspirations
      if (inspirations.trim()) {
        try {
          // Pass empty string as projectName to focus only on inspirations
          const aiGeneratedDescription = await generateProjectDescriptionServer("", "", inspirations)

          // Ensure it doesn't exceed character limit
          let finalText = aiGeneratedDescription
          if (finalText.length > MAX_CHARS) {
            finalText = finalText.substring(0, MAX_CHARS)
          }

          // Use the AI-generated description
          fullTextRef.current = finalText
        } catch (error) {
          console.error("Error with server AI generation:", error)
          // Fallback to our locally generated purpose
          fullTextRef.current = generatedPurpose
        }
      } else {
        // No inspirations provided, use a generic purpose
        fullTextRef.current =
          "Create an application with intuitive user interface, efficient data management, and customizable features to meet user needs."
      }

      // Ensure text doesn't exceed character limit
      if (fullTextRef.current.length > MAX_CHARS) {
        fullTextRef.current = fullTextRef.current.substring(0, MAX_CHARS)
      }

      // Reset typing index and start animation
      typingIndexRef.current = 0
      setProjectGoal("")
      setIsTyping(true)
    } catch (error) {
      console.error("Error generating project description:", error)
      // Fallback to a simple description
      fullTextRef.current = `Application with features inspired by ${inspirations || "modern applications"}.`
      typingIndexRef.current = 0
      setProjectGoal("")
      setIsTyping(true)
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Construire l'URL avec les paramètres du projet
      const params = new URLSearchParams()
      // Use a default name if none is provided
      params.append("name", projectName || "Untitled Project")
      params.append("goal", projectGoal)
      if (inspirations) {
        params.append("inspirations", inspirations)
      }

      // Rediriger vers la page Kanban avec les paramètres
      router.push(`/kanban?${params.toString()}`)
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
            <Label htmlFor="project-name" className="text-white font-medium">
              Project Name
            </Label>
            <Input
              id="project-name"
              placeholder="ChatApp"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-black/20 text-white border-purple-800/30 focus:ring-1 focus:ring-purple-500 focus:outline-none rounded-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspirations" className="text-white font-medium">
              Inspirations
            </Label>
            <Input
              id="inspirations"
              placeholder="Mention similar softwares that inspire you.."
              value={inspirations}
              onChange={(e) => setInspirations(e.target.value)}
              required
              className="bg-black/20 text-white border-purple-800/30 focus:ring-1 focus:ring-purple-500 focus:outline-none rounded-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-goal" className="text-white font-medium">
              Project Purpose
            </Label>
            <Textarea
              id="project-goal"
              placeholder="Describe the main purpose of your application..."
              value={projectGoal}
              onChange={handleProjectGoalChange}
              required
              maxLength={MAX_CHARS}
              className={`min-h-[100px] bg-black/20 text-white border-purple-800/30 focus:ring-1 focus:ring-purple-500 focus:outline-none rounded-md ${
                isAtCharLimit ? "opacity-90" : ""
              }`}
            />
            <div className="flex justify-between items-center">
              <p
                className={`text-xs ${
                  isAtCharLimit ? "text-green-500 font-medium" : "text-slate-400"
                }`}
              >
                {projectGoal.length}/{MAX_CHARS} characters
              </p>
              <Button
                type="button"
                size="sm"
                className={`bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 px-2 py-1 h-7 text-xs rounded-md ${!inspirations.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (inspirations.trim()) {
                    generateProjectDescription()
                  }
                }}
              >
                {isAiLoading || isTyping ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {isTyping ? "Typing..." : "AI"}
                  </>
                ) : (
                  <>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white"
                    >
                      <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z" />
                    </svg>
                    AI
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              className={`w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 rounded-md transition-all ${!projectName.trim() || !inspirations.trim() || !projectGoal.trim() || isLoading || isTyping ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={(e) => {
                if (!projectName.trim() || !inspirations.trim() || !projectGoal.trim() || isLoading || isTyping) {
                  e.preventDefault()
                }
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Generate Project Structure"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
