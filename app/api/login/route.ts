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
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Authenticate the user
    const result = await authenticateUser(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 401 }
      );
    }
    
    // Generate a JWT token
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    // Create the response with the success data
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Login successful', 
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name
        }
      },
      { status: 200 }
    );
    
    // Set the cookie on the response object
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
