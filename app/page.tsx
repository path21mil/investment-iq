'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SmartSearchBar from '@/components/SmartSearchBar';
import { Search, Loader2, ArrowRight, Star, ShieldCheck, Activity, BookOpen, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 
import Logo from '@/components/Logo';

const TICKER_POOL = ['NVDA', 'MSFT', 'TSLA', 'COST', 'AAPL', 'AMZN', 'GOOGL', 'META', 'NFLX', 'CRM', 'PLTR', 'AMD', 'AAOI'];

// 2. THE GRACEFUL FALLBACK DATA
const DEMO_COMPANIES: any = {
  AAPL: {
    name: 'Apple Inc.', ticker: 'AAPL', sector: 'Consumer Electronics', thesis: 'Strengthening', thesisColor: 'emerald',
    overallAssessment: 'Apple remains a high-quality business with a durable ecosystem, strong capital allocation, and resilient cash generation.',
    pillars: { quality: 'Excellent', management: 'Trusted', valuation: 'Premium', understandability: 'Easy' },
    changes: [
      { text: 'Services revenue accelerated', sub: 'Supports long-term margin expansion.', status: 'positive' },
      { text: 'Installed base reached a new high', sub: 'Strengthens ecosystem moat.', status: 'positive' },
      { text: 'China demand remains soft', sub: 'Worth monitoring next quarter.', status: 'warning' },
    ]
  },
  NVDA: {
    name: 'NVIDIA Corp.', ticker: 'NVDA', sector: 'Semiconductors', thesis: 'Strengthening', thesisColor: 'emerald',
    overallAssessment: 'NVIDIA maintains an unparalleled moat in AI hardware, backed by accelerating hyperscaler capex and flawless execution.',
    pillars: { quality: 'Exceptional', management: 'Visionary', valuation: 'High', understandability: 'Moderate' },
    changes: [
      { text: 'Data Center revenue up 112% YoY', sub: 'Hyperscale demand remains unsated.', status: 'positive' },
      { text: 'Blackwell architecture shipping at scale', sub: 'Secures 2-year technical lead.', status: 'positive' },
      { text: 'Export restriction risks elevated', sub: 'Potential headwinds in restricted regions.', status: 'warning' },
    ]
  },
  AAOI: {
    name: 'Applied Optoelectronics', ticker: 'AAOI', sector: 'Optical Networking', thesis: 'Strengthening', thesisColor: 'emerald',
    overallAssessment: 'AAOI’s turnaround thesis is rapidly strengthening. The company successfully executed its AI-driven 800G transition and achieved a pivotal return to non-GAAP profitability.',
    pillars: { quality: 'Improving', management: 'Executing', valuation: 'Fair', understandability: 'Complex' },
    changes: [
      { text: 'Record revenue and return to profitability', sub: 'Q2 revenue hit $191.9M.', status: 'positive' },
      { text: '800G transceiver volume doubled', sub: 'AI infrastructure demand remains robust.', status: 'positive' },
      { text: 'Production capacity bottleneck', sub: 'Scaling internal capacity to meet demand.', status: 'warning' },
    ]
  }
};

function CompanyLogo({ ticker, containerClass, textClass }: { ticker: string, containerClass: string, textClass: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm ${containerClass}`}>
      {!hasError ? (
        <img 
          src={`https://financialmodelingprep.com/image-stock/${ticker}.png`} 
          alt={ticker}
          className="w-full h-full object-contain p-2"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={`font-extrabold text-slate-300 select-none ${textClass}`}>
          {ticker[0]}
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [popularSearches, setPopularSearches] = useState<string[]>(['NVDA', 'AAOI', 'AAPL', 'MSFT']);
  
  // --- LIVE COMMUNITY DATA STATES ---
  const [communityData, setCommunityData] = useState<any>(DEMO_COMPANIES);
  const [previewTickers, setPreviewTickers] = useState<string[]>(['AAOI', 'NVDA', 'AAPL']);
  const [selectedTicker, setSelectedTicker] = useState<string>('AAOI');
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);

  // Rotate popular searches every 5 seconds
  useEffect(() => {
    setPopularSearches([...TICKER_POOL].sort(() => 0.5 - Math.random()).slice(0, 4));
    const interval = setInterval(() => {
      setPopularSearches([...TICKER_POOL].sort(() => 0.5 - Math.random()).slice(0, 4));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

// --- 3. FETCH RECENT GENERATIONS FROM SUPABASE ---
  useEffect(() => {
    async function fetchRecentCommunityResearch() {
      try {
        // Fetch the 4 newest rows from ai_cache
        const { data, error } = await supabase
          .from('ai_cache')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(4);

        if (error) {
          console.error("Supabase API Error:", error);
          throw error;
        }

        if (data && data.length > 0) {
          const liveFormattedData: any = {};
          const liveTickers: string[] = [];
          
          // ✨ NEW: Dynamically fetch real company names securely through our API!
          const dynamicNames: Record<string, string> = {};
          try {
            const uniqueTickers = [...new Set(data.map(r => r.ticker))];
            
            // ✅ SECURE FETCH: Replaced direct getCompanyProfile call with our secure API route
            const profiles = await Promise.all(uniqueTickers.map(async (t) => {
              const res = await fetch(`/api/company-profile?ticker=${t}`);
              if (!res.ok) return null;
              return res.json();
            }));
            
            profiles.forEach((profileResult, idx) => {
              const ticker = uniqueTickers[idx];
              const profile = Array.isArray(profileResult) ? profileResult[0] : profileResult;
              if (profile && profile.companyName) {
                dynamicNames[ticker] = profile.companyName;
              }
            });
          } catch (nameErr) {
            console.warn("Could not fetch live names from API, falling back to DB", nameErr);
          }

          // 🛡️ HELPER FUNCTION: Safely extracts the text label from the DB object
          const extractLabel = (pillar: any, fallback: string) => {
            if (!pillar) return fallback;
            if (typeof pillar === 'string') return pillar;
            if (typeof pillar === 'object' && pillar.label) return pillar.label;
            return fallback;
          };

          data.forEach((row) => {
            let aiPayload = row.ai_data; 
            
            if (typeof aiPayload === 'string') {
              try { aiPayload = JSON.parse(aiPayload); } catch (e) {}
            }

            if (aiPayload) {
              liveTickers.push(row.ticker);
              
              const rawPillars = aiPayload.pillars || {};
              
              // Uses the dynamic name from FMP first, then cleans it!
              let rawName = dynamicNames[row.ticker] || aiPayload.companyName || row.company_name || row.ticker;
              let cleanName = rawName.replace(/(?:\s+Inc\.?|\s+Corp\.?|\s+Ltd\.?|\s+LLC|\s+PLC)$/i, '').trim();
              
              liveFormattedData[row.ticker] = {
                name: cleanName, 
                ticker: row.ticker,
                sector: 'Community Research',
                thesis: 'Generated Live',
                thesisColor: 'blue',
                overallAssessment: aiPayload.overallAssessment || 'AI Assessment complete.',
                pillars: { 
                  quality: extractLabel(rawPillars.quality, '-'), 
                  management: extractLabel(rawPillars.management, '-'), 
                  valuation: extractLabel(rawPillars.valuation, '-'), 
                  understandability: extractLabel(rawPillars.understandability, '-') 
                },
                changes: (aiPayload.updates || []).slice(0, 3).map((u: any) => ({
                  text: u.headline,
                  sub: u.impact,
                  status: u.type === 'negative' ? 'warning' : u.type === 'neutral' ? 'neutral' : 'positive'
                }))
              };
            }
          });

          if (liveTickers.length > 0) {
            setCommunityData(liveFormattedData);
            setPreviewTickers(liveTickers);
            setSelectedTicker(liveTickers[0]);
          }
        }
      } catch (err) {
        console.error("Database fetch failed, falling back to Demo Companies:", err);
      } finally {
        setIsLoadingCommunity(false);
      }
    }

    fetchRecentCommunityResearch();
  }, []);

  const activeData = communityData[selectedTicker] || DEMO_COMPANIES['AAOI'];

  const getBadgeStyles = (color: string) => {
    if (color === 'blue') return 'bg-blue-50 border-blue-200/60 text-blue-800';
    return 'bg-emerald-50 border-emerald-200/60 text-emerald-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* TOP NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
          <div className="shrink-0">
            <Logo />
          </div>
          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            
            {/* 1. SIGN IN: Stays exactly the same (defaults to the Log In tab) */}
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
              Sign In
            </Link>
            
            {/* 2. GET STARTED: Updated href and changed from blue to emerald! */}
            <Link href="/login?mode=signup" className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-xl transition-colors shadow-sm">
              Get Started
            </Link>
            
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="flex-grow flex flex-col items-center pt-16 md:pt-24 pb-10 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Don't just buy stocks. <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Track your conviction.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-900 font-bold mb-3">
            Built for long-term investors who buy businesses—not charts.
          </p>
          <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed px-4 md:px-0 max-w-2xl mx-auto">
            Investment IQ helps you understand great businesses, build your investment thesis, record why you invested, and use AI to identify what has changed since you invested.
          </p>
        </div>

        {/* The Contextual Search Bar */}
        <div className="w-full max-w-2xl mx-auto mb-12 relative z-20">
          <SmartSearchBar variant="hero" />
          <div className="mt-6 h-8 flex items-center justify-center">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs md:text-sm font-medium text-slate-400 transition-opacity duration-500">
              <span className="hidden sm:inline font-bold text-slate-500">Popular Searches:</span>
              {popularSearches.map(t => (
                <button key={t} onClick={() => router.push(`/company/${t}`)} className="bg-white border border-slate-200/80 px-3 py-1 rounded-lg hover:border-blue-300 hover:text-blue-600 shadow-sm transition-all cursor-pointer">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full mt-12 mb-32 relative z-10 flex flex-col items-center px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Research powered by primary sources</p>
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
            {['SEC Filings', 'Earnings Reports', 'Financial Statements', 'Management Commentary'].map((tag) => (
              <div key={tag} className="bg-white border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] px-4 py-2 rounded-full text-xs md:text-sm font-bold text-slate-600 flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {tag}
              </div>
            ))}
          </div>
        </div>

        {/* THE "WHY" */}
        <div className="w-full max-w-5xl mx-auto mb-20 relative z-10">
          <div className="text-center mb-14 px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Never lose track of why you invested</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col text-center items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-5">🧠</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Remember Why You Invested</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Record exactly why you bought a stock. Never panic sell because of short-term price moves.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col text-center items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-5">🤖</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Monitors Every Update</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Investment IQ reads every earnings report, SEC filing, and management commentary while you sleep.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col text-center items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-5">📈</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Know When Your Thesis Changes</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">See instantly whether your original reasons for investing are fundamentally strengthening or breaking.</p>
            </div>
          </div>
        </div>

        {/* THE VISUAL PROOF (INTERACTIVE PREVIEW CARD) */}
        <div className="w-full max-w-3xl mx-auto mb-10 relative px-4 md:px-0 z-10">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-100/50 via-indigo-50/50 to-emerald-100/50 rounded-[3rem] blur-2xl -z-10 pointer-events-none"></div>

          {/* DYNAMIC SELECTION PILLS */}
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {isLoadingCommunity ? (
               <div className="text-slate-400 text-sm font-bold flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin" /> Fetching latest community research...
               </div>
            ) : (
              previewTickers.map((ticker) => {
                const isActive = selectedTicker === ticker;
                return (
                  <button
                    key={ticker}
                    onClick={() => setSelectedTicker(ticker)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md scale-105'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {communityData[ticker]?.name?.split(' ')[0] || ticker} ({ticker})
                  </button>
                );
              })
            )}
          </div>

          {/* PREVIEW CARD */}
          {!isLoadingCommunity && activeData && (
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden font-sans transition-all duration-300 min-h-[400px]">
             
              {/* 1. PREMIUM HEADER */}
              <div className="p-8 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* ✨ THE NEW LOGO & TITLE SECTION ✨ */}
                <div className="flex items-center gap-4">
                  
                  {/* Naked Logo */}
                  <CompanyLogo 
                    ticker={activeData.ticker} 
                    containerClass="w-12 h-12 rounded-xl" 
                    textClass="text-2xl" 
                  />

                  {/* Title & Sector */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeData.name}</h2>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md">{activeData.ticker}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{activeData.sector}</p>
                  </div>
                </div>

                {/* Generated Live Badge / Thesis Status */}
                <div className={`inline-flex items-center border px-4 py-2 rounded-full self-start md:self-auto ${getBadgeStyles(activeData.thesisColor)}`}>
                  <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className={`animate-pulse text-[10px] ${activeData.thesisColor === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}`}>●</span> {activeData.thesis}
                  </span>
                </div>
              </div>
              
              {/* 2. THE METRICS RIBBON */}
              <div className="bg-slate-50/50 border-y border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200/60">
                  <div className="p-5 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Star className="w-3 h-3" /> Quality</p>
                    <p className="text-sm font-extrabold text-slate-900">{activeData.pillars?.quality}</p>
                  </div>
                  <div className="p-5 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Management</p>
                    <p className="text-sm font-extrabold text-slate-900">{activeData.pillars?.management}</p>
                  </div>
                  <div className="p-5 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Valuation</p>
                    <p className="text-sm font-extrabold text-slate-900">{activeData.pillars?.valuation}</p>
                  </div>
                  <div className="p-5 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Clarity</p>
                    <p className="text-sm font-extrabold text-slate-900">{activeData.pillars?.understandability}</p>
                  </div>
                </div>
              </div>

              {/* 3. OVERALL ASSESSMENT */}
              <div className="px-8 py-6 border-b border-slate-100 bg-white">
                <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Overall Assessment</h3>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">{activeData.overallAssessment}</p>
              </div>

              {/* 4. ACTIVITY FEED */}
              <div className="p-8">
                <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-5">What Changed Since Last Earnings</h3>
                <div className="space-y-3">
                  {activeData.changes?.map((item: any, idx: number) => (
                    <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${item.status === 'warning' ? 'bg-amber-50/50 border-amber-200/60' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                      <div className="mt-1">
                        {item.status === 'warning' ? <span className="text-amber-500 font-bold text-xs">⚠</span> : item.status === 'neutral' ? <span className="text-slate-400 font-bold text-xs">—</span> : <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 mt-1" />}
                      </div>
                      <div>
                        <p className={`text-sm font-bold mb-0.5 ${item.status === 'warning' ? 'text-amber-950' : 'text-slate-900'}`}>{item.text}</p>
                        <p className={`text-xs font-medium ${item.status === 'warning' ? 'text-amber-700/80' : 'text-slate-500'}`}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. FOOTER ACTION */}
              <div className="p-6 bg-slate-50/80 border-t border-slate-100">
                <button onClick={() => router.push(`/company/${activeData.ticker}`)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.15)] flex items-center justify-center gap-2 text-sm group cursor-pointer">
                  View Full Research <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* FOOTER */}
      <footer className="w-full border-t border-slate-200/60 pt-16 pb-8 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-sm">
          <div className="col-span-1 md:col-span-2">
           <div className="mb-6">
              {/* w-32 is small on phones, md:w-48 is medium on laptops */}
              <Logo className="w-32 md:w-48" /> 
            </div>
            <p className="text-slate-500 font-medium max-w-sm leading-relaxed">
              The AI-powered journal for long-term investors. Track your conviction, not just price charts.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-3 text-slate-500 font-medium">
              <li><button className="hover:text-blue-600 transition-colors">Research</button></li>
              <li><button className="hover:text-blue-600 transition-colors">Pricing</button></li>
              <li><button className="hover:text-blue-600 transition-colors">About</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Legal & Social</h4>
            <ul className="space-y-3 text-slate-500 font-medium">
              <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-slate-400">© {new Date().getFullYear()} Investment IQ. For educational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}