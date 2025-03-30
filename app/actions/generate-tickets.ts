"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

export type SubTicket = {
  id: string
  title: string
  description: string
}

export type Ticket = {
  id: string
  title: string
  description: string
  subTickets: SubTicket[]
}

export async function generateTicketsWithAI(
  projectName: string,
  projectGoal: string,
  inspirations: string,
): Promise<Ticket[]> {
  try {
    // Initialize the Google Generative AI with the API key
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

    // Access the Gemini model - using a standard model instead of experimental
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Build the prompt for Gemini
    const prompt = `
You are an expert in project management and software development. Your role is to generate a list of Kanban tickets for a new project.

Project information:
- Project name: ${projectName}
- Project purpose: ${projectGoal}
${inspirations ? `- Inspirations: ${inspirations}` : ""}

Generate 5 to 8 Kanban tickets for this project. Each ticket should represent a clear and coherent feature (at the "molecule" level).
For each ticket, also generate 2-4 sub-tickets (at the "atom" level) that represent smaller tasks needed to complete the main ticket.

Important rules:
1. Do not include technical details or references to specific frameworks/languages
2. Each ticket should be user-oriented and describe a visible feature
3. Tickets should cover the essential aspects of the project
4. Each ticket should have a short title and a clear description
5. Sub-tickets should be concrete, actionable tasks that contribute to the parent ticket

Respond ONLY with a JSON array in the following format, without any additional text:
[
{
  "title": "Main Ticket Title",
  "description": "Main feature description",
  "subTickets": [
    {
      "title": "Sub-ticket 1 Title",
      "description": "Sub-task description"
    },
    {
      "title": "Sub-ticket 2 Title",
      "description": "Sub-task description"
    }
  ]
}
]
`

    // Call the Gemini API
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    let tickets: { title: string; description: string; subTickets: { title: string; description: string }[] }[] = []

    try {
      // Clean the response to ensure it contains only valid JSON
      const cleanedText = text.replace(/```json|```/g, "").trim()
      tickets = JSON.parse(cleanedText)
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      // Fallback to default tickets in case of error
      return getDefaultTickets()
    }

    // Add unique IDs to tickets and subTickets
    return tickets.map((ticket, index) => ({
      id: `ticket-${Date.now()}-${index}`,
      title: ticket.title,
      description: ticket.description,
      subTickets: ticket.subTickets.map((subTicket, subIndex) => ({
        id: `subticket-${Date.now()}-${index}-${subIndex}`,
        title: subTicket.title,
        description: subTicket.description,
      })),
    }))
  } catch (error) {
    console.error("Error generating tickets:", error)
    return getDefaultTickets()
  }
}

// Default tickets in case of error
function getDefaultTickets(): Ticket[] {
  return [
    {
      id: "ticket-1",
      title: "User Authentication System",
      description: "Complete authentication system with registration, login, and profile management",
      subTickets: [
        {
          id: "subticket-1-1",
          title: "User Registration Form",
          description: "Create a form for new users to register with email and password",
        },
        {
          id: "subticket-1-2",
          title: "Login Interface",
          description: "Implement secure login functionality with validation",
        },
        {
          id: "subticket-1-3",
          title: "Profile Management",
          description: "Allow users to view and edit their profile information",
        },
      ],
    },
    {
      id: "ticket-2",
      title: "Project Dashboard",
      description: "Main dashboard showing project overview and key metrics",
      subTickets: [
        {
          id: "subticket-2-1",
          title: "Project Statistics Panel",
          description: "Display key project metrics and statistics",
        },
        {
          id: "subticket-2-2",
          title: "Recent Activity Feed",
          description: "Show recent actions and updates in the project",
        },
      ],
    },
    {
      id: "ticket-3",
      title: "Interactive Kanban Board",
      description: "Visual interface to view and organize tickets in columns (To Do, In Progress, Done)",
      subTickets: [
        {
          id: "subticket-3-1",
          title: "Drag and Drop Interface",
          description: "Implement drag and drop functionality for moving tickets between columns",
        },
        {
          id: "subticket-3-2",
          title: "Column Management",
          description: "Allow users to add, rename, and reorder columns",
        },
        {
          id: "subticket-3-3",
          title: "Ticket Filtering",
          description: "Add ability to filter tickets by various criteria",
        },
      ],
    },
    {
      id: "ticket-4",
      title: "Notification System",
      description: "System for alerting users about updates and changes",
      subTickets: [
        {
          id: "subticket-4-1",
          title: "In-App Notifications",
          description: "Create a notification center within the application",
        },
        {
          id: "subticket-4-2",
          title: "Email Notifications",
          description: "Send email alerts for important updates",
        },
      ],
    },
    {
      id: "ticket-5",
      title: "Reporting Tools",
      description: "Tools for generating reports and analytics on project progress",
      subTickets: [
        {
          id: "subticket-5-1",
          title: "Progress Charts",
          description: "Visual charts showing project completion and progress",
        },
        {
          id: "subticket-5-2",
          title: "Export Functionality",
          description: "Allow exporting reports in various formats (PDF, CSV)",
        },
        {
          id: "subticket-5-3",
          title: "Scheduled Reports",
          description: "Set up automatic generation of periodic reports",
        },
      ],
    },
  ]
}

