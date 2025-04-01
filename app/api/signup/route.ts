import { NextResponse } from 'next/server';
import { createUser } from '@/app/actions';

// Password validation regex - at least 8 characters, 1 number, 1 symbol
const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-zA-Z]).{8,}$/;
// Name validation regex - only letters, apostrophes, and hyphens
const nameRegex = /^[a-zA-ZÀ-ÿ'-]+$/;
// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;
    
    // Validate the input data
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Validate first name format
    if (!nameRegex.test(firstName)) {
      return NextResponse.json(
        { success: false, message: 'First name can only contain letters, apostrophes, and hyphens' },
        { status: 400 }
      );
    }
    
    // Validate last name format
    if (!nameRegex.test(lastName)) {
      return NextResponse.json(
        { success: false, message: 'Last name can only contain letters, apostrophes, and hyphens' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Validate password complexity
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long and include a number and symbol' },
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
        { success: false, message: result.error },
        { status: 400 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      { success: true, message: 'User registered successfully', user: result.user },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
