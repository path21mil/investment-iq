import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

// Initialize a Supabase Admin client to safely bypass RLS in backend routes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch jobs using the Admin client
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('notification_jobs')
      .select(`
        id,
        user_id,
        ai_analysis,
        theses ( id, ticker, company_name )
      `)
      .eq('status', 'email_queued')
      .limit(20);

    const sentEmails = [];

    if (!jobsError && jobs && jobs.length > 0) {
      for (const job of jobs) {
        const thesis: any = job.theses;
        const analysis: any = job.ai_analysis;
        const ticker = thesis?.ticker || 'Holding';

        // 2. Fetch user data using the Admin client
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(job.user_id);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          try {
            await resend.emails.send({
              from: 'Investment IQ <updates@investmentiq.me>', 
              to: userEmail,
              subject: `🔔 Your ${ticker} thesis has new evidence`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <p style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                    Investment IQ Catalyst Alert
                  </p>
                  <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #0f172a;">
                    ${ticker} — ${analysis?.thesis_impact?.includes('Supporting') ? '🟢 Thesis Intact' : '🟡 Needs Review'}
                  </h2>
                  <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
                    ${analysis?.what_changed || 'New financial disclosures were detected and processed.'}
                  </p>
                  ${analysis?.why_it_matters ? `
                    <div style="background-color: #f8fafc; border-left: 3px solid #0ea5e9; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; color: #475569;">
                      <strong>Why it matters:</strong> ${analysis.why_it_matters}
                    </div>
                  ` : ''}
                 <a href="http://localhost:3000/thesis/${ticker}?highlight=latest" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
  Review Your ${ticker} Thesis
</a>
                </div>
              `,
            });

            // 3. Mark job as completed using the Admin client
            await supabaseAdmin
              .from('notification_jobs')
              .update({ status: 'completed' })
              .eq('id', job.id);

            sentEmails.push({ job_id: job.id, ticker, recipient: userEmail });
          } catch (error) {
            console.error(`Failed to send email for job ${job.id}:`, error);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: sentEmails.length });
  } catch (err: any) {
    console.error('Cron job error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}