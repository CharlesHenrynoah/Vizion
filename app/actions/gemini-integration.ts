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

// Fonction pour générer des tickets de projet
export async function generateProjectTickets(
  projectName: string,
  projectDescription: string
): Promise<any[]> {
  const prompt = `
    Tu es un assistant expert en planification de projets logiciels, spécialisé dans la création de tâches pour des IA IDE qui génèrent du code React. Tu dois décomposer la description de projet fournie en une structure détaillée de tickets et sous-tickets.

    **Projet à planifier :**
    Nom: "${projectName}"
    Description: "${projectDescription}"
    
    **Contraintes de Rédaction Essentielles :**

    Format Strict et Obligatoire :
    - Chaque ticket principal (epic) doit avoir un titre commençant par un emoji suivi de "EPIC [Num] - [Titre]"
    - La description de chaque epic doit commencer par "Objectif : " suivi d'un texte explicatif
    - Les sous-tickets doivent avoir un format "Ticket [Num Epic].[Num Ticket] ([Type]) : [Titre]"
    - Privilégier les descriptions détaillées sous forme de liste à puces (-)

    Types de Fonctionnalités à Couvrir :
    1. **Core Features** : Fonctionnalités principales spécifiques au projet décrit
    2. **Authentification** : Système de login/signup, gestion des sessions, profils utilisateurs
    3. **Abonnements/Paiements** : Plans d'abonnement, intégration de paiement, gestion des factures 
    4. **Features Transversales** : Notifications, préférences utilisateur, thèmes, internationalisation

    Focus Exclusif Frontend React :
    - Décrire uniquement ce qui se passe dans le navigateur, côté client
    - Se concentrer sur les composants React, leur état, les interactions utilisateur et la navigation
    
    API comme Boîte Noire Externe :
    - Décrire les API uniquement du point de vue du frontend
    - Inclure la méthode HTTP, l'URL, les données envoyées/reçues et comment l'interface réagit

    Spécificité React :
    - Mentionner explicitement les noms des composants React et hooks à utiliser
    
    Types de Tickets Restreints :
    - Utiliser uniquement les types suivants : (React), (API Intégration), (React UI), (React Routing), (React State/Context), (Frontend Best Practices), (Auth), (Subscription), (UX/UI)
    
    **Structure à produire :**
    
    Prépare exactement 7-9 tickets principaux (EPIC), dont :
    - 4-5 EPICs pour les Core Features du projet
    - 1-2 EPICs pour l'authentification et profil utilisateur
    - 1 EPIC pour les abonnements et paiements (si pertinent pour le projet)
    - 1-2 EPICs pour les fonctionnalités transversales (notifications, préférences, etc.)
    
    Chaque EPIC devrait contenir 4-6 sous-tickets.
    
    TRÈS IMPORTANT: Tu dois générer AU MINIMUM 10 tickets au total (EPICs + sous-tickets).
    
    Pour chaque ticket principal (EPIC) :
    - Un titre au format "[Emoji] EPIC [Num] - [Titre]"
    - Une description débutant par "Objectif : " 
    - Un statut qui DOIT être "To Do"
    - Une priorité (1 à 3, où 1 est la plus élevée)
    
    Pour chaque sous-ticket :
    - Un titre spécifique au format "Ticket [Num Epic].[Num Ticket] ([Type]) : [Titre]"
    - Une description détaillée incluant :
      * Le composant React à créer/modifier
      * Les props nécessaires et l'état géré
      * Les interactions utilisateur
      * L'appel API exact si pertinent
      * Comment l'UI réagit
      * Les éléments UI clés et bibliothèques suggérées
    - Un statut qui DOIT être "To Do"
    - Une priorité (1 à 3)
    
    **Format de sortie (JSON) :**
    [
      {
        "title": "[Emoji] EPIC 1 - [Fonctionnalité principale]",
        "description": "Objectif : Description détaillée de cette fonctionnalité majeure...",
        "status": "To Do",
        "priority": 1,
        "subTickets": [
          {
            "title": "Ticket 1.1 (React UI) : Développer [composant spécifique]",
            "description": "- Crée le composant React \`ComposantName\`\\n- Utilise useState pour gérer l'état X\\n- Implemente les interactions utilisateur suivantes...\\n- Appelle l'API \`GET /api/resource\`\\n- Affiche les données avec une UI responsive\\n- Utilise la bibliothèque X pour Y",
            "status": "To Do",
            "priority": 2
          },
          {
            "title": "Ticket 1.2 (API Intégration) : Intégrer [autre aspect]",
            "description": "Description technique détaillée...",
            "status": "To Do",
            "priority": 1
          }
        ]
      }
    ]
    
    IMPORTANT :
    - Tous les tickets et sous-tickets DOIVENT avoir le statut "To Do"
    - Les titres des tickets principaux DOIVENT commencer par un emoji puis "EPIC [Num] - "
    - Les titres des sous-tickets DOIVENT suivre le format "Ticket [Num Epic].[Num Ticket] ([Type]) : [Titre]"
    - Les descriptions DOIVENT être en français et inclure des puces (-)
    - Les descriptions DOIVENT être suffisamment détaillées pour qu'une IA génératrice de code puisse implémenter la fonctionnalité
    - N'inclus PAS d'autres informations que le JSON demandé dans ta réponse
  `

  try {
    const response = await generateWithGemini(prompt)
    
    // Nettoyer la réponse de tout texte supplémentaire et garder uniquement le JSON
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Erreur: Impossible de trouver le JSON dans la réponse de Gemini");
      return [];
    }
    
    const cleanJson = jsonMatch[0];
    const tickets = JSON.parse(cleanJson);
    
    // S'assurer que tous les tickets sont en statut "To Do"
    return tickets.map((ticket: any) => {
      // Forcer le statut "To Do" pour tous les tickets
      ticket.status = "To Do";
      
      // Assurer une priorité valide
      if (!ticket.priority || ticket.priority < 1 || ticket.priority > 3) {
        ticket.priority = Math.floor(Math.random() * 3) + 1;
      }
      
      // Traiter les sous-tickets
      if (ticket.subTickets && Array.isArray(ticket.subTickets)) {
        ticket.subTickets = ticket.subTickets.map((subTicket: any) => {
          subTicket.status = "To Do";
          
          if (!subTicket.priority || subTicket.priority < 1 || subTicket.priority > 3) {
            subTicket.priority = Math.floor(Math.random() * 3) + 1;
          }
          
          return subTicket;
        });
      } else {
        ticket.subTickets = [];
      }
      
      return ticket;
    });
  } catch (error) {
    console.error("Erreur lors de la génération des tickets de projet:", error);
    return [];
  }
}

// Fonction pour générer des tickets de projet avec format strict
export async function generateProjectTicketsFormatted(
  projectName: string,
  projectDescription: string
): Promise<string> {
  const prompt = `
    Tu es un assistant expert en planification de projets React, spécialisé dans la création de tickets suivant un format strict. Tu dois décomposer la description de projet fournie en une structure détaillée d'epics et de tickets.

    **Projet à planifier :**
    Nom: "${projectName}"
    Description: "${projectDescription}"
    
    **Contraintes de Rédaction Essentielles :**

    Format Strict et Obligatoire :
    - Utiliser exactement la structure : [Emoji] EPIC [Num] – [Titre] suivi de Objectif : [Description].
    - Puis, pour chaque ticket : Ticket [Num Epic].[Num Ticket] ([Type]) : [Titre] suivi de descriptions détaillées sous forme de liste à puces (-).
    - Aucune déviation de ce format (majuscules, tirets, parenthèses, emojis, retours à la ligne).

    Focus Exclusif Frontend React :
    - Décrire uniquement ce qui se passe dans le navigateur, côté client.
    - Se concentrer sur les composants React, leur état, les interactions utilisateur (clics, formulaires), l'affichage des données et la navigation (React Router).

    API comme Boîte Noire Externe :
    - Ne JAMAIS décrire l'implémentation du backend, de la base de données ou de la logique interne de l'API.
    - Décrire les appels API du point de vue du frontend :
      * Quelle méthode HTTP et quelle URL (hypothétique mais cohérente, ex: GET /api/users/me/profile) sont appelées ?
      * Quelles données clés sont envoyées (si POST/PUT) ?
      * Quelles données clés sont attendues en retour ?
      * Comment l'interface React réagit à la réponse (mise à jour de l'état, affichage, redirection) ?
      * Inclure la gestion des états de chargement et d'erreur liés aux appels API.

    Spécificité React :
    - Mentionner explicitement les noms des composants React à créer ou modifier (ex: UserProfileCard).
    - Décrire l'utilisation de hooks React si pertinent (useState, useEffect...).
    - Indiquer si une gestion d'état globale (Context API, Zustand, Redux Toolkit) ou une navigation (React Router) est nécessaire.

    Types de Tickets Restreints :
    - Utiliser uniquement les types suivants entre parenthèses : (React), (API Intégration), (React UI), (React Routing), (React State/Context), (Frontend Best Practices).

    Langage Clair et Actionnable :
    - Utiliser des verbes d'action clairs (Créer, Afficher, Gérer, Appeler, Mettre à jour, Configurer...).
    - Être précis et non ambigu.
    - Décomposer suffisamment les tâches pour qu'un ticket représente une unité de travail logique.

    Détails UI Pertinents :
    - Mentionner les éléments d'interface utilisateur importants (boutons, formulaires, listes, graphiques, modales, toasts...).
    - Suggérer des bibliothèques spécifiques (ex: Recharts pour les graphiques, react-toastify pour les notifications, Axios pour les appels API) si cela aide à la clarté.
    
    **Structure à produire :**
    
    - Créer 4-5 EPICS principaux
    - Chaque EPIC doit avoir 4-5 tickets
    - Chaque EPIC doit avoir un emoji thématique approprié
    - Les tickets doivent aller des fonctionnalités core aux fonctionnalités plus générales
    - Les tickets doivent couvrir: inscription, connexion, modification de compte, dashboard, présentation du projet, etc.
    
    **Ton output doit être EXACTEMENT dans ce format:**
    
    [Emoji] EPIC 1 – [Titre Epic 1]
    Objectif : [Description Epic 1]
    
    Ticket 1.1 ([Type]) : [Titre Ticket 1.1]
    - [Point détaillé 1]
    - [Point détaillé 2]
    - [Point détaillé 3]
    - [Point détaillé 4]
    - [Point détaillé 5]
    
    Ticket 1.2 ([Type]) : [Titre Ticket 1.2]
    - [Point détaillé 1]
    - [Point détaillé 2]
    - [Point détaillé 3]
    - [Point détaillé 4]
    - [Point détaillé 5]
    
    [Emoji] EPIC 2 – [Titre Epic 2]
    ...etc
    
    IMPORTANT:
    - N'inclus RIEN d'autre dans ta réponse que le format demandé
    - N'inclus PAS d'introduction ou de conclusion
    - N'utilise PAS de numérotation (1., 2., etc.) mais uniquement des tirets (-)
    - Respecte STRICTEMENT le format demandé sans aucune déviation
    - Les descriptions doivent être en français
  `

  try {
    const response = await generateWithGemini(prompt)
    return response
  } catch (error) {
    console.error("Erreur lors de la génération des tickets formatés:", error)
    return "Erreur lors de la génération des tickets formatés. Veuillez réessayer."
  }
}

// Fonction pour créer les tickets dans la base de données
export async function createProjectTicketsInDB(
  projectId: string,
  generatedTickets: any[],
  userId: string
): Promise<boolean> {
  try {
    // Importer supabaseAdmin directement
    const { supabaseAdmin } = await import('@/lib/db');
    
    // Récupérer les statuts de tickets
    const { data: statuses, error: statusError } = await supabaseAdmin
      .from('ticket_statuses')
      .select('id, name');

    if (statusError) {
      console.error('Erreur lors de la récupération des statuts:', statusError);
      return false;
    }

    // Vérifier si les statuts existent, sinon les créer
    let statusMap: Record<string, string> = {};
    
    if (!statuses || statuses.length === 0) {
      console.log('Aucun statut trouvé, création des statuts par défaut...');
      
      // Créer les statuts par défaut
      const defaultStatuses = [
        { name: 'To Do', color: '#4287f5', position: 0 },
        { name: 'In Progress', color: '#f5a742', position: 1 },
        { name: 'Done', color: '#42f569', position: 2 }
      ];
      
      for (const status of defaultStatuses) {
        const { data, error } = await supabaseAdmin
          .from('ticket_statuses')
          .insert(status)
          .select()
          .single();
          
        if (error) {
          console.error(`Erreur lors de la création du statut ${status.name}:`, error);
        } else if (data) {
          statusMap[data.name] = data.id;
        }
      }
      
      // Récupérer à nouveau les statuts après création
      const { data: newStatuses } = await supabaseAdmin
        .from('ticket_statuses')
        .select('id, name');
        
      if (newStatuses && newStatuses.length > 0) {
        statusMap = newStatuses.reduce((acc: Record<string, string>, status: any) => {
          acc[status.name] = status.id;
          return acc;
        }, {});
      } else {
        // Si toujours pas de statuts, on ne peut pas continuer
        console.error('Impossible de créer ou récupérer les statuts de tickets');
        return false;
      }
    } else {
      // Utiliser les statuts existants
      statusMap = statuses.reduce((acc: Record<string, string>, status: any) => {
        acc[status.name] = status.id;
        return acc;
      }, {});
    }
    
    console.log('Statuts disponibles:', Object.keys(statusMap));

    // Fonction pour créer un ticket dans la base de données
    const createTicket = async (
      ticket: any,
      parentId: string | null = null,
      position: number
    ) => {
      // Déterminer le statut ID à partir du nom
      const defaultStatusId = statusMap['To Do'] || Object.values(statusMap)[0];
      const statusId = ticket.status && statusMap[ticket.status] 
        ? statusMap[ticket.status]
        : defaultStatusId;

      if (!statusId) {
        console.error('Aucun statut valide trouvé pour le ticket:', ticket.title);
        return null;
      }

      // Créer le ticket avec les champs requis
      const { data, error } = await supabaseAdmin.from('tickets').insert({
        title: ticket.title,
        description: ticket.description,
        project_id: projectId,
        status_id: statusId,
        priority: ticket.priority || 2,
        position: position,
        parent_ticket_id: parentId,
        is_sub_ticket: parentId !== null,
        created_by: userId,  // Ajouter l'ID de l'utilisateur
      }).select().single();

      if (error) {
        console.error('Erreur lors de la création du ticket:', error);
        throw error;
      }

      return data;
    };

    // Traiter tous les tickets principaux
    const createdTickets = [];
    for (let i = 0; i < generatedTickets.length; i++) {
      const ticket = generatedTickets[i];
      try {
        // Créer le ticket principal
        const mainTicket = await createTicket(ticket, null, i);
        
        if (mainTicket) {
          // Traiter les sous-tickets si présents
          if (ticket.subTickets && Array.isArray(ticket.subTickets) && ticket.subTickets.length > 0) {
            for (let j = 0; j < ticket.subTickets.length; j++) {
              const subTicket = ticket.subTickets[j];
              // Assurer que le sous-ticket a le même statut que le ticket parent par défaut
              if (!subTicket.status) {
                subTicket.status = ticket.status || 'To Do';
              }
              await createTicket(subTicket, mainTicket.id, j);
            }
          }
          
          createdTickets.push(mainTicket);
        }
      } catch (ticketError) {
        console.error(`Erreur lors de la création du ticket ${i + 1}:`, ticketError);
        // Continuer avec les autres tickets même si un échoue
      }
    }

    console.log(`${createdTickets.length} tickets créés avec succès`);
    return createdTickets.length > 0;
  } catch (error) {
    console.error("Erreur lors de la création des tickets dans la base de données:", error)
    return false
  }
}
