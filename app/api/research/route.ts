import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI (Replaces Gemini)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. HELPER: DYNAMIC FORWARD ESTIMATES (FMP)
// ==========================================
async function fetchForwardEstimates(ticker: string) {
  try {
    const fmpKey = process.env.FMP_API_KEY;
    if (!fmpKey) return null;

    const res = await fetch(`https://financialmodelingprep.com/api/v3/analyst-estimates/${ticker}?period=annual&apikey=${fmpKey}`);
    const estimates = await res.json();

    // Gracefully handle FMP free tier sandbox restrictions or empty arrays
    if (!estimates || estimates.length === 0 || estimates["Error Message"]) {
        return null;
    }

    const sorted = estimates.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const today = new Date();
    const futureEstimates = sorted.filter((e: any) => new Date(e.date) > today).slice(0, 3);
    const lastActual = sorted.filter((e: any) => new Date(e.date) <= today).pop(); 

    if (futureEstimates.length < 3 || !lastActual) return null; 

    const calcGrowth = (current: number, previous: number) => {
       if (!current || !previous) return '-';
       const growth = ((current / previous) - 1) * 100;
       const sign = growth > 0 ? '+' : '';
       return `${sign}${growth.toFixed(1)}%`;
    };

    const baseRev = lastActual.estimatedRevenueAvg; 
    const year3Rev = futureEstimates[2].estimatedRevenueAvg;
    let cagr = '-';
    if (baseRev && year3Rev) {
       const cagrValue = (Math.pow(year3Rev / baseRev, 1/3) - 1) * 100;
       cagr = `${cagrValue > 0 ? '+' : ''}${cagrValue.toFixed(1)}%`;
    }

  return {
      revenue: {
        fy1: { label: futureEstimates[0].date.substring(0, 4) + 'E', value: calcGrowth(futureEstimates[0].estimatedRevenueAvg, baseRev) },
        fy2: { label: futureEstimates[1].date.substring(0, 4) + 'E', value: calcGrowth(futureEstimates[1].estimatedRevenueAvg, futureEstimates[0].estimatedRevenueAvg) },
        fy3: { label: futureEstimates[2].date.substring(0, 4) + 'E', value: calcGrowth(futureEstimates[2].estimatedRevenueAvg, futureEstimates[1].estimatedRevenueAvg) }
      },
      eps: {
        fy1: { label: futureEstimates[0].date.substring(0, 4) + 'E', value: calcGrowth(futureEstimates[0].estimatedEpsAvg, lastActual.estimatedEpsAvg) },
        fy2: { label: futureEstimates[1].date.substring(0, 4) + 'E', value: calcGrowth(futureEstimates[1].estimatedEpsAvg, futureEstimates[0].estimatedEpsAvg) },
        fy3: { label: futureEstimates[2].date.substring(0, 4) + 'E', value: calcGrowth(futureEstimates[2].estimatedEpsAvg, futureEstimates[1].estimatedEpsAvg) }
      },
      cagr: cagr,
      guidance: `Data sourced from live broker consensus`,
      source: `Analyst consensus · Financial Modeling Prep`,
      date: `Updated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    };
  } catch (error) {
    console.warn("Failed to fetch FMP estimates:", error);
    return null;
  }
}

// ==========================================
// 2. MAIN API ROUTE
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticker, companyName } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured in .env" }, { status: 500 });
    }
    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // 1. UNIVERSAL TICKER NORMALIZATION
    const rawTicker = (ticker || '').toString().toUpperCase().trim();
    const cleanTicker = rawTicker
      .replace('$', '')
      .replace(/([A-Z]+)[- ]([A-Z]+)$/, '$1.$2')
      .trim();

    // 2. CHECK SUPABASE CACHE FIRST
    const { data: cacheData } = await supabase
      .from('ai_cache')
      .select('*')
      .eq('ticker', cleanTicker)
      .maybeSingle();

    if (cacheData && cacheData.ai_data) {
      const aiData = cacheData.ai_data;
      const isOldFormat = aiData.strengths && aiData.strengths.length > 0 && typeof aiData.strengths[0] === 'string';
      
      if (!isOldFormat) {
        const lastUpdated = new Date(cacheData.updated_at).getTime();
        const now = new Date().getTime();
        if ((now - lastUpdated) / (1000 * 60 * 60) < 24) {
          return NextResponse.json(aiData);
        }
      }
    }

    // 3. FETCH LIVE MARKET DATA
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const finnhubKey = process.env.FINNHUB_API_KEY;
    
    let newsText = "No recent news.";
    let profileSummary = "";
    let peerTickers: string[] = [];
    let currentPrice = 0;
    let priceChange = 0;
    let metricsData: any = {};
    let fetchedCompanyName = companyName || cleanTicker;
    let logoUrl = "";
    let exchangeShortName = "US Market"; 

    if (finnhubKey) {
      try {
        const [newsRes, quoteRes, metricRes, peersRes, profileRes] = await Promise.all([
          fetch(`https://finnhub.io/api/v1/company-news?symbol=${cleanTicker}&from=${lastWeek.toISOString().split('T')[0]}&to=${today.toISOString().split('T')[0]}&token=${finnhubKey}`),
          fetch(`https://finnhub.io/api/v1/quote?symbol=${cleanTicker}&token=${finnhubKey}`),
          fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${cleanTicker}&metric=all&token=${finnhubKey}`),
          fetch(`https://finnhub.io/api/v1/stock/peers?symbol=${cleanTicker}&token=${finnhubKey}`),
          fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${cleanTicker}&token=${finnhubKey}`)
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData?.name) fetchedCompanyName = profileData.name;
          if (profileData?.finnhubIndustry) profileSummary = `Industry: ${profileData.finnhubIndustry}, Market Cap: $${profileData.marketCapitalization}M`;
          if (profileData?.logo) logoUrl = profileData.logo;
          if (profileData?.exchange) exchangeShortName = profileData.exchange.split(' ')[0]; 
        }

        if (newsRes.ok) {
          const newsData = await newsRes.json();
          const topNews = Array.isArray(newsData) ? newsData.slice(0, 8) : [];
          if (topNews.length > 0) {
            newsText = topNews.map((a: any) => `HEADLINE: ${a.headline} | SUMMARY: ${a.summary}`).join('\n\n');
          }
        }

        if (quoteRes.ok) {
          const q = await quoteRes.json();
          currentPrice = q.c || 0;
          priceChange = q.d || 0; 
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
        console.error("Finnhub Fetch Error:", err);
      }
    }

    // 4. QUANTITATIVE METRICS EXTRACTION
    let yearHigh = Number(metricsData['52WeekHigh']) || currentPrice;
    let yearLow = Number(metricsData['52WeekLow']) || (currentPrice > 0 ? currentPrice * 0.7 : 0);

    if (currentPrice > 0 && yearHigh > currentPrice * 4) {
      yearHigh = Number((currentPrice * 1.15).toFixed(2));
      yearLow = Number((currentPrice * 0.85).toFixed(2));
    }

    const pe = metricsData['peTTM'] || metricsData['peNormalizedAnnual'] || null;
    const revGrowth = metricsData['revenueGrowthTTMYoy'] || metricsData['revenueGrowthQuarterlyYoy'] || 0;
    const opMargin = metricsData['operatingMarginTTM'] || 0;
    const netMargin = metricsData['netProfitMarginTTM'] || 0;
    const earningsYield = pe && Number(pe) > 0 ? (1 / Number(pe)) * 100 : 0;

    // 5. FETCH FORWARD ESTIMATES
    const forwardEstimates = await fetchForwardEstimates(cleanTicker);

    // 6. OPENAI INSTITUTIONAL SYNTHESIS
 const prompt = `
      Analyze ${fetchedCompanyName} (${cleanTicker}) as an institutional Wall Street equity analyst.
      Company Context: ${profileSummary}
      
      Live Quantitative Metrics:
      - Current Price: $${currentPrice} (52W High: $${yearHigh}, 52W Low: $${yearLow})
      - P/E: ${pe || 'N/A'}, Earnings Yield: ${earningsYield ? earningsYield.toFixed(1) + '%' : 'N/A'}
      - Revenue Growth YoY: ${revGrowth}%, Operating Margin: ${opMargin}%

      Recent News Headlines:
      ${newsText}

      LIFECYCLE RULES FOR "ratingBadge":
      Evaluate where this company sits in its business lifecycle and pick EXACTLY one of these four values:
      - "Early Stage" (Unproven, rapid innovation or high risk phase)
      - "Expanding" (Accelerating market adoption, rapid revenue and scaling phase)
      - "Mature" (Established market leader with steady, defensive compounding cash flows)
      - "Declining" (Facing structural headwinds, disruption, or shrinking market share)

      CRITICAL NARRATIVE RULES FOR DRIVERS (STRENGTHS) AND RISKS:
      DO NOT use generic financial metrics as titles (e.g., absolutely NO "Strong Revenue Growth", "High Margins", or "Intense Competition"). 
      Instead, you MUST identify the specific qualitative business catalysts or structural moats behind the numbers. Use creative, institutional narrative titles (e.g., "Unrivaled Ecosystem Lock-in", "Aggressive Carrier Subsidies", "Sovereign AI CapEx Cycle"). Apply this standard to both strengths and risks.

      Return a JSON object exactly matching this structure.
      {
        "ratingTitle": "Short 2-word title (e.g. Dominant Leader, High Compounder, Category Pioneer)",
        "ratingBadge": "Expanding",
        "overallAssessment": "2-sentence institutional summary synthesizing fundamentals and recent news.",
       "strengths": [
          {
            "title": "Narrative qualitative driver title (3-6 words)",
            "whyThisMatters": "Clear 1-sentence explanation of why this creates shareholder value.",
            "evidence": ["Data point or business facts 1", "Fact 2", "Fact 3"],
            "monitors": ["Key metric or KPI to track 1", "KPI 2", "KPI 3"]
          },
          {
            "title": "Second narrative driver title",
            "whyThisMatters": "Clear 1-sentence explanation.",
            "evidence": ["Fact 1", "Fact 2", "Fact 3"],
            "monitors": ["KPI 1", "KPI 2", "KPI 3"]
          }
        ],
        "risks": [
          {
            "title": "Narrative qualitative risk title (3-6 words)",
            "whyThisMatters": "Clear 1-sentence explanation of how this hurts performance.",
            "evidence": ["Data point or business concern 1", "Concern 2", "Concern 3"],
            "monitors": ["Key metric or warning sign 1", "Warning sign 2", "Warning sign 3"]
          },
          {
            "title": "Second narrative risk title",
            "whyThisMatters": "Clear 1-sentence explanation.",
            "evidence": ["Fact 1", "Fact 2", "Fact 3"],
            "monitors": ["KPI 1", "KPI 2", "KPI 3"]
          }
        ],
        "pillars": {
          "quality": { "label": "Excellent" | "Good" | "Moderate", "color": "green" },
          "management": { "label": "Trusted" | "Solid" | "Under Review", "color": "green" },
          "valuation": { "label": "Premium" | "Fair Value" | "Compressed", "color": "yellow" },
          "understandability": { "label": "High" | "Medium" | "Complex", "color": "yellow" },
          "financialStrength": { "label": "Fortress" | "Stable" | "Leveraged", "color": "green" },
          "compoundingPower": { "label": "Exceptional" | "Moderate" | "Weak", "color": "green" }
        },
        "updates": [
          { "headline": "Short headline", "impact": "1-sentence impact", "type": "positive" | "negative" | "warning" }
        ],
        "deepDive": [
          { "question": "Is this a high-quality business?", "statusType": "green" | "yellow" | "red", "summary": "1-sentence summary", "evidence": ["Data point 1", "Data point 2", "Data point 3"] },
          { "question": "Does it have a durable competitive advantage?", "statusType": "green" | "yellow" | "red", "summary": "1-sentence summary", "evidence": ["Data point 1", "Data point 2", "Data point 3"] },
          { "question": "Can management be trusted?", "statusType": "green" | "yellow" | "red", "summary": "1-sentence summary", "evidence": ["Data point 1", "Data point 2", "Data point 3"] },
          { "question": "Am I paying a reasonable price?", "statusType": "green" | "yellow" | "red", "summary": "1-sentence summary", "evidence": ["Data point 1", "Data point 2", "Data point 3"] },
          { "question": "Can I understand this business well enough to own it?", "statusType": "green" | "yellow" | "red", "summary": "1-sentence summary", "evidence": ["Data point 1", "Data point 2", "Data point 3"] },
          { "question": "What could go wrong?", "statusType": "green" | "yellow" | "red", "summary": "1-sentence summary", "evidence": ["Data point 1", "Data point 2", "Data point 3"] },
          { "question": "Can this business keep growing for 5–10 years?", "statusType": "green" | "yellow" | "red", "summary": "1-sentence summary", "evidence": ["Data point 1", "Data point 2", "Data point 3"] }
        ],
        "peers": [
          { "ticker": "${peerTickers[0] || 'COMP1'}", "pe": "24.0x", "growth": "+11.8%", "margin": "22.1%" },
          { "ticker": "${peerTickers[1] || 'COMP2'}", "pe": "18.5x", "growth": "+17.2%", "margin": "25.4%" }
        ]
      }
    `;

    // Make the call to OpenAI with STRENGTHENED STRICT constraints for exact array lengths
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
     messages: [
        { 
          role: "system", 
          content: "You are an elite Wall Street equity analyst. You must output valid JSON. You must strictly adhere to professional financial analysis standards. CRITICAL REQUIREMENT: You MUST generate EXACTLY 2 items in the 'strengths' array and EXACTLY 2 items in the 'risks' array. For every strength and risk, you MUST generate EXACTLY 3 items in the 'evidence' array and EXACTLY 3 items in the 'monitors' array. Never generate 1, 2, or 4 items for these sub-arrays." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ]
    });

    let rawText = completion.choices[0].message.content || "{}";

    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return NextResponse.json({ error: "AI did not return valid JSON." }, { status: 500 });
    }

    rawText = rawText.substring(firstBrace, lastBrace + 1);
    rawText = rawText.replace(/[\n\r\t]/g, ' '); 

    let finalJson;
    try {
      finalJson = JSON.parse(rawText);
    } catch (parseError: any) {
      return NextResponse.json({ error: "JSON Parsing Failed: " + parseError.message }, { status: 500 });
    }

    // 7. ASSEMBLE FINAL PAYLOAD & CACHE
    const finalPayload = {
      ticker: cleanTicker,
      companyName: fetchedCompanyName,
      exchangeShortName: exchangeShortName, 
      image: logoUrl,
      price: currentPrice,
      changes: priceChange,
      forwardEstimates: forwardEstimates || null, // Will be null if FMP sandbox blocks it
      metrics: {
        pe: pe ? `${Number(pe).toFixed(1)}x` : 'N/A',
        earningsYield: earningsYield ? `${Number(earningsYield).toFixed(1)}%` : 'N/A',
        currentPrice: `$${currentPrice.toFixed(2)}`,
        yearHigh: `$${yearHigh.toFixed(2)}`,
        yearLow: `$${yearLow.toFixed(2)}`,
        revenueGrowth: revGrowth ? `+${Number(revGrowth).toFixed(1)}%` : 'N/A',
        operatingMargin: opMargin ? `${Number(opMargin).toFixed(1)}%` : 'N/A',
        netMargin: netMargin ? `${Number(netMargin).toFixed(1)}%` : 'N/A'
      },
      ...finalJson
    };

    await supabase
      .from('ai_cache')
      .upsert({ ticker: cleanTicker, ai_data: finalPayload, updated_at: new Date().toISOString() });

    return NextResponse.json(finalPayload);

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: `Backend crash: ${error.message || "Unknown error"}` }, { status: 500 });
  }
}