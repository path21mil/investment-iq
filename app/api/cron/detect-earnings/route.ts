import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with the Service Role Key to bypass RLS in background jobs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Get all unique tickers currently being tracked across all theses
    const { data: theses, error: thesisError } = await supabaseAdmin
      .from('theses')
      .select('ticker');
    
    if (thesisError) throw thesisError;

    // Deduplicate the array so we only check each ticker once
    const uniqueTickers = [...new Set((theses || []).map(t => t.ticker))];
    
    if (uniqueTickers.length === 0) {
      return NextResponse.json({ message: 'No active tickers to monitor.' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // MOCK DATA: Simulating that AAPL and NVDA reported earnings today
    const earningsData = [
      { ticker: 'AAPL', date: today, time: 'After Market Close' },
      { ticker: 'NVDA', date: today, time: 'Before Market Open' },
      { ticker: 'TSLA', date: today, time: 'After Market Close' }
    ];

    // Only keep earnings for companies your users actually care about
    const relevantEarnings = earningsData.filter(e => uniqueTickers.includes(e.ticker));
    const results = [];

    // 3. Insert events into the database safely
    for (const release of relevantEarnings) {
      const { data, error } = await supabaseAdmin
        .from('earnings_events')
        .insert({
          ticker: release.ticker,
          earnings_date: release.date,
          market_time: release.time,
          status: 'detected'
        })
        .select()
        .single();

      if (error && error.code === '23505') {
        results.push({ ticker: release.ticker, status: 'already_logged' });
      } else if (error) {
        console.error(`Failed to log ${release.ticker}:`, error);
        results.push({ ticker: release.ticker, status: 'error', error: error.message });
      } else {
        results.push({ ticker: release.ticker, status: 'inserted', id: data?.id });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}