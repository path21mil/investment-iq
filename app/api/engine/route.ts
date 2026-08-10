import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);
console.log("🔑 Finnhub Key Loaded:", process.env.FINNHUB_API_KEY ? "YES" : "NO");
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const { data: portfolio, error: fetchError } = await supabase
      .from('theses')
      .select('*')
      .eq('user_id', userId);

    if (fetchError || !portfolio) throw fetchError;

    let totalUpdates = 0;

    // Loop through each company they track
    for (const company of portfolio) {
      
      // ==========================================
      // 1. THE EYES (LIVE FINNHUB INTEGRATION)
      // ==========================================
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);

      // Finnhub requires dates in YYYY-MM-DD format
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      let liveNewsString = "";

      try {
        const finnhubUrl = `https://finnhub.io/api/v1/company-news?symbol=${company.ticker}&from=${formatDate(threeDaysAgo)}&to=${formatDate(today)}&token=${process.env.FINNHUB_API_KEY}`;
        const newsRes = await fetch(finnhubUrl);
        const newsData = await newsRes.json();

        if (newsData && newsData.length > 0) {
          // Grab only the top 3 most recent articles to save OpenAI tokens
          const topArticles = newsData.slice(0, 3);
          liveNewsString = topArticles.map((article: any) => 
            `Headline: ${article.headline}\nSummary: ${article.summary}`
          ).join("\n\n");
        } else {
          liveNewsString = "No major news reported in the last 3 days.";
        }
      } catch (err) {
        console.error(`Failed to fetch Finnhub news for ${company.ticker}:`, err);
        liveNewsString = "Unable to retrieve real-time news at this moment.";
      }

      console.log(`📰 LIVE NEWS FOR ${company.ticker}:`, liveNewsString);

      // ==========================================
      // 2. THE BRAIN (OPENAI ANALYSIS)
      // ==========================================
      const aiPrompt = `
        You are an expert financial AI. 
        The user holds this stock: ${company.ticker}.
        Their core investment drivers are: ${JSON.stringify(company.drivers)}.
        Their core investment risks are: ${JSON.stringify(company.risks)}.
        
        Recent News for ${company.ticker}: 
        "${liveNewsString}"
        
        Did this news Strengthen, Weaken, or have a Neutral effect on their specific drivers/risks?
        Respond ONLY in JSON format matching this structure exactly:
        {
          "status": "Strengthening" | "Weakening" | "Review Needed",
          "aiSummary": "A 2-sentence explanation of how the news impacts their specific thesis.",
          "updates": [
             { "text": "Short headline of the change", "trend": "up" | "down" | "neutral" }
          ]
        }
      `;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: aiPrompt }],
      });

      const analysis = JSON.parse(aiResponse.choices[0].message.content || "{}");
      console.log(`🧠 AI DECIDED FOR ${company.ticker}:`, analysis);

      // ==========================================
      // 3. THE MOUTH (UPDATE SUPABASE)
      // ==========================================
      const { error: updateError } = await supabase
        .from('theses')
        .update({
          status: analysis.status,
          ai_summary: analysis.aiSummary,
          updates: analysis.updates,
          requires_action: analysis.status === "Weakening" || analysis.status === "Review Needed",
          last_scanned_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (updateError) console.error(`Failed to update ${company.ticker}`, updateError);
      else totalUpdates++;
    }

    return NextResponse.json({ success: true, updatedCount: totalUpdates });

  } catch (error: any) {
    console.error("Engine Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}