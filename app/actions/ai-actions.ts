"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// Fonction pour enrichir la description d'un ticket avec Gemini
export async function enrichTicketDescription(
  ticketTitle: string,
  currentDescription: string,
  otherTickets: { title: string; description: string }[],
): Promise<string> {
  try {
    // Initialiser l'API Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Construire le contexte à partir des autres tickets
    const ticketContext = otherTickets
      .map((t) => `- ${t.title}: ${t.description.substring(0, 100)}${t.description.length > 100 ? "..." : ""}`)
      .join("\n")

    // Construire le prompt pour Gemini - modified to request shorter descriptions
    const prompt = `
You are an expert project manager and developer. Your task is to enhance the description of a project ticket.

Current ticket information:
- Title: ${ticketTitle}
- Current description: ${currentDescription}

Context from other tickets in the project:
${ticketContext}

Please provide a concise but improved description for this ticket that:
1. Expands on the current description with just a few more technical details
2. Keeps the description brief - no more than 2-3 sentences longer than the original
3. Maintains a professional, clear tone
4. Focuses only on the most important aspects of implementation

Respond ONLY with the new description text, without any additional commentary or markdown formatting.
Keep it concise and to the point.
`

    // Appeler l'API Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Error enriching ticket description:", error)
    return currentDescription + "\n\n(AI enhancement failed. Using original description.)"
  }
}

// Fonction pour enrichir la description d'un sous-ticket avec Gemini
export async function enrichSubTicketDescription(
  parentTicketTitle: string,
  parentTicketDescription: string,
  subTicketTitle: string,
  currentDescription: string,
  otherSubTickets: { title: string; description: string }[],
): Promise<string> {
  try {
    // Initialiser l'API Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Construire le contexte à partir des autres sous-tickets
    const subTicketContext = otherSubTickets
      .map((st) => `- ${st.title}: ${st.description.substring(0, 100)}${st.description.length > 100 ? "..." : ""}`)
      .join("\n")

    // Construire le prompt pour Gemini - modified to request more concise descriptions
    const prompt = `
You are an expert project manager and developer. Your task is to enhance the description of a sub-ticket within a larger project ticket.

Parent ticket information:
- Title: ${parentTicketTitle}
- Description: ${parentTicketDescription}

Current sub-ticket information:
- Title: ${subTicketTitle}
- Current description: ${currentDescription}

Context from other sub-tickets in the parent ticket:
${subTicketContext}

Please provide a concise but improved description for this sub-ticket that:
1. Expands on the current description with just a few more technical details
2. Keeps the description brief - no more than 4 sentences longer than the original
3. Ensures it aligns with the parent ticket's purpose
4. Maintains a professional, clear tone
5. Focuses only on the most important aspects of implementation

Respond ONLY with the new description text, without any additional commentary or markdown formatting.
Keep it focused and to the point.
`

    // Appeler l'API Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Error enriching sub-ticket description:", error)
    return currentDescription + "\n\n(AI enhancement failed. Using original description.)"
  }
}

