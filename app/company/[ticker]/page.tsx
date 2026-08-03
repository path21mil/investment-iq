'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  BookmarkCheck
} from 'lucide-react';

export default function CompanyResearchPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = ((params?.ticker as string) || 'AAPL').toUpperCase();

  const [session, setSession] = useState<any>(null);
  const [hasSavedThesis, setHasSavedThesis] = useState(false);
  const [userThesis, setUserThesis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUserThesis() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          // Fetch existing thesis from Supabase for this user and ticker
          const { data, error } = await supabase
            .from('theses')
            .select('*')
            .eq('ticker', ticker)
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (data && !error) {
            setHasSavedThesis(true);
            setUserThesis(data);
          }
        }
      } catch (err) {
        console.error("Error checking thesis status:", err);
      } finally {
        setIsLoading(false);
      }
    }

    checkUserThesis();
  }, [ticker]);

  const handleLaunchBuilder = () => {
    if (!session) {
      router.push(`/login?redirect=/build-thesis/${ticker}`);
    } else {
      router.push(`/build-thesis/${ticker}`);
    }
  };

  const scrollToThesisBanner = () => {
    const element = document.getElementById('thesis-banner');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* 1. TOP NAVIGATION */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
            Investment IQ
            <span className="flex gap-0.5">
              <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {session ? (
              <Link 
                href="/dashboard" 
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Go to My Dashboard
              </Link>
            ) : (
              <Link 
                href={`/login?redirect=/company/${ticker}`} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-10">
        
        {/* ALPHA BANNER */}
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-xs font-bold mb-8 flex items-center justify-between">
          <span>⚠️ Investment IQ is currently in Alpha. All thesis data is generated as a UI demonstration.</span>
          <span className="text-amber-600">v0.9.4</span>
        </div>

        {/* 2. HEADER SNAPSHOT */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{ticker} Research Snapshot</h1>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
                  Alpha Research
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500">
                Explore synthesized SEC filings, earnings call transcripts, and fundamental metrics.
              </p>
            </div>

            {/* DYNAMIC THESIS STATUS BADGE */}
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="h-10 w-36 bg-gray-100 rounded-xl animate-pulse"></div>
              ) : hasSavedThesis ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-sm font-extrabold flex items-center gap-2 shadow-sm">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Thesis: Saved & Tracking
                </div>
              ) : (
                <button 
                  onClick={scrollToThesisBanner}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                  ↓ Jump to Thesis Engine
                </button>
              )}
            </div>
          </div>

          {/* OVERALL ASSESSMENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-extrabold text-gray-900">Excellent Business</h2>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-lg">
                  High Quality
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                {ticker} remains one of the highest-quality businesses globally, supported by a structural moat, dominant developer ecosystem, and stellar margin expansion. The key factor for investors to monitor is sustained capital expenditure levels against premium valuation multiples.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Key Strengths</p>
                  <ul className="text-xs font-bold text-gray-700 space-y-1.5">
                    <li className="flex items-center gap-2 text-emerald-700">
                      <span>✓</span> Wide Moat & Software Lock-in
                    </li>
                    <li className="flex items-center gap-2 text-emerald-700">
                      <span>✓</span> Exceptional Operating Margins
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Watch Points</p>
                  <ul className="text-xs font-bold text-gray-700 space-y-1.5">
                    <li className="flex items-center gap-2 text-amber-700">
                      <span>⚠️</span> Premium Historical Valuation
                    </li>
                    <li className="flex items-center gap-2 text-amber-700">
                      <span>⚠️</span> Export Control Restrictions
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* QUICK STATS */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">Quick Snapshot</p>
              
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">Business Quality</span>
                <span className="text-emerald-600 flex items-center gap-1">★★★★★ Excellent</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">Management</span>
                <span className="text-emerald-600 flex items-center gap-1">★★★★★ Trusted</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">Growth</span>
                <span className="text-emerald-600">Exceptional</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">Valuation</span>
                <span className="text-amber-600">Premium</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">Risk Profile</span>
                <span className="text-blue-600">Low Risk</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. LATEST EARNINGS UPDATES */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">What's Changed Since Last Earnings</h2>
            <span className="text-xs font-bold text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-lg">Updated Q2 FY27</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-3 inline-block">Validates AI Demand</span>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Revenue guidance raised</h3>
              <p className="text-xs text-gray-500">Accelerating enterprise hardware purchases.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-3 inline-block">Validates Margin Expansion</span>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Gross margins improved</h3>
              <p className="text-xs text-gray-500">Higher software mix expanding margin profile.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md mb-3 inline-block">Ecosystem Growth</span>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Developer growth +35%</h3>
              <p className="text-xs text-gray-500">Stronger lock-in across enterprise suites.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md mb-3 inline-block">Watch Item</span>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Export restrictions remain</h3>
              <p className="text-xs text-gray-500">Monitoring regional revenue impacts.</p>
            </div>
          </div>
        </div>

        {/* 4. DYNAMIC THESIS BUILDER CTA BANNER */}
        <div id="thesis-banner" className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-4 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> Core Feature • Investment Operating System
              </div>

              {hasSavedThesis ? (
                <>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                    Your Investment Thesis is Active for {ticker}
                  </h2>
                  <p className="text-slate-400 text-base font-medium leading-relaxed mb-4">
                    Investment IQ is actively scanning SEC filings and earnings transcripts for updates on your selected drivers:
                  </p>
                  
                  {/* Display saved drivers tags if available */}
                  {userThesis?.drivers && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {userThesis.drivers.map((d: string, i: number) => (
                        <span key={i} className="bg-slate-800 border border-slate-700 text-blue-300 text-xs font-bold px-3 py-1 rounded-lg">
                          ✓ {d}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                    Build My Investment Thesis for {ticker}
                  </h2>
                  <p className="text-slate-400 text-base font-medium leading-relaxed">
                    Investment IQ has analyzed {ticker}'s SEC filings. Launch the wizard to select from pre-identified drivers and risks, or write your own.
                  </p>
                </>
              )}
            </div>

            <div className="shrink-0 w-full md:w-auto">
              {hasSavedThesis ? (
                <button
                  onClick={handleLaunchBuilder}
                  className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-8 py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 text-base cursor-pointer"
                >
                  <BookmarkCheck className="w-5 h-5" />
                  Update Saved Thesis &rarr;
                </button>
              ) : (
                <button
                  onClick={handleLaunchBuilder}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-8 py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 text-base cursor-pointer"
                >
                  {session ? 'Launch Thesis Builder →' : 'Sign in to Launch Builder →'}
                </button>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-gray-200 py-8 bg-white text-center text-sm font-medium text-gray-400 mt-auto">
        <p>© {new Date().getFullYear()} Investment IQ. All rights reserved.</p>
      </footer>
    </div>
  );
}