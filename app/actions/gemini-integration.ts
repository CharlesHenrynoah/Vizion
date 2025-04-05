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
    - Mentionner explicitement les noms des composants React à utiliser
    
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
    let processedTickets = tickets.map((ticket: any) => {
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
    
    // Réorganiser les tickets pour que les épics d'authentification et profil utilisateur soient toujours en dernier
    const authAndProfileEpics: any[] = [];
    const otherEpics: any[] = [];
    
    processedTickets.forEach((ticket: any) => {
      // Vérifier si le ticket est lié à l'authentification ou au profil utilisateur
      if (
        ticket.title.toLowerCase().includes("auth") || 
        ticket.title.toLowerCase().includes("authentification") ||
        ticket.title.toLowerCase().includes("login") || 
        ticket.title.toLowerCase().includes("connexion") ||
        ticket.title.toLowerCase().includes("profil") ||
        ticket.title.toLowerCase().includes("profile") ||
        ticket.title.toLowerCase().includes("utilisateur") ||
        ticket.title.toLowerCase().includes("user") ||
        ticket.title.toLowerCase().includes("préférences") ||
        ticket.title.toLowerCase().includes("preferences") ||
        ticket.description.toLowerCase().includes("authentification") ||
        ticket.description.toLowerCase().includes("profil utilisateur")
      ) {
        authAndProfileEpics.push(ticket);
      } else {
        otherEpics.push(ticket);
      }
    });
    
    // Combiner les deux listes avec les épics d'authentification et profil en dernier
    return [...otherEpics, ...authAndProfileEpics];
  } catch (error) {
    console.error("Erreur lors du parsing des tickets de projet:", error)
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
        { name: 'In Progress', color: '#f5a142', position: 1 },
        { name: 'Done', color: '#42f545', position: 2 },
      ];
      
      for (const status of defaultStatuses) {
        const { data, error } = await supabaseAdmin
          .from('ticket_statuses')
          .insert(status)
          .select();
          
        if (error) {
          console.error('Erreur lors de la création du statut:', error);
          return false;
        }
        
        if (data && data[0]) {
          statusMap[status.name] = data[0].id;
        }
      }
    } else {
      // Créer une map des status pour les retrouver facilement
      for (const status of statuses) {
        statusMap[status.name] = status.id;
      }
    }
    
    // Pour chaque ticket principal (epic)
    for (const ticket of generatedTickets) {
      // Déterminer le statut
      const statusId = statusMap[ticket.status] || statusMap['To Do'];
      
      // Créer le ticket principal
      const { data: epicData, error: epicError } = await supabaseAdmin
        .from('tickets')
        .insert({
          title: ticket.title,
          description: ticket.description,
          project_id: projectId,
          status_id: statusId,
          assigned_to: null,
          created_by: userId,
          priority: ticket.priority,
          position: 0
        })
        .select();
        
      if (epicError) {
        console.error('Erreur lors de la création du ticket principal:', epicError);
        continue;
      }
      
      // Si le ticket principal a été créé et qu'il a des sous-tickets
      if (epicData && epicData[0] && ticket.subTickets && ticket.subTickets.length > 0) {
        const epicId = epicData[0].id;
        
        // Pour chaque sous-ticket
        for (let i = 0; i < ticket.subTickets.length; i++) {
          const subTicket = ticket.subTickets[i];
          
          // Déterminer le statut du sous-ticket
          const subTicketStatusId = statusMap[subTicket.status] || statusMap['To Do'];
          
          // Créer le sous-ticket
          const { error: subTicketError } = await supabaseAdmin
            .from('tickets')
            .insert({
              title: subTicket.title,
              description: subTicket.description,
              project_id: projectId,
              status_id: subTicketStatusId,
              assigned_to: null,
              created_by: userId,
              priority: subTicket.priority,
              position: i,
              parent_ticket_id: epicId,
              is_sub_ticket: true
            });
            
          if (subTicketError) {
            console.error('Erreur lors de la création du sous-ticket:', subTicketError);
          }
        }
      }
    }
    
    return true
  } catch (error) {
    console.error("Erreur lors de la création des tickets dans la base de données:", error)
    return false
  }
}

// Fonction pour générer un sous-ticket avec IA
export async function generateSubTicketWithAI(
  epicTitle: string,
  epicDescription: string,
  subTicketDescription: string
): Promise<any> {
  console.log("Génération de sous-ticket avec paramètres:", {
    epicTitle,
    epicDescription: epicDescription ? `${epicDescription.substring(0, 30)}...` : "(vide)",
    subTicketDescription: `${subTicketDescription.substring(0, 30)}...`
  });
  
  // Définir une longueur cible pour les descriptions de tickets
  const TARGET_DESCRIPTION_LENGTH = 500;
  // La limite maximale reste à 800 caractères
  const MAX_DESCRIPTION_LENGTH = 800;
  
  const prompt = `
    Je suis un assistant de gestion de projet et j'ai besoin de générer un sous-ticket technique pertinent 
    pour l'epic suivant: "${epicTitle}". 
    ${epicDescription ? `Description de l'epic: "${epicDescription}"` : ''}
    
    Voici la description du sous-ticket que je veux créer: "${subTicketDescription}"
    
    Génère un sous-ticket technique approprié au format JSON avec les champs suivants:
    - title: Le titre doit suivre ce format exact: "Ticket [Num Epic].X (Domaine) : Description concise". 
      Par exemple "Ticket 1.3 (Frontend) : Implémenter la validation de formulaire"
    - description: Une description technique et actionnable avec des étapes précises
    - priority: Un nombre entre 1 (basse) et 3 (haute) pour représenter la priorité du ticket
    
    IMPORTANT :
    - Le titre DOIT respecter exactement le format spécifié
    - La description DOIT être technique, précise et actionnable
    - La description DOIT faire environ ${TARGET_DESCRIPTION_LENGTH} caractères (entre 450 et 550)
    - La description NE DOIT JAMAIS dépasser ${MAX_DESCRIPTION_LENGTH} caractères
    - Fournis uniquement le JSON demandé, sans aucun texte supplémentaire
  `

  try {
    const response = await generateWithGemini(prompt)
    
    if (!response || response.trim() === '') {
      console.error("Erreur: Réponse vide de Gemini");
      return null;
    }
    
    console.log("Réponse brute de Gemini:", response.substring(0, 100) + "...");
    
    // Analyser la réponse JSON
    let jsonStr = response;
    
    // Si la réponse contient du texte avant ou après le JSON, tenter de l'extraire
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
      console.log("JSON extrait:", jsonStr.substring(0, 100) + "...");
    }
    
    // Tenter de parser le JSON
    let ticketData;
    try {
      ticketData = JSON.parse(jsonStr);
      console.log("Parsing JSON réussi");
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      
      // Tentative de correction du JSON
      try {
        // Remplacer les guillemets simples par des guillemets doubles
        const correctedJson = jsonStr.replace(/'/g, '"');
        ticketData = JSON.parse(correctedJson);
        console.log("Parsing JSON réussi après correction");
      } catch (secondParseError) {
        console.error("Échec de la correction du JSON:", secondParseError);
        console.log("JSON incorrect:", jsonStr);
        
        // Créer un objet par défaut si le parsing échoue
        ticketData = {
          title: `Ticket X.X : ${subTicketDescription.substring(0, 50)}...`,
          description: `Sous-ticket créé à partir de: ${subTicketDescription.substring(0, 400)}`,
          priority: 2
        };
        console.log("Utilisation d'un objet par défaut");
      }
    }
    
    // Vérifier les champs requis
    if (!ticketData.title) {
      console.warn("Titre manquant dans la réponse, création d'un titre par défaut");
      ticketData.title = `Ticket X.X : ${subTicketDescription.substring(0, 50)}...`;
    }
    
    if (!ticketData.description) {
      console.warn("Description manquante dans la réponse, création d'une description par défaut");
      ticketData.description = `Sous-ticket créé à partir de: ${subTicketDescription.substring(0, 400)}`;
    }
    
    // Extraire le numéro d'epic du titre
    const epicNumberMatch = epicTitle.match(/EPIC\s+(\d+)/i);
    const epicNumber = epicNumberMatch ? epicNumberMatch[1] : "X";
    
    // Formater correctement le titre
    ticketData.title = ticketData.title.replace(/\[\d*\]\.X/i, `[${epicNumber}].X`);
    
    // S'assurer que le titre a un format correct
    if (!ticketData.title.match(/Ticket\s+\[\w+\]\.X/i)) {
      console.warn("Format de titre incorrect, correction");
      ticketData.title = `Ticket [${epicNumber}].X : ${ticketData.title.substring(0, 50)}`;
    }
    
    // Assurer les valeurs par défaut
    ticketData.status = "To Do";
    if (!ticketData.priority || ticketData.priority < 1 || ticketData.priority > 3) {
      ticketData.priority = 2;
    }
    
    // Vérifier la longueur de la description
    if (ticketData.description.length > MAX_DESCRIPTION_LENGTH) {
      console.log(`Description trop longue (${ticketData.description.length} caractères), troncature à ${MAX_DESCRIPTION_LENGTH}`);
      ticketData.description = ticketData.description.substring(0, MAX_DESCRIPTION_LENGTH);
    }
    
    // Ajouter une propriété de validation pour éviter les erreurs
    ticketData.valid = true;
    
    console.log("Sous-ticket généré avec succès:", {
      title: ticketData.title,
      priority: ticketData.priority,
      descriptionLength: ticketData.description.length
    });
    
    return ticketData;
  } catch (error) {
    console.error("Erreur lors de la génération du sous-ticket:", error);
    
    // Créer un sous-ticket par défaut en cas d'erreur générale
    const fallbackTicket = {
      title: `Ticket X.X : ${subTicketDescription.substring(0, 50)}...`,
      description: `Sous-ticket créé à partir de: ${subTicketDescription.substring(0, 400)}`,
      priority: 2,
      status: "To Do",
      valid: true
    };
    
    console.log("Utilisation d'un sous-ticket de secours suite à une erreur");
    return fallbackTicket;
  }
}
