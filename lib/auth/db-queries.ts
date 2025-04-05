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
    console.log(`Attempting to verify credentials for email: ${email}`);
    
    // Rechercher l'utilisateur par email
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, password, avatar')
      .eq('email', email)
      .maybeSingle(); // Using maybeSingle instead of single to avoid errors when no user is found
    
    console.log('Database query result:', { data, error });

    if (error) {
      console.error('Error querying user:', error);
      throw new Error('Database error during authentication');
    }

    if (!data) {
      console.log('No user found with this email');
      throw new Error('No user found with this email');
    }

    // Vérifier le mot de passe
    console.log('Comparing passwords...');
    const passwordMatch = await compare(password, data.password);
    console.log('Password match result:', passwordMatch);
    
    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    // Retourner les informations de l'utilisateur sans le mot de passe
    console.log('Authentication successful for user:', data.email);
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      image: data.avatar
    };
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof Error) {
      throw error; // Propager l'erreur avec le message spécifique
    }
    throw new Error('Authentication failed');
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
    let userId = profile.id || profile.sub;
    let userName = profile.name;
    let userImage = profile.image || profile.picture || profile.avatar_url;
    
    // Traitement spécifique pour Google
    if (provider === 'google') {
      // Pour Google, l'ID est généralement dans profile.sub
      userId = profile.sub || userId;
      // Google fournit souvent le nom dans des propriétés séparées
      if (profile.given_name && profile.family_name) {
        userName = `${profile.given_name} ${profile.family_name}`;
      }
      // Google fournit l'image dans profile.picture
      userImage = profile.picture || userImage;
      console.log('Informations extraites pour Google:', { userId, userName, userImage, email: profile.email });
    }
    
    // Traitement spécifique pour GitHub
    if (provider === 'github') {
      // GitHub fournit l'ID dans profile.id
      userId = profile.id || userId;
      // GitHub fournit l'image dans profile.avatar_url
      userImage = profile.avatar_url || userImage;
      console.log('Informations extraites pour GitHub:', { userId, userName, userImage, email: profile.email });
    }

    if (!userId) {
      console.error('Aucun ID utilisateur trouvé dans le profil OAuth');
      throw new Error('Aucun ID utilisateur trouvé dans le profil OAuth');
    }

    // D'abord, essayons de trouver l'utilisateur par ID
    const { data: existingUserById, error: idSearchError } = await supabase
      .from('users')
      .select('id, email, name, avatar')
      .eq('id', userId)
      .maybeSingle();

    if (idSearchError) {
      console.error('Erreur lors de la recherche de l\'utilisateur par ID:', idSearchError);
    }

    // Si l'utilisateur existe par ID, le retourner immédiatement
    if (existingUserById) {
      console.log('Utilisateur existant trouvé par ID:', existingUserById);
      return {
        id: existingUserById.id,
        email: existingUserById.email,
        name: existingUserById.name,
        image: existingUserById.avatar
      };
    }

    // Ensuite, essayons de trouver l'utilisateur par email
    const { data: existingUserByEmail, error: emailSearchError } = await supabase
      .from('users')
      .select('id, email, name, avatar')
      .eq('email', profile.email)
      .maybeSingle();

    if (emailSearchError) {
      console.error('Erreur lors de la recherche de l\'utilisateur par email:', emailSearchError);
    }

    // Si l'utilisateur existe par email, mettons à jour son ID pour correspondre à l'ID OAuth
    if (existingUserByEmail) {
      console.log('Utilisateur existant trouvé par email:', existingUserByEmail);
      console.log('Mise à jour de l\'ID utilisateur pour correspondre à l\'ID OAuth:', userId);
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          id: userId,
          name: userName || existingUserByEmail.name,
          avatar: userImage || existingUserByEmail.avatar
        })
        .eq('id', existingUserByEmail.id)
        .select('id, email, name, avatar')
        .single();
        
      if (updateError) {
        console.error('Erreur lors de la mise à jour de l\'ID utilisateur:', updateError);
        
        // Si l'erreur est liée à une contrainte de clé unique, cela signifie probablement
        // qu'un autre utilisateur avec cet ID existe déjà.
        // Dans ce cas, utilisons l'ID existant au lieu d'essayer de le mettre à jour
        if (updateError.code === '23505') {
          console.log('Un autre utilisateur existe avec cet ID OAuth, utilisation de l\'utilisateur existant');
          return {
            id: existingUserByEmail.id,
            email: existingUserByEmail.email,
            name: existingUserByEmail.name,
            image: existingUserByEmail.avatar
          };
        }
        
        throw updateError;
      }
      
      console.log('ID utilisateur mis à jour avec l\'ID OAuth:', updatedUser);
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.avatar
      };
    }

    // Si l'utilisateur n'existe pas du tout, créons-le
    console.log('Création d\'un nouvel utilisateur OAuth avec les données:', {
      id: userId,
      email: profile.email,
      name: userName,
      avatar: userImage,
      provider
    });

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: profile.email,
        name: userName || `${provider} User`,
        avatar: userImage || null,
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