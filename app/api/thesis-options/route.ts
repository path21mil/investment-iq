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

    // 1. 🚀 CHECK CACHE FIRST (if Supabase client is active)
    if (supabase) {
      const { data: cachedData, error: cacheError } = await supabase
        .from('thesis_options_cache')
        .select('data')
        .eq('ticker', cleanTicker)
        .maybeSingle();

      if (!cacheError && cachedData && cachedData.data) {
        console.log(`⚡ Loaded thesis options for ${cleanTicker} from Supabase Cache!`);
        return NextResponse.json(cachedData.data);
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

    const formattedDrivers = (result.drivers || []).slice(0, 6).map((d: any, i: number) => ({ ...d, id: `d${i}` }));
    const formattedRisks = (result.risks || []).slice(0, 6).map((r: any, i: number) => ({ ...r, id: `r${i}` }));

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