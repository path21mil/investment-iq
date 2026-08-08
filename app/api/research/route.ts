import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticker, companyName } = body;

    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const toDate = today.toISOString().split('T')[0];
    const fromDate = lastWeek.toISOString().split('T')[0];

    let newsText = "No recent major news found.";
    const finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    
    if (finnhubKey) {
      const newsResponse = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${finnhubKey}`);
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        const topNews = newsData.slice(0, 8);
        if (topNews.length > 0) {
          newsText = topNews.map((article: any) => `HEADLINE: ${article.headline}\nSUMMARY: ${article.summary}`).join('\n\n');
        }
      }
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
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
          {
            "question": "1. Is this a high-quality business?",
            "statusText": "Status",
            "statusType": "green", 
            "summary": "Summary",
            "evidence": ["Point 1", "Point 2", "Point 3"]
          },
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
    return NextResponse.json(JSON.parse(result.response.text()));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}