import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets, ticketStatuses } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

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
    const projectTickets = await db.select().from(tickets)
      .where(eq(tickets.projectId, parseInt(projectId)));

    // Récupérer les statuts de tickets pour organiser les colonnes
    const statuses = await db.select().from(ticketStatuses).orderBy(ticketStatuses.position);

    // Organiser les tickets par statut
    const ticketsByStatus = statuses.map(status => ({
      id: `column-${status.id}`,
      title: status.name,
      tickets: projectTickets
        .filter(ticket => ticket.statusId === status.id && !ticket.isSubTicket)
        .map(ticket => {
          // Trouver les sous-tickets pour ce ticket
          const subTickets = projectTickets.filter(t => 
            t.isSubTicket && t.parentTicketId === ticket.id
          );
          
          return {
            ...ticket,
            id: ticket.id.toString(),
            subTickets: subTickets.map(st => ({
              ...st,
              id: st.id.toString(),
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
    const newTicket = await db.insert(tickets).values({
      title,
      description,
      projectId: parseInt(projectId),
      statusId: parseInt(statusId),
      createdBy: parseInt(session.user.id),
      isSubTicket: isSubTicket || false,
      parentTicketId: parentTicketId ? parseInt(parentTicketId) : null,
    }).returning();

    return NextResponse.json(newTicket[0]);
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

    // Préparer les données à mettre à jour
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (statusId !== undefined) updateData.statusId = parseInt(statusId);
    if (position !== undefined) updateData.position = position;

    // Mettre à jour le ticket
    const updatedTicket = await db.update(tickets)
      .set(updateData)
      .where(eq(tickets.id, parseInt(id)))
      .returning();

    if (updatedTicket.length === 0) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    return NextResponse.json(updatedTicket[0]);
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de ticket requis' }, { status: 400 });
    }

    // Supprimer le ticket
    const deletedTicket = await db.delete(tickets)
      .where(eq(tickets.id, parseInt(id)))
      .returning();

    if (deletedTicket.length === 0) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Ticket supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du ticket:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
