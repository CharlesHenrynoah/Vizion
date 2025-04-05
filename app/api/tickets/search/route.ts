import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth/auth-options';

// GET /api/tickets/search - Rechercher des tickets d'un projet
export async function GET(request: NextRequest) {
  try {
    // Vérifier si l'utilisateur est authentifié
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer les paramètres de la requête
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const query = searchParams.get('query') || '';

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID de projet manquant' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a accès au projet
    const { data: projectAccess, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('is_active', true)
      .or(`owner_id.eq.${session.user.id},id.in.(select project_id from project_members where user_id = '${session.user.id}')`)
      .maybeSingle();

    if (projectError || !projectAccess) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou non autorisé' },
        { status: 404 }
      );
    }

    // Obtenir tous les statuts pour le mapping
    const { data: statuses, error: statusError } = await supabaseAdmin
      .from('ticket_statuses')
      .select('id, name');

    if (statusError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des statuts' },
        { status: 500 }
      );
    }

    // Créer un mapping des IDs de statut vers leurs noms
    const statusMap = statuses.reduce((acc: Record<string, string>, status) => {
      acc[status.id] = status.name;
      return acc;
    }, {});

    // Construire la requête de recherche de tickets
    let ticketsQuery = supabaseAdmin
      .from('tickets')
      .select(`
        id, title, description, status_id, priority, 
        position, is_sub_ticket, parent_ticket_id,
        created_at, updated_at, due_date
      `)
      .eq('project_id', projectId);

    // Ajouter le filtrage par texte si une requête est fournie
    if (query) {
      ticketsQuery = ticketsQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    // Exécuter la requête
    const { data: tickets, error: ticketsError } = await ticketsQuery;

    if (ticketsError) {
      return NextResponse.json(
        { error: 'Erreur lors de la recherche des tickets' },
        { status: 500 }
      );
    }

    // Formatter les tickets avec le nom du statut
    const formattedTickets = tickets.map(ticket => ({
      ...ticket,
      status_name: statusMap[ticket.status_id]
    }));

    return NextResponse.json({
      tickets: formattedTickets,
      statusMap,
      count: formattedTickets.length
    });
  } catch (error) {
    console.error('Erreur lors de la recherche des tickets:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la recherche des tickets' },
      { status: 500 }
    );
  }
}
