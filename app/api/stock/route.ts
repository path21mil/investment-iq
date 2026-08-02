import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  // Safely split and clean the symbols (removes empty spaces or weird commas)
  const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ prices: {} });
  }

  console.log(`\n📡 1. Pinging Yahoo Finance for:`, symbols);

  try {
    const rawResult = await yahooFinance.quote(symbols);
    const quotes = Array.isArray(rawResult) ? rawResult : [rawResult];

    const prices: Record<string, number> = {};
    
    quotes.forEach((quote: any) => {
      if (quote && quote.symbol) {
        const currentPrice = quote.regularMarketPrice || quote.postMarketPrice || quote.price;
        if (currentPrice) {
          prices[quote.symbol] = currentPrice;
        }
      }
    });

    console.log(`✅ 2. Success! Prices found:`, prices);
    return NextResponse.json({ prices });
    
  } catch (error) {
    console.error('\n🔥 YAHOO FINANCE API ERROR 🔥');
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch stock data', details: String(error) }, { status: 500 });
  }
}