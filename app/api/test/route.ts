import { NextResponse } from 'next/server';

// Use a different export syntax to ensure it's recognized
export function GET() {
  return NextResponse.json({ 
    message: "Test API route works", 
    time: new Date().toISOString() 
  });
}
