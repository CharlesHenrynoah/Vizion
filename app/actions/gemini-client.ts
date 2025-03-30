"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// Centralized Gemini client to ensure consistent configuration
export async function generateGeminiContent(prompt: string): Promise<string> {
  try {
    // Initialize the Google Generative AI with the API key
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

    // Access the Gemini model with the model name from the curl example
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Call the Gemini API
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Error generating content with Gemini:", error)

    // Provide a more detailed error message for debugging
    if (error instanceof Error) {
      console.error("Error details:", error.message)
    }

    // Fallback to a description generator that uses existing content if available
    return generateFallbackDescription(prompt)
  }
}

// Fallback function to generate a description when the API fails
function generateFallbackDescription(prompt: string): string {
  // Extract project name, current purpose, and inspirations from the prompt if possible
  const nameMatch = prompt.match(/Project Name:\s*([^*\n]+)/i)
  const purposeMatch = prompt.match(/Current Project Purpose:\s*"([^"]+)"/i)
  const inspirationsMatch = prompt.match(/Inspirations:\s*"([^"]+)"/i)

  const projectName = nameMatch ? nameMatch[1].trim() : "Your project"
  const currentPurpose = purposeMatch && purposeMatch[1].trim() !== "(None provided)" ? purposeMatch[1].trim() : ""
  const inspirations =
    inspirationsMatch && inspirationsMatch[1].trim() !== "(None provided)" ? inspirationsMatch[1].trim() : ""

  // If there's already a purpose, enhance it slightly
  if (currentPurpose) {
    // Return the current purpose with minimal modification to respect user input
    if (inspirations) {
      // If the current purpose doesn't mention the inspirations, add them
      if (!currentPurpose.toLowerCase().includes(inspirations.toLowerCase())) {
        return `${currentPurpose} Inspired by ${inspirations}.`
      }
    }
    return currentPurpose
  }

  // Generate a purpose based on project name and inspirations
  if (inspirations) {
    // Try to extract specific software mentions to make the description more relevant
    const softwareList = inspirations.split(/[,\s]+/).filter((s) => s.length > 3)
    const features = getFeaturesByInspiration(inspirations, softwareList)

    return `${getActionVerb(projectName)} ${features.join(", ")}. Inspired by ${inspirations}, it provides an intuitive interface for seamless workflow management.`
  } else {
    // No inspirations, create a simple purpose based on project name
    return `${getActionVerb(projectName)} content and resources efficiently with an intuitive interface, customizable options, and streamlined workflow.`
  }
}

// Helper function to determine a starting action verb based on project name
function getActionVerb(projectName: string): string {
  const name = projectName.toLowerCase()

  if (name.includes("chat") || name.includes("message") || name.includes("talk")) {
    return "Communicate and collaborate through real-time messaging,"
  } else if (name.includes("task") || name.includes("todo") || name.includes("list")) {
    return "Organize tasks and track progress with"
  } else if (name.includes("note") || name.includes("doc")) {
    return "Create and organize information with"
  } else if (name.includes("shop") || name.includes("store") || name.includes("commerce")) {
    return "Manage products and process orders with"
  } else if (name.includes("blog") || name.includes("cms") || name.includes("content")) {
    return "Publish and manage content using"
  } else if (name.includes("analytic") || name.includes("metric") || name.includes("dash")) {
    return "Visualize data and track performance with"
  } else if (name.includes("learn") || name.includes("course") || name.includes("edu")) {
    return "Facilitate learning and knowledge sharing through"
  } else {
    return "Manage and organize your workflow with"
  }
}

// Helper function to extract relevant features based on inspirations
function getFeaturesByInspiration(inspirationText: string, softwareList: string[]): string[] {
  const features: string[] = []
  const text = inspirationText.toLowerCase()

  // Map common software to features
  const softwareFeatures: Record<string, string[]> = {
    slack: ["channels", "team communication"],
    discord: ["community spaces", "voice channels"],
    trello: ["kanban boards", "card organization"],
    notion: ["flexible content blocks", "wiki pages"],
    jira: ["issue tracking", "sprint planning"],
    asana: ["task management", "project timelines"],
    github: ["code collaboration", "version control"],
    figma: ["design collaboration", "prototyping tools"],
    shopify: ["product catalog", "payment processing"],
    wordpress: ["content management", "publishing tools"],
    tableau: ["data visualization", "interactive dashboards"],
    excel: ["spreadsheet functions", "data analysis"],
  }

  // Check for known software and add their features
  for (const [software, featureList] of Object.entries(softwareFeatures)) {
    if (text.includes(software)) {
      features.push(...featureList.slice(0, 1)) // Add one feature per software
    }
  }

  // If no specific software features were found, use generic features based on text patterns
  if (features.length === 0) {
    if (text.includes("chat") || text.includes("messag") || text.includes("slack") || text.includes("discord")) {
      features.push("communication tools", "collaborative features")
    } else if (text.includes("task") || text.includes("project") || text.includes("todo") || text.includes("trello")) {
      features.push("task tracking", "project organization")
    } else if (text.includes("content") || text.includes("blog") || text.includes("cms")) {
      features.push("content management", "publishing workflow")
    } else if (text.includes("data") || text.includes("analytics") || text.includes("dashboard")) {
      features.push("data visualization", "performance metrics")
    } else {
      features.push("customizable workflows", "organization tools")
    }
  }

  // Ensure we have at least 2 features
  if (features.length < 2) {
    features.push("intuitive interface", "customizable options")
  }

  // Limit to 3 features
  return features.slice(0, 3)
}

