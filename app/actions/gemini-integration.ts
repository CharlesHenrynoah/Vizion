"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

// Cette fonction doit être exécutée uniquement côté serveur
export async function generateWithGemini(prompt: string): Promise<string> {
  try {
    // Initialiser l'API Gemini avec la clé API
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

    // Accéder au modèle Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Générer du contenu
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Erreur lors de la génération avec Gemini:", error)
    return "Une erreur s'est produite lors de la génération de contenu."
  }
}

// Fonction pour améliorer la description d'un projet
export async function enhanceProjectDescription(projectName: string, inspirations: string): Promise<string> {
  const prompt = `
    Create a functional description for a project inspired by: "${inspirations}".
    
    Instructions:
    1. Imagine this project as a hybrid that combines the best features from all the inspirations mentioned.
    2. Describe 3-5 key innovative features that would make this project stand out.
    3. Focus on functionality, user experience, and technical capabilities.
    4. Keep the tone professional but engaging.
    5. The description must be in English.
    6. Limit your response to exactly 500 characters.
    7. DO NOT include any prefixes, labels, or formatting - just output the pure description text.
    8. DO NOT start with the project name or "AI:" or any other prefix.
    9. DO NOT use bullet points or numbered lists.
    
    Output only the project description as a continuous paragraph with no additional commentary.
  `

  return generateWithGemini(prompt)
}

// Fonction pour générer des idées de fonctionnalités
export async function generateFeatureIdeas(
  projectName: string,
  projectDescription: string,
  count = 5,
): Promise<string[]> {
  const prompt = `
    Generate ${count} feature ideas for a project named "${projectName}" 
    with the description:
    
    "${projectDescription}"
    
    For each feature:
    1. Provide a short, catchy title (3-5 words)
    2. Write a concise description (15-20 words)
    3. Focus on practical functionality that users would value
    4. All content must be in English
    
    Format your response as a JSON array:
    [
      {
        "title": "Feature Title 1",
        "description": "Concise description of feature 1"
      },
      ...
    ]
  `

  try {
    const response = await generateWithGemini(prompt)
    const features = JSON.parse(response)
    return features.map((feature: any) => `${feature.title}: ${feature.description}`)
  } catch (error) {
    console.error("Erreur lors du parsing des idées de fonctionnalités:", error)
    return ["Error generating feature ideas."]
  }
}
