import { NextResponse } from 'next/server';
import { getCompanyProfile } from '@/lib/fmp';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const profile = await getCompanyProfile(ticker);

    if (!profile || Object.keys(profile).length === 0) {
      return NextResponse.json(
        { error: 'Company profile not found or service unavailable' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 });
  }
}