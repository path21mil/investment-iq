import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the standard client for user-facing routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    // 1. Get the authenticated user's session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the user's completed notification jobs (Thesis updates)
    const { data: jobs, error: jobsError } = await supabase
      .from('notification_jobs')
      .select(`
        id,
        created_at,
        status,
        ai_analysis,
        theses ( id, ticker, company_name )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20);

    if (jobsError) throw jobsError;

    // 3. Format the data for the frontend drawer
    const formattedUpdates = (jobs || []).map((job) => {
      const analysis: any = job.ai_analysis;
      const thesis: any = job.theses;

      // Map the AI impact string to your visual indicators
      let indicator = '🔵';
      let statusText = 'Thesis Update';
      
      if (analysis?.thesis_impact?.includes('Supporting')) {
        indicator = '🟢';
        statusText = 'Thesis Intact';
      } else if (analysis?.thesis_impact?.includes('Risk') || analysis?.needs_review) {
        indicator = '🟡';
        statusText = 'Needs Review';
      }

      return {
        id: job.id,
        type: 'thesis_update',
        thesis_id: thesis?.id,
        ticker: thesis?.ticker,
        company_name: thesis?.company_name,
        indicator: indicator,
        statusText: statusText,
        summary: analysis?.what_changed || 'New earnings data processed.',
        timestamp: job.created_at,
      };
    });

    return NextResponse.json({ success: true, updates: formattedUpdates });

  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}