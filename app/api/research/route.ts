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

    // ==========================================
    // 🛑 1. CHECK SUPABASE CACHE FIRST
    // ==========================================
    const { data: cacheData, error: cacheError } = await supabase
      .from('ai_cache')
      .select('*')
      .eq('ticker', ticker)
      .maybeSingle();

    if (cacheData) {
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
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const finnhubKey = process.env.FINNHUB_API_KEY;
    let newsText = "No recent news.";
    let profileSummary = "";

    if (finnhubKey) {
      try {
        const [newsRes, profileRes] = await Promise.all([
          fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${lastWeek.toISOString().split('T')[0]}&to=${today.toISOString().split('T')[0]}&token=${finnhubKey}`),
          fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${finnhubKey}`)
        ]);

        if (newsRes.ok) {
          const newsData = await newsRes.json();
          const topNews = newsData.slice(0, 8);
          if (topNews.length > 0) newsText = topNews.map((a: any) => `HEADLINE: ${a.headline}\nSUMMARY: ${a.summary}`).join('\n\n');
        }
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData?.finnhubIndustry) profileSummary = `Industry: ${profileData.finnhubIndustry}, Market Cap: $${profileData.marketCapitalization}M`;
        }
      } catch (err) {
        console.error("Finnhub Fetch Error (Ignored):", err);
      }
    }

    // ==========================================
    // 🧠 3. ASK GEMINI TO ANALYZE
    // ==========================================
   const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash", 
      // ...
      generationConfig: { responseMimeType: "application/json" },
      safetySettings: [ 
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    const prompt = `
      Analyze ${companyName || ticker} (${ticker}).
      Company Context: ${profileSummary}
      Recent News Headlines: ${newsText}

      LIFECYCLE RULES FOR "ratingBadge":
      You must evaluate where this company sits in its business lifecycle and pick EXACTLY one of these four values:
      - "Early Stage" (Unproven, rapid innovation or high risk phase)
      - "Expanding" (Accelerating market adoption, rapid revenue and scaling phase)
      - "Mature" (Established market leader with steady, defensive compounding cash flows)
      - "Declining" (Facing structural headwinds, disruption, or shrinking market share)

      Do NOT return "BUY", "SELL", "HOLD", or any other values for ratingBadge.

      Return a JSON object exactly matching this structure:
      {
        "ratingTitle": "Short 2-word title (e.g. Dominant Leader, High Compounder, Category Pioneer)",
        "ratingBadge": "Expanding",
        "overallAssessment": "2-sentence summary.",
        "strengths": ["Strength 1", "Strength 2", "Strength 3"],
        "risks": ["Risk 1", "Risk 2", "Risk 3"],
        "pillars": {
          "quality": { "label": "Excellent", "color": "green" },
          "management": { "label": "Trusted", "color": "green" },
          "valuation": { "label": "Premium", "color": "yellow" },
          "understandability": { "label": "Medium", "color": "yellow" },
          "financialStrength": { "label": "Fortress", "color": "green" },
          "compoundingPower": { "label": "Exceptional", "color": "green" }
        },
        "updates": [
          { "headline": "Text", "impact": "Text", "type": "positive" },
          { "headline": "Text", "impact": "Text", "type": "negative" },
          { "headline": "Text", "impact": "Text", "type": "neutral" },
          { "headline": "Text", "impact": "Text", "type": "positive" }
        ],
        "deepDive": [
          { "question": "1. Is this a high-quality business?", "statusText": "Status", "statusType": "green", "summary": "Summary", "evidence": ["Point 1", "Point 2", "Point 3"] },
          { "question": "2. Does it have a durable competitive advantage (moat)?", "statusText": "Status", "statusType": "green", "summary": "Summary", "evidence": ["Point 1", "Point 2", "Point 3"] },
          { "question": "3. Can management be trusted?", "statusText": "Status", "statusType": "green", "summary": "Summary", "evidence": ["Point 1", "Point 2", "Point 3"] },
          { "question": "4. Am I paying a reasonable price?", "statusText": "Status", "statusType": "yellow", "summary": "Summary", "evidence": ["Point 1", "Point 2", "Point 3"] },
          { "question": "5. Can I understand this business well enough to own it?", "statusText": "Status", "statusType": "green", "summary": "Summary", "evidence": ["Point 1", "Point 2", "Point 3"] },
          { "question": "6. What could go wrong?", "statusText": "Status", "statusType": "red", "summary": "Summary", "evidence": ["Point 1", "Point 2", "Point 3"] },
          { "question": "7. Can this business keep growing for the next 5-10 years?", "statusText": "Status", "statusType": "green", "summary": "Summary", "evidence": ["Point 1", "Point 2", "Point 3"] }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();

    // Safely Extract JSON
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return NextResponse.json({ error: "Gemini did not return valid JSON. Output was: " + rawText.substring(0, 50) + "..." }, { status: 500 });
    }

    rawText = rawText.substring(firstBrace, lastBrace + 1);
    rawText = rawText.replace(/[\n\r\t]/g, ' '); 

    let finalJson;
    try {
      finalJson = JSON.parse(rawText);
    } catch (parseError: any) {
      return NextResponse.json({ error: "JSON Parsing Failed: " + parseError.message }, { status: 500 });
    }

    // ==========================================
    // 💾 4. SAVE TO CACHE
    // ==========================================
    await supabase
      .from('ai_cache')
      .upsert({ ticker: ticker, ai_data: finalJson, updated_at: new Date().toISOString() });

    return NextResponse.json(finalJson);

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: `Backend crash: ${error.message || "Unknown error"}` }, { status: 500 });
  }
}