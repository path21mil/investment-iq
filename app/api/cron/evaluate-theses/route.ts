import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role to bypass RLS during cron execution
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Serverless execution limit

// Reusable logic to check if an event aligns with the user's thesis
function isEventRelevant(event: any, drivers: any[], primaryRisk?: string) {
  const targetTopics: string[] = [];
  if (Array.isArray(drivers)) {
    drivers.forEach(d => {
      if (d.title) targetTopics.push(d.title.toLowerCase());
      if (d.description) targetTopics.push(d.description.toLowerCase());
    });
  }
  if (primaryRisk) targetTopics.push(primaryRisk.toLowerCase());
  if (targetTopics.length === 0) return true;

  const content = `${event.headline} ${event.impact_summary} ${event.event_type || ''}`.toLowerCase();
  
  return targetTopics.some(topic => {
    const words = topic.split(/\s+/).filter(w => w.length > 3);
    return words.some(w => content.includes(w));
  });
}

// Deterministic Critical Gate: Flags existential threats outside the thesis
function detectCriticalOverride(event: any) {
  const content = `${event.headline} ${event.impact_summary}`.toLowerCase();
  const criticalGates = {
    leadership: ['ceo', 'cfo', 'resigns', 'resignation', 'steps down', 'ousted', 'fired'],
    solvency: ['bankruptcy', 'chapter 11', 'default', 'going concern', 'liquidity'],
    legal: ['doj', 'sec probe', 'fraud', 'delisting', 'subpoena', 'indicted'],
    integrity: ['restatement', 'auditor resigns', 'accounting issue']
  };

  for (const [category, keywords] of Object.entries(criticalGates)) {
    if (keywords.some(kw => content.includes(kw))) return category;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all active theses
    const { data: theses, error: thesesError } = await supabase.from('theses').select('*');
    if (thesesError) throw thesesError;
    if (!theses || theses.length === 0) {
      return NextResponse.json({ message: 'No theses to evaluate' });
    }

    // 2. Fetch the last 7 days of global events for the required tickers
    const uniqueTickers = Array.from(new Set(theses.map(t => t.ticker.toUpperCase())));
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: globalEvents, error: eventsError } = await supabase
      .from('portfolio_events')
      .select('*')
      .in('ticker', uniqueTickers)
      .gte('detected_at', sevenDaysAgo);
      
    if (eventsError) throw eventsError;
    const safeEvents = globalEvents || [];

    let processedCount = 0;

    // 3. Process each thesis individually
    for (const thesis of theses) {
      const ticker = thesis.ticker.toUpperCase();
      const tickerEvents = safeEvents.filter(e => e.ticker.toUpperCase() === ticker);
      if (tickerEvents.length === 0) continue;

      const rawDrivers = typeof thesis.drivers === 'string' ? JSON.parse(thesis.drivers) : (thesis.drivers || []);
      const primaryRisk = thesis.primary_risk;

      let inThesisEvents: any[] = [];
      let criticalOverrides: any[] = [];

      // Route events into in-thesis processing or critical override flags
      tickerEvents.forEach(event => {
        if (isEventRelevant(event, rawDrivers, primaryRisk)) {
          inThesisEvents.push(event);
        } else {
          const overrideCategory = detectCriticalOverride(event);
          if (overrideCategory) {
            criticalOverrides.push({ ...event, overrideCategory });
          }
        }
      });

      const isCritical = criticalOverrides.length > 0;
      const eventsToEvaluate = isCritical ? criticalOverrides : inThesisEvents;

      if (eventsToEvaluate.length === 0) continue;

      // 4. AI Synthesis Prompt with Dynamic Affected Driver Mapping
      if (!OPENAI_API_KEY) continue;
      
      const driverTitles = rawDrivers.map((d: any) => d.title).filter(Boolean);

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
              content: `You are a Principal Equity Research Analyst synthesizing updates against an investor's thesis.

USER'S TRACKED DRIVERS: ${JSON.stringify(driverTitles)}
USER'S PRIMARY RISK: ${primaryRisk || 'None specified'}

RULES:
1. ${isCritical 
    ? 'CRITICAL OVERRIDE: Focus exclusively on the existential events outside the thesis. Set "affected_drivers" to [].' 
    : `NORMAL EVALUATION: 
       - Identify which specific user driver titles are directly or closely impacted/improved by these events.
       - Return EXACT string matches from USER'S TRACKED DRIVERS in the "affected_drivers" array.
       - If 1 driver is affected, return an array of 1.
       - If 2 drivers are affected, return an array of 2.
       - If 3 or more are affected, select ONLY the top 2 most material drivers.
       - If none match directly, select the single closest related driver title.`}
2. Synthesize all related news into ONE high-conviction sentence under "key_thesis_change". Do not repeat the same event across multiple thoughts.

JSON OUTPUT STRUCTURE:
{
  "status": "Strengthening" | "Review Needed" | "Weakening",
  "affected_drivers": string[],
  "is_critical_override": ${isCritical},
  "override_category": ${isCritical ? '"Leadership" | "Solvency" | "Legal" | "Integrity"' : null},
  "untracked_risk_type": ${isCritical ? '"string naming untracked risk"' : null},
  "key_thesis_change": "1 concise statement synthesizing the impact",
  "evidence_count": number,
  "supporting_events": [
    { "headline": "string", "source_name": "string", "source_url": "string" }
  ]
}`
            },
            {
              role: 'user',
              content: `EVENTS TO EVALUATE: ${JSON.stringify(eventsToEvaluate.slice(0, 5))}`
            }
          ],
          temperature: 0.1
        })
      });

      if (!aiResponse.ok) continue;
      
      const aiData = await aiResponse.json();
      const synthesizedUpdate = JSON.parse(aiData.choices[0].message.content);
      synthesizedUpdate.last_evaluated_at = new Date().toISOString();

      // 5. Save the synthesis and affected driver mapping to the database
      await supabase
        .from('theses')
        .update({ curated_updates: synthesizedUpdate })
        .eq('id', thesis.id);

      processedCount++;
      
      // Prevent hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return NextResponse.json({ success: true, evaluatedTheses: processedCount });
  } catch (error: any) {
    console.error('Evaluate Theses Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}