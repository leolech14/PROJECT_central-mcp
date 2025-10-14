import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });

  // Clear session cookie
  response.cookies.delete('session');

  return response;
}

export async function GET() {
  return POST();
}
