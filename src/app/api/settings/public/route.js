import { NextResponse } from 'next/server';
import { getPublicSystemConfig } from '@/lib/config';

export const dynamic = 'force-dynamic'; // We handle caching manually if needed, or rely on SWR on client

export async function GET() {
  try {
    const config = await getPublicSystemConfig();
    
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' // Cache for 1 min, stale for 5 mins
      }
    });
  } catch (error) {
    console.error('Failed to fetch public settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
