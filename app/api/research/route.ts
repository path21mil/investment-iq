import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
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

    // 1. UNIVERSAL TICKER NORMALIZATION (From full-research)
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
      const lastUpdated = new Date(cacheData.updated_at).getTime();
      const now = new Date().getTime();
      if ((now - lastUpdated) / (1000 * 60 * 60) < 24) {
        return NextResponse.json(cacheData.ai_data);
      }
    }

    // 3. FETCH LIVE MARKET DATA (Combined Finnhub calls)
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
    let exchangeShortName = "US Market"; // Default fallback

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
  // Grab the first word of the exchange (e.g., "NASDAQ NMS - GLOBAL MARKET" -> "NASDAQ")
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
          priceChange = q.d || 0; // Daily dollar change
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

    // 4. QUANTITATIVE METRICS EXTRACTION (From full-research)
    let yearHigh = Number(metricsData['52WeekHigh']) || currentPrice;
    let yearLow = Number(metricsData['52WeekLow']) || (currentPrice > 0 ? currentPrice * 0.7 : 0);

    // Guardrail against share class data anomalies
    if (currentPrice > 0 && yearHigh > currentPrice * 4) {
      yearHigh = Number((currentPrice * 1.15).toFixed(2));
      yearLow = Number((currentPrice * 0.85).toFixed(2));
    }

    const pe = metricsData['peTTM'] || metricsData['peNormalizedAnnual'] || null;
    const revGrowth = metricsData['revenueGrowthTTMYoy'] || metricsData['revenueGrowthQuarterlyYoy'] || 0;
    const opMargin = metricsData['operatingMarginTTM'] || 0;
    const netMargin = metricsData['netProfitMarginTTM'] || 0;
    const earningsYield = pe && Number(pe) > 0 ? (1 / Number(pe)) * 100 : 0;

    // 5. GEMINI INSTITUTIONAL SYNTHESIS (Using strict schema from research)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      safetySettings: [ 
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

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

      Return a JSON object exactly matching this structure:
      {
        "ratingTitle": "Short 2-word title (e.g. Dominant Leader, High Compounder, Category Pioneer)",
        "ratingBadge": "Expanding",
        "overallAssessment": "2-sentence institutional summary synthesizing fundamentals and recent news.",
        "strengths": ["Specific strength 1", "Specific strength 2"],
        "risks": ["Specific risk 1", "Specific risk 2"],
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

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();

    // Safely Extract JSON (From research file)
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return NextResponse.json({ error: "Gemini did not return valid JSON." }, { status: 500 });
    }

    rawText = rawText.substring(firstBrace, lastBrace + 1);
    rawText = rawText.replace(/[\n\r\t]/g, ' '); 

    let finalJson;
    try {
      finalJson = JSON.parse(rawText);
    } catch (parseError: any) {
      return NextResponse.json({ error: "JSON Parsing Failed: " + parseError.message }, { status: 500 });
    }

    // 6. ASSEMBLE FINAL PAYLOAD & CACHE
  const finalPayload = {
      ticker: cleanTicker,
      companyName: fetchedCompanyName,
      exchangeShortName: exchangeShortName, // <-- Added this line
      image: logoUrl,
      price: currentPrice,
      changes: priceChange,
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