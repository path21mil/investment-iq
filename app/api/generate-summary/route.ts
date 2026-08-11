import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const { ticker, companyName, driverTitles, riskTitles } = await req.json();
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

    const openai = new OpenAI({ apiKey });

    const prompt = `You are a financial writing assistant. A user is building an investment thesis for ${companyName || ticker} (${ticker}).
    Their core growth drivers are: ${driverTitles.join(', ')}.
    Their main risks are: ${riskTitles.join(', ')}.
    
    Write a punchy, first-person executive summary (max 3 sentences) explaining why they are investing. 
    Start with "I am investing in..." or "I believe...".
    Keep it strictly under 400 characters. Do not give financial advice, just beautifully summarize their choices into a cohesive narrative.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const summary = response.choices[0].message.content?.trim();
    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error("Summary Generation Error:", error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}