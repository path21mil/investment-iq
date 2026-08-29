import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration is incomplete' }, { status: 500 });
    }

    // Never accept a user id from the request body. A caller could replace it
    // with another account's id. Instead, validate the caller's Supabase token.
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = authorization.slice('Bearer '.length);
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    // This client is only for the shared company-intelligence cache. User-owned
    // theses always use userSupabase so Supabase RLS remains in effect.
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Fetch user's active portfolio / theses
    const { data: portfolio, error: fetchError } = await userSupabase
      .from('theses')
      .select('*')
      .eq('user_id', userId);

    if (fetchError || !portfolio) throw fetchError;

    let totalUpdates = 0;

    for (const company of portfolio) {
      const ticker = company.ticker.toUpperCase();

      // =================================================================
      // LAYER 1: GLOBAL COMPANY INTELLIGENCE (Finnhub + Cache + Circuit Breaker)
      // =================================================================
      let { data: companyCache } = await adminSupabase
        .from('company_intelligence_cache')
        .select('*')
        .eq('ticker', ticker)
        .maybeSingle();

      const now = new Date();
      const cacheAgeHours = companyCache
        ? (now.getTime() - new Date(companyCache.last_scanned_at).getTime()) / (1000 * 60 * 60)
        : 999;

      let companyFacts = companyCache?.raw_intelligence;

      // Check if cache is missing or older than 24 hours
      if (!companyCache || cacheAgeHours >= 24) {
        console.log(`[Layer 1] Cache stale/missing for ${ticker} (${cacheAgeHours.toFixed(1)}h old). Checking Finnhub...`);

        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        let articlesFound = false;
        let liveNewsString = "";

        try {
          const finnhubUrl = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${formatDate(threeDaysAgo)}&to=${formatDate(today)}&token=${process.env.FINNHUB_API_KEY}`;
          const newsRes = await fetch(finnhubUrl);
          const newsData = await newsRes.json();

          if (Array.isArray(newsData) && newsData.length > 0) {
            articlesFound = true;
            const topArticles = newsData.slice(0, 5);
            liveNewsString = topArticles.map((article: any) =>
              `Headline: ${article.headline}\nSummary: ${article.summary}`
            ).join("\n\n");
          }
        } catch (err) {
          console.error(`Failed to fetch Finnhub news for ${ticker}:`, err);
        }

        // ✨ ZERO-COST CIRCUIT BREAKER:
        // If there is NO new news from Finnhub, skip OpenAI entirely!
        if (!articlesFound) {
          console.log(`[Zero-Cost Skip] No new articles for ${ticker}. Bypassing OpenAI ($0 spent).`);

          // Touch timestamp so we don't re-check Finnhub for another 24 hours
          await adminSupabase
            .from('company_intelligence_cache')
            .upsert({
              ticker,
              company_name: company.company_name || ticker,
              raw_intelligence: companyCache?.raw_intelligence || { recentFacts: ["No recent material news reported."] },
              last_scanned_at: new Date().toISOString()
            }, { onConflict: 'ticker' });

          companyFacts = companyCache?.raw_intelligence || { recentFacts: ["No recent material news reported."] };
        } else {
          // Only pay OpenAI if actual news articles were returned!
          const layer1Prompt = `
            You are a senior equity research analyst. Summarize recent material financial events and news for ${ticker} into objective company facts.
            
            Recent Finnhub News:
            "${liveNewsString}"

            Respond ONLY in JSON format:
            {
              "recentFacts": ["fact 1", "fact 2"],
              "newsSummary": "Concise summary of market sentiment and events from the last 3 days."
            }
          `;

          const layer1Response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: layer1Prompt }],
          });

          companyFacts = JSON.parse(layer1Response.choices[0].message.content || "{}");

          // Save into global company intelligence cache
          const { data: updatedCache } = await adminSupabase
            .from('company_intelligence_cache')
            .upsert({
              ticker,
              company_name: company.company_name || ticker,
              raw_intelligence: companyFacts,
              last_scanned_at: new Date().toISOString()
            }, { onConflict: 'ticker' })
            .select()
            .single();

          companyCache = updatedCache;
        }
      } else {
        console.log(`[Layer 1] Reusing cached company intelligence for ${ticker} ($0 API Cost)`);
      }

      // =================================================================
      // LAYER 2: PRIVATE USER THESIS EVALUATION (Personalized)
      // =================================================================
      console.log(`[Layer 2] Evaluating private thesis for ${ticker}...`);

   const layer2Prompt = `
        You are an expert financial AI evaluating an investor's private thesis. 
        The user holds stock: ${ticker}.
        Core investment drivers: ${JSON.stringify(company.drivers)}.
        Core investment risks: ${JSON.stringify(company.risks)}.
        
        Recent Material Facts for ${ticker}: 
        "${JSON.stringify(companyFacts)}"
        
        Determine if these recent company facts Strengthen, Weaken, or require a Review for their specific drivers and risks.
        
        Respond ONLY in JSON format matching this exact structure:
        {
          "status": "Strengthening" | "Weakening" | "Review Needed",
          "aiSummary": "A 2-sentence explanation of how the news impacts their specific thesis.",

        "updates": [
  {
    "text": "A short, 1-sentence summary of the key change or news", // <--- Make sure this line exists!
    "trend": "up" | "down" | "neutral",
    "evidenceText": "Optional direct quote or stat supporting this change",
    "sourceName": "Name of the specific source",
    "sourceUrl": "Link to the source article or document"
  }
]


          "drivers": [
             { 
               "title": "Name of the key driver", 
               "status": "strengthening" | "on_track" | "monitoring" | "weakening" 
             }
          ],
          "primaryRisk": "The single biggest macroeconomic or company-specific risk for this stock."
        }
      `;

      const layer2Response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: layer2Prompt }],
      });

      const analysis = JSON.parse(layer2Response.choices[0].message.content || "{}");

      // Update the user's specific thesis
      const { error: updateError } = await userSupabase
        .from('theses')
        .update({
          status: analysis.status,
          ai_summary: analysis.aiSummary,
          updates: JSON.stringify(analysis.updates || []),
          drivers: analysis.drivers ? JSON.stringify(analysis.drivers) : company.drivers, // ✨ NEW: Saves the 3 drivers
          primary_risk: analysis.primaryRisk, // ✨ NEW: Saves the key risk
          requires_action: analysis.status === "Weakening" || analysis.status === "Review Needed",
          last_scanned_at: new Date().toISOString()
        })
        .eq('id', company.id)
        .eq('user_id', userId);

      if (updateError) {
        console.error(`Failed to update thesis for ${ticker}`, updateError);
      } else {
        totalUpdates++;
      }
    }

    return NextResponse.json({ success: true, updatedCount: totalUpdates });

  } catch (error: any) {
    console.error("Engine Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
