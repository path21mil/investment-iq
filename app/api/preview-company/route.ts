import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase() || 'AAOI';

  try {
    // 1. Check database/cache first here (e.g., Supabase / Prisma)
    // 2. If not cached, fetch live data from AI or FMP API:
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${process.env.FMP_API_KEY}`
    );
    const profileData = await res.json();

    if (!profileData || profileData.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = profileData[0];

    // Return structured payload matching your UI layout
    return NextResponse.json({
      name: company.companyName,
      ticker: company.symbol,
      sector: company.sector || 'N/A',
      thesis: 'Strengthening',
      thesisColor: 'emerald',
      overallAssessment: `${company.companyName} operates in ${company.sector || 'its industry'} with a market cap of $${(company.mktCap / 1e9).toFixed(2)}B.`,
      pillars: {
        quality: company.mktCap > 100e9 ? 'Exceptional' : 'Moderate',
        management: 'Executing',
        valuation: 'Fair',
        understandability: 'Easy',
      },
      changes: [
        {
          text: `Market Capitalization at $${(company.mktCap / 1e9).toFixed(2)}B`,
          sub: `Trading on ${company.exchangeShortName}`,
          status: 'positive',
        },
        {
          text: `Price: $${company.price} (${company.changes >= 0 ? '+' : ''}${company.changes.toFixed(2)})`,
          sub: 'Latest market valuation update.',
          status: company.changes >= 0 ? 'positive' : 'warning',
        },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}