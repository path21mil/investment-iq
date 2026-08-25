import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 🔌 LATER: We will plug in Finnhub or FMP here to scan live market data
    
    // For now, we return the structured format your dashboard expects:
    const opportunities = [
      { ticker: 'AMD', condition: 'Near 200D MA' },
      { ticker: 'GOOG', condition: 'Below 5Y avg P/E' },
      { ticker: 'SHOP', condition: '18% below 52W high' },
    ];

    // Simulate a brief network delay so you can see the loading spinner
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ success: true, data: opportunities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}