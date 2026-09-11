'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SmartSearchBar from '@/components/SmartSearchBar';
import { Loader2, ArrowRight, Star, ShieldCheck, Activity, BookOpen, Circle } from 'lucide-react';
import Logo from '@/components/Logo';

// 1. CURATED DEMO NARRATIVES
const DEMO_COMPANIES: Record<string, any> = {
  AAOI: {
    name: 'Applied', // Changed from 'Applied Optoelectronics' to prevent mobile truncation
    ticker: 'AAOI', 
    sector: 'Optical Networking', 
    ratingBadge: 'Early Stage',
    overallAssessment: 'AAOI’s turnaround thesis is rapidly strengthening. The company successfully executed its AI-driven 800G transition and achieved a pivotal return to non-GAAP profitability.',
    pillars: { quality: 'Improving', management: 'Executing', valuation: 'Fair', understandability: 'Complex' },
    changes: [
      { text: 'Record revenue and return to profitability', sub: 'Q2 revenue hit $191.9M.', status: 'positive' },
      { text: '800G transceiver volume doubled', sub: 'AI infrastructure demand remains robust.', status: 'positive' },
      { text: 'Production capacity bottleneck', sub: 'Scaling internal capacity to meet demand.', status: 'warning' },
    ]
  },
  NVDA: {
    name: 'NVIDIA Corp.', ticker: 'NVDA', sector: 'Semiconductors', ratingBadge: 'Expanding',
    overallAssessment: 'NVIDIA\'s hardware monopoly remains intact, but core thesis guardrails are under pressure due to margin compression and supply chain constraints.',
    pillars: { quality: 'Exceptional', management: 'Visionary', valuation: 'Premium', understandability: 'Moderate' },
    changes: [
      { text: 'Data Center revenue up 112% YoY', sub: 'Hyperscale demand remains unsated.', status: 'positive' },
      { text: 'Gross Margin — Failing', sub: 'Q3 margins compressed to 71.4%, breaching your 74.0% minimum guardrail.', status: 'negative' },
      { text: 'Export restriction risks elevated', sub: 'Potential headwinds in restricted regions.', status: 'warning' },
    ]
  },
  AAPL: {
    name: 'Apple Inc.', ticker: 'AAPL', sector: 'Consumer Electronics', ratingBadge: 'Mature',
    overallAssessment: 'Apple remains a high-quality business with a durable ecosystem. Services compounding continues to perfectly support the long-term margin expansion thesis.',
    pillars: { quality: 'Excellent', management: 'Trusted', valuation: 'Premium', understandability: 'Easy' },
    changes: [
      { text: 'Services revenue accelerated to 14%', sub: 'Supports long-term margin expansion thesis.', status: 'positive' },
      { text: 'Installed base reached a new high', sub: 'Strengthens ecosystem moat and recurring revenue.', status: 'positive' },
      { text: 'Share buybacks pace maintained', sub: 'Management continuing aggressive capital return.', status: 'positive' },
    ]
  }
};

const getLifecycleBadgeStyle = (badge: string = '') => {
  switch (badge.toLowerCase()) {
    case 'expanding':
      return { dot: 'text-emerald-500', label: 'Expanding' };
    case 'mature':
      return { dot: 'text-blue-500', label: 'Mature' };
    case 'early stage':
      return { dot: 'text-amber-500', label: 'Early Stage' };
    case 'declining':
      return { dot: 'text-rose-500', label: 'Declining' };
    default:
      return { dot: 'text-slate-400', label: badge || 'Active' };
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
  
  // Controls which demo narrative is shown on the landing page
  const [selectedTicker, setSelectedTicker] = useState<string>('AAOI');
  
  // Rotating search bar suggestions
  const [popularSearches, setPopularSearches] = useState<string[]>(['NVDA', 'AAOI', 'AAPL', 'MSFT']);
  const TICKER_POOL = ['NVDA', 'MSFT', 'TSLA', 'COST', 'AAPL', 'AMZN', 'GOOGL', 'META', 'NFLX', 'CRM', 'PLTR', 'AMD', 'AAOI'];

  useEffect(() => {
    const interval = setInterval(() => {
      setPopularSearches([...TICKER_POOL].sort(() => 0.5 - Math.random()).slice(0, 4));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeData = DEMO_COMPANIES[selectedTicker];
  const lifecycle = getLifecycleBadgeStyle(activeData.ratingBadge);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* TOP NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
          <div className="shrink-0">
            <Logo />
          </div>
          <div className="flex items-center gap-3 md:gap-5 shrink-0">
            <Link 
              href="?auth=login"
              className="text-xs sm:text-sm font-bold text-[#0F172A] hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="?auth=signup"
              scroll={false}
              className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center pt-16 md:pt-24 pb-10 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none -z-10 overflow-x-hidden"></div>

        {/* HERO TEXT */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Investment IQ doesn't just research stocks. <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              It tracks whether your thesis is still holding up.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-900 font-bold mb-3">
            Built for long-term investors who buy businesses — not charts.
          </p>
          <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed px-4 md:px-0 max-w-2xl mx-auto">
            Understand the business, build your investment thesis, and use AI to track the evidence that supports or challenges your conviction after you invest.
          </p>
        </div>

       {/* DEMO INTERACTIVE TABS */}
        {/* Added mt-10 to create breathing room below the hero text */}
        <div className="flex items-center justify-center gap-2 mt-10 mb-10 flex-wrap">
          {['AAOI', 'NVDA', 'AAPL'].map((ticker) => {
            const isActive = selectedTicker === ticker;
            return (
              <button
                key={ticker}
                onClick={() => setSelectedTicker(ticker)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer block ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {DEMO_COMPANIES[ticker].name.split(' ')[0]} ({ticker})
              </button>
            );
          })}
        </div>

        {/* THE DEMO CARD SHOWCASE */}
        <div className="w-full max-w-3xl mx-auto relative z-10 mb-20">
          
          {/* ✨ Premium Ambient Glow Behind Card */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-200 via-indigo-100 to-purple-200 rounded-[2.5rem] blur-2xl opacity-50 -z-10"></div>
          
          <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden font-sans transition-all duration-300">
            
            {/* Header */}
            <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 border-b border-slate-100">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-4 w-full md:w-auto">
                <div className="grid grid-cols-[auto_auto] items-center gap-2.5 w-full md:w-auto justify-center md:justify-start">
                  <CompanyLogo 
                    ticker={activeData.ticker} 
                    containerClass="w-11 h-11 md:w-12 md:h-12 rounded-xl shrink-0 border-slate-100 shadow-none" 
                    textClass="text-xl" 
                  />
                  <div className="hidden md:flex flex-col">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activeData.name}</h2>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md shrink-0">{activeData.ticker}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{activeData.sector}</p>
                  </div>
                  <div className="flex md:hidden items-center gap-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none truncate max-w-[200px]">{activeData.name}</h2>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded-md shrink-0">{activeData.ticker}</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-1 md:hidden w-full">{activeData.sector}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/60 rounded-lg shadow-none self-center md:self-auto mt-2 md:mt-0 shrink-0">
                <span className={`text-[10px] ${lifecycle.dot}`}>●</span>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{lifecycle.label}</span>
              </div>
            </div>
            
            {/* PROMINENT THESIS STATEMENT */}
            {/* ✨ Deepened Background for Emphasis */}
            <div className="px-6 sm:px-8 py-7 bg-indigo-50/70 border-b border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Your Active Thesis</h3>
              </div>
              <p className="text-[15px] font-semibold text-slate-800 leading-relaxed">
                {activeData.overallAssessment}
              </p>
            </div>
            
            {/* PILLARS / SUPPORTING EVIDENCE */}
            <div className="bg-white border-b border-slate-100">
              <div className="px-6 sm:px-8 py-3 bg-slate-50/50 border-b border-slate-100">
                 <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Supporting Evidence</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4">
                
                {/* ✨ Left-aligned items with semantic icon colors */}
                <div className="p-5 flex flex-col items-start justify-start border-b border-r border-slate-100 md:border-b-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" /> Quality
                  </p>
                  <p className="text-sm font-black text-slate-900">{activeData.pillars.quality}</p>
                </div>
                <div className="p-5 flex flex-col items-start justify-start border-b border-slate-100 md:border-b-0 md:border-r">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Management
                  </p>
                  <p className="text-sm font-black text-slate-900">{activeData.pillars.management}</p>
                </div>
                <div className="p-5 flex flex-col items-start justify-start border-r border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" /> Valuation
                  </p>
                  <p className="text-sm font-black text-slate-900">{activeData.pillars.valuation}</p>
                </div>
                <div className="p-5 flex flex-col items-start justify-start">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Clarity
                  </p>
                  <p className="text-sm font-black text-slate-900">{activeData.pillars.understandability}</p>
                </div>

              </div>
            </div>

            {/* Changes / Evidence */}
            <div className="p-6 sm:p-8">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Latest Evidence</h3>
              <div className="space-y-3">
           {activeData.changes.map((item: any, idx: number) => {
                  
                  let bgStyle = 'bg-white border-slate-200/60 shadow-sm hover:border-slate-300';
                  let icon = <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />;
                  let titleColor = 'text-slate-900';
                  let subColor = 'text-slate-500';

                  if (item.status === 'warning') {
                    bgStyle = 'bg-amber-50/40 border-amber-200/50';
                    icon = <span className="text-amber-500 font-bold text-[10px]">⚠</span>;
                    titleColor = 'text-amber-950';
                    subColor = 'text-amber-700/90';
                  } else if (item.status === 'negative') {
                    bgStyle = 'bg-rose-50/50 border-rose-200/60';
                    icon = <span className="text-rose-500 font-bold text-[10px]">✕</span>;
                    titleColor = 'text-rose-950';
                    subColor = 'text-rose-700/90';
                  }

                  const mockSources = ['Q2 Earnings Release', 'Management Commentary', 'SEC 10-Q Filing'];
                  const mockTimes = ['2h ago', '1d ago', '3d ago'];

                  return (
                    <div key={idx} className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 ${bgStyle}`}>
                      
                      {/* LEFT SIDE: Indicator + Main Text */}
                      <div className="flex items-start gap-3.5 flex-1 pr-2">
                        <div className="mt-1 shrink-0 flex items-center justify-center w-4 h-4">{icon}</div>
                        <div>
                          <p className={`text-[14px] sm:text-[15px] font-bold mb-1 leading-snug ${titleColor}`}>{item.text}</p>
                          <p className={`text-[12px] sm:text-[13px] font-medium leading-relaxed m-0 ${subColor}`}>{item.sub}</p>
                        </div>
                      </div>
                      
                      {/* RIGHT SIDE: Source and Timestamp (Stacked in two rows) */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pl-7 sm:pl-0 shrink-0">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap ${
                          item.status === 'warning' ? 'bg-amber-100/50 text-amber-700' : 
                          item.status === 'negative' ? 'bg-rose-100/50 text-rose-700' : 
                          'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                          {mockSources[idx]}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                          {mockTimes[idx]}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => router.push(`/company/${activeData.ticker}`)} className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm group cursor-pointer">
                Enter Sandbox to Build Thesis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* THE SANDBOX ENTRY (Search) */}
        <div className="w-full max-w-2xl mx-auto mb-12 relative z-20">
          <p className="text-center font-bold text-slate-800 mb-4 text-lg">Ready to track your own conviction?</p>
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

        {/* FEATURES / WHY (Fixed Wrapper) */}
        <div className="w-full max-w-5xl mx-auto mt-10 mb-20 relative z-10 px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Never lose track of why you invested</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col text-center items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-5">🧠</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Remember Why You Invested</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Record your thesis and key assumptions. Never panic sell because of short-term price noise again.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col text-center items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-5">🤖</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Monitors Every Update</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                New evidence from earnings reports, filings, and management commentary is instantly checked against your thesis.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col text-center items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-5">📈</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Know When It Changes</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                See instantly when the real-world evidence strengthens, weakens, or completely challenges your core convictions.
              </p>
            </div>
          </div>
        </div>

      </main>
      
      {/* FOOTER */}
      <footer className="w-full border-t border-slate-200/60 pt-16 pb-8 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-sm">
          <div className="col-span-1 md:col-span-2">
           <div className="mb-6">
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