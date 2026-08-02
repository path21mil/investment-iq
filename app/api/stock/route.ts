import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2'; // Notice the capital Y here now

// INITIALIZE THE NEW V4 INSTANCE HERE
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  // Safely split and clean the symbols
  const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ prices: {} });
  }

  try {
    const rawResult = await yahooFinance.quote(symbols);
    const quotes = Array.isArray(rawResult) ? rawResult : [rawResult];

    const prices: Record<string, number> = {};
    
    quotes.forEach((quote: any) => {
      if (quote && quote.symbol) {
        // Check regular price, then post-market, then general price fallback
        const currentPrice = quote.regularMarketPrice || quote.postMarketPrice || quote.price;
        if (currentPrice) {
          prices[quote.symbol] = currentPrice;
        }
      }
    });

    return NextResponse.json({ prices });
    
  } catch (error) {
    console.error('🔥 YAHOO FINANCE API ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data', details: String(error) }, { status: 500 });
  }
}