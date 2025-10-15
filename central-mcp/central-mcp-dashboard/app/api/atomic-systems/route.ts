import { NextResponse } from 'next/server';
import { getAtomicSystemsStatus } from '@/src/api/atomic-systems';

export async function GET() {
  try {
    const status = await getAtomicSystemsStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching atomic systems status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch atomic systems status' },
      { status: 500 }
    );
  }
}
