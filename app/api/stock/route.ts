import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',');

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
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}