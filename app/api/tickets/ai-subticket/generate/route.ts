import { generateSubTicketWithAI } from "@/app/actions/gemini-integration";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Route pour générer un sous-ticket avec IA sans le créer (prévisualisation)
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les données de la requête
    const requestData = await req.json();
    console.log("Données reçues dans l'API:", JSON.stringify(requestData));
    
    const { epicId, epicTitle, epicDescription, subTicketDescription } = requestData;

    if (!epicId || !epicTitle || !subTicketDescription) {
      console.error("Données manquantes:", { epicId, epicTitle, subTicketDescription });
      return NextResponse.json(
        { error: "epicId, epicTitle et subTicketDescription sont requis" },
        { status: 400 }
      );
    }

    // Générer le sous-ticket avec l'IA (sans le créer dans la base de données)
    const generatedSubTicket = await generateSubTicketWithAI(
      epicTitle,
      epicDescription || "",
      subTicketDescription
    );

    if (!generatedSubTicket) {
      console.error("Échec de génération du sous-ticket avec l'IA");
      return NextResponse.json(
        { error: "Erreur lors de la génération du sous-ticket" },
        { status: 500 }
      );
    }

    console.log("Sous-ticket généré avec succès:", JSON.stringify(generatedSubTicket));
    
    // Retourner le sous-ticket généré pour prévisualisation
    return NextResponse.json(generatedSubTicket);
    
  } catch (error) {
    console.error("Erreur dans l'API de génération de sous-ticket (prévisualisation):", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
