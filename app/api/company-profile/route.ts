import { NextResponse } from 'next/server';
import { getCompanyProfile } from '@/lib/fmp'; // Adjust this import path if your lib folder is elsewhere

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    // This runs safely on the server where FINNHUB_API_KEY exists!
    const profile = await getCompanyProfile(ticker);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 });
  }
}