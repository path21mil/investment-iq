import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ result: [] });
  }

  const finnhubKey = process.env.FINNHUB_API_KEY;

  if (!finnhubKey) {
    console.error("❌ CRITICAL: Finnhub API Key is missing from environment variables!");
    return NextResponse.json({ error: 'Finnhub API key is not configured' }, { status: 500 });
  }

  try {
    const finnhubUrl = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${finnhubKey}`;
    const res = await fetch(finnhubUrl);

    if (!res.ok) {
      console.error(`❌ Finnhub API responded with status: ${res.status}`);
      return NextResponse.json({ result: [] });
    }

    // ✨ FIX: Read as text first to prevent the JSON crash
    const rawText = await res.text();
    let data;
    
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("🚨 Finnhub Search returned HTML instead of JSON! Raw response:", rawText.substring(0, 250));
      return NextResponse.json({ result: [] }); // Return empty results safely
    }

    const cleanQuery = query.trim().toUpperCase();

    // 🏆 CUSTOM PRIORITY SORTING LOGIC
    const sortedMatches = (data.result || [])
      .filter((item: any) => !item.symbol.includes('.')) // Filter out foreign suffixes
      .sort((a: any, b: any) => {
        const symA = a.symbol.toUpperCase();
        const symB = b.symbol.toUpperCase();
        const descA = a.description.toUpperCase();
        const descB = b.description.toUpperCase();

        // 1. Exact ticker match (e.g., searching "AAPL" -> Apple Inc.)
        const exactTickerA = symA === cleanQuery;
        const exactTickerB = symB === cleanQuery;
        if (exactTickerA && !exactTickerB) return -1;
        if (!exactTickerA && exactTickerB) return 1;

        // 2. Exact company-name match
        const exactDescA = descA === cleanQuery;
        const exactDescB = descB === cleanQuery;
        if (exactDescA && !exactDescB) return -1;
        if (!exactDescA && exactDescB) return 1;

        // 3. Company-name starts with search query (e.g., "Micro" -> "Microsoft")
        const startsA = descA.startsWith(cleanQuery);
        const startsB = descB.startsWith(cleanQuery);
        if (startsA && !startsB) return -1;
        if (!startsA && startsB) return 1;

        // 4. Partial company-name match
        const includesA = descA.includes(cleanQuery);
        const includesB = descB.includes(cleanQuery);
        if (includesA && !includesB) return -1;
        if (!includesA && includesB) return 1;

        // 5. Everything else
        return 0;
      })
      .slice(0, 6) // Take top 6 sorted results
      .map((item: any) => ({
        symbol: item.symbol,
        description: item.description,
        type: item.type,
      }));

    return NextResponse.json({ result: sortedMatches });
  } catch (error) {
    console.error('🚨 Search route exception:', error);
    return NextResponse.json({ result: [] }, { status: 500 });
  }
}