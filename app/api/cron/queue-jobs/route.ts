import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with the Service Role Key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Fetch all earnings events that haven't been processed yet
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('earnings_events')
      .select('*')
      .eq('status', 'detected');

    if (eventsError) throw eventsError;

    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No new earnings events to process.' });
    }

    const queuedJobs = [];

    // 2. Loop through each detected event
    for (const event of events) {
      // Find all active theses for this specific ticker
      const { data: theses, error: thesesError } = await supabaseAdmin
        .from('theses')
        .select('id, user_id')
        .eq('ticker', event.ticker);

      if (thesesError) {
        console.error(`Error fetching theses for ${event.ticker}:`, thesesError);
        continue;
      }

      // If users are tracking this ticker, create a notification job for each one
      if (theses && theses.length > 0) {
        const jobsToInsert = theses.map((thesis) => ({
          event_id: event.id,
          user_id: thesis.user_id,
          thesis_id: thesis.id,
          status: 'pending',
          // Idempotency: Ensures we never queue the exact same alert for the same thesis twice
          idempotency_key: `${event.id}-${thesis.id}` 
        }));

        const { error: insertError } = await supabaseAdmin
          .from('notification_jobs')
          .insert(jobsToInsert);

        if (insertError && insertError.code !== '23505') {
           console.error(`Failed to queue jobs for ${event.ticker}:`, insertError);
        } else {
           queuedJobs.push(...jobsToInsert);
        }
      }

      // 3. Update the event status so we don't process it again on the next cron run
      await supabaseAdmin
        .from('earnings_events')
        .update({ status: 'processed' })
        .eq('id', event.id);
    }

    return NextResponse.json({ 
      success: true, 
      events_processed: events.length,
      jobs_queued: queuedJobs.length 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}