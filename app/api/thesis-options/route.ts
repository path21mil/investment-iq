import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ❌ NOTHING HERE! Leave this area completely empty of API keys.

export async function POST(req: Request) {
  try {
    const { ticker, companyName } = await req.json();
    
    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const cleanTicker = ticker.toUpperCase().trim();

    // Safely get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let supabase: any = null;
    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      console.warn("⚠️ Warning: Supabase credentials missing. Caching will be disabled for this request.");
    }

    // 1. 🚀 CHECK CACHE FIRST (with data integrity check)
    if (supabase) {
      const { data: cachedData, error: cacheError } = await supabase
        .from('thesis_options_cache')
        .select('data')
        .eq('ticker', cleanTicker)
        .maybeSingle();

      if (!cacheError && cachedData && cachedData.data) {
        const d = cachedData.data;
        const allDriversHaveWhy = Array.isArray(d.drivers) && d.drivers.every((item: any) => Boolean(item.whyThisMatters || item.why || item.why_this_matters));
        const allRisksHaveWhy = Array.isArray(d.risks) && d.risks.every((item: any) => Boolean(item.whyThisMatters || item.why || item.why_this_matters));

        if (allDriversHaveWhy && allRisksHaveWhy) {
          console.log(`⚡ Loaded complete thesis options for ${cleanTicker} from Supabase Cache!`);
          return NextResponse.json(d);
        }
        console.log(`🔄 Cached thesis options for ${cleanTicker} missing descriptions. Refreshing...`);
      }
    }

    // 2. 🧠 IF NOT IN CACHE, CALL OPENAI
    // ✅ The OpenAI setup lives down here, safely inside the function!
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is missing in .env.local' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    console.log(`🧠 Generating live thesis options for ${companyName || cleanTicker}...`);

    const systemPrompt = `You are a top-tier Wall Street equity research analyst. 
Analyze ${companyName || cleanTicker} (${cleanTicker}) based on its business model, recent SEC filings (10-K/10-Q), earnings calls, and competitive landscape.

Generate 6 key growth drivers (bull case) and 6 key risks/invalidators (bear case).
Make every driver and risk deeply specific to ${cleanTicker}. Avoid generic statements that could apply to any company.

Return strictly a valid JSON object matching this schema:
{
  "drivers": [
    {
      "title": "Short punchy driver title (3-6 words)",
      "whyThisMatters": "Clear 1-sentence explanation of why this creates shareholder value.",
      "evidence": ["Data point or business facts 1", "Fact 2", "Fact 3"],
      "monitors": ["Key metric or KPI to track 1", "KPI 2", "KPI 3"]
    }
  ],
  "risks": [
    {
      "title": "Short punchy risk title (3-6 words)",
      "whyThisMatters": "Clear 1-sentence explanation of how this hurts performance.",
      "evidence": ["Data point or business concern 1", "Concern 2", "Concern 3"],
      "monitors": ["Key metric or warning sign 1", "Warning sign 2", "Warning sign 3"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const aiContent = response.choices[0].message.content;
    if (!aiContent) throw new Error("AI returned empty output");

    const result = JSON.parse(aiContent);

    const formattedDrivers = (result.drivers || []).slice(0, 6).map((d: any, i: number) => ({
      id: `d${i}`,
      title: d.title || 'Core Driver',
      whyThisMatters: d.whyThisMatters || d.why || d.why_this_matters || d.whyItMatters || 'Clear 1-sentence explanation of why this creates shareholder value.',
      evidence: Array.isArray(d.evidence) ? d.evidence : [d.evidence || 'Established core pillar.'],
      monitors: Array.isArray(d.monitors) ? d.monitors : [d.monitors || 'Quarterly segment performance metrics']
    }));

    const formattedRisks = (result.risks || []).slice(0, 6).map((r: any, i: number) => ({
      id: `r${i}`,
      title: r.title || 'Monitored Risk',
      whyThisMatters: r.whyThisMatters || r.why || r.why_this_matters || r.whyItMatters || 'Monitored counter-thesis factor that could impair performance.',
      evidence: Array.isArray(r.evidence) ? r.evidence : [r.evidence || 'Monitored counter-thesis factor.'],
      monitors: Array.isArray(r.monitors) ? r.monitors : [r.monitors || 'Macro & operational headwinds']
    }));

    const finalPayload = { drivers: formattedDrivers, risks: formattedRisks };

    // 3. 💾 SAVE TO CACHE FOR NEXT TIME (if Supabase client is active)
    if (supabase) {
      await supabase
        .from('thesis_options_cache')
        .upsert({ 
          ticker: cleanTicker, 
          data: finalPayload 
        });
    }

    return NextResponse.json(finalPayload);

  } catch (error: any) {
    console.error("OpenAI Execution Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate live thesis' }, { status: 500 });
  }
}