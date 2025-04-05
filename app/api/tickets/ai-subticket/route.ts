import { NextRequest, NextResponse } from "next/server";
import { generateSubTicketWithAI } from "@/app/actions/gemini-integration";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { supabaseAdmin } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Route pour générer un sous-ticket avec IA
export async function POST(req: NextRequest) {
  try {
    console.log("Début du traitement de la requête API de création de sous-ticket");
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("Erreur d'authentification: Utilisateur non authentifié");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    
    console.log("Utilisateur authentifié:", session.user.email);

    // Récupérer les données de la requête
    const requestData = await req.json();
    console.log("Données reçues dans l'API de création:", {
      epicId: requestData.epicId,
      epicTitle: requestData.epicTitle,
      generatedSubTicket: requestData.generatedSubTicket ? "présent" : "absent"
    });
    
    const { epicId, epicTitle, epicDescription, subTicketDescription, generatedSubTicket } = requestData;

    if (!epicId || !epicTitle || !subTicketDescription) {
      console.error("Données manquantes:", { epicId, epicTitle, subTicketDescription });
      return NextResponse.json(
        { error: "epicId, epicTitle et subTicketDescription sont requis" },
        { status: 400 }
      );
    }

    // Utiliser le sous-ticket déjà généré ou en générer un nouveau
    let ticketToCreate;
    if (generatedSubTicket) {
      console.log("Utilisation d'un sous-ticket déjà généré");
      ticketToCreate = generatedSubTicket;
    } else {
      console.log("Génération d'un nouveau sous-ticket avec l'IA");
      // Générer le sous-ticket avec l'IA
      ticketToCreate = await generateSubTicketWithAI(
        epicTitle,
        epicDescription || "",
        subTicketDescription
      );

      if (!ticketToCreate) {
        console.error("Échec de la génération du sous-ticket avec l'IA");
        return NextResponse.json(
          { error: "Erreur lors de la génération du sous-ticket" },
          { status: 500 }
        );
      }
    }
    
    console.log("Sous-ticket à créer:", {
      title: ticketToCreate.title,
      priority: ticketToCreate.priority,
      descriptionLength: ticketToCreate.description?.length || 0
    });

    // Récupérer les détails du ticket parent (epic)
    console.log("Récupération des détails du ticket parent (epic):", epicId);
    const { data: parentTicket, error: parentTicketError } = await supabaseAdmin
      .from("tickets")
      .select("id, status_id, project_id, sub_tickets_count")
      .eq("id", epicId)
      .single();

    if (parentTicketError || !parentTicket) {
      console.error("Ticket parent non trouvé:", parentTicketError);
      return NextResponse.json(
        { error: "Ticket parent non trouvé" },
        { status: 404 }
      );
    }
    
    console.log("Ticket parent trouvé:", {
      id: parentTicket.id,
      project_id: parentTicket.project_id,
      sub_tickets_count: parentTicket.sub_tickets_count || 0
    });

    // Déterminer l'index du nouveau sous-ticket
    const subTicketsCount = parentTicket.sub_tickets_count || 0;
    const newSubTicketIndex = subTicketsCount + 1;

    // Ajuster le titre avec le bon numéro de sous-ticket
    const titleWithCorrectIndex = ticketToCreate.title.replace(
      /\.X\s/i,
      `.${newSubTicketIndex} `
    );
    
    console.log("Titre ajusté:", titleWithCorrectIndex);

    // Créer le sous-ticket dans la base de données
    console.log("Création du sous-ticket dans la base de données");
    const insertData = {
      title: titleWithCorrectIndex,
      description: ticketToCreate.description,
      project_id: parentTicket.project_id,
      status_id: parentTicket.status_id,
      priority: ticketToCreate.priority || 2,
      position: subTicketsCount,
      parent_ticket_id: epicId,
      is_sub_ticket: true,
      created_by: session.user.id,
    };
    
    console.log("Données d'insertion:", insertData);
    
    try {
      const { data: createdSubTicket, error } = await supabaseAdmin
        .from("tickets")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de la création du sous-ticket dans Supabase:", error);
        return NextResponse.json(
          { error: `Erreur lors de la création du sous-ticket: ${error.message}` },
          { status: 500 }
        );
      }

      if (!createdSubTicket) {
        console.error("Aucun sous-ticket créé mais pas d'erreur retournée");
        return NextResponse.json(
          { error: "Échec de la création du sous-ticket" },
          { status: 500 }
        );
      }
      
      console.log("Sous-ticket créé avec succès:", createdSubTicket.id);
      return NextResponse.json(createdSubTicket);
    } catch (insertError) {
      console.error("Exception lors de l'insertion du sous-ticket:", insertError);
      return NextResponse.json(
        { error: "Exception lors de la création du sous-ticket" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Exception générale dans l'API de génération de sous-ticket:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
