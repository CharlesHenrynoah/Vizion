import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/auth-options';

// GET /api/projects - Récupérer tous les projets de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      // Récupérer les projets dont l'utilisateur est propriétaire
      const { data: ownedProjects, error: ownedError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_active', true);

      if (ownedError) {
        console.error('Erreur lors de la récupération des projets:', ownedError);
        throw ownedError;
      }

      // Récupérer les projets dont l'utilisateur est membre
      const { data: memberProjects, error: memberError } = await supabaseAdmin
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('user_id', userId)
        .eq('projects.is_active', true);

      if (memberError) {
        console.error('Erreur lors de la récupération des projets membres:', memberError);
        throw memberError;
      }

      // Combiner les projets (en évitant les doublons)
      const allProjects = [
        ...(ownedProjects || []),
        ...(memberProjects || []).map(mp => mp.projects)
      ];

      // Éliminer les doublons
      const uniqueProjects = Array.from(
        new Map(allProjects.map(project => [project.id, project])).values()
      );

      return NextResponse.json(uniqueProjects);
    } catch (dbError) {
      console.error('Erreur lors de la récupération des projets:', dbError);
      return NextResponse.json([], { status: 200 }); // Retourner un tableau vide en cas d'erreur
    }
  } catch (error) {
    console.error('Erreur serveur lors de la récupération des projets:', error);
    return NextResponse.json([], { status: 200 }); // Retourner un tableau vide en cas d'erreur
  }
}

// POST /api/projects - Créer un nouveau projet
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name required' }, { status: 400 });
    }

    try {
      // Log user ID for debugging
      console.log('Creating project with user ID:', session.user.id);
      console.log('User ID type:', typeof session.user.id);
      
      // Create project with Supabase
      const { data: newProject, error } = await supabaseAdmin
        .from('projects')
        .insert({
          name,
          description: description || '',
          owner_id: String(session.user.id), // Ensure ID is a string
          color: color || '#3b82f6',
          icon: icon || 'clipboard',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      // Log successful project creation
      console.log('Project created successfully:', newProject);
      
      return NextResponse.json(newProject);
    } catch (dbError) {
      console.error('Database error while creating project:', dbError);
      return NextResponse.json({ error: 'Error creating project' }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error while creating project:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/projects - Mettre à jour un projet
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, color, icon } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de projet requis' }, { status: 400 });
    }

    try {
      // Vérifier que l'utilisateur est le propriétaire du projet
      const { data: projectData, error: getError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (getError || !projectData) {
        return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
      }

      if (projectData.owner_id !== session.user.id.toString()) {
        // Vérifier si l'utilisateur est au moins membre avec des privilèges d'édition
        const { data: memberData, error: memberError } = await supabaseAdmin
          .from('project_members')
          .select('*')
          .eq('project_id', id)
          .eq('user_id', session.user.id.toString())
          .in('role', ['admin', 'owner'])
          .single();

        if (memberError || !memberData) {
          return NextResponse.json({ error: 'Non autorisé à modifier ce projet' }, { status: 403 });
        }
      }

      // Mettre à jour le projet
      const { data: updatedProject, error: updateError } = await supabaseAdmin
        .from('projects')
        .update({
          name: name || projectData.name,
          description: description !== undefined ? description : projectData.description,
          color: color || projectData.color,
          icon: icon || projectData.icon,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Erreur lors de la mise à jour du projet:', updateError);
        throw updateError;
      }

      return NextResponse.json(updatedProject);
    } catch (dbError) {
      console.error('Erreur de base de données lors de la mise à jour du projet:', dbError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du projet' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erreur serveur lors de la mise à jour du projet:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects - Supprimer un projet
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de projet requis' }, { status: 400 });
    }

    try {
      // Vérifier que l'utilisateur est le propriétaire du projet
      const { data: projectData, error: getError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (getError || !projectData) {
        return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
      }

      if (projectData.owner_id !== session.user.id.toString()) {
        return NextResponse.json({ error: 'Non autorisé à supprimer ce projet' }, { status: 403 });
      }

      // Supprimer le projet (soft delete)
      const { error: deleteError } = await supabaseAdmin
        .from('projects')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteError) {
        console.error('Erreur lors de la suppression du projet:', deleteError);
        throw deleteError;
      }

      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Erreur de base de données lors de la suppression du projet:', dbError);
      return NextResponse.json({ error: 'Erreur lors de la suppression du projet' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erreur serveur lors de la suppression du projet:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
