import { NextResponse } from 'next/server';
import { createUser } from '@/app/actions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;
    
    // Validate the input data
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Use the server action to create the user
    const result = await createUser({
      firstName,
      lastName,
      email,
      password,
    });
    
    if (result.error) {
      return NextResponse.json(
        { message: result.error },
        { status: 400 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      { message: 'User registered successfully', user: result.user },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
