import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key to bypass RLS in background jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Extends execution window (up to 300 on Pro plans)
export async function GET(req: NextRequest) {
  // Optional secret verification: only enforces if CRON_SECRET is configured
  const authHeader = req.headers.get('authorization');
 const cronSecret = process.env.CRON_SECRET;
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

  try {
    // 1. Fetch distinct tickers currently held in user portfolios
    const { data: userTheses, error: thesesError } = await supabase
      .from('theses')
      .select('ticker');

    if (thesesError) throw thesesError;
    if (!userTheses || userTheses.length === 0) {
      return NextResponse.json({ message: 'No active portfolio tickers to monitor' });
    }

    // Deduplicate tickers (e.g. 50 users holding TSLA becomes 1 scan)
    const uniqueTickers = Array.from(
      new Set(userTheses.map((t) => t.ticker.toUpperCase()))
    );

    // Limit batch size per run to avoid serverless timeouts
    const tickersToScan = uniqueTickers.slice(0, 40);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const toDate = now.toISOString().split('T')[0];
    const fromDate = yesterday.toISOString().split('T')[0];

    const insertedEvents = [];

    // 2. Scan each ticker for breaking news / SEC filings
    for (const ticker of tickersToScan) {
      if (!FINNHUB_API_KEY) break;

      const finnhubUrl = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
      const res = await fetch(finnhubUrl);
      if (!res.ok) continue;

      const newsItems: any[] = await res.json();
      if (!Array.isArray(newsItems) || newsItems.length === 0) continue;

      // Take the top 3 most relevant headlines
      const topNews = newsItems.slice(0, 3);

      for (const item of topNews) {
        // Skip duplicate records already saved in the database
        const { data: existing } = await supabase
          .from('portfolio_events')
          .select('id')
          .eq('ticker', ticker)
          .eq('headline', item.headline)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // 3. Evaluate catalyst significance with OpenAI
        if (!OPENAI_API_KEY) continue;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
     content: `You are an equity analyst evaluating portfolio holding developments.
Analyze this news item. Set "is_material": true if the news represents:
- Earnings releases, guidance adjustments, or financial performance updates
- Key product launches, technological milestones, or major contract wins/partnerships
- Executive leadership shifts, board changes, or corporate restructuring
- Regulatory decisions, legal actions, or antitrust/compliance matters
- Significant analyst upgrades, downgrades, or price target revisions

If the news is generic market commentary, general market recaps (e.g. "why tech dipped today"), or repetitive listicles (e.g. "top 3 dividend stocks"), set "is_material": false.

Classify sentiment as:
- "strengthening" (clear positive tailwinds, expansion, beats)
- "monitoring" (neutral updates, leadership changes, minor headwinds, watch items)
- "risk" (legal hurdles, misses, severe downgrades, lost contracts)

Provide a concise 1-sentence impact summary.

Return JSON format:
{
  "is_material": boolean,
  "sentiment": "strengthening" | "monitoring" | "risk",
  "impact_summary": "1 concise sentence explaining the effect"
}`
              },
              {
                role: 'user',
                content: `Company: ${ticker}\nHeadline: ${item.headline}\nSummary: ${item.summary}`
              }
            ],
            temperature: 0.1,
            max_tokens: 150
          })
        });

        if (!aiResponse.ok) continue;

        const aiData = await aiResponse.json();
        const analysis = JSON.parse(aiData.choices[0].message.content);

        // 4. Save significant catalysts to the database
        if (analysis.is_material) {
          const { data: newEvent, error: insertError } = await supabase
            .from('portfolio_events')
            .insert({
              ticker: ticker,
              headline: item.headline,
              impact_summary: analysis.impact_summary,
              event_type: 'news',
              sentiment: analysis.sentiment,
              source_name: item.source || 'Market Disclosure',
              source_url: item.url || null,
              detected_at: new Date(item.datetime * 1000).toISOString(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

          if (!insertError && newEvent) {
            insertedEvents.push(newEvent);
          }
        }
      }

      // 100ms pause between tickers to stay well under rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 5. Housekeeping: Purge events older than 7 days
    await supabase
      .from('portfolio_events')
      .delete()
      .lt('expires_at', new Date().toISOString());

    return NextResponse.json({
      success: true,
      scannedTickers: tickersToScan.length,
      eventsCreated: insertedEvents.length,
      events: insertedEvents
    });
  } catch (error: any) {
    console.error('Portfolio Update Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}