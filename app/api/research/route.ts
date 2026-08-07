import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticker, companyName } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const mockContext = `
      COMPANY: ${companyName} (${ticker})
      RECENT PERFORMANCE: Revenue grew 14% year over year. Margins expanded to 28% due to software pricing power. 
      However, the company faces rising costs in expanding its data center infrastructure and faces minor regulatory headwinds in Europe.
      Management emphasized a strict return of capital to shareholders via buybacks.
    `;

    const prompt = `
      You are a strict, objective financial analyst assessing ${companyName} (${ticker}).
      Read the provided performance data and assess the company.

      CRITICAL RULE: You MUST return EXACTLY 3 strengths and EXACTLY 3 risks in your arrays.

      Return ONLY a valid JSON object matching this exact structure:
      {
        "overallAssessment": "A 2-sentence summary of the business quality.",
        "strengths": [
          "First major strength",
          "Second major strength",
          "Third major strength"
        ],
        "risks": [
          "First major risk or watch point",
          "Second major risk or watch point",
          "Third major risk or watch point"
        ],
        "pillars": {
          "quality": "Excellent", 
          "management": "Trusted",
          "valuation": "Fair",
          "understandability": "Easy",
          "financialStrength": "Fortress",
          "compoundingPower": "Exceptional"
        }
      }

      DATA TO ANALYZE:
      ${mockContext}
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    // Smarter JSON extraction to prevent crashes
    const cleanText = textResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const startIndex = cleanText.indexOf('{');
    const endIndex = cleanText.lastIndexOf('}') + 1;
    const jsonString = cleanText.substring(startIndex, endIndex);
    
    return NextResponse.json(JSON.parse(jsonString));

  } catch (error) {
    console.error("AI Engine Error:", error);
    return NextResponse.json({ error: "Failed to generate research" }, { status: 500 });
  }
}