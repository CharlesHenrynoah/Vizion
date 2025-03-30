import { NextResponse } from 'next/server';
import { authenticateUser } from '@/app/actions';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Validate the input data
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Authenticate the user
    const result = await authenticateUser({
      email,
      password,
    });
    
    if (result.error) {
      return NextResponse.json(
        { message: result.error },
        { status: 401 }
      );
    }
    
    // Generate a JWT token
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    // Set the token in a cookie
    (await
          // Set the token in a cookie
          cookies()).set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    // Return success response
    return NextResponse.json(
      { message: 'Login successful', user: result.user },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
