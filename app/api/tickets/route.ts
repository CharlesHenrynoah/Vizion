import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/auth-options';

// GET /api/tickets - Récupérer tous les tickets d'un projet
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'ID de projet requis' }, { status: 400 });
    }

    // Récupérer les tickets du projet
    const { data: projectTickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('project_id', projectId);

    if (ticketsError) {
      console.error('Erreur lors de la récupération des tickets:', ticketsError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des tickets' }, { status: 500 });
    }

    // Récupérer les statuts de tickets pour organiser les colonnes
    const { data: statuses, error: statusesError } = await supabaseAdmin
      .from('ticket_statuses')
      .select('*')
      .order('position');

    if (statusesError) {
      console.error('Erreur lors de la récupération des statuts:', statusesError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des statuts' }, { status: 500 });
    }

    // Organiser les tickets par statut
    const ticketsByStatus = statuses.map(status => ({
      id: `column-${status.id}`,
      title: status.name,
      tickets: projectTickets
        .filter(ticket => ticket.status_id === status.id && !ticket.is_sub_ticket)
        .map(ticket => {
          // Trouver les sous-tickets pour ce ticket
          const subTickets = projectTickets.filter(t => 
            t.is_sub_ticket && t.parent_ticket_id === ticket.id
          );
          
          return {
            ...ticket,
            id: ticket.id.toString(),
            statusId: ticket.status_id,
            projectId: ticket.project_id,
            assignedTo: ticket.assigned_to,
            createdBy: ticket.created_by,
            isSubTicket: ticket.is_sub_ticket,
            parentTicketId: ticket.parent_ticket_id,
            subTickets: subTickets.map(st => ({
              ...st,
              id: st.id.toString(),
              statusId: st.status_id,
              projectId: st.project_id,
              assignedTo: st.assigned_to,
              createdBy: st.created_by,
              isSubTicket: st.is_sub_ticket,
              parentTicketId: st.parent_ticket_id,
            }))
          };
        })
    }));

    return NextResponse.json(ticketsByStatus);
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/tickets - Créer un nouveau ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, projectId, statusId, parentTicketId, isSubTicket } = body;

    if (!title || !projectId || !statusId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Créer le ticket
    const { data: newTicket, error } = await supabaseAdmin
      .from('tickets')
      .insert({
        title,
        description,
        project_id: projectId,
        status_id: statusId,
        created_by: session.user.id,
        is_sub_ticket: isSubTicket || false,
        parent_ticket_id: parentTicketId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du ticket:', error);
      return NextResponse.json({ error: 'Erreur lors de la création du ticket' }, { status: 500 });
    }

    return NextResponse.json(newTicket);
  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/tickets - Mettre à jour un ticket
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, statusId, position } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de ticket requis' }, { status: 400 });
    }

    // Mettre à jour le ticket
    const { data: updatedTicket, error } = await supabaseAdmin
      .from('tickets')
      .update({
        title,
        description,
        status_id: statusId,
        position,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du ticket:', error);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du ticket' }, { status: 500 });
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du ticket:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/tickets - Supprimer un ticket
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('id');

    if (!ticketId) {
      return NextResponse.json({ error: 'ID de ticket requis' }, { status: 400 });
    }

    // Vérifier si le ticket a des sous-tickets
    const { data: subTickets } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('parent_ticket_id', ticketId);

    if (subTickets && subTickets.length > 0) {
      // Supprimer d'abord les sous-tickets
      const { error: subTicketsError } = await supabaseAdmin
        .from('tickets')
        .delete()
        .eq('parent_ticket_id', ticketId);

      if (subTicketsError) {
        console.error('Erreur lors de la suppression des sous-tickets:', subTicketsError);
        return NextResponse.json({ error: 'Erreur lors de la suppression des sous-tickets' }, { status: 500 });
      }
    }

    // Supprimer le ticket
    const { error } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) {
      console.error('Erreur lors de la suppression du ticket:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression du ticket' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du ticket:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
