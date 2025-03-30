import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

// Route alternative pour initialiser la base de données
export async function GET() {
  try {
    console.log('Starting database initialization...');
    await initDatabase();
    console.log('Database initialization completed successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Database initialized successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to initialize database',
      error: String(error)
    }, { status: 500 });
  }
}
