import { compare } from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Créer le client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Vérifie les identifiants de l'utilisateur pour l'authentification
 */
export async function verifyUserCredentials(email: string, password: string) {
  try {
    // Rechercher l'utilisateur par email
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, password, avatar')
      .eq('email', email)
      .single();

    if (error || !data) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', error);
      return null;
    }

    // Vérifier le mot de passe
    const passwordMatch = await compare(password, data.password);
    if (!passwordMatch) {
      return null;
    }

    // Retourner les informations de l'utilisateur sans le mot de passe
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      image: data.avatar
    };
  } catch (error) {
    console.error('Erreur lors de la vérification des identifiants:', error);
    return null;
  }
}

/**
 * Trouve ou crée un utilisateur à partir d'un profil OAuth (GitHub, Google, etc.)
 */
export async function findOrCreateOAuthUser(profile: any, provider: string) {
  try {
    console.log('Profil OAuth reçu:', JSON.stringify(profile, null, 2));
    console.log('Fournisseur:', provider);
    
    // Vérifier que le profil contient un email
    if (!profile.email) {
      console.error('Profil OAuth sans email:', JSON.stringify(profile, null, 2));
      throw new Error('Le profil OAuth ne contient pas d\'email');
    }

    // Extraire les informations du profil en fonction du fournisseur
    let userName = profile.name;
    let userImage = profile.image || profile.picture || profile.avatar_url;
    
    // Traitement spécifique pour Google
    if (provider === 'google') {
      // Google fournit souvent le nom dans des propriétés séparées
      if (profile.given_name && profile.family_name) {
        userName = `${profile.given_name} ${profile.family_name}`;
      }
      // Google fournit l'image dans profile.picture
      userImage = profile.picture || userImage;
      console.log('Informations extraites pour Google:', { userName, userImage, email: profile.email });
    }
    
    // Traitement spécifique pour GitHub
    if (provider === 'github') {
      // GitHub fournit l'image dans profile.avatar_url
      userImage = profile.avatar_url || userImage;
      console.log('Informations extraites pour GitHub:', { userName, userImage, email: profile.email });
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('id, email, name, avatar')
      .eq('email', profile.email)
      .single();

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erreur lors de la recherche de l\'utilisateur:', searchError);
      throw searchError;
    }

    // Si l'utilisateur existe, le retourner
    if (existingUser) {
      console.log('Utilisateur existant trouvé:', existingUser);
      return {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        image: existingUser.avatar
      };
    }

    console.log('Création d\'un nouvel utilisateur OAuth avec les données:', {
      email: profile.email,
      name: userName,
      avatar: userImage,
      provider
    });

    // Sinon, créer un nouvel utilisateur
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: profile.email,
        name: userName || `${provider} User`,
        avatar: userImage || null,
        // Pas de mot de passe pour les utilisateurs OAuth
        password: null,
        is_active: true
      })
      .select('id, email, name, avatar')
      .single();

    if (createError) {
      console.error('Erreur lors de la création de l\'utilisateur:', createError);
      throw createError;
    }

    console.log('Nouvel utilisateur créé avec succès:', newUser);
    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      image: newUser.avatar
    };
  } catch (error) {
    console.error('Erreur dans findOrCreateOAuthUser:', error);
    throw error;
  }
}