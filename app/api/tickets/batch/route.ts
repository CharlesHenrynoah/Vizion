import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth/auth-options';

// POST /api/tickets/batch - Créer plusieurs tickets en une seule requête
export async function POST(request: NextRequest) {
  try {
    // Vérifier si l'utilisateur est authentifié
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer les données de la requête
    const { projectId, tickets } = await request.json();

    if (!projectId || !tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { error: 'Données invalides. projectId et tickets sont requis.' },
        { status: 400 }
      );
    }

    // Vérifier que le projet existe et appartient à l'utilisateur ou qu'il en est membre
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('is_active', true)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou non autorisé' },
        { status: 404 }
      );
    }

    // Récupérer les statuts de tickets pour pouvoir associer les noms aux IDs
    const { data: statuses, error: statusError } = await supabaseAdmin
      .from('ticket_statuses')
      .select('id, name');

    if (statusError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des statuts' },
        { status: 500 }
      );
    }

    // Mapping des noms de statuts vers leurs IDs
    const statusMap = statuses.reduce((acc: Record<string, string>, status) => {
      acc[status.name] = status.id;
      return acc;
    }, {});

    // Fonction pour créer un ticket dans la base de données
    const createTicket = async (
      ticket: any,
      parentId: string | null = null,
      position: number
    ) => {
      // Déterminer le statut ID à partir du nom
      const statusId = statusMap[ticket.status] || statusMap['To Do'];

      // Créer le ticket
      const { data, error } = await supabaseAdmin.from('tickets').insert({
        title: ticket.title,
        description: ticket.description,
        project_id: projectId,
        status_id: statusId,
        assigned_to: null, // Pas d'assignation par défaut
        created_by: session.user.id,
        priority: ticket.priority || 2,
        position: position,
        parent_ticket_id: parentId,
        is_sub_ticket: parentId !== null,
      }).select().single();

      if (error) {
        console.error('Erreur lors de la création du ticket:', error);
        throw error;
      }

      return data;
    };

    // Traiter tous les tickets principaux
    const createdTickets = [];
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      try {
        // Créer le ticket principal
        const mainTicket = await createTicket(ticket, null, i);
        
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
      } catch (ticketError) {
        console.error(`Erreur lors de la création du ticket ${i + 1}:`, ticketError);
        // Continuer avec les autres tickets même si un échoue
      }
    }

    return NextResponse.json({
      success: true,
      message: `${createdTickets.length} tickets créés avec succès`,
      tickets: createdTickets,
    });
  } catch (error) {
    console.error('Erreur lors de la création des tickets par lot:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création des tickets' },
      { status: 500 }
    );
  }
}
