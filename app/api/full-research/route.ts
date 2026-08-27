import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use Service Role Key so backend bypasses RLS and can write to cache
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticker, companyName } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured in .env" }, { status: 500 });
    }

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const cleanTicker = ticker.toUpperCase().trim();

  // ==========================================
    // 🛑 1. CHECK SUPABASE CACHE FIRST
    // ==========================================
    const { data: cacheData, error: cacheError } = await supabase
      .from('ai_cache')
      .select('*')
      .eq('ticker', `${cleanTicker}_V2`) // <-- ADD _V2 HERE
      .maybeSingle();

    if (cacheData && cacheData.ai_data) {
      const lastUpdated = new Date(cacheData.updated_at).getTime();
      const now = new Date().getTime();
      if ((now - lastUpdated) / (1000 * 60 * 60) < 24) {
        return NextResponse.json(cacheData.ai_data);
      }
    }

    // ==========================================
    // ⚡ 2. FETCH LIVE MARKET DATA
    // ==========================================
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days for more context
    const finnhubKey = process.env.FINNHUB_API_KEY;
    
    let newsText = "No recent news.";
    let peerTickers: string[] = [];
    let currentPrice = 0;
    let metricsData: any = {};
    let fetchedCompanyName = companyName; // <-- Add this

    if (finnhubKey) {
      try {
        const [newsRes, quoteRes, metricRes, peersRes, profileRes] = await Promise.all([
          fetch(`https://finnhub.io/api/v1/company-news?symbol=${cleanTicker}&from=${lastWeek.toISOString().split('T')[0]}&to=${today.toISOString().split('T')[0]}&token=${finnhubKey}`),
          fetch(`https://finnhub.io/api/v1/quote?symbol=${cleanTicker}&token=${finnhubKey}`),
          fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${cleanTicker}&metric=all&token=${finnhubKey}`),
          fetch(`https://finnhub.io/api/v1/stock/peers?symbol=${cleanTicker}&token=${finnhubKey}`),
          fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${cleanTicker}&token=${finnhubKey}`) // <-- ADD THIS
        ]);

        // ... existing response handlers ...

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData?.name) fetchedCompanyName = profileData.name; // <-- ADD THIS
        }


        if (newsRes.ok) {
          const newsData = await newsRes.json();
          const topNews = Array.isArray(newsData) ? newsData.slice(0, 8) : [];
          if (topNews.length > 0) {
            newsText = topNews.map((a: any) => `HEADLINE: ${a.headline} | SOURCE: ${a.source} | URL: ${a.url}\nSUMMARY: ${a.summary}`).join('\n\n');
          }
        }
        if (quoteRes.ok) {
          const q = await quoteRes.json();
          currentPrice = q.c || 0;
        }
        if (metricRes.ok) {
          const m = await metricRes.json();
          metricsData = m.metric || {};
        }
        if (peersRes.ok) {
          const p = await peersRes.json();
          peerTickers = Array.isArray(p) ? p.filter((s: string) => s !== cleanTicker).slice(0, 3) : [];
        }
      } catch (err) {
        console.error("Finnhub Fetch Error (Ignored):", err);
      }
    }

    // Extract quantitative metrics safely
    const yearHigh = metricsData['52WeekHigh'] || currentPrice;
    const yearLow = metricsData['52WeekLow'] || currentPrice * 0.7;
    const pe = metricsData['peTTM'] || metricsData['peNormalizedAnnual'] || null;
    const revGrowth = metricsData['revenueGrowthTTMYoy'] || metricsData['revenueGrowthQuarterlyYoy'] || 0;
    const opMargin = metricsData['operatingMarginTTM'] || 0;
    const netMargin = metricsData['netProfitMarginTTM'] || 0;
    const debtEquity = metricsData['totalDebt/totalEquityQuarterly'] || 0;
    const earningsYield = pe && pe > 0 ? (1 / pe) * 100 : 0;
    const drawdownPct = yearHigh > 0 ? Math.round(((currentPrice - yearHigh) / yearHigh) * 100) : 0;

    // ==========================================
    // 🧠 3. ASK GEMINI TO ANALYZE
    // ==========================================
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash", // Using your specific model string
      generationConfig: { responseMimeType: "application/json" },
      safetySettings: [ 
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    const prompt = `
      Analyze ${companyName || cleanTicker} (${cleanTicker}) as a top-tier Wall Street analyst.
      
      Live Quantitative Metrics:
      - Current Price: $${currentPrice} (Drawdown: ${drawdownPct}%)
      - P/E: ${pe || 'N/A'}, Earnings Yield: ${earningsYield.toFixed(1)}%
      - Revenue Growth YoY: ${revGrowth}%, Operating Margin: ${opMargin}%, Net Margin: ${netMargin}%

      Recent News & Headlines:
      ${newsText}

      Return a JSON object exactly matching this structure. Do NOT include markdown blocks (\`\`\`json).
      {
        "opportunityType": "PULLBACK OPPORTUNITY" | "BALANCED SETUP" | "VALUATION" | "FUNDAMENTAL ACCELERATION",
        "pillars": {
          "quality": { "label": "Excellent" | "Good" | "Moderate", "status": "green" | "yellow" },
          "management": { "label": "Trusted" | "Solid" | "Under Review", "status": "green" | "yellow" },
          "valuation": { "label": "Premium" | "Fair Value" | "Compressed", "status": "green" | "yellow" | "red" }
        },
        "whySurfaced": [
          { "direction": "down" | "up" | "neutral", "text": "Specific metric or price action reason 1" },
          { "direction": "down" | "up" | "neutral", "text": "Specific metric or price action reason 2" },
          { "direction": "up" | "down" | "neutral", "text": "Specific metric or price action reason 3" }
        ],
        "executiveSummary": {
          "summary": "2-sentence institutional summary synthesizing fundamentals and recent news.",
          "businessQuality": "Excellent",
          "growth": "Strengthening",
          "profitability": "Strong",
          "valuation": "Premium",
          "keyRisk": "Execution / valuation"
        },
        "whatChanged": [
          {
            "direction": "up" | "down" | "warning",
            "headline": "Short headline of change",
            "detail": "1-sentence elaboration.",
            "sourceName": "Name of source (e.g. Reuters, Yahoo Finance)",
            "sourceUrl": "URL from the news list or null",
            "evidenceText": "Quoted fact or specific metric from the news"
          }
        ],
        "investmentQuestions": [
          { "number": "01", "question": "Is this a high-quality business?", "status": "pass" | "warn", "summary": "1-sentence summary" },
          { "number": "02", "question": "Does it have a durable competitive advantage?", "status": "pass" | "warn", "summary": "1-sentence summary" },
          { "number": "03", "question": "Can management be trusted?", "status": "pass" | "warn", "summary": "1-sentence summary" },
          { "number": "04", "question": "Am I paying a reasonable price?", "status": "pass" | "warn", "summary": "1-sentence summary" },
          { "number": "05", "question": "Can I understand this business well enough to own it?", "status": "pass" | "warn", "summary": "1-sentence summary" },
          { "number": "06", "question": "What could go wrong?", "status": "pass" | "warn", "summary": "1-sentence summary" },
          { "number": "07", "question": "Can this business keep growing for 5–10 years?", "status": "pass" | "warn", "summary": "1-sentence summary" }
        ],
        "management": {
          "capitalAllocation": "Strong",
          "execution": "Trusted",
          "commentary": "Summary of management tone and execution based on news context."
        },
        "peers": [
          { "ticker": "${peerTickers[0] || 'COMP1'}", "pe": "24.0x", "growth": "+11.8%", "margin": "22.1%" },
          { "ticker": "${peerTickers[1] || 'COMP2'}", "pe": "18.5x", "growth": "+17.2%", "margin": "25.4%" }
        ],
        "sources": [
          { "title": "Finnhub Financial Statements", "type": "Metrics" },
          { "title": "Financial News Feed", "type": "News" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();

    // Safely Extract JSON using your existing robust logic
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return NextResponse.json({ error: "Gemini did not return valid JSON. Output was: " + rawText.substring(0, 50) + "..." }, { status: 500 });
    }

    rawText = rawText.substring(firstBrace, lastBrace + 1);
    
    // Note: Removed the regex replace for newlines here to prevent JSON parse errors if Gemini returns strings with valid spaces/newlines.
    
    let finalJson;
    try {
      finalJson = JSON.parse(rawText);
    } catch (parseError: any) {
      return NextResponse.json({ error: "JSON Parsing Failed: " + parseError.message }, { status: 500 });
    }

    // Merge the AI data with our real-time scraped quantitative metrics for the UI
    const finalPayload = {
      ticker: cleanTicker,
      companyName: fetchedCompanyName || cleanTicker,
      price: currentPrice,
      metrics: {
        pe: pe ? `${Number(pe).toFixed(1)}x` : 'N/A',
        earningsYield: earningsYield ? `${Number(earningsYield).toFixed(1)}%` : 'N/A',
        currentPrice: `$${currentPrice.toFixed(2)}`,
        yearHigh: `$${yearHigh.toFixed(2)}`,
        yearLow: `$${yearLow.toFixed(2)}`,
        revenueGrowth: revGrowth ? `+${Number(revGrowth).toFixed(1)}%` : 'N/A',
        operatingMargin: opMargin ? `${Number(opMargin).toFixed(1)}%` : 'N/A',
        netMargin: netMargin ? `${Number(netMargin).toFixed(1)}%` : 'N/A',
        debtEquity: debtEquity ? `${Number(debtEquity).toFixed(1)}%` : 'N/A'
      },
      ...finalJson
    };

  // ==========================================
    // 💾 4. SAVE TO CACHE
    // ==========================================
    await supabase
      .from('ai_cache')
      .upsert({ 
        ticker: `${cleanTicker}_V2`, // <-- ADD _V2 HERE
        ai_data: finalPayload, 
        updated_at: new Date().toISOString() 
      });

    return NextResponse.json(finalPayload);

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: `Backend crash: ${error.message || "Unknown error"}` }, { status: 500 });
  }
}