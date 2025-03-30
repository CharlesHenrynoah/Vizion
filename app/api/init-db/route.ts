import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

// Endpoint pour initialiser la base de données manuellement
export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({ message: 'Database initialized successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { message: 'Failed to initialize database', error: String(error) },
      { status: 500 }
    );
  }
}
