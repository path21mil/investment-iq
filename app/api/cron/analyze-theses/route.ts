import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Grab up to 10 pending jobs at a time to prevent serverless timeouts
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('notification_jobs')
      .select(`
        id,
        user_id,
        thesis_id,
        theses ( ticker, company_name, drivers, risks ),
        earnings_events ( earnings_date, market_time )
      `)
      .eq('status', 'pending')
      .limit(10);

    if (jobsError) throw jobsError;

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: 'No pending jobs to evaluate.' });
    }

    const processedJobs = [];

    // 2. Loop through and evaluate each thesis
    for (const job of jobs) {
      const thesis: any = job.theses;
      
      // Mocking the structured JSON response the AI will return:
      const mockAiAnalysis = {
        thesis_impact: "🟢 Supporting",
        driver_affected: thesis.drivers?.[0]?.title || "Core Growth Driver",
        what_changed: `${thesis.ticker} reported a 15% revenue beat, validating the primary growth assumptions.`,
        why_it_matters: "Accelerated cash flow gives the company runway to execute its roadmap without dilution.",
        needs_review: false
      };

      // 3. Save the AI analysis and queue it for email delivery
      const { error: updateError } = await supabaseAdmin
        .from('notification_jobs')
        .update({
          status: 'email_queued',
          ai_analysis: mockAiAnalysis
        })
        .eq('id', job.id);

      if (updateError) {
        console.error(`Failed to update job ${job.id}:`, updateError);
      } else {
        processedJobs.push({ job_id: job.id, ticker: thesis.ticker });
      }
    }

    return NextResponse.json({ 
      success: true, 
      evaluated_count: processedJobs.length,
      details: processedJobs
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}