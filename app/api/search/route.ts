import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ result: [] });
  }

  try {
    // 🌐 Ping Yahoo Finance's unauthenticated public endpoint
    const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=6&newsCount=0`;
    const res = await fetch(yahooUrl, {
      // Adding a standard user-agent helps prevent Cloudflare/bot blocks
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!res.ok) {
      console.error(`❌ Yahoo API responded with status: ${res.status}`);
      return NextResponse.json({ result: [] });
    }

    // Safely parse the response 
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("🚨 Yahoo Search returned invalid JSON! Raw response:", rawText.substring(0, 250));
      return NextResponse.json({ result: [] });
    }

    const cleanQuery = query.trim().toUpperCase();

    // 🔄 Map Yahoo's data structure to match what your frontend expects
    const mappedMatches = (data.quotes || [])
      .filter((item: any) => item.quoteType === 'EQUITY' && !item.symbol.includes('.'))
      .map((item: any) => ({
        symbol: item.symbol,
        // Fallback to longname or symbol if shortname is missing
        description: item.shortname || item.longname || item.symbol, 
        type: item.quoteType,
      }));

    // 🏆 CUSTOM PRIORITY SORTING LOGIC
    const sortedMatches = mappedMatches.sort((a: any, b: any) => {
        const symA = a.symbol.toUpperCase();
        const symB = b.symbol.toUpperCase();
        const descA = a.description.toUpperCase();
        const descB = b.description.toUpperCase();

        if (symA === cleanQuery && symB !== cleanQuery) return -1;
        if (symA !== cleanQuery && symB === cleanQuery) return 1;

        if (descA === cleanQuery && descB !== cleanQuery) return -1;
        if (descA !== cleanQuery && descB === cleanQuery) return 1;

        if (descA.startsWith(cleanQuery) && !descB.startsWith(cleanQuery)) return -1;
        if (!descA.startsWith(cleanQuery) && descB.startsWith(cleanQuery)) return 1;

        return 0;
      }).slice(0, 6);

    return NextResponse.json({ result: sortedMatches });
  } catch (error) {
    console.error('🚨 Search route exception:', error);
    return NextResponse.json({ result: [] }, { status: 500 });
  }
}