import { NextResponse } from 'next/server';

async function fetchYahooData(ticker: string, tf: string) {
  let range = '1mo';
  let interval = '1d';

  if (tf === '1D') {
    range = '1d';
    interval = '5m';
  } else if (tf === '1W') {
    range = '5d';
    interval = '30m';
  }

  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}&includePrePost=true`,
    {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) throw new Error(`Yahoo error ${response.status}`);
  
  const data = await response.json();
  const result = data?.chart?.result?.[0];
  
  if (!result) throw new Error('No data found');

  let pricePoints: number[] = [];
  if (result.indicators?.quote?.[0]?.close) {
    pricePoints = result.indicators.quote[0].close.filter((price: number | null) => price !== null);
  }

  const meta = result.meta;
  const currentPrice = meta.regularMarketPrice || 0;
  
  // 1D compares to yesterday's close. 1W and 1M compare to the start of the chart.
  const startPrice = tf === '1D' 
    ? (meta.previousClose || meta.chartPreviousClose || currentPrice)
    : (pricePoints[0] || currentPrice);
  
  const regChange = currentPrice - startPrice;
  const regChangePercent = startPrice !== 0 ? (regChange / startPrice) * 100 : 0;

  return {
    chartData: pricePoints,
    pricing: {
      currency: meta.currency || 'USD',
      currentPrice,
      regChange,
      regChangePercent,
      timeframeLabel: tf === '1D' ? 'today' : tf === '1W' ? 'past week' : 'past month'
    }
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const timeframesParam = searchParams.get('timeframes') || '1M';

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const timeframes = timeframesParam.split(',');
    
    // Fetch all requested timeframes simultaneously
    const results = await Promise.all(
      timeframes.map(async (tf) => {
        try {
          const data = await fetchYahooData(ticker, tf);
          return { [tf]: data };
        } catch (e) {
          console.error(`Failed to fetch ${tf}:`, e);
          return { [tf]: null };
        }
      })
    );

    // Combine into a single dictionary: { '1M': {...}, '1D': {...} }
    const multiData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {} as Record<string, any>);

    return NextResponse.json(multiData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}