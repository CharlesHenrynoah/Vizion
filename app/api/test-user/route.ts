import { NextResponse } from 'next/server';
import { createUser } from '@/app/actions';

export async function GET(request: Request) {
  try {
    // Création d'un utilisateur de test
    const testUser = {
      firstName: "Test",
      lastName: "User",
      email: `test${Date.now()}@example.com`, // Email unique à chaque fois
      password: "Password123!"
    };
    
    console.log('Tentative de création d\'un utilisateur de test:', testUser);
    
    const result = await createUser(testUser);
    
    if (result.error) {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Utilisateur de test créé avec succès',
      user: result.user
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création d\'un utilisateur de test:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur de test',
      error: String(error)
    }, { status: 500 });
  }
}
