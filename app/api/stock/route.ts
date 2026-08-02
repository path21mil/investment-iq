import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  // 1. Get the list of symbols from the URL (e.g., ?symbols=TSLA,NVDA)
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',');

  try {
    // 2. Fetch live quotes for ALL symbols
    const rawResult = await yahooFinance.quote(symbols);

    // 3. TYPESCRIPT FIX: Force it to be an array so .forEach() never fails
    const quotes = Array.isArray(rawResult) ? rawResult : [rawResult];

    const prices: Record<string, number> = {};
    
    // TYPESCRIPT FIX: Explicitly tell TS that 'quote' is 'any' type
    quotes.forEach((quote: any) => {
      if (quote && quote.symbol && quote.regularMarketPrice) {
        prices[quote.symbol] = quote.regularMarketPrice;
      }
    });

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}