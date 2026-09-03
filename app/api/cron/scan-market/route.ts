import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { LARGE_CAP_UNIVERSE } from '@/lib/universe';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- QUANTITATIVE SCORING ENGINE ---

function calculateValuationScore(currentPe: number | null, benchmarkPe: number = 28): { score: number; label: string } {
  if (!currentPe || currentPe <= 0) return { score: 30, label: 'Unprofitable or non-standard P/E' };
  const discountPct = ((benchmarkPe - currentPe) / benchmarkPe) * 100;
  if (discountPct <= 0) return { score: 25, label: `Trading at premium valuation (${currentPe.toFixed(1)}x P/E)` };
  if (discountPct <= 10) return { score: Math.round(20 + (discountPct / 10) * 30), label: `P/E near benchmark range (${currentPe.toFixed(1)}x)` };
  if (discountPct <= 20) return { score: Math.round(50 + ((discountPct - 10) / 10) * 30), label: `P/E compressed ${discountPct.toFixed(0)}% below historical baseline` };
  if (discountPct <= 35) return { score: Math.round(80 + ((discountPct - 20) / 15) * 15), label: `P/E deeply compressed (${currentPe.toFixed(1)}x)` };
  return { score: 95, label: `Historical valuation low (${currentPe.toFixed(1)}x P/E)` };
}

function calculatePriceScore(currentPrice: number, yearHigh: number): { score: number; label: string; drawdownPct: number } {
  const drawdownPct = ((currentPrice - yearHigh) / yearHigh) * 100;
  const absDrawdown = Math.abs(drawdownPct);
  let score = 20;
  let label = `${absDrawdown.toFixed(0)}% off 52W high`;

  if (absDrawdown >= 5 && absDrawdown < 15) {
    score = Math.round(20 + ((absDrawdown - 5) / 10) * 30);
    label = `${absDrawdown.toFixed(0)}% pullback from 52W high`;
  } else if (absDrawdown >= 15 && absDrawdown < 30) {
    score = Math.round(50 + ((absDrawdown - 15) / 15) * 30);
    label = `${absDrawdown.toFixed(0)}% below 52W high`;
  } else if (absDrawdown >= 30 && absDrawdown < 45) {
    score = Math.round(80 + ((absDrawdown - 30) / 15) * 15);
    label = `${absDrawdown.toFixed(0)}% major drawdown from 52W high`;
  } else if (absDrawdown >= 45) {
    score = 95;
    label = `${absDrawdown.toFixed(0)}% deep selloff from 52W high`;
  }

  return { score, label, drawdownPct };
}

function calculateBusinessScore(revGrowthYoY: number | null, opMargin: number | null): { score: number; label: string } {
  const growth = revGrowthYoY ?? 0;
  const margin = opMargin ?? 0;
  let score = 50;

  if (growth >= 25) score += 30;
  else if (growth >= 15) score += 20;
  else if (growth >= 8) score += 10;
  else if (growth < 0) score -= 25;

  if (margin >= 25) score += 15;
  else if (margin >= 15) score += 10;
  else if (margin < 0) score -= 15;

  score = Math.max(10, Math.min(100, score));
  let label = `Revenue growth +${growth.toFixed(0)}% YoY`;
  if (margin > 0) label += ` with ${margin.toFixed(0)}% operating margin`;
  return { score, label };
}

function calculateRiskPenalty(debtToEquity: number | null, netMargin: number | null): { penalty: number; watchFlag?: string } {
  let penalty = 0;
  let watchFlag: string | undefined;

  if (debtToEquity && debtToEquity > 200) {
    penalty -= 20;
    watchFlag = 'Elevated balance sheet debt';
  }
  if (netMargin !== null && netMargin < 0) {
    penalty -= 15;
    watchFlag = watchFlag ? `${watchFlag} & negative net margin` : 'Negative net margins';
  } else if (netMargin !== null && netMargin < 5) {
    penalty -= 5;
    watchFlag = watchFlag || 'Tight net margins under pressure';
  }
  return { penalty, watchFlag };
}

export async function GET(req: NextRequest) {
  // 1. Enforce Authorization Check
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const finnhubApiKey = process.env.FINNHUB_API_KEY;
    if (!finnhubApiKey) throw new Error('Missing FINNHUB_API_KEY');

    const BATCH_SIZE = 12;

    // 1. Fetch persistent cursor index from Supabase
    const { data: stateData } = await supabase
      .from('system_state')
      .select('value')
      .eq('key', 'market_scan_cursor')
      .maybeSingle();

    let startIndex = typeof stateData?.value === 'number' ? stateData.value : 0;
    if (startIndex >= LARGE_CAP_UNIVERSE.length) startIndex = 0;

    // 2. Select next sequential batch of tickers
    const batch: string[] = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      batch.push(LARGE_CAP_UNIVERSE[(startIndex + i) % LARGE_CAP_UNIVERSE.length]);
    }

    const nextIndex = (startIndex + BATCH_SIZE) % LARGE_CAP_UNIVERSE.length;
    const scoredCandidates = [];

    // 3. Process batch with 500ms pacing between Finnhub requests
    for (const symbol of batch) {
      try {
        await sleep(500);

        const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubApiKey}`);
        const quote = await quoteRes.json();

        const metricRes = await fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${finnhubApiKey}`);
        const metricData = await metricRes.json();
        const m = metricData?.metric;

        if (!quote || !quote.c || !m) continue;

       const currentPrice = quote.c;
        const rawYearHigh = m['52WeekHigh'] || null;
        const rawYearLow = m['52WeekLow'] || null;

        // Dynamically sanitize bounds for any stock
        const { yearHigh, yearLow } = sanitizePriceBounds(currentPrice, rawYearHigh, rawYearLow);

        const pe = m['peTTM'] || m['peNormalizedAnnual'] || null;
        const revGrowth = m['revenueGrowthTTMYoy'] || m['revenueGrowthQuarterlyYoy'] || null;
        const opMargin = m['operatingMarginTTM'] || null;
        const debtEquity = m['totalDebt/totalEquityQuarterly'] || null;
        const netMargin = m['netProfitMarginTTM'] || null;

        const val = calculateValuationScore(pe);
        const price = calculatePriceScore(currentPrice, yearHigh);
        const biz = calculateBusinessScore(revGrowth, opMargin);
        const risk = calculateRiskPenalty(debtEquity, netMargin);

        if (biz.score < 30 || risk.penalty <= -30) continue;

        const compositeScore = Math.round(
          val.score * 0.40 +
          price.score * 0.25 +
          biz.score * 0.25 +
          risk.penalty
        );

        if (compositeScore < 55) continue;

        let oppType = 'BALANCED SETUP';
        if (price.score >= 70 && biz.score >= 60) oppType = 'PULLBACK';
        else if (val.score >= 75 && biz.score >= 60) oppType = 'VALUATION';
        else if (biz.score >= 75) oppType = 'FUNDAMENTAL ACCELERATION';

        const earningsYield = (pe && pe > 0) ? (1 / pe) * 100 : null;
        const lowDistance = (yearLow && yearLow > 0) ? ((currentPrice - yearLow) / yearLow) * 100 : null;

        scoredCandidates.push({
          ticker: symbol,
          company_name: symbol,
          market_cap: m['marketCapitalization'] || 0,
          opportunity_type: oppType,
          rawPrice: price.label,
          rawVal: val.label,
          rawBiz: biz.label,
          watchFlag: risk.watchFlag || 'Premium valuation leaves less room for execution misses.',
          metrics: {
            price: currentPrice,
            year_high: yearHigh,
            year_low: yearLow ? Number(yearLow.toFixed(2)) : null,
            pe: pe ? Number(pe.toFixed(1)) : null,
            earnings_yield: earningsYield ? Number(earningsYield.toFixed(2)) : null,
            drawdown: Number((price.drawdownPct).toFixed(1)),
            low_distance_pct: lowDistance ? Number(lowDistance.toFixed(1)) : null,
            revenue_growth: revGrowth ? Number(revGrowth.toFixed(1)) : null,
            op_margin: opMargin ? Number(opMargin.toFixed(1)) : null,
            debt_equity: debtEquity ? Number(debtEquity.toFixed(1)) : null,
            net_margin: netMargin ? Number(netMargin.toFixed(1)) : null,
            score: compositeScore
          },
          score: compositeScore
        });
      } catch (err) {
        console.error(`Error scoring ${symbol}:`, err);
      }
    }

    // 4. Full LLM Synthesis with strict compliance guardrails
    const finalizedOpportunities = [];

    for (const c of scoredCandidates) {
      let reasons = [
        `↑ ${c.rawBiz}`,
        `↑ ${c.rawPrice}`
      ];
      let warning = `⚠ ${c.watchFlag}`;

      if (process.env.OPENAI_API_KEY) {
        try {
          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a strict quantitative financial analyst.

I will provide raw financial and market metrics for a stock.

Return ONLY a valid JSON object with exactly two keys:

1. "reasons"
   - An array containing exactly 2 or 3 short, clear statements explaining why this stock surfaced.
   - Each statement must be directly supported by the provided metrics.
   - Focus on measurable changes, relative comparisons, or notable trends.
   - Example:
     "Revenue growth accelerated from 12% to 18%."
     "The stock is 22% below its 52-week high."
     "Operating margin improved to 44%."

2. "warning"
   - One short sentence describing the most important risk, limitation, or watch item supported by the provided metrics.
   - Example:
     "Premium valuation leaves less room for execution misses."

CRITICAL RULES:
- Never give financial advice or make a recommendation.
- Never use words or phrases such as:
  "buy", "sell", "buying opportunity", "undervalued", "overvalued", "upside", "downside", "attractive", "cheap", "expensive", or similar recommendation language.
- Never tell the user what they should do.
- Use objective, factual, analytical language only.
- Never invent, estimate, assume, or modify numbers.
- Use ONLY the metrics provided in the input.
- Do not introduce outside facts or data.
- Do not repeat the same metric in multiple reasons unless necessary.
- Keep each reason concise and easy to scan.
- The warning must identify a meaningful limitation, risk, or uncertainty supported by the provided metrics.
- Do not force a positive or negative conclusion if the data does not clearly support one.
- If the provided metrics do not support 2 or 3 meaningful reasons, use only the strongest supported reasons.
- Return valid JSON only. No markdown, no explanation, and no additional keys.`
              },
              {
                role: 'user',
                content: JSON.stringify({
                  ticker: c.ticker,
                  type: c.opportunity_type,
                  price_action: c.rawPrice,
                  valuation: c.rawVal,
                  business_health: c.rawBiz,
                  primary_risk: c.watchFlag
                })
              }
            ],
            response_format: { type: 'json_object' }
          });

          const parsed = JSON.parse(aiResponse.choices[0].message.content || '{}');
          if (parsed.reasons && Array.isArray(parsed.reasons)) {
            reasons = parsed.reasons;
          }
          if (parsed.warning) {
            warning = parsed.warning;
          }
        } catch (aiErr) {
          console.error(`AI formatting failed for ${c.ticker}:`, aiErr);
        }
      }

      finalizedOpportunities.push({
        ticker: c.ticker,
        company_name: c.company_name,
        market_cap: c.market_cap,
        opportunity_type: c.opportunity_type,
        reasons: reasons,
        warning: warning,
        metrics: c.metrics,
        score: c.score,
        updated_at: new Date().toISOString()
      });
    }

    // 5. Database cleanups, insertion, and cursor state persistence
    const expirationThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('market_opportunities')
      .delete()
      .lt('updated_at', expirationThreshold);

    await supabase
      .from('market_opportunities')
      .delete()
      .in('ticker', batch);

    if (finalizedOpportunities.length > 0) {
      const { error: insertError } = await supabase
        .from('market_opportunities')
        .insert(finalizedOpportunities);

      if (insertError) throw insertError;
    }

    await supabase
      .from('system_state')
      .upsert(
        {
          key: 'market_scan_cursor',
          value: nextIndex,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      );

    return NextResponse.json({
      success: true,
      scannedRange: `${startIndex} to ${(startIndex + BATCH_SIZE - 1) % LARGE_CAP_UNIVERSE.length}`,
      nextCursor: nextIndex,
      qualified: finalizedOpportunities.length,
      opportunities: finalizedOpportunities
    });

  } catch (error: any) {
    console.error('Scan Market Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}