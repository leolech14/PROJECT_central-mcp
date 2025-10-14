import { NextResponse } from 'next/server';
import { getAtomicSystemDetails } from '@/src/api/atomic-systems';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const details = await getAtomicSystemDetails(params.id);
    return NextResponse.json(details);
  } catch (error) {
    console.error(`Error fetching system ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch system details' },
      { status: 500 }
    );
  }
}
