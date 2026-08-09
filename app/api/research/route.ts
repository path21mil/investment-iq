import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Supabase to read/write the cache
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticker, companyName } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // ==========================================
    // 🛑 1. CHECK SUPABASE CACHE FIRST
    // ==========================================
    const { data: cacheData } = await supabase
      .from('ai_cache')
      .select('*')
      .eq('ticker', ticker)
      .single();

    if (cacheData) {
      const lastUpdated = new Date(cacheData.updated_at).getTime();
      const now = new Date().getTime();
      const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);

      // If the cache is less than 24 hours old, return it instantly!
      if (hoursSinceUpdate < 24) {
        console.log(`✅ Loaded ${ticker} from Supabase Cache!`);
        return NextResponse.json(cacheData.ai_data);
      }
    }

    // ==========================================
    // 🟢 2. NO CACHE FOUND -> FETCH LIVE NEWS
    // ==========================================
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const toDate = today.toISOString().split('T')[0];
    const fromDate = lastWeek.toISOString().split('T')[0];

    let newsText = "No recent major news found.";
    const finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    
    if (finnhubKey) {
      try {
        const newsResponse = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${finnhubKey}`);
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          const topNews = newsData.slice(0, 8);
          if (topNews.length > 0) {
            newsText = topNews.map((article: any) => `HEADLINE: ${article.headline}\nSUMMARY: ${article.summary}`).join('\n\n');
          }
        }
      } catch (newsError) {
        console.error("Finnhub Fetch Error:", newsError);
      }
    }

    // ==========================================
    // 🧠 3. ASK GEMINI TO ANALYZE
    // ==========================================
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
      Analyze ${companyName} (${ticker}) based on these news headlines: ${newsText}

      Return a JSON object:
      {
        "ratingTitle": "Short 2-word title (e.g. 'Excellent Business', 'Speculative Play', 'Turnaround Case')",
        "ratingBadge": "1-word status (e.g. 'High Quality', 'Speculative', 'High Risk')",
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
          { "question": "7. Can this business keep growing for the next 5–10 years?", "statusText": "Status", "statusType": "green", "summary": "Summary", "evidence": ["Point 1", "Point 2", "Point 3"] }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const finalJson = JSON.parse(result.response.text());

    // ==========================================
    // 💾 4. SAVE NEW DATA TO CACHE
    // ==========================================
    await supabase
      .from('ai_cache')
      .upsert({ 
        ticker: ticker, 
        ai_data: finalJson,
        updated_at: new Date().toISOString()
      });

    return NextResponse.json(finalJson);

  } catch (error: any) {
    console.error("🚨 Backend AI Error:", error.message || error);
    return NextResponse.json({ error: error.message || "Failed to generate research" }, { status: 500 });
  }
}