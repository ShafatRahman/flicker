import { NextResponse } from 'next/server';

// This route is no longer needed with Supabase Storage
// Client uploads directly to Supabase
// Keeping for potential future use or custom upload handling

export async function POST() {
  return NextResponse.json(
    { message: 'Direct uploads to Supabase Storage are used instead' },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
