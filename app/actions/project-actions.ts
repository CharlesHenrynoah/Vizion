"use server"

import { generateGeminiContent } from "./gemini-client"

export async function generateProjectDescription(
  projectName: string,
  currentProjectGoal = "",
  inspirations = "",
): Promise<string> {
  try {
    // Build a more detailed, comprehensive prompt focused on inspirations
    const prompt = `
You are an expert product strategist. Your task is to generate a detailed, specific, and comprehensive project purpose description based primarily on the inspirations provided.

**Project Context:**
* **Inspirations:** ${inspirations ? `"${inspirations}"` : "(None provided)"} (Extract key features, capabilities, and use cases from these examples)
* **Current Project Purpose:** ${currentProjectGoal ? `"${currentProjectGoal}"` : "(None provided)"} (Use as additional context if provided)

**Your Task:**
Generate a detailed project purpose description (250-400 characters) that:

1. **Begins with a clear primary action verb** (Create, Develop, Build, Design, etc.)
2. **Describes the core functionality** in specific, concrete terms
3. **Includes 3-5 distinct features or capabilities** that directly relate to the inspirations
4. **Outlines 2-3 specific use cases or user benefits**
5. **Uses precise, descriptive language** with technical specificity where appropriate
6. **Maintains a professional, action-oriented tone**

**Important Guidelines:**
- Be comprehensive yet concise (250-400 characters)
- Focus on what users can accomplish with the software
- Include specific features and capabilities, not just general concepts
- Use varied sentence structures for better readability
- Respond only with the generated description

**Example:**
For inputs: Inspirations: 'Google Maps, Tripadvisor'
Output: "Explore environments through an interactive interface with dynamic mapping capabilities. Discover points of interest with rich metadata, generate contextual descriptions based on user preferences, and create personalized routes optimized for different transportation modes. Enable location sharing, offline access, and community-contributed reviews."

Now, generate a detailed, specific description based on '${inspirations}'.
`

    // Call the centralized Gemini client
    const text = await generateGeminiContent(prompt)

    // Clean up potential leading/trailing whitespace and prefixes
    let cleanedText = text.trim()
    // Aggressive cleaning of potential unwanted introductory phrases
    cleanedText = cleanedText
      .replace(
        /^(AI:|The project aims to|The application will|The goal is to|Based on the context,|Here is a description:|\[Project Name\]\s*(is|enables|allows)?\s*)/i,
        "",
      )
      .trim()

    // Ensure character limit is respected (increased to 450 characters)
    if (cleanedText.length > 450) {
      // Find the last sentence end before 450 to avoid cutting mid-sentence
      const lastPeriodIndex = cleanedText.lastIndexOf(".", 447)
      cleanedText = cleanedText.substring(0, lastPeriodIndex > 0 ? lastPeriodIndex + 1 : 447).trim()
      console.warn("Gemini response exceeded 450 chars, truncated gracefully.")
    }

    return cleanedText
  } catch (error) {
    console.error("Error generating project description:", error)
    throw error // Re-throw for handling upstream
  }
}

